import { createRoot } from "solid-js";

export const requestErrorTip = (title: string, description: string) => {
  const element = (
    <div class="chat-markdown" style={{ "user-select": "none" }}>
      <p style={{ "font-weight": "bold" }}>{title}</p>
      <p style={{ "user-select": "text" }}>{description}</p>
    </div>
  );
  const result = createRoot((dispose) => {
    dispose();
    return element;
  });
  return result;
};
