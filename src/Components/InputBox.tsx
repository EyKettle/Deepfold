import { Component, JSX } from "solid-js";

interface InputBoxProps {
  ref?: (element: HTMLInputElement) => void;
  class?: string;
  style?: JSX.CSSProperties;
  placeholder?: string;
  value?: string;
  hideContent?: boolean;
  onFocus?: (
    event: FocusEvent & {
      currentTarget: HTMLInputElement;
      target: HTMLInputElement;
    }
  ) => void;
  onBlur?: (
    event: FocusEvent & {
      currentTarget: HTMLInputElement;
      target: HTMLInputElement;
    }
  ) => void;
  onChange?: (
    event: Event & {
      currentTarget: HTMLInputElement;
      target: HTMLInputElement;
    }
  ) => void;
  onInput?: (
    event: InputEvent & {
      currentTarget: HTMLInputElement;
      target: HTMLInputElement;
    }
  ) => void;
}

const InputBox: Component<InputBoxProps> = (props) => {
  let element: HTMLElement | undefined;

  return (
    <input
      ref={(e) => {
        element = e;
        props.ref?.(e);
      }}
      type={props.hideContent ? "password" : "text"}
      class={props.class}
      style={{
        border: "none",
        "font-size": "1.125rem",
        "text-align": "start",
        color: "var(--color-theme-text)",
        "border-radius": "0.5rem",
        "background-color": "var(--color-input-default)",
        "box-shadow": "0 0 0 0.0625rem var(--color-border-default)",
        padding: "0.625rem",
        "transition-property": "background-color, box-shadow",
        "transition-duration": "0.2s",
        "transition-timing-function": "cubic-bezier(0, 0, 0, 1)",
        cursor: "text",
        ...props.style,
      }}
      placeholder={props.placeholder ?? ""}
      value={props.value ?? ""}
      on:mouseenter={() => {
        if (!element || element === document.activeElement) return;
        element.style.boxShadow = "0 0 0 0.0625rem var(--color-theme-accent)";
      }}
      on:mouseleave={() => {
        if (!element || element === document.activeElement) return;
        element.style.boxShadow = "0 0 0 0.0625rem var(--color-border-default)";
      }}
      on:focus={(e) => {
        if (!element) return;
        element.style.zIndex = "3";
        element.style.boxShadow = "0 0 0 0.125rem var(--color-theme-accent)";
        props.onFocus?.(e);
      }}
      on:blur={(e) => {
        if (!element) return;
        element.style.zIndex = "unset";
        element.style.boxShadow = "0 0 0 0.0625rem var(--color-border-default)";
        props.onBlur?.(e);
      }}
      on:change={props.onChange}
      on:input={props.onInput}
    />
  );
};

export default InputBox;
