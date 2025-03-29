import { Component, JSX } from "solid-js";

interface BlockerProps {
  style: JSX.CSSProperties;
}

const Blocker: Component<BlockerProps> = (props) => {
  return <div style={{ "flex-shrink": 0, ...props.style }} />;
};

export default Blocker;
