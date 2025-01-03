import { Component, createMemo, Show } from "solid-js";

import "./Components.css";

interface InputBoxProps {
  show: boolean;
  files?: string[];
  onSubmit: (text: string) => void;
}

export const InputBox: Component<InputBoxProps> = (props) => {
  const fileNames = props.files?.map((file) => file.split("/").pop());
  const containerClass = createMemo(
    () => "inputBox-container" + (props.show ? "" : " leave")
  );

  const submit = () => {
    const textarea = document.getElementById("inputBox")?.children[0] as HTMLTextAreaElement;
    if (textarea) {
      const textValue = textarea.value;
      if (textValue.trim() !== "") {
        props.onSubmit(textValue.trimEnd());
        textarea.value = "";
      }
      textarea.focus();
    }
  };

  return (
    <div id="inputBox" class={containerClass()}>
      <textarea
        placeholder="描述你的需求"
        on:keyup={(e) => {
          if (e.key === "Enter" && e.ctrlKey) submit();
        }}
      />
      <div class="bar">
        <button class="icon addFile ghost">{"\ue8e5"}</button>
        <div class="files">
          <Show when={fileNames}>
            <div class="file">{fileNames!.pop()}</div>
            <Show when={fileNames!.length > 1}>
              <div class="card" />
            </Show>
          </Show>
        </div>
        <button class="submit" onClick={() => submit()}>
          提交
        </button>
      </div>
    </div>
  );
};
