import { Component } from "solid-js";

interface MessageStatus {
  label: string;
  type?: "error" | "warn" | "info" | "nothing";
}

const MessageStatusBar: Component<MessageStatus> = (props) => {
  return (
    <div
      style={{
        "padding-block": "4px",
        "padding-inline": "8px",
        "border-radius": "8px",
        opacity: 0.6,
        color: `var(--color-msg-${props.type ?? "info"}-text)`,
        "background-color": `var(--color-msg-${props.type ?? "info"}-back)`,
        "user-select": "none",
      }}
    >
      {props.label}
    </div>
  );
};

export default MessageStatusBar;
