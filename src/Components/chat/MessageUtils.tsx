import { ChatMessage, Sender } from "./chatMessageBox";
import { SolidMarkdown } from "solid-markdown";
import remarkGfm from "remark-gfm";
import { createRoot, createSignal, JSXElement, Show } from "solid-js";
import Loading from "../loading";
import MessageStatusBar, {
  MessageStatus,
} from "../../controls/MessageStatusBar";

export const streamAiMessage = (
  operations: {
    append: (info: ChatMessage, open?: boolean) => number;
    set: (index: number, content: any, align?: boolean) => void;
    close: (index: number) => void;
    alignWith: (fun: () => void, duration?: number) => void;
    scrollToBottom: (duration?: number) => void;
  },
  sender: Sender
): {
  push: (str: string) => void;
  setTopBar: (element: Element | JSXElement) => void;
  setBottomBar: (element: Element | JSXElement) => void;
  setStatus: (status: MessageStatus) => void;
  over: () => void;
} => {
  const [raw, setRaw] = createSignal("");
  const [top, setTop] = createSignal<JSXElement | undefined>(undefined);
  const [bottom, setBottom] = createSignal<JSXElement | undefined>(undefined);
  const [note, setNote] = createSignal<MessageStatus | undefined>(undefined);
  const markdown = createRoot((dispose) => ({
    element: (
      <Show
        when={raw() !== "" || top() !== undefined || bottom() !== undefined}
        fallback={<Loading style={{ height: "1rem", width: "1rem" }} />}
      >
        <Show when={top() !== undefined}>
          <div style={{ display: "inline-grid", width: "100%" }}>{top()}</div>
        </Show>
        <Show when={raw().trim() !== ""}>
          <SolidMarkdown
            class="chat-markdown"
            remarkPlugins={[remarkGfm]}
            children={raw()}
            renderingStrategy="reconcile"
          ></SolidMarkdown>
        </Show>
        <Show when={bottom() !== undefined}>
          <div style={{ display: "inline-grid", width: "100%" }}>
            {bottom()}
          </div>
        </Show>
        <Show when={note() !== undefined}>
          <MessageStatusBar {...note()!} />
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
    operations.alignWith(() => setRaw(raw() + str), 0);
  };
  const setTopBar = (element: Element | JSXElement) => {
    check();
    setTop(element);
  };
  const setBottomBar = (element: Element | JSXElement) => {
    check();
    operations.alignWith(() => setBottom(element), 0);
  };
  const setStatus = (status: MessageStatus) => {
    check();
    operations.alignWith(() => setNote(status), 0);
  };
  const over = () => {
    if (targetIndex) operations.close(targetIndex);
    markdown.dispose();
  };
  return {
    push,
    setTopBar,
    setBottomBar,
    setStatus,
    over,
  };
};
