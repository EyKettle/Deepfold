import { Component } from "solid-js";

import { Version } from "../utils/debugger";
import SettingSwitch from "../controls/SettingSwitch";
import { invoke } from "@tauri-apps/api/core";

interface SettingPageProps {
  version: Version;
}

const SettingPage: Component<SettingPageProps> = (props) => {
  return (
    <div
      id="page-setting"
      style={{
        display: "flex",
        "flex-direction": "column",
        height: "100%",
        width: "min(100%, 32rem)",
        gap: "0.5rem",
        "box-sizing": "border-box",
        "padding-inline": "0.5rem",
        "--color-shadow": "rgba(0, 0, 0, 0.15)",
        "--color-shadow-auto": "none",
      }}
      card-width="100%"
    >
      <div
        style={{
          display: "flex",
          "flex-direction": "row",
          "justify-content": "center",
          "align-items": "center",
          width: "100%",
          gap: "1rem",
          "padding-block": "1rem",
        }}
      >
        <img
          src="/public/logo.svg"
          width={128}
          style={{
            filter: "drop-shadow(0 0.25rem 0.25rem var(--color-shadow))",
          }}
        />
        <div
          style={{ display: "flex", "flex-direction": "column", gap: "0.5rem" }}
        >
          <label
            style={{
              "font-size": "1.75rem",
              "font-weight": "bold",
            }}
          >
            Deepfold
          </label>
          <div
            style={{
              color: "var(--color-dev-text)",
              "font-size": "1.25rem",
              display: "flex",
              "align-items": "center",
              gap: "0.5rem",
            }}
          >
            <label
              id="version-code"
              style={{
                padding: "0.25rem 0.75rem",
                "border-radius": "1rem",
                "background-color": "var(--color-dev-back)",
              }}
            >
              {props.version.code ?? "NONE"}
            </label>
            <label id="version-number">
              {props.version.number ?? "-0.0.0"}
            </label>
          </div>
        </div>
      </div>
      <SettingSwitch
        title="色彩模式"
        default={1}
        switchStyle={{
          display: "grid",
          "grid-template-columns": "1fr 80px 1fr",
        }}
      >
        {[
          {
            label: "浅色",
            onClick: () => invoke("switch_theme", { themeMode: "light" }),
          },
          {
            label: "自动",
            onClick: () => invoke("switch_theme", { themeMode: "auto" }),
          },
          {
            label: "深色",
            onClick: () => invoke("switch_theme", { themeMode: "dark" }),
          },
        ]}
      </SettingSwitch>
    </div>
  );
};

export default SettingPage;
