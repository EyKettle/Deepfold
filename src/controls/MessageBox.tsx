import { Component, For, Show, Suspense } from "solid-js";
import { VList, VListHandle } from "virtua/solid";
import "./Components.css";
import { MsgTip } from "../Ai/CoreService";

export enum MsgSender {
  User = "user",
  System = "system",
  Bot = "bot",
}

export enum MsgPosition {
  Empty,
  Start = "start",
  Middle = "middle",
  End = "end",
}

export interface MsgInfo {
  sender: MsgSender;
  position: MsgPosition;
  content: string;
  extra?: MsgTip[];
}

interface MessageContainerProps {
  messages?: MsgInfo[];
  commands: (arg0: () => number, arg1: () => void) => void;
}

export const MessageContainer: Component<MessageContainerProps> = (props) => {
  let listHandle: VListHandle | undefined;

  const findEndIndex = () => {
    if (!listHandle) return 0;
    return listHandle.findEndIndex();
  }
  const scrollToBottom = () => {
    if (!listHandle) return;
    listHandle.scrollTo(listHandle.scrollSize);
  }
  props.commands(findEndIndex, scrollToBottom)

  return (
    <div id="message-container">
      <VList ref={h => listHandle = h} data={props.messages || []}>
        {(msg: MsgInfo, index) => {
          let tail;
          if (index === (props.messages!.length - 1)) tail = <div style={{ height: "154px" }}></div>
          return (<>
            <Suspense fallback={<div class="loading" />}>
              <Message {...msg} />
            </Suspense>
            {tail}
          </>)
        }}
      </VList>
    </div>
  );
};

const Message: Component<MsgInfo> = (props) => {
  const msgClass = () => {
    let cls = "message-wrapper";
    cls += ` ${props.sender}`;
    if (props.position !== MsgPosition.Empty) cls += ` ${props.position}`;
    return cls;
  };
  const msgContent = () => {
    const paragraphs = props.content.split("\n");
    const pList = paragraphs.map((p) => <p>{p}</p>);
    return pList;
  };

  return (
    <div style={{
      display: "flex",
      "flex-direction": "column",
    }}>
      <div class={msgClass()}>
        <label class="message-content">{msgContent()}</label>
        <Show when={props.extra}>
          <div class="tip-container">
            <For each={props.extra}>{(tip) => <Tip {...tip} />}</For>
          </div>
        </Show>
      </div></div>
  );
};

const Tip: Component<MsgTip> = (props) => {
  return (
    <div class="tip-wrapper">
      <label class="icon">{props.icon}</label>
      <div class="content">
        <label class="title">{props.title}</label>
        <Show when={props.description}>
          <label class="description">{props.description}</label>
        </Show>
      </div>
      <Show when={props.buttons}>
        <div class="functions">
          <For each={props.buttons}>
            {(btn) => <button onClick={props.functions?.[0]}>{btn}</button>}
          </For>
        </div>
      </Show>
    </div>
  );
};
