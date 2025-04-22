import { Component, onMount } from "solid-js";
import ChatMessageBox, { ChatMessage } from "../components/chat/chatMessageBox";

import "../components/markdown.css";
import { animate } from "motion";

interface homePageProps {
  getOps?: (
    append: (info: ChatMessage, open?: boolean) => number,
    set: (index: number, content: any, align?: boolean) => void,
    close: (index: number) => void,
    clear: () => void,
    alignBottom: (sudden?: boolean) => void,
    scrollToBottom: () => void
    // getMessages: () => MsgInfo[],
    // setMessage: (text: string, index?: number) => void,
    // tipPop: (tip: MsgTip, index?: number) => void
  ) => void;
}

const HomePage: Component<homePageProps> = (props) => {
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

  let append: (info: ChatMessage, open?: boolean) => number;
  let set: (index: number, content: any, align?: boolean) => void;
  let close: (index: number) => void;
  let clear: () => void;
  let alignBottom: (sudden?: boolean) => void;
  let scrollToBottom: () => void;

  onMount(() => {
    if (props.getOps)
      props.getOps(append, set, close, clear, alignBottom, scrollToBottom);
  });

  return (
    <ChatMessageBox
      paddingBottom="12rem"
      getListOps={(a, _r, s, _o, cs, cr) => {
        append = a;
        set = s;
        close = cs;
        clear = cr;
      }}
      getScrollOps={(_t, toBottom, _p, _s, _e, _i, ab) => {
        scrollToBottom = toBottom;
        alignBottom = ab;
      }}
      style={{
        "box-sizing": "border-box",
        "padding-inline": "0.5rem",
        "--color-border-default": "transparent",
        "justify-content": "start",
      }}
      snapOffset={44}
      showupMotion={(bubble) =>
        new Promise<void>((resolve) => {
          animate(
            bubble,
            {
              opacity: [0, 1],
              filter: ["blur(0.5rem)", "blur(0)"],
            },
            {
              duration: 0.3,
              ease: [0.5, 0, 0, 1],
            }
          );
          animate(
            bubble,
            {
              scale: [0.6, 1],
            },
            {
              type: "spring",
              duration: 0.4,
              bounce: 0.3,
            }
          ).then(resolve);
        })
      }
    >
      {
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
