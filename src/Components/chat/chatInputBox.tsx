import { Component, createEffect, JSX, onMount } from "solid-js";
import { Button } from "../button";

interface ChatInputBoxProps {
  showed?: boolean;
  fontSize?: string;
  class?: string;
  style?: JSX.CSSProperties;
  placeHolder?: string;
  submitLabel?: string;
  functionArea?: any;
  onFocus?: (
    event: FocusEvent & {
      currentTarget: HTMLTextAreaElement;
      target: HTMLTextAreaElement;
    }
  ) => void;
  onBlur?: (
    event: FocusEvent & {
      currentTarget: HTMLTextAreaElement;
      target: HTMLTextAreaElement;
    }
  ) => void;
  onChange?: (
    event: Event & {
      currentTarget: HTMLTextAreaElement;
      target: HTMLTextAreaElement;
    }
  ) => void;
  onInput?: (
    event: InputEvent & {
      currentTarget: HTMLTextAreaElement;
      target: HTMLTextAreaElement;
    }
  ) => void;
  onSubmit?: (text: string) => boolean;
  showupMotion?: (
    isShow: boolean,
    outerBox: HTMLDivElement,
    textArea: HTMLTextAreaElement
  ) => void;
  bindKey?: {
    submit: string;
  };
  ref?: (outerBox: HTMLDivElement, textArea: HTMLTextAreaElement) => void;
}

const ChatInputBox: Component<ChatInputBoxProps> = (props) => {
  if (props.showed === undefined) props.showed = true;

  let element: HTMLDivElement;

  onMount(() => {
    if (props.ref)
      props.ref(element, element.firstChild as HTMLTextAreaElement);
  });

  createEffect(() => {
    if (props.showupMotion) {
      props.showupMotion(
        props.showed ?? true,
        element,
        element.firstChild as HTMLTextAreaElement
      );
    } else if (props.showed) element.style.translate = "0 0";
    else {
      const height = element.clientHeight;
      element.style.translate = "0 " + height + "px";
    }
  });

  const handleSubmit = () => {
    if (!props.onSubmit && !element.firstChild) return;
    const textArea = element.firstChild as HTMLTextAreaElement;
    textArea.focus();
    if (textArea.value !== "")
      if (props.onSubmit?.(textArea.value)) textArea.value = "";
  };

  let submitPress: () => void;
  let submitRelease: () => void;
  return (
    <div
      aria-disabled={!props.showed}
      ref={(e) => (element = e)}
      class={props.class}
      style={{
        display: "grid",
        "grid-template-rows": "1fr auto",
        padding: "1rem",
        gap: "0.5rem",
        "box-sizing": "border-box",
        "border-radius": "1.5rem",
        "border-bottom-left-radius": "0",
        "border-bottom-right-radius": "0",
        "border-style": "solid",
        "border-width": "0.0625rem",
        "border-bottom-width": "0",
        "border-color": "var(--color-border-default)",
        "background-color": "var(--color-input-solid)",
        "box-shadow": "0 0.25rem 0.5rem var(--color-shadow)",
        "transition-property": "all",
        "transition-duration": "0.2s",
        "transition-timing-function": "cubic-bezier(0.5, 0, 0, 1)",
        ...props.style,
      }}
    >
      <textarea
        name="chat-input"
        disabled={!props.showed}
        style={{
          "font-size": props.fontSize ?? "1rem",
          border: "none",
          outline: "none",
          resize: "none",
          width: "100%",
          background: "none",
          "transition-property": "all",
          "transition-duration": "0.2s",
          "transition-timing-function": "cubic-bezier(0.5, 0, 0, 1)",
        }}
        placeholder={props.placeHolder}
        spellcheck={false}
        on:keydown={(e) => {
          if (e.ctrlKey && e.key === "Enter") submitPress();
        }}
        on:keyup={(e) => {
          if (e.ctrlKey && e.key === "Enter") {
            submitRelease();
            handleSubmit();
          }
        }}
        on:focus={props.onFocus}
        on:blur={props.onBlur}
        on:change={props.onChange}
        on:input={props.onInput}
      />
      <div
        aria-disabled={!props.showed}
        style={{
          display: "grid",
          "grid-template-columns": "auto 6rem",
          height: "2.75rem",
          width: "100%",
          gap: "0.5rem",
        }}
      >
        {props.functionArea}
        <Button
          disabled={!props.showed}
          label={props.submitLabel}
          borderRadius="1.375rem"
          backgroundColor={{
            default: "var(--color-button-main-default)",
            hover: "var(--color-button-main-hover)",
            active: "var(--color-button-main-active)",
          }}
          color="var(--color-button-main-text)"
          style={{
            "grid-column-start": 2,
          }}
          onClick={handleSubmit}
          getAnimates={(p, r) => {
            submitPress = p;
            submitRelease = r;
          }}
        />
      </div>
    </div>
  );
};

export default ChatInputBox;
