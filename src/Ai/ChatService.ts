import { createFileTool, pushMessage } from './LangChainService';
import { newMessage } from '../pages/HomePage';
import { MsgSender, MsgTip } from '../Components/MessageBox';

export const sendChatMessage = async (
  message: string,
  onResponse: (message: newMessage) => void,
  onUpdate?: (content: string) => void,
  onTipPop?: (tip: MsgTip) => void,
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

    const stream = await pushMessage(
      messages,
    );

    // 收集完整的AI响应
    for await (const chunk of stream) {
      const content = chunk.content;
      if (content) {
        if (content === '<tool_call>') {
          if (onTipPop) {
            onTipPop({
              icon: 'T',
              title: '调用工具',
            })
          } else {
            onResponse({
              sender: MsgSender.System,
              content: '文件创建失败，缺少参数。',
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
          if (call.name === 'create_file') {
            const { filePath, content } = call.args;
            if (!filePath || !content) {
              if (onTipPop) {
                onTipPop({
                  icon: 'E',
                  title: '创建失败',
                  description: '无效参数',
                })
              } else {
                onResponse({
                  sender: MsgSender.System,
                  content: '文件创建失败，缺少参数。',
                });
              }
              sendChatMessage('', onResponse, onUpdate, onTipPop, [...messages, { role: 'system', content: '程序未实现文件创建功能。请告知用户该遗憾。' }]);
            } else {
              const result = await createFileTool.func({ filePath, content });
              const fileName = filePath.split('/').pop();
              if (onTipPop) {
                onTipPop({
                  icon: 'C',
                  title: `创建 ${fileName}`,
                  description: filePath.slice(0, -fileName.length - 1),
                })
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
    return [
      ...messages,
      { role: 'assistant', content: aiMessage }
    ];
  } catch (error) {
    console.error(error);
    let tail;
    if ((error as Error).message.includes('400 status code (no body)')) {
      tail = '\n模型可能不支持工具调用。';
    }
    onResponse({
      sender: MsgSender.System,
      content: '抱歉，请求出错：' + (error as Error).message + (tail || ''),
    });
    // 返回当前聊天历史记录
    return chatHistory;
  }
};