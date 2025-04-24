import { createRoot } from "solid-js";

export const requestErrorTip = (title: string, content: Element) => {
  const element = (
    <div class="chat-markdown" style={{ "user-select": "none" }}>
      <p style={{ "font-weight": "bold" }}>{title}</p>
      <p style={{ "user-select": "text" }}>{content}</p>
    </div>
  );
  const result = createRoot((dispose) => {
    dispose();
    return element;
  });
  return result;
};
