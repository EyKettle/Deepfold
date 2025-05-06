import { Component, For, Signal } from "solid-js";

import { Version } from "../utils/debugger";
import SettingSwitch from "../controls/SettingSwitch";
import { app, window } from "@tauri-apps/api";
import InputBox from "../components/inputBox";
import SettingCard from "../controls/SettingCard";
import { Button } from "../components/button";

interface SettingPageProps {
  version: Version;
  messages: Message[];
  config: Signal<CoreData>;
  operations: {
    back: () => void;
    clearMessages: () => void;
    resetService: () => void;
    saveConfig: () => void;
    openLog: (startingElement: HTMLButtonElement) => void;
  };
  getOps: (switchTheme: (theme: Theme) => void) => void;
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
        "--color-shadow-auto": "none",
        "padding-bottom": "2rem",
        overflow: "scroll",
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
        default={
          props.config[0]().theme === "auto"
            ? 1
            : props.config[0]().theme === "dark"
            ? 2
            : 0
        }
        switchStyle={{
          display: "grid",
          "grid-template-columns": "1fr 80px 1fr",
        }}
        getOps={(to) =>
          props.getOps((theme) => {
            switch (theme) {
              case "light":
                to(0, true);
                break;
              case "dark":
                to(2, true);
                break;
              default:
                to(1, true);
                break;
            }
          })
        }
      >
        {[
          {
            label: "浅色",
            onClick: () => {
              document.documentElement.classList.remove("dark");
              app.setTheme("light").then(() => {
                props.config[1]((prev) => {
                  let value = { ...prev };
                  value.theme = "light";
                  return value;
                });
                props.operations.saveConfig();
              });
            },
          },
          {
            label: "自动",
            onClick: () => {
              app.setTheme(null).then(() => {
                window
                  .getCurrentWindow()
                  .theme()
                  .then((theme) => {
                    if (theme === "dark")
                      document.documentElement.classList.add("dark");
                    else document.documentElement.classList.remove("dark");
                  });
                props.config[1]((prev) => {
                  let value = { ...prev };
                  value.theme = "auto";
                  return value;
                });
                props.operations.saveConfig();
              });
            },
          },
          {
            label: "深色",
            onClick: () => {
              document.documentElement.classList.add("dark");
              app.setTheme("dark").then(() => {
                props.config[1]((prev) => {
                  let value = { ...prev };
                  value.theme = "dark";
                  return value;
                });
                props.operations.saveConfig();
              });
            },
          },
        ]}
      </SettingSwitch>
      <SettingCard title="AI 模型">
        <InputBox
          placeholder="URL"
          value={props.config[0]().endpoint}
          onChange={(e) => {
            if (!e.target.value) return;
            props.config[1]((prev) => {
              let value = { ...prev };
              value.endpoint = e.target.value;
              return value;
            });
          }}
        />
        <InputBox
          placeholder="密钥"
          value={props.config[0]().apiKey}
          hide={true}
          onChange={(e) => {
            if (!e.target.value) return;
            props.config[1]((prev) => {
              let value = { ...prev };
              value.apiKey = e.target.value;
              return value;
            });
          }}
        />
        <InputBox
          placeholder="模型名称"
          value={props.config[0]().modelName}
          onChange={(e) => {
            if (!e.target.value) return;
            props.config[1]((prev) => {
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
          "white-space": "pre-wrap",
        }}
        textSelected={true}
      >
        <Button label="查询最新 Streaming" onClick={props.operations.openLog} />
        <For
          each={props.messages}
          fallback={
            <p
              style={{
                opacity: 0.6,
                "margin-bottom": "0.5rem",
                "user-select": "none",
              }}
            >
              没有消息
            </p>
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
