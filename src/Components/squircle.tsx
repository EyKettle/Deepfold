import { Component, JSX } from "solid-js";

type FourSides = {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
};

interface SquircleProps {
  ref?: (el: HTMLDivElement) => void;
  children?: any;
  cornerRadius?: string;
  cornerSmoothing?: string;
  fillColor?: string;
  outlineWidth?: string | FourSides;
  outlineColor?: string;
  style?: JSX.CSSProperties;
}

const Squircle: Component<SquircleProps> = (props) => {
  return (
    <div
      ref={props.ref}
      style={{
        background: "paint(squircle)",
        "--squircle-radius": props.cornerRadius,
        "--squircle-smooth": props.cornerSmoothing,
        "--squircle-fill": props.fillColor,
        "--squircle-outline": props.outlineWidth ?? "",
        "--squircle-outline-top":
          (typeof props.outlineWidth === "object" && props.outlineWidth?.top) ??
          "",
        "--squircle-outline-right":
          (typeof props.outlineWidth === "object" &&
            props.outlineWidth?.right) ??
          "",
        "--squircle-outline-bottom":
          (typeof props.outlineWidth === "object" &&
            props.outlineWidth?.bottom) ??
          "",
        "--squircle-outline-left":
          (typeof props.outlineWidth === "object" &&
            props.outlineWidth?.left) ??
          "",
        "--squircle-outline-color": props.outlineColor,
        ...(props.style as any),
      }}
    >
      {props.children}
    </div>
  );
};

export default Squircle;
