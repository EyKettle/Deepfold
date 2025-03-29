import { ChatMessage, Sender } from "./chatMessageBox";

export const testChatData: ChatMessage[] = [
  {
    sender: Sender.System,
    content: "系统提示",
  },
  {
    sender: Sender.Own,
    content: "这是独立的消息",
  },
  {
    sender: Sender.Other,
    content: "这是对方独立的消息",
  },
  {
    sender: Sender.Own,
    content: "多条消息的首条",
  },
  {
    sender: Sender.Own,
    content: "多条消息的中间条",
  },
  {
    sender: Sender.Own,
    content: "多条消息的尾条",
  },
  {
    sender: Sender.Other,
    content:
      "一行长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长长文本",
  },
  {
    sender: Sender.Other,
    content: "多行消息的第一行\n多行消息的第二行",
  },
];
