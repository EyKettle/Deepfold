import { Component, createSignal, JSX } from "solid-js";
import { VirtualizerHandle, VList } from "virtua/solid";
import { blocker, separateValueAndUnit } from "../utils";
import { ScrollToIndexOpts } from "virtua";
import { animate, motionValue } from "motion";
import { insert } from "solid-js/web";

export enum Sender {
  System,
  Own,
  Other,
}

export type ChatMessage = {
  sender: Sender;
  content?: any;
};

type ChatBubble = ChatMessage & {
  pos: BubblePosition;
};

enum BubblePosition {
  Start,
  Middle,
  End,
}

interface ChatMessageBubbleProps {
  children: ChatMessage;
  fontSize?: string;
  style?: JSX.CSSProperties;
  position: BubblePosition;
  ref?: (appearanceRef: HTMLDivElement, elementRef: HTMLDivElement) => void;
}

const ChatMessageBubble: Component<ChatMessageBubbleProps> = (props) => {
  return (
    <div
      ref={(e) => {
        const element = e;
        const appearance = e.firstElementChild as HTMLDivElement | null;
        if (!appearance) return;
        const fontSize = separateValueAndUnit(props.fontSize ?? "1rem") ?? {
          value: 1,
          unit: "rem",
        };
        appearance.style.borderRadius = 1 * fontSize.value + fontSize.unit;
        appearance.style.minHeight = 1.5 * fontSize.value + fontSize.unit;
        appearance.style.paddingBlock = 0.25 * fontSize.value + fontSize.unit;
        appearance.style.paddingInline = 0.75 * fontSize.value + fontSize.unit;
        if (props.position === BubblePosition.Start)
          appearance.style.marginTop = "0.25rem";

        element.style.justifyContent = "start";
        element.style.textAlign = "start";
        switch (props.children.sender) {
          case Sender.System:
            element.style.opacity = "0.6";
            appearance.style.backgroundColor = "transparent";
            appearance.style.border = "none";
            appearance.style.transformOrigin = "left";
            break;
          case Sender.Own:
            element.style.justifyContent = "end";
            element.style.textAlign = "end";
            appearance.style.color = "var(--color-chat-own-text-default)";
            appearance.style.backgroundColor =
              "var(--color-chat-own-back-default)";
            appearance.style.borderStyle = "solid";
            appearance.style.borderWidth = "0.0625rem";
            appearance.style.borderColor = "var(--color-border-default)";
            switch (props.position) {
              case BubblePosition.Start:
                appearance.style.borderBottomRightRadius = "0";
                appearance.style.transformOrigin = "bottom right";
                break;
              case BubblePosition.Middle:
                appearance.style.borderTopRightRadius = "0";
                appearance.style.borderBottomRightRadius = "0";
                appearance.style.transformOrigin = "right";
                break;
              case BubblePosition.End:
                appearance.style.borderTopRightRadius = "0";
                appearance.style.transformOrigin = "top right";
                break;
            }
            break;
          case Sender.Other:
            appearance.style.color = "var(--color-chat-other-text-default)";
            appearance.style.backgroundColor =
              "var(--color-chat-other-back-default)";
            appearance.style.borderStyle = "solid";
            appearance.style.borderWidth = "0.0625rem";
            appearance.style.borderColor = "var(--color-border-default)";
            switch (props.position) {
              case BubblePosition.Start:
                appearance.style.borderBottomLeftRadius = "0";
                appearance.style.transformOrigin = "bottom left";
                break;
              case BubblePosition.Middle:
                appearance.style.borderTopLeftRadius = "0";
                appearance.style.borderBottomLeftRadius = "0";
                appearance.style.transformOrigin = "left";
                break;
              case BubblePosition.End:
                appearance.style.borderTopLeftRadius = "0";
                appearance.style.transformOrigin = "top left";
                break;
            }
            break;
        }

        props.ref?.(appearance, element);
      }}
      style={{
        display: "inline-flex",
        width: "100%",
        padding: "0.125rem",
        "text-wrap": "wrap",
        "white-space": "break-spaces",
        "box-sizing": "border-box",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          "text-align": "start",
          "justify-content": "center",
          "align-items": "center",
          "transition-property": "opacity, scale, filter, border-radius",
          "transition-duration": "0.2s",
          "transition-timing-function": "cubic-bezier(0.5, 0, 0, 1)",
          "will-change": "scale, filter",
          "overflow-wrap": "anywhere",
          ...props.style,
        }}
      >
        {props.children.content}
      </div>
    </div>
  );
};

interface ChatMessageBoxProps {
  ref?: (vlist: VirtualizerHandle) => void;
  initData?: ChatMessage[];
  fontSize?: string;
  style?: JSX.CSSProperties;
  bubbleStyle?: JSX.CSSProperties;
  paddingTop?: string;
  paddingBottom?: string;
  snapOffset?: number;
  showupMotion?: (element: HTMLDivElement) => Promise<void>;
  getListOps?: (
    append: (info: ChatMessage, open?: boolean) => number,
    remove: (index: number) => void,
    set: (index: number, content: any, align?: boolean) => void,
    open: (index: number) => void,
    close: (index: number) => void,
    clear: () => void,
    getList: () => ReadonlyArray<ChatMessage>
  ) => void;
  getScrollOps?: (
    scrollTo: (position: number, duration?: number) => void,
    scrollToBottom: (duration?: number) => void,
    getPosition: () => number,
    getStartIndex: () => number,
    getEndIndex: () => number,
    scrollToIndex: (index: number, opts?: ScrollToIndexOpts) => void,
    alignBottom: (sudden?: boolean) => void
  ) => void;
}

const ChatMessageBox: Component<ChatMessageBoxProps> = (props) => {
  let vlist: VirtualizerHandle | undefined;
  let msgList: ChatBubble[] = props.initData
    ? props.initData.map((raw, index) => ({
        pos: getPos(props.initData!, index, raw),
        ...raw,
      }))
    : [];
  let memoBubble = new Map<number, { ref?: HTMLDivElement; keep?: boolean }>();
  let animationQueue = new Set<number>();
  const [renderList, setRenderList] = createSignal<
    Array<ChatBubble | HTMLDivElement>
  >([]);

  const alignBottom = (sudden?: boolean) => {
    if (
      props.snapOffset &&
      vlist &&
      vlist.scrollSize - (vlist.scrollOffset + vlist.viewportSize) <=
        props.snapOffset
    )
      scrollToBottom(sudden ? 0 : undefined);
  };
  const submitUpdate = (scroll?: boolean, sudden?: boolean) => {
    setRenderList([
      blocker(props.paddingTop),
      ...msgList,
      blocker(props.paddingBottom),
    ]);
    if (scroll) alignBottom(sudden);
  };

  const getPos = (
    list: ChatMessage[] | ChatBubble[],
    index: number,
    info: ChatMessage
  ) => {
    if (list.length > 0) {
      const isSameAsPreviousSender =
        index > 0 && info.sender === list[index - 1].sender;
      const isSameAsNextSender =
        index < list.length - 1 && info.sender === list[index + 1].sender;
      return isSameAsPreviousSender
        ? isSameAsNextSender
          ? BubblePosition.Middle
          : BubblePosition.End
        : BubblePosition.Start;
    } else return BubblePosition.Start;
  };

  const append = (info: ChatMessage, open?: boolean) => {
    const actualInfo: ChatBubble = {
      pos: getPos(msgList, msgList.length, info),
      ...info,
    };
    const index = msgList.push(actualInfo) - 1;
    const prev = msgList[msgList.length - 2];
    if (prev && prev.sender === info.sender) {
      prev.pos = getPos(msgList, msgList.length - 2, prev);
      const prevBubble = memoBubble.get(msgList.length - 2)?.ref
        ?.firstElementChild as HTMLDivElement | null | undefined;
      if (prevBubble) {
        switch (prev.sender) {
          case Sender.Own:
            switch (prev.pos) {
              case BubblePosition.Start:
                prevBubble.style.borderBottomRightRadius = "0";
                prevBubble.style.transformOrigin = "bottom right";
                break;
              case BubblePosition.Middle:
                prevBubble.style.borderTopRightRadius = "0";
                prevBubble.style.borderBottomRightRadius = "0";
                prevBubble.style.transformOrigin = "right";
                break;
              case BubblePosition.End:
                prevBubble.style.borderTopRightRadius = "0";
                prevBubble.style.transformOrigin = "top right";
                break;
            }
            break;
          case Sender.Other:
            switch (prev.pos) {
              case BubblePosition.Start:
                prevBubble.style.borderBottomLeftRadius = "0";
                prevBubble.style.transformOrigin = "bottom left";
                break;
              case BubblePosition.Middle:
                prevBubble.style.borderTopLeftRadius = "0";
                prevBubble.style.borderBottomLeftRadius = "0";
                prevBubble.style.transformOrigin = "left";
                break;
              case BubblePosition.End:
                prevBubble.style.borderTopLeftRadius = "0";
                prevBubble.style.transformOrigin = "top left";
                break;
            }
            break;
        }
      }
    }
    const earliestIndex = memoBubble.keys().next().value;
    if (
      earliestIndex &&
      !memoBubble.get(earliestIndex)?.keep &&
      earliestIndex < msgList.length - 2
    )
      memoBubble.delete(earliestIndex);
    memoBubble.set(index, { keep: open });
    animationQueue.add(index);
    submitUpdate(true);
    return index;
  };
  const remove = (index: number) => {
    msgList.splice(index, 1);
    memoBubble.delete(index);
    animationQueue.delete(index);
    submitUpdate();
  };
  const set = (index: number, content: any, snap?: boolean) => {
    const target = msgList[index];
    if (target) {
      target.content = content;
      if (memoBubble.has(index)) {
        const element = memoBubble.get(index)?.ref?.firstElementChild;
        if (element instanceof HTMLDivElement) {
          element.innerHTML = "";
          insert(element, content);
        }
      }
      submitUpdate(snap, true);
    }
  };
  const open = (index: number) => {
    memoBubble.set(index, { keep: true });
    submitUpdate();
  };
  const close = (index: number) => {
    memoBubble.delete(index);
  };
  const clear = () => {
    msgList = [];
    memoBubble.clear();
    animationQueue.clear();
    submitUpdate();
  };
  const getList = (): ReadonlyArray<ChatMessage> => msgList;
  props.getListOps?.(append, remove, set, open, close, clear, getList);

  const scrollTo = (position: number, duration?: number) => {
    if (duration === 0) vlist?.scrollTo(position);
    if (vlist) {
      const pos = motionValue(vlist.scrollOffset);
      animate(pos, position, {
        duration: duration ?? 0.4,
        ease: [0.5, 0, 0, 1],
        onUpdate: (value) => vlist?.scrollTo(value),
      });
    }
  };
  const scrollToBottom = (duration?: number) => {
    if (duration === 0) vlist?.scrollTo(vlist.scrollOffset);
    if (vlist) {
      const pos = motionValue(vlist.scrollOffset);
      animate(pos, vlist.scrollSize, {
        duration: duration ?? 0.4,
        ease: [0.5, 0, 0, 1],
        onUpdate: (value) => vlist?.scrollTo(value),
      });
    }
  };
  const getPosition = (): number => (vlist ? vlist.scrollOffset : 0);
  const getStartIndex = (): number => (vlist ? vlist.findStartIndex() : 0);
  const getEndIndex = (): number => (vlist ? vlist.findEndIndex() : 0);
  const scrollToIndex = (index: number, opts?: ScrollToIndexOpts) =>
    vlist?.scrollToIndex(index, opts);
  props.getScrollOps?.(
    scrollTo,
    scrollToBottom,
    getPosition,
    getStartIndex,
    getEndIndex,
    scrollToIndex,
    alignBottom
  );

  return (
    <VList
      ref={(e) => {
        vlist = e;
        if (vlist) props.ref?.(vlist);
      }}
      data={renderList()}
      style={{
        "font-size": `${props.fontSize ?? "1rem"}`,
        "user-select": "text",
        ...props.style,
      }}
    >
      {(item, index) => {
        const realIndex = index - 1;
        const memo = memoBubble.get(realIndex)?.ref;
        if (item instanceof HTMLDivElement) return item;
        return memo ? (
          memo
        ) : (
          <ChatMessageBubble
            ref={(a) => {
              const target = memoBubble.get(realIndex);
              const element = a.parentElement as HTMLDivElement;
              if (target) {
                target.ref = element;
                if (animationQueue.has(realIndex)) {
                  animationQueue.delete(realIndex);
                  if (props.showupMotion) {
                    props.showupMotion(a).then(() => {
                      if (target.keep && index < msgList.length - 2) {
                        memoBubble.delete(index);
                      }
                    });
                  }
                }
              }
            }}
            position={item.pos}
            fontSize={props.fontSize}
            children={item}
            style={props.bubbleStyle}
          />
        );
      }}
    </VList>
  );
};

export default ChatMessageBox;
