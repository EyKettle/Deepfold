import { Component, JSX } from "solid-js";
import { Switch, SwitchItem } from "../components/switch";
import SettingCard from "./SettingCard";

interface SettingSwitchProps {
  title: string;
  children: SwitchItem[];
  default: number;
  switchStyle?: JSX.CSSProperties;
  onChange?: (index: number) => void;
}

const SettingSwitch: Component<SettingSwitchProps> = (props) => {
  return (
    <SettingCard title={props.title}>
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
    </SettingCard>
  );
};

export default SettingSwitch;
