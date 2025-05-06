import { Component, JSX, JSXElement } from "solid-js";
import { Card } from "../components/card";

interface SettingSwitchProps {
  title: string;
  children: JSXElement;
  style?: JSX.CSSProperties;
  textSelected?: boolean;
  onChange?: (index: number) => void;
}

const SettingCard: Component<SettingSwitchProps> = (props) => {
  return (
    <Card
      interactType="hover"
      effect="none"
      description={props.title}
      style={{
        cursor: "auto",
        border: "none",
        ...props.style,
      }}
      onEnter={(a) => {
        a.style.transitionDuration = "0.4s";
      }}
      onLeave={(a) => {
        a.style.transitionDuration = "0.4s";
        setTimeout(() => (a.style.transitionDuration = "0.2s"), 400);
      }}
    >
      <div
        class="full-width-box"
        style={{
          display: "flex",
          "flex-direction": "column",
          "margin-top": "1rem",
          gap: "0.5rem",
          width: "100%",
          "user-select": props.textSelected ? "text" : "none",
        }}
      >
        {props.children}
      </div>
    </Card>
  );
};

export default SettingCard;
