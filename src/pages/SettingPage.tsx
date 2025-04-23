import { Component, For, Signal } from "solid-js";

import { Version } from "../utils/debugger";
import SettingSwitch from "../controls/SettingSwitch";
import { webviewWindow, app } from "@tauri-apps/api";
import InputBox from "../components/inputBox";
import SettingCard from "../controls/SettingCard";
import { Button } from "../components/button";

interface SettingPageProps {
  version: Version;
  messages: Message[];
  aiConfig: Signal<ServiceConfig>;
  operations: {
    back: () => void;
    clearMessages: () => void;
    resetService: () => void;
  };
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
        "padding-bottom": "2rem",
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
          src="/logo.svg"
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
            onClick: () => {
              document.documentElement.classList.remove("dark");
              app.setTheme("light");
            },
          },
          {
            label: "自动",
            onClick: () => {
              app.setTheme(null).then(() => {
                webviewWindow
                  .getCurrentWebviewWindow()
                  .theme()
                  .then((theme) => {
                    if (theme === "dark")
                      document.documentElement.classList.add("dark");
                    else document.documentElement.classList.remove("dark");
                  });
              });
            },
          },
          {
            label: "深色",
            onClick: () => {
              document.documentElement.classList.add("dark");
              app.setTheme("dark").catch((e) => console.log(e));
            },
          },
        ]}
      </SettingSwitch>
      <SettingCard title="AI 模型">
        <InputBox
          placeholder="URL"
          value={props.aiConfig[0]().endpoint}
          onChange={(e) => {
            if (!e.target.value) return;
            props.aiConfig[1]((prev) => {
              let value = { ...prev };
              value.endpoint = e.target.value;
              return value;
            });
          }}
        />
        <InputBox
          placeholder="密钥"
          value={props.aiConfig[0]().apiKey}
          hide={true}
          onChange={(e) => {
            if (!e.target.value) return;
            props.aiConfig[1]((prev) => {
              let value = { ...prev };
              value.apiKey = e.target.value;
              return value;
            });
          }}
        />
        <InputBox
          placeholder="模型名称"
          value={props.aiConfig[0]().modelName}
          onChange={(e) => {
            if (!e.target.value) return;
            props.aiConfig[1]((prev) => {
              let value = { ...prev };
              value.modelName = e.target.value;
              return value;
            });
          }}
        />
        <Button
          label="重置"
          onClick={() => {
            props.operations.resetService();
            props.operations.back();
          }}
        />
      </SettingCard>
      <SettingCard
        title="后端记录"
        style={{
          "padding-bottom": "1.5rem",
        }}
      >
        <For
          each={props.messages}
          fallback={
            <p style={{ opacity: 0.6, "margin-bottom": "0.5rem" }}>没有消息</p>
          }
        >
          {(item, index) => (
            <>
              {index() === 0 ? (
                <Button label="清空" onClick={props.operations.clearMessages} />
              ) : null}
              <div
                style={{
                  width: "100%",
                  "padding-inline": "8px",
                  "box-sizing": "border-box",
                }}
              >
                <h3 style={{ "text-align": "right" }}>{item.role}</h3>
                <p style={{ "text-align": "left" }}>{item.content}</p>
              </div>
            </>
          )}
        </For>
      </SettingCard>
    </div>
  );
};

export default SettingPage;
