import { createRoot, Show } from "solid-js";
import { Button } from "../components/button";

export const requestErrorTip = (title: string, description: string) => {
  return createRoot((dispose) => {
    dispose();
    return (
      <div class="chat-markdown" style={{ "user-select": "none" }}>
        <p style={{ "font-weight": "bold" }}>{title}</p>
        <p style={{ "user-select": "text" }}>{description}</p>
      </div>
    );
  });
};

type ToolCallButton = {
  icon: string;
  callback: () => void;
};

export const toolCallTip = (
  icon: string,
  name: string,
  process: string,
  operations?: ToolCallButton[]
) => {
  return createRoot((dispose) => {
    dispose();
    return (
      <div class="toolcall-tip-wrapper">
        <div class={`toolcall-tip ${operations ? "o1" : ""}`}>
          <h1>{icon}</h1>
          <h2>{name}</h2>
          <p title={process}>{process}</p>
          <Show when={operations}>
            <Button
              icon={operations![0].icon}
              onClick={operations![0].callback}
              backgroundColor={{
                default: "var(--color-button-main-default)",
                hover: "var(--color-button-main-hover)",
                active: "var(--color-button-main-active)",
              }}
            />
          </Show>
        </div>
      </div>
    ) as Element;
  });
};
