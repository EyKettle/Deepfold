import { Component, JSX } from "solid-js";
import { Card } from "../components/card";
import { Switch, SwitchItem } from "../components/switch";

interface SettingSwitchProps {
  title: string;
  children: SwitchItem[];
  default: number;
  switchStyle?: JSX.CSSProperties;
  onChange?: (index: number) => void;
}

const SettingSwitch: Component<SettingSwitchProps> = (props) => {
  return (
    <Card
      interactType="hover"
      effect="none"
      disableShadow={true}
      description={props.title}
      style={{
        cursor: "auto",
        gap: "1rem",
        "transition-duration": "0.4s",
        border: "none",
      }}
    >
      <Switch
        default={props.default}
        border={{ width: "0", color: "unset" }}
        backgroundColor="transparent"
        style={{
          padding: "0",
          width: "100%",
          "min-height": "unset",
          ...props.switchStyle,
        }}
        fontSize="1rem"
        children={props.children}
        onChange={props.onChange}
      />
    </Card>
  );
};

export default SettingSwitch;
