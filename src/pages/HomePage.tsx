import { Component, createSignal, untrack } from "solid-js";
import { Page } from "../Components/PageContainer";
import { Motion } from "solid-motionone";
import { MessageContainer, MsgInfo, MsgPosition, MsgSender, MsgTip } from "../Components/MessageBox";
import { testBubbleMessages, testMessages } from "../debugger";
import { animate } from "motion/mini";

export interface newMessage {
  sender: MsgSender;
  content: string;
}

interface homePageProps {
  commands: (
    arg0: (newMessage: newMessage) => number,
    arg1: (text: string, index?: number) => void,
    arg2: (tip: MsgTip, index?: number) => void
  ) => void;
}

export const homePage: Component<homePageProps> = (props) => {
  const [messages, setMessages] = createSignal<MsgInfo[]>([]);
  let findEndIndex: () => number;
  let scrollToBottom: () => void;

  const onResize = () => {
    if (findEndIndex() === messages().length - 1)
      scrollToBottom();
  }
  window.addEventListener("resize", onResize);

  const appendMessage = (newMessage: newMessage) => {
    setMessages((groups) => {
      let result = [...groups];
      let msg = { ...newMessage, position: MsgPosition.Empty } as MsgInfo;
      if (result.length > 0) {
        const last = result[result.length - 1];
        if (last.sender === newMessage.sender) {
          if (result.length > 1) {
            const previous = result[result.length - 2];
            if (previous.sender === newMessage.sender)
              last.position = MsgPosition.Middle;
          }
          msg.position = MsgPosition.End;
        } else msg.position = MsgPosition.Start;
      }
      result.push(msg);
      return result;
    });

    const messageIndex = messages().length - 1;

    const messageContainer = document.getElementById("message-container");
    const currentMessages = untrack(() => messages());
    if (messageContainer) {
      const element = messageContainer.lastChild?.lastChild?.lastChild as HTMLElement;
      if (!element) {
        console.error("Message not found");
        return messageIndex;
      }
      if (newMessage.sender === MsgSender.User) 
        scrollToBottom();
      const isLastItem = findEndIndex() === currentMessages.length - 1;
      if (!isLastItem) return messageIndex;
      const hasHistory = currentMessages.length > 1;
      const sameSender = (hasHistory)? newMessage.sender === currentMessages[currentMessages.length - 2].sender : false;
      element.style.transformOrigin = (sameSender? "top" : "bottom") + " " + (newMessage.sender === MsgSender.User ? "right" : "left");
      animate(element, {
        opacity: [0, 1],
        scale: [0, 1],
      },
      {
        duration: 0.3,
        ease: [0,0,0,1],
      });
      scrollToBottom();
    }

    return messageIndex;
  };
  const updateMessage = (text: string, index?: number) => {
    setMessages((groups) => {
      let result = [...groups];
      result[index ?? messages().length - 1].content = text;
      return result;
    });
    if (index === findEndIndex())
      scrollToBottom();
  };
  const tipPop = (tip: MsgTip, index?: number) => {
    setMessages((groups) => {
      let result = [...groups];
      let extra = [...result[index ?? messages().length - 1].extra ?? []];
      extra = extra.concat(tip);
      result[index ?? messages().length - 1].extra = extra;
      return result;
    });
  }
  props.commands(appendMessage, updateMessage, tipPop);

  return (
    <Page id="page-home">
      <Motion
        initial={{
          opacity: 0,
          scale: 0.8,
          y: "60vh",
          filter: "blur(16px)",
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: "0",
          filter: "blur(0px)",
        }}
        class="page"
      >
        <MessageContainer messages={messages()} commands={((endIndex, toBottom) => {
            findEndIndex = endIndex;
            scrollToBottom = toBottom;
          })}/>
      </Motion>
    </Page>
  );
};
