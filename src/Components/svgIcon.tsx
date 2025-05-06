import { Component, createRoot } from "solid-js";

export enum Icons {
  Prev = "prev",
  Next = "next",
}

interface SvgIconProps {
  name: Icons;
  size?: number;
  fill?: string;
}

const SvgIcon: Component<SvgIconProps> = (props) => {
  return (
    <svg
      height={props.size}
      width={props.size}
      fill={props.fill ?? "var(--color-theme-text)"}
    >
      <use href={`#icon-${props.name}`} />
    </svg>
  );
};

export const svgIcon = (name: Icons, size?: number, fill?: string) => {
  return createRoot((dispose) => {
    dispose();
    return (
      <svg height={size} width={size} fill={fill ?? "var(--color-theme-text)"}>
        <use href={`#icon-${name}`} />
      </svg>
    ) as Element;
  });
};

export default SvgIcon;
