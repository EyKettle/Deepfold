import { ChatMessage, Sender } from "./chatMessageBox";
import { SolidMarkdown } from "solid-markdown";
import remarkGfm from "remark-gfm";
import { createRoot, createSignal, JSXElement, Show } from "solid-js";
import Loading from "../loading";

export const streamAiMessage = (
  operations: {
    append: (info: ChatMessage, open?: boolean) => number;
    set: (index: number, content: any, align?: boolean) => void;
    close: (index: number) => void;
    alignBottom: (sudden?: boolean) => void;
  },
  sender: Sender
): {
  push: (str: string) => void;
  setTopBar: (element: Element | JSXElement) => void;
  setBottomBar: (element: Element | JSXElement) => void;
  over: () => void;
} => {
  const [raw, setRaw] = createSignal("");
  const [top, setTop] = createSignal<JSXElement | undefined>(undefined);
  const [bottom, setBottom] = createSignal<JSXElement | undefined>(undefined);
  const markdown = createRoot((dispose) => ({
    element: (
      <Show
        when={raw() !== "" || top() !== undefined || bottom() !== undefined}
        fallback={<Loading style={{ height: "1rem", width: "1rem" }} />}
      >
        <Show when={top() !== undefined}>
          <div style={{ display: "inline-flex", width: "100%" }}>{top()}</div>
        </Show>
        <Show when={raw() !== ""}>
          <SolidMarkdown
            class="chat-markdown"
            remarkPlugins={[remarkGfm]}
            children={raw()}
            renderingStrategy="reconcile"
          ></SolidMarkdown>
        </Show>
        <Show when={bottom() !== undefined}>
          <div style={{ display: "inline-flex", width: "100%" }}>
            {bottom()}
          </div>
        </Show>
      </Show>
    ),
    dispose,
  }));
  let targetIndex: number | undefined;
  const check = () => {
    if (!targetIndex)
      targetIndex = operations.append(
        { sender, content: markdown.element },
        true
      );
  };
  const push = (str: string) => {
    check();
    setRaw(raw() + str);
    operations.alignBottom(true);
  };
  const setTopBar = (element: Element | JSXElement) => {
    check();
    setTop(element);
  };
  const setBottomBar = (element: Element | JSXElement) => {
    check();
    setBottom(element);
  };
  const over = () => {
    if (targetIndex) operations.close(targetIndex);
    markdown.dispose();
  };
  return {
    push,
    setTopBar,
    setBottomBar,
    over,
  };
};
