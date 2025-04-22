import { ChatMessage, Sender } from "./chatMessageBox";
import { SolidMarkdown } from "solid-markdown";
import remarkGfm from "remark-gfm";
import { createRoot, createSignal, JSXElement, Show } from "solid-js";
import Loading from "../loading";

export const createMarkdownMessage = (
  operations: {
    append: (info: ChatMessage, open?: boolean) => number;
    set: (index: number, content: any, align?: boolean) => void;
    close: (index: number) => void;
    alignBottom: (sudden?: boolean) => void;
  },
  sender: Sender
): {
  push: (str: string) => void;
  setBar: (element: JSXElement) => void;
  over: () => void;
} => {
  const [raw, setRaw] = createSignal("");
  const [bottom, setBottom] = createSignal<JSXElement | undefined>(undefined);
  const markdown = createRoot((dispose) => ({
    element: (
      <Show
        when={raw() !== "" || bottom() !== undefined}
        fallback={<Loading style={{ height: "1rem", width: "1rem" }} />}
      >
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
  const targetIndex = operations.append(
    { sender, content: markdown.element },
    true
  );
  const push = (str: string) => {
    setRaw(raw() + str);
    operations.alignBottom(true);
  };
  const setBar = (element: JSXElement) => setBottom(element);
  const over = () => {
    operations.close(targetIndex);
    markdown.dispose();
  };
  return {
    push,
    setBar,
    over,
  };
};
