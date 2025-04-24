import { createRoot, createSignal, For, onMount } from "solid-js";

import { AppWindow } from "./controls/AppWindow";

import HomePage from "./pages/HomePage";
import SettingPage from "./pages/SettingPage";

import "./App.css";
import {
  botConfigTemples as botConfigTemplates,
  createKeyBinding,
  parseServiceError as catchServiceError,
  Version,
} from "./utils/debugger";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import ChatInputBox from "./components/chat/chatInputBox";
import { PageContainer } from "./components/pageContainer";
import { ChatMessage, Sender } from "./components/chat/chatMessageBox";
import { animate, animateMini } from "motion";
import { createMarkdownMessage } from "./components/chat/MessageUtils";
import MessageStatusBar from "./controls/MessageStatusBar";

enum Pages {
  SettingPage = 0,
  HomePage = 1,
}

function App() {
  let version: Version = {
    code: "DEV",
    number: "0.1.5",
  };

  const [messages, setMessages] = createSignal<Message[]>([]);
  const [config, setConfig] = createSignal<CoreData>({
    endpoint: "",
    apiKey: "",
    modelName: "",
  });

  onMount(() => {
    invoke<CoreData>("config_load").then((config) => {
      setConfig(config);
      invoke("ai_service_init", {
        endpoint: config.endpoint,
        apiKey: config.apiKey,
        modelName: config.modelName,
      }).catch(catchServiceError);
    });

    // botConfigTemplates("OpenAIGemini").then((config) => {
    //   setConfig(config);
    //   invoke("ai_service_init", {
    //     endpoint: config.endpoint,
    //     apiKey: config.apiKey,
    //     modelName: config.modelName,
    //   }).catch(catchServiceError);
    // });
  });

  const [showSettings, setShowSettings] = createSignal(false);
  const handleShowSettings = () => {
    setShowSettings(!showSettings());
    switchTo(showSettings() ? Pages.SettingPage : Pages.HomePage);
    if (!showSettings()) {
      inputArea.focus();
      invoke("config_set", config())
        .then(() => {
          invoke("config_save").catch(catchServiceError);
        })
        .catch(catchServiceError);
    }
  };
  const handleSubmit = (text: string): boolean => {
    append({ sender: Sender.Own, content: text });
    scrollToBottom();

    new Promise<void>(async (resolve) => {
      const markdownMessage = createMarkdownMessage(
        {
          append,
          set,
          close,
          alignBottom,
        },
        Sender.Other
      );

      let isReasoning = false;
      const hookId = `ai_stream_${Date.now()}`;
      const unlisten = await listen<string>(hookId, (e) => {
        if (isReasoning) {
          markdownMessage.push("\n```\n");
          isReasoning = false;
        }
        markdownMessage.push(e.payload);
      });
      const unlistenReason = await listen<string>(`${hookId}_reason`, (e) => {
        if (!isReasoning) {
          markdownMessage.push("```Think\n");
          isReasoning = true;
        }
        markdownMessage.push(e.payload);
      });
      const unlistenError = await listen<string | BackendError>(
        `${hookId}_error`,
        (e) => {
          if (typeof e.payload === "object") {
            switch (e.payload.type) {
              case "EmptyParameter":
                const items = (e.payload.detail as string[]).map((value) => {
                  switch (value) {
                    case "Endpoint":
                      return (
                        <div
                          style={{
                            padding: "4px 8px",
                            "border-radius": "8px",
                            "background-color": "var(--color-msg-nothing-back)",
                          }}
                        >
                          URL
                        </div>
                      );
                    case "APIKey":
                      return (
                        <div
                          style={{
                            padding: "4px 8px",
                            "border-radius": "8px",
                            "background-color": "var(--color-msg-nothing-back)",
                          }}
                        >
                          密钥
                        </div>
                      );
                    case "ModelName":
                      return (
                        <div
                          style={{
                            padding: "4px 8px",
                            "border-radius": "8px",
                            "background-color": "var(--color-msg-nothing-back)",
                          }}
                        >
                          模型名称
                        </div>
                      );
                  }
                });
                markdownMessage.setBar(
                  <div class="chat-markdown" style={{ "user-select": "none" }}>
                    <p style={{ "font-weight": "bold" }}>空参数</p>
                    <div style={{ display: "inline-flex", gap: "8px" }}>
                      {items}
                    </div>
                  </div>
                );
                break;
              case "RequestSending":
                markdownMessage.setBar(
                  <div class="chat-markdown" style={{ "user-select": "none" }}>
                    <p style={{ "font-weight": "bold" }}>无正常响应</p>
                    <div style={{ display: "inline-flex", gap: "8px" }}>
                      <p style={{ "flex-shrink": 0 }}>URL:</p>
                      <a href={e.payload.detail}>{e.payload.detail}</a>
                    </div>
                  </div>
                );
                break;
            }
          } else {
            append({ sender: Sender.System, content: "• 出现问题" });
            append({ sender: Sender.System, content: e.payload });
          }
          stop();
        }
      );
      const unlistenEnd = await listen<StreamEndMessage>(
        `${hookId}_end`,
        (e) => {
          setMessages(e.payload.messages);
          if (e.payload.interrupted) {
            markdownMessage.setBar(
              createRoot((dispose) => {
                dispose();
                return <MessageStatusBar label="打断" type="nothing" />;
              })
            );
          }
          stop();
        }
      );
      invoke("ai_service_send", {
        content: text,
        hookId,
      }).catch((e) => {
        catchServiceError(e);
        markdownMessage.push("程序运行错误");
      });
      const stop = () => {
        unlisten();
        unlistenReason();
        unlistenError();
        unlistenEnd();
        markdownMessage.over();
      };
      resolve();
    });

    return true;
  };

  const clearMessages = () => {
    invoke("ai_service_clear")
      .then(() => {
        append({ sender: Sender.System, content: "清除聊天记录" });
        setMessages([]);
      })
      .catch(catchServiceError);
  };
  const resetService = () => {
    invoke("ai_service_reset", {
      endpoint: config().endpoint,
      apiKey: config().apiKey,
      modelName: config().modelName,
    })
      .then(() => {
        append({ sender: Sender.System, content: "重置服务配置" });
        scrollToBottom();
      })
      .catch(catchServiceError);
  };
  createKeyBinding([
    {
      key: "F9",
      callback: () => {
        invoke<string>("ai_service_test")
          .then((msg) => {
            append({ sender: Sender.Other, content: msg });
          })
          .catch(catchServiceError);
      },
    },
    {
      key: "l",
      keyModifiers: "Control",
      callback: () => {
        inputArea.focus();
      },
    },
    {
      key: "F5",
      state: "keydown",
      callback: (e) => {
        e.preventDefault();
        clearMessages();
      },
    },
    {
      key: "F5",
      keyModifiers: "Shift",
      callback: () => {
        resetService();
      },
    },
    {
      key: "C",
      keyModifiers: "Shift",
      callback: (e) => {
        if (e.target === inputArea) return;
        e.preventDefault();
        invoke("ai_service_clear").catch(catchServiceError);
        clearHistory();
      },
    },
    {
      key: "L",
      keyModifiers: "Shift",
      callback: () => {
        invoke<CoreData>("config_load")
          .then((config) => {
            setConfig(config);
            append({ sender: Sender.System, content: "读取本地配置" });
          })
          .catch(catchServiceError);
      },
    },
  ]);

  let inputArea: HTMLTextAreaElement;

  let switchTo: (_index: number) => void;

  let append: (info: ChatMessage, open?: boolean) => number;
  let set: (index: number, content: any, align?: boolean) => void;
  let close: (index: number) => void;
  let clearHistory: () => void;
  let alignBottom: (sudden?: boolean) => void;
  let scrollToBottom: () => void;

  return (
    <AppWindow title="深度折叠" showSettings={handleShowSettings}>
      <PageContainer
        pageInfos={[
          {
            name: Pages[Pages.SettingPage],
          },
          {
            name: Pages[Pages.HomePage],
          },
        ]}
        defaultIndex={Pages.HomePage}
        homeIndex={Pages.HomePage}
        getMethods={(to) => {
          switchTo = to;
        }}
        pageInit={(page) => {
          page.style.display = "grid";
          page.style.placeItems = "center";
          page.style.willChange = "opacity, scale, filter";
          page.style.overflow = "scroll";
        }}
        switchMotion={(prev, cur, _isForward, dir) =>
          new Promise<void>((resolve) => {
            if (dir[1] === Pages.SettingPage) {
              animateMini(
                prev,
                {
                  opacity: 0,
                  filter: "blur(1rem)",
                },
                {
                  duration: 0.3,
                  ease: [0, 0, 0, 1],
                }
              );
              animate(
                prev,
                {
                  scale: 0.8,
                },
                {
                  duration: 0.3,
                  ease: [0.5, 0, 0, 1],
                }
              );
              animateMini(
                cur,
                {
                  opacity: [0, 1],
                  filter: ["blur(1rem)", "blur(0)"],
                },
                {
                  duration: 0.3,
                  ease: [0, 0, 0, 1],
                }
              );
              animate(
                cur,
                {
                  scale: [0.2, 1],
                  x: ["-40vw", 0],
                  y: ["-40vh", 0],
                },
                {
                  type: "spring",
                  duration: 0.4,
                  bounce: 0.2,
                }
              ).then(() => {
                resolve();
              });
            } else if (dir[0] === Pages.SettingPage) {
              animateMini(
                prev,
                {
                  opacity: 0,
                  filter: "blur(1rem)",
                },
                {
                  duration: 0.3,
                  ease: [0, 0, 0, 1],
                }
              );
              animate(
                prev,
                {
                  scale: 0,
                  x: "-50vw",
                  y: "-50vh",
                },
                {
                  duration: 0.3,
                  ease: [0.5, 0, 0, 1],
                }
              );
              animateMini(
                cur,
                {
                  opacity: [0, 1],
                  filter: ["blur(1rem)", "blur(0)"],
                },
                {
                  duration: 0.3,
                  ease: [0, 0, 0, 1],
                }
              );
              animate(
                cur,
                {
                  scale: [0.8, 1],
                },
                {
                  duration: 0.3,
                  ease: [0.5, 0, 0, 1],
                }
              ).then(() => {
                resolve();
              });
            } else {
              resolve();
            }
          })
        }
        loadedMotion={(container) => {
          container.style.transform = "translateY(12rem)";
          container.style.opacity = "0";
          container.style.filter = "blur(1rem)";
          new Promise<void>((resolve) => {
            setTimeout(() => {
              animateMini(
                container,
                {
                  transform: "translateY(0)",
                  opacity: 1,
                  filter: "blur(0)",
                },
                {
                  duration: 0.3,
                  ease: [0.5, 0, 0, 1],
                }
              );
              resolve();
            }, 200);
          });
        }}
        style={{
          "will-change": "opacity, transform, filter",
        }}
      >
        <SettingPage
          version={version}
          messages={messages()}
          aiConfig={[config, setConfig]}
          operations={{
            back: () => handleShowSettings(),
            clearMessages,
            resetService,
          }}
        />
        <HomePage
          getOps={(a, s, cs, cr, ab, b) => {
            append = a;
            set = s;
            close = cs;
            clearHistory = cr;
            alignBottom = ab;
            scrollToBottom = b;
          }}
        />
      </PageContainer>
      <ChatInputBox
        showed={!showSettings()}
        onSubmit={handleSubmit}
        placeHolder="Ctrl + L 聚焦此处"
        submitLabel="发送"
        style={{
          position: "fixed",
          bottom: 0,
          width: "min(calc(100% - 1rem), 40rem)",
          padding: "0.75rem",
        }}
        showupMotion={(show, box, area) => {
          if (show) {
            box.style.translate = "0 0";
            area.style.height = "6rem";
          } else {
            box.style.translate = "0 6rem";
            area.style.height = "0";
          }
        }}
        ref={(_, area) => (inputArea = area)}
        onFocus={(e) => {
          const box = e.target.parentElement;
          if (box) {
            box.style.borderColor = "var(--color-theme-accent)";
          }
        }}
        onBlur={(e) => {
          const box = e.target.parentElement;
          if (box) {
            box.style.borderColor = "var(--color-border-default)";
          }
        }}
      />
    </AppWindow>
  );
}

export default App;
