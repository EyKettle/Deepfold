import { createRoot, JSXElement } from "solid-js";

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
