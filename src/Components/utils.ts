import { JSX } from "solid-js";
import { VirtualizerHandle } from "virtua/solid";
export function separateValueAndUnit(
  cssValue: string
): { value: number; unit: string } | null {
  const match = cssValue.match(/^(\d+(\.\d*)?|\.\d+)([a-zA-Z%]+)?$/);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[3] || "";
    return { value, unit };
  }
  return null;
}

export const blocker = (height?: string, width?: string) => {
  const div = document.createElement("div");
  div.style.flexShrink = "0";
  if (height) div.style.height = height;
  if (width) div.style.width = width;
  return div;
};

export const buttonSize = (size: "large" | "medium" | "normal") => {
  let style: JSX.CSSProperties = {};
  switch (size) {
    case "large":
      style["font-size"] = "1.75rem";
      style["min-height"] = "3.5rem";
      style["min-width"] = "3.5rem";
      style.padding = "1rem 1.5rem";
      style["border-radius"] = "1.25rem";
      break;
    case "medium":
      style["font-size"] = "1.25rem";
      style["min-height"] = "3rem";
      style["min-width"] = "3rem";
      style.padding = "0.75rem 1rem";
      style["border-radius"] = "0.75rem";
      break;
  }
  return style;
};

export const roundButton = (size?: string) => {
  let style: JSX.CSSProperties = {
    height: size,
    width: size,
    "border-radius": "50%",
  };
  return style;
};

export const alignInfo = (
  alignOffset: number,
  vlist: VirtualizerHandle,
  pos: any,
  scrolling: boolean
) => {
  new Promise<void>((resolve) => {
    alignOffset !== undefined &&
      vlist !== undefined &&
      console.log(
        "目标点",
        pos.offsetY,
        "位移",
        vlist.scrollOffset,
        vlist.scrollSize,
        pos.offsetY + vlist.viewportSize,
        scrolling,
        "结果",
        alignOffset !== undefined &&
          vlist !== undefined &&
          vlist.scrollSize - (pos.offsetY + vlist.viewportSize) <=
            alignOffset &&
          !scrolling
      );
    setTimeout(() => {
      alignOffset !== undefined &&
        vlist !== undefined &&
        console.log(vlist.scrollSize);
      resolve();
    }, 20);
  });
};
