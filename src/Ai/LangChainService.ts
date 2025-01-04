import { ChatOpenAI, ChatOpenAICallOptions } from "@langchain/openai";
import { AIMessage, AIMessageChunk, BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { invoke } from "@tauri-apps/api/core";
import { appDataDir } from "@tauri-apps/api/path";
import { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import { Runnable } from "@langchain/core/runnables";
import { Annotation, MemorySaver, messagesStateReducer, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

export interface ChatConfig {
  endpoint?: string;
  apiKey: string;
  model?: string;
  headers?: Record<string, string>;
  stream?: boolean;
}

let systemMessageContent: string[] | null = null;

export const createFileTool = tool(async ({ filePath, content }) => {
  const response = await invoke("create_file", { filePath: filePath, content: content }).then(() => {
    return `文件创建成功: ${filePath}`;
  }).catch((error) => {
    return `文件创建失败: ${(error as Error).message}`;
  });
  return response;
}, {
  name: "create_file",
  description: "创建本地文件",
  schema: z.object({
    filePath: z.string().describe("文件的完整路径"),
    content: z.string().describe("文件内容"),
  }),
});
const tools = [createFileTool];
const toolNode = new ToolNode(tools);

let model: Runnable<BaseLanguageModelInput, AIMessageChunk, ChatOpenAICallOptions> | null = null;
// const StateAnnotation = Annotation.Root({
//   messages: Annotation<BaseMessage[]>({
//     reducer: messagesStateReducer,
//   })
// })
export const initModel = async (config: ChatConfig) => {
  model = new ChatOpenAI({
    openAIApiKey: config.apiKey,
    modelName: config.model || "gpt-3.5-turbo",
    temperature: 0.7,
    streaming: config.stream ?? true,
    configuration: {
      baseURL: config.endpoint,
    },
  }).bindTools(tools);
  systemMessageContent = [
    '你的名称是"若可(Roco)"，本工具的AI助理。',
    '本程序是Deepfold，一款使用AI管理本地文件的工具。',
    '请不要编造信息。如果你不确定某个信息，请根据你已知的事实提供最准确的回答，并明确指出你不清楚的部分。',
    '你需要遵守的规则：',
    '0. 涉及自身时自称若可。',
    '1. 使用简洁有趣的语言。',
    '2. 多用Emoji表达情感。',
    '3. 每次操作都要尝试调用工具，而非叙述虚假情况。',
    '4. 协助用户操作时提供必要的反馈。',
    '你目前的能力：',
    '1. 基本对话。',
    '2. 管理本地文件（如创建、读取、修改、删除文件）。',
    '没有列出的能力代表你无法做到，请不要以任何方式承诺这些能力。',
    '以下是一些默认配置：',
    '1. 默认路径：' + await appDataDir(),
  ];
}

// function shouldContinue(state: typeof StateAnnotation.State) {
//   const messages = state.messages;
//   const lastMessage = messages[messages.length - 1] as AIMessage;

//   if (lastMessage.tool_calls?.length) {
//     return "tools";
//   }
//   return "__end__";
// }

// async function callModel(state: typeof StateAnnotation.State) {
//   if (!model) 
//     throw new Error("Model not initialized");
  
//   const messages = state.messages;
//   const response = await model.invoke(messages);

//   return { messages: [response] };
// }

// const workflow = new StateGraph(StateAnnotation)
//   .addNode("agent", callModel)
//   .addNode("tools", toolNode)
//   .addEdge("__start__", "agent")
//   .addConditionalEdges("agent", shouldContinue)
//   .addEdge("tools", "agent");

// const checkpointer = new MemorySaver();
// const app = workflow.compile({checkpointer});

export const pushMessage = async (
  messages: Array<{ role: string; content: string }>,
) => {
  if (!model)
    throw new Error("Model not initialized");
  if (!systemMessageContent)
    throw new Error("System message content not set");

  const messagesWithSystem = [
    {
      role: 'system',
      content: systemMessageContent.join('\n')
    },
    ...messages
  ];

  const messageHistory = messagesWithSystem.map((msg) => {
    if (msg.role === "user") {
      return new HumanMessage(msg.content);
    } else if (msg.role === "assistant") {
      return new AIMessage(msg.content);
    } else if (msg.role === "system") {
      return new SystemMessage(msg.content);
    } else {
      return new HumanMessage(msg.content);
    }
  });

  // const lastMessage = messages[messages.length - 1];
  // const newMessage = () => {
  //   switch (lastMessage.role) {
  //     case "user":
  //       return new HumanMessage(lastMessage.content);
  //     case "assistant":
  //       return new AIMessage(lastMessage.content);
  //     case "system":
  //       return new SystemMessage(lastMessage.content);
  //     default:
  //       return new HumanMessage(lastMessage.content);
  //   }
  // }

  // const stream = await app.stream(
  //   { messages: [newMessage()] },
  //   { configurable: { thread_id: "42" }}
  // );

  const stream = await model.stream(messageHistory);
  
  return {
    async *[Symbol.asyncIterator]() {
      for await (const chunk of stream) {
        yield {
          content: chunk.content,
          tool_calls: chunk.tool_calls,
        };
      }
    }
  };
};