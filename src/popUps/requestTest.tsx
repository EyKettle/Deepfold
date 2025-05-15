import { Component } from "solid-js";
import { Button } from "../components/button";
import Blocker from "../components/blocker";
import { Channel, invoke } from "@tauri-apps/api/core";
import { parseServiceError } from "../utils/debugger";

interface RequestTestProps {
  ref: (element: HTMLDivElement) => void;
  operations: {
    close: () => void;
  };
}

const RequestTest: Component<RequestTestProps> = (props) => {
  let textArea: HTMLTextAreaElement;
  let messageBox: HTMLPreElement;

  const handleSubmit = () => {
    messageBox.textContent = "";
    const streamChannel = new Channel<StreamEvent>();
    let content = "";
    const push = (str: string) => {
      content += str;
      messageBox.textContent = content;
    };
    streamChannel.onmessage = (message) => {
      console.log(message);

      switch (message.event) {
        case "push":
          push(message.data);
          break;
        case "tool":
          push("\n" + message.data);
          break;
        case "end":
          if (message.data.messages.length === 0) {
            break;
          }
          if (message.data.interrupted) {
            push("\n[打断]");
          }
          break;
        case "error":
          switch (message.data.type) {
            case "requestSending":
              push(("\n" + message.data.detail) as string);
              break;
            case "serialize":
              console.warn("Serialize error", message.data.detail);
              break;
          }
          break;
      }
    };
    invoke("debug_request", {
      json: textArea.value,
      channel: streamChannel,
    }).catch((e) => {
      parseServiceError(e);
      messageBox.textContent = "程序内部错误";
    });
  };
  return (
    <>
      <Blocker
        style={{
          position: "absolute",
          inset: "-8px",
        }}
        onClick={props.operations.close}
      />
      <div
        ref={props.ref}
        style={{
          position: "absolute",
          height: "calc(100vh - 12rem)",
          width: "calc(100vw - 2rem)",
          top: "0",
          translate: "0 2rem",
          "max-width": "31rem",
          "box-sizing": "border-box",
          border: "1px solid var(--color-border-default)",
          "background-color": "var(--color-surface-glass)",
          "box-shadow": "0 16px 32px var(--color-shadow)",
          "border-radius": "1rem",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "0.5rem",
            margin: 0,
            overflow: "scroll",
            height: "100%",
            width: "100%",
            "min-height": "16rem",
            "max-width": "31rem",
            "box-sizing": "border-box",
            "white-space": "pre-wrap",
            "text-align": "start",
            display: "grid",
            "place-items": "stretch",
            "grid-template-rows": "1.5rem 1fr auto 1.5rem 2fr",
            "row-gap": "0.5rem",
            "padding-inline": "1rem",
            "padding-bottom": "1rem",
          }}
        >
          <span
            style={{
              "font-size": "1.125rem",
              "text-align": "center",
              "user-select": "none",
              translate: "0 -1px",
            }}
          >
            请求头测试
          </span>
          <textarea
            ref={(e) => (textArea = e)}
            style={{
              outline: "none",
              "box-shadow": "0 0 0 1px var(--color-border-default)",
              "border-radius": "0.5rem",
              "background-color": "var(--color-surface-glass)",
              "box-sizing": "border-box",
              padding: "0.5rem",
              resize: "none",
              width: "100%",
            }}
            placeholder="JSON 数据"
          />
          <Button label="发送" onClick={handleSubmit} />
          <h3 style={{ margin: 0, "margin-top": "0.5rem" }}>Assistant</h3>
          <pre
            ref={(e) => (messageBox = e)}
            style={{
              margin: 0,
              "text-wrap": "wrap",
              "overflow-wrap": "anywhere",
              overflow: "scroll",
            }}
          >
            {"键入完整请求数据并提交\n等待响应"}
          </pre>
        </div>
      </div>
    </>
  );
};

export default RequestTest;
