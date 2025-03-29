import { createFileTool, pushMessage } from "./LangChainService";
import { newMessage } from "../pages/HomePage";
import { MsgSender } from "../controls/MessageBox";
import {
  AIMessage,
  AIMessageChunk,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { Runnable } from "@langchain/core/runnables";
import { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import { ChatOpenAI, ChatOpenAICallOptions } from "@langchain/openai";
import {
  Annotation,
  BinaryOperatorAggregate,
  CompiledStateGraph,
  MemorySaver,
  Messages,
  MessagesAnnotation,
  messagesStateReducer,
  StateDefinition,
  StateGraph,
  StateType,
  UpdateType,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { appDataDir } from "@tauri-apps/api/path";
import { tools } from "./Tools";
import { MsgTip, ServiceConfig } from "./CoreService";

export type ReceiveEmit = {
  index: number;
  text: string;
};

const systemMessageContent = [
  '你的名称是"若可(Roco)"，本工具的AI助理。',
  "本程序是Deepfold，一款使用AI管理本地文件的工具。",
  "请不要编造信息。如果你不确定某个信息，请根据你已知的事实提供最准确的回答，并明确指出你不清楚的部分。",
  "你需要遵守的规则：",
  "0. 涉及自身时自称若可。",
  "1. 使用简洁有趣的语言。",
  "2. 多用Emoji表达情感。",
  "3. 每次操作都要尝试调用工具，而非叙述虚假情况。",
  "4. 协助用户操作时提供必要的反馈。",
  "你目前的能力：",
  "1. 基本对话。",
  "2. 管理本地文件（如创建、读取、修改、删除文件）。",
  "没有列出的能力代表你无法做到，请不要以任何方式承诺这些能力。",
  "以下是一些默认配置：",
  "1. 默认路径：" + (await appDataDir()),
].join("\n");

const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
  }),
});

export class AiService {
  private config: ServiceConfig;
  private model: Runnable<
    BaseLanguageModelInput,
    AIMessageChunk,
    ChatOpenAICallOptions
  > | null = null;
  private app: CompiledStateGraph<
    StateType<{
      messages: BinaryOperatorAggregate<BaseMessage[], BaseMessage[]>;
    }>,
    UpdateType<{
      messages: BinaryOperatorAggregate<BaseMessage[], BaseMessage[]>;
    }>,
    "__start__" | "agent" | "tools",
    { messages: BinaryOperatorAggregate<BaseMessage[], BaseMessage[]> },
    { messages: BinaryOperatorAggregate<BaseMessage[], BaseMessage[]> },
    StateDefinition
  >;
  private chatHistory: Array<BaseMessage> = [];

  private sendMessage: (message: string) => void;
  private updateMessage: (content: string) => void;
  private tipPop: (tip: MsgTip) => void;

  constructor(
    config: ServiceConfig,
    sendMessage: (message: string) => void,
    updateMessage: (content: string) => void,
    tipPop: (tip: MsgTip) => void
  ) {
    this.config = config;
    this.sendMessage = sendMessage;
    this.updateMessage = updateMessage;
    this.tipPop = tipPop;

    this.model = new ChatOpenAI({
      apiKey: config.apiKey,
      modelName: config.modelName,
      temperature: 0.7,
      streaming: config.stream,
      configuration: {
        baseURL: config.endpoint,
      },
    }).bindTools(tools);

    const callModel = async (state: typeof StateAnnotation.State) => {
      if (!this.model) throw new Error("Model not initialized");
      const messages = state.messages;
      const response = await this.model.invoke(messages);
      return { messages: [response] };
    };

    const toolNode = new ToolNode(tools);

    const shouldContinue = (state: typeof StateAnnotation.State) => {
      const messages = state.messages;
      const lastMessage = messages[messages.length - 1] as AIMessage;
      if (lastMessage.tool_calls?.length) {
        return "tools";
      }
      return "__end__";
    };

    const checkpointer = new MemorySaver();

    this.app = new StateGraph(StateAnnotation)
      .addNode("agent", callModel)
      .addNode("tools", toolNode)
      .addEdge("__start__", "agent")
      .addConditionalEdges("agent", shouldContinue)
      .addEdge("tools", "agent")
      .compile({ checkpointer });

    this.chatHistory = [new SystemMessage(systemMessageContent)];
  }

  async send(message: string) {
    if (!this.model) throw new Error("Model not initialized");

    this.chatHistory.push(new HumanMessage(message));

    const stream = await this.model.stream(this.chatHistory);

    for await (const chunks of stream) {
      console.log(chunks);
    }
  }
}

export const sendChatMessage = async (
  message: string,
  onResponse: (message: newMessage) => void,
  onUpdate?: (content: string) => void,
  onTipPop?: (tip: MsgTip) => void,
  chatHistory: Array<{ role: string; content: string }> = [],
  role?: string
): Promise<Array<{ role: string; content: string }>> => {
  try {
    // 创建初始消息
    let aiMessage = "";
    onResponse({
      sender: MsgSender.Bot,
      content: aiMessage,
    });

    // 添加上下文消息
    const messages = [
      ...chatHistory,
      { role: role || "user", content: message },
    ];

    const stream = await pushMessage(messages);

    // 收集完整的AI响应
    for await (const chunk of stream) {
      const content = chunk.content;
      if (content) {
        if (content === "<tool_call>") {
          if (onTipPop) {
            onTipPop({
              icon: "T",
              title: "调用工具",
            });
          } else {
            onResponse({
              sender: MsgSender.System,
              content: "文件创建失败，缺少参数。",
            });
          }
        } else {
          aiMessage += content;
          if (onUpdate) {
            onUpdate(aiMessage);
          }
        }
      }

      if (chunk.tool_calls?.length) {
        for (const call of chunk.tool_calls) {
          if (call.name === "create_file") {
            const { filePath, content } = call.args;
            if (!filePath || !content) {
              if (onTipPop) {
                onTipPop({
                  icon: "E",
                  title: "创建失败",
                  description: "无效参数",
                });
              } else {
                onResponse({
                  sender: MsgSender.System,
                  content: "文件创建失败，缺少参数。",
                });
              }
              sendChatMessage("", onResponse, onUpdate, onTipPop, [
                ...messages,
                {
                  role: "system",
                  content: "程序未实现文件创建功能。请告知用户该遗憾。",
                },
              ]);
            } else {
              const result = await createFileTool.func({ filePath, content });
              const fileName = filePath.split("/").pop();
              if (onTipPop) {
                onTipPop({
                  icon: "C",
                  title: `创建 ${fileName}`,
                  description: filePath.slice(0, -fileName.length - 1),
                });
              } else {
                onResponse({
                  sender: MsgSender.Bot,
                  content: result,
                });
              }
            }
          }
        }
      }
    }

    // 返回更新后的聊天历史记录
    return [...messages, { role: "assistant", content: aiMessage }];
  } catch (error) {
    console.error(error);
    let tail;
    if ((error as Error).message.includes("400 status code (no body)")) {
      tail = "\n模型可能不支持工具调用。";
    }
    onResponse({
      sender: MsgSender.System,
      content: "抱歉，请求出错：" + (error as Error).message + (tail || ""),
    });
    // 返回当前聊天历史记录
    return chatHistory;
  }
};
