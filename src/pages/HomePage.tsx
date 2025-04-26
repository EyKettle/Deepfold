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
  ) => void;
}

const HomePage: Component<homePageProps> = (props) => {
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
              duration: 0.5,
              bounce: 0.25,
            }
          ).then(resolve);
        })
      }
    />
  );
};

export default HomePage;
