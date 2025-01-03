import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatConfig } from "./ChatService";

export const createLangChainCompletion = async (
  messages: Array<{ role: string; content: string }>,
  config: ChatConfig
) => {
  const chat = new ChatOpenAI({
    openAIApiKey: config.apiKey,
    modelName: config.model || "gpt-3.5-turbo",
    temperature: 0.7,
    streaming: config.stream ?? true,
    configuration: {
      baseURL: config.endpoint,
    },
  });

  const langchainMessages = messages.map((msg) => {
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

  const stream = await chat.stream(langchainMessages);
  
  return {
    async *[Symbol.asyncIterator]() {
      for await (const chunk of stream) {
        yield {
          content: chunk.content,
        };
      }
    }
  };
};