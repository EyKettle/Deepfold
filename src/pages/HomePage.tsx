import { Component, onMount } from "solid-js";
import ChatMessageBox, { ChatMessage } from "../components/chat/chatMessageBox";

import "../components/markdown.css";
import { animate, createSpring } from "animejs";
import ScrollBar, { ScrollBarController } from "../components/scrollbar";
import { VirtualizerHandle } from "virtua/solid";

interface homePageProps {
  getOps?: (
    append: (info: ChatMessage, open?: boolean) => number,
    set: (index: number, content: any, align?: boolean) => void,
    close: (index: number) => void,
    clear: () => void,
    alignWith: (fun: () => void, duration?: number) => void,
    scrollToBottom: (duration?: number) => void
  ) => void;
}

const HomePage: Component<homePageProps> = (props) => {
  let scrollTo: (position: number, duration?: number) => void;
  let append: (info: ChatMessage, open?: boolean) => number;
  let set: (index: number, content: any, align?: boolean) => void;
  let close: (index: number) => void;
  let clear: () => void;
  let alignWith: (fun: () => void, duration?: number) => void;
  let scrollToBottom: (duration?: number) => void;

  onMount(() => {
    props.getOps?.(append, set, close, clear, alignWith, scrollToBottom);
  });

  let vlist: VirtualizerHandle;
  let scrollBarController: ScrollBarController;
  return (
    <>
      <ChatMessageBox
        ref={(v) => (vlist = v)}
        onScroll={(o) =>
          scrollBarController.set(o, vlist!.scrollSize, vlist!.viewportSize)
        }
        paddingBottom="11.5rem"
        getListOps={(a, _r, s, _o, cs, cr) => {
          append = a;
          set = s;
          close = cs;
          clear = cr;
        }}
        getScrollOps={(t, toBottom, _p, _s, _e, _i, _ab, _is, aw) => {
          scrollTo = t;
          scrollToBottom = toBottom;
          alignWith = aw;
        }}
        style={{
          "box-sizing": "border-box",
          "padding-inline": "0.5rem",
          "--color-border-default": "transparent",
          "justify-content": "start",
        }}
        bubbleStyle={{
          "align-items": "start",
          gap: "0.25rem",
        }}
        alignOffset={44}
        showupMotion={(bubble) =>
          new Promise<void>((resolve) => {
            animate(bubble, {
              opacity: [0, 1],
              filter: ["blur(0.5rem)", "blur(0rem)"],
              duration: 200,
            });
            animate(bubble, {
              scale: [0.6, 1],
              ease: createSpring({
                stiffness: 400,
                damping: 26,
              }),
              onComplete: () => resolve(),
            });
          })
        }
      />
      <ScrollBar
        controllerRef={(c) => (scrollBarController = c)}
        style={{
          top: 0,
          right: "2px",
          bottom: "11.5rem",
        }}
        onScroll={(y) => scrollTo(y, 0)}
      />
    </>
  );
};

export default HomePage;
