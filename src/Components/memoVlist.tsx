import { Component, JSX, JSXElement, onMount } from "solid-js";
import { DOMElement } from "solid-js/jsx-runtime";
import { VList, VListHandle } from "virtua/solid";

export type ScrollDelta = {
  vertical: number;
  horizontal: number;
};

interface MemoVlistProps {
  ref?: (vlist: VListHandle) => void;
  data: any[];
  children: (item: any, index: number) => JSXElement;
  class?: string;
  style?: JSX.CSSProperties;
  horizontal?: boolean;
  memoList?: Map<number, Element | JSXElement>;
  getMethods?: (
    addMemoItem: (index: number, ref: Element | JSXElement) => void,
    removeMemoItem: (index: number) => void
  ) => void;
}

const MemoVlist: Component<MemoVlistProps> = (props) => {
  let memoList = props.memoList ?? new Map<number, Element | JSXElement>();

  const addMemoItem = (index: number, ref: Element | JSXElement) => {
    memoList.set(index, ref);
  };
  const removeMemoItem = (index: number) => {
    memoList.delete(index);
  };
  props.getMethods?.(addMemoItem, removeMemoItem);

  return (
    <VList
      ref={(e) => {
        if (e && props.ref) props.ref(e);
      }}
      class={props.class}
      style={{
        display: "flex",
        "flex-direction": "column",
        height: "100%",
        width: "100%",
        ...props.style,
      }}
      horizontal={props.horizontal}
      data={props.data}
    >
      {(item, index) => memoList.get(index) || props.children(item, index)}
    </VList>
  );
};
export default MemoVlist;
