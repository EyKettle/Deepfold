import { Component, JSX } from "solid-js";

interface BlockerProps {
  style: JSX.CSSProperties;
  onClick?: () => void;
}

const Blocker: Component<BlockerProps> = (props) => {
  return (
    <div style={{ "flex-shrink": 0, ...props.style }} onClick={props.onClick} />
  );
};

export default Blocker;
