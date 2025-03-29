import { Component, createSignal, onMount } from "solid-js";
import ChatMessageBox, {
  ChatMessage,
  Sender,
} from "../components/chatMessageBox";
import { initReport } from "../components/utils";
import { VirtualizerHandle } from "virtua/solid";

import "../components/markdown.css";
import { SolidMarkdown } from "solid-markdown";
import remarkGfm from "remark-gfm";
import { render } from "solid-js/web";

interface homePageProps {
  getMethod?: (
    posOperation: {
      save: () => void;
      load: () => void;
    },
    scrollToBottom: () => void,
    appendMessage: (content: string, sender?: Sender) => number,
    // getMessages: () => MsgInfo[],
    // setMessage: (text: string, index?: number) => void,
    pushStr: (index: number, str: string) => void,
    clearHistory: () => void
    // tipPop: (tip: MsgTip, index?: number) => void
  ) => void;
}

const HomePage: Component<homePageProps> = (props) => {
  const [messages, setMessages] = createSignal<ChatMessage[]>([]);
  // let findEndIndex: () => number;
  // let scrollToBottom: () => void;

  // const onResize = () => {
  //   if (findEndIndex() === messages().length - 1) scrollToBottom();
  // };
  // window.addEventListener("resize", onResize);

  // const getMessages = () => {
  //   return messages();
  // };

  // const setMessage = (text: string, index?: number) => {
  //   if (text.trim() === "") return;
  //   if (messages().length === 0) return;

  //   const safeIndex =
  //     index !== undefined
  //       ? Math.min(index, messages().length - 1)
  //       : messages().length - 1;

  //   setMessages((groups) => {
  //     let result = [...groups];
  //     result[safeIndex].content = text;
  //     return result;
  //   });

  //   if (safeIndex === findEndIndex()) scrollToBottom();
  // };

  // const appendMessage = (newMessage: newMessage) => {
  //   setMessages((groups) => {
  //     let result = [...groups];
  //     let msg = { ...newMessage, position: MsgPosition.Empty } as MsgInfo;
  //     if (result.length > 0) {
  //       const last = result[result.length - 1];
  //       if (last.sender === newMessage.sender) {
  //         if (result.length > 1) {
  //           const previous = result[result.length - 2];
  //           if (previous.sender === newMessage.sender)
  //             last.position = MsgPosition.Middle;
  //         }
  //         msg.position = MsgPosition.End;
  //       } else msg.position = MsgPosition.Start;
  //     }
  //     result.push(msg);
  //     return result;
  //   });

  //   const messageIndex = messages().length - 1;

  //   const messageContainer = document.getElementById("message-container");
  //   const currentMessages = untrack(() => messages());
  //   if (messageContainer) {
  //     const element = messageContainer.lastChild?.lastChild
  //       ?.lastChild as HTMLElement;
  //     if (!element) return messageIndex;

  //     if (newMessage.sender === MsgSender.User) scrollToBottom();

  //     const isLastItem = findEndIndex() === currentMessages.length - 1;
  //     if (!isLastItem) return messageIndex;

  //     const hasHistory = currentMessages.length > 1;
  //     const sameSender = hasHistory
  //       ? newMessage.sender ===
  //         currentMessages[currentMessages.length - 2].sender
  //       : false;
  //     element.style.transformOrigin =
  //       (sameSender ? "top" : "bottom") +
  //       " " +
  //       (newMessage.sender === MsgSender.User ? "right" : "left");
  //     animate(
  //       element,
  //       {
  //         opacity: [0, 1],
  //         scale: [0, 1],
  //       },
  //       {
  //         duration: 0.3,
  //         ease: [0, 0, 0, 1],
  //       }
  //     );
  //     scrollToBottom();
  //   }
  //   return messageIndex;
  // };

  // const pushStr = (text: string, index?: number) => {
  //   if (text.trim() === "") return;
  //   if (messages().length === 0) return;

  //   const safeIndex =
  //     index !== undefined
  //       ? Math.min(index, messages().length - 1)
  //       : messages().length - 1;

  //   setMessages((groups) => {
  //     let result = [...groups];
  //     result[safeIndex].content += text;
  //     return result;
  //   });

  //   if (safeIndex === findEndIndex()) scrollToBottom();
  // };

  // const tipPop = (tip: MsgTip, index?: number) => {
  //   setMessages((groups) => {
  //     let result = [...groups];
  //     let extra = [...(result[index ?? messages().length - 1].extra ?? [])];
  //     extra = extra.concat(tip);
  //     result[index ?? messages().length - 1].extra = extra;
  //     return result;
  //   });
  // };

  const appendMessage = (content: string, sender?: Sender): number => {
    let index = 0;
    setMessages((prev) => {
      let value = [...prev];
      index =
        value.push({
          content,
          sender: sender ?? Sender.Own,
        }) - 1;
      return value;
    });
    return index;
  };
  const pushStr = (index: number, str: string) => {
    let value = [...messages()];
    const item = value.at(index);
    if (item) item.content += str;
    setMessages(value);
  };

  const clearHistory = () => {
    setMessages([]);
  };

  let chatBox: VirtualizerHandle;
  let position = 0;
  let scrollToBottom = () => initReport();
  const savePosition = () => {
    position = chatBox.scrollOffset;
  };
  const loadPosition = () => {
    chatBox.scrollTo(position);
  };

  onMount(() => {
    if (props.getMethod)
      props.getMethod(
        {
          save: savePosition,
          load: loadPosition,
        },
        scrollToBottom,
        appendMessage,
        pushStr,
        clearHistory
      );
  });

  return (
    <ChatMessageBox
      paddingBottom="12rem"
      getMethods={(_, toBottom) => {
        scrollToBottom = toBottom;
      }}
      ref={(e) => (chatBox = e)}
      style={{
        "box-sizing": "border-box",
        "padding-inline": "0.5rem",
        "--color-border-default": "transparent",
      }}
      snapOffset={750}
    >
      {messages()
      // .map((value) => {
      //   const formatContent = (
      //     <SolidMarkdown
      //       class="markdown-body"
      //       remarkPlugins={[remarkGfm]}
      //       children={value.content}
      //       renderingStrategy="reconcile"
      //     />
      //   );
      //   console.log(document.getElementsByClassName("markdown-body")[0]);

      //   return {
      //     sender: value.sender,
      //     content: formatContent,
      //   };
      // })
      }
    </ChatMessageBox>
  );
};

export default HomePage;
