import { createLangChainCompletion } from './LangChainService';
import { newMessage } from '../pages/HomePage';
import { MsgSender } from '../Components/MessageBox';

interface ChatConfig {
  endpoint?: string;
  apiKey: string;
  model?: string;
  headers?: Record<string, string>;
  stream?: boolean;
}

export const sendChatMessage = async (
  config: ChatConfig,
  message: string,
  onResponse: (message: newMessage) => void,
  onUpdate?: (content: string) => void,
  chatHistory: Array<{ role: string; content: string }> = []
): Promise<Array<{ role: string; content: string }>> => {
  try {
    // 创建初始消息
    let aiMessage = '';
    onResponse({
      sender: MsgSender.Bot,
      content: aiMessage
    });

    // 添加上下文消息
    const messages = [
      ...chatHistory,
      { role: 'user', content: message }
    ];

    const stream = await createLangChainCompletion(
      messages,
      config
    );

    // 收集完整的AI响应
    for await (const chunk of stream) {
      const content = chunk.content;
      if (content) {
        aiMessage += content;
        if (onUpdate) {
          onUpdate(aiMessage);
        }
      }
    }

    // 返回更新后的聊天历史记录
    return [
      ...messages,
      { role: 'assistant', content: aiMessage }
    ];
  } catch (error) {
    onResponse({
      sender: MsgSender.System,
      content: '抱歉，请求出错：' + (error as Error).message
    });
    // 返回当前聊天历史记录
    return chatHistory;
  }
};

export type { ChatConfig };