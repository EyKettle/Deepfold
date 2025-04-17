import { ChatMessage, Sender } from "./chatMessageBox";
import { SolidMarkdown } from "solid-markdown";
import remarkGfm from "remark-gfm";
import { createRoot, createSignal, Show } from "solid-js";
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
  over: () => void;
} => {
  const [raw, setRaw] = createSignal("");
  const markdown = createRoot((dispose) => ({
    element: (
      <Show
        when={raw() !== ""}
        fallback={<Loading style={{ height: "1rem", width: "1rem" }} />}
      >
        <SolidMarkdown
          class="chat-markdown"
          remarkPlugins={[remarkGfm]}
          children={raw()}
          renderingStrategy="reconcile"
        ></SolidMarkdown>
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
  const over = () => {
    operations.close(targetIndex);
    markdown.dispose();
  };
  return {
    push,
    over,
  };
};
