import { Component, JSX, Show } from "solid-js";

interface LoadingProps {
  text?: string;
  class?: string;
  style?: JSX.CSSProperties;
}

const Loading: Component<LoadingProps> = (props) => {
  return (
    <div
      class={props.class}
      style={{
        gap: "1rem",
        display: "flex",
        "justify-content": "center",
        "align-items": "center",
        height: "100%",
        width: "100%",
        ...props.style,
      }}
    >
      <svg width="40" height="40" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="var(--color-theme-accent)"
          stroke-width="12"
          stroke-linecap="round"
          style={{
            "transform-origin": "50% 50%",
            animation:
              "loadingRotate 1s cubic-bezier(0.2, 0.1, 0.8, 0.9) infinite, loadingPath 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite alternate",
          }}
        />
      </svg>
      <Show when={props.text}>
        <div style={{ "font-size": "1.5rem" }}>{props.text}</div>
      </Show>
    </div>
  );
};

export default Loading;
