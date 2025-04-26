import { createRoot, createSignal, onMount } from "solid-js";

import { AiStatus, AppWindow } from "./controls/AppWindow";

import HomePage from "./pages/HomePage";
import SettingPage from "./pages/SettingPage";

import "./App.css";
import { createKeyBinding, parseServiceError, Version } from "./utils/debugger";
import { Channel, invoke } from "@tauri-apps/api/core";
import ChatInputBox from "./components/chat/chatInputBox";
import { PageContainer } from "./components/pageContainer";
import { ChatMessage, Sender } from "./components/chat/chatMessageBox";
import { animate, animateMini } from "motion";
import { streamAiMessage } from "./components/chat/MessageUtils";
import MessageStatusBar from "./controls/MessageStatusBar";
import { requestErrorTip } from "./controls/MessageWidgets";

enum Pages {
  SettingPage = 0,
  HomePage = 1,
}

function App() {
  let version: Version = {
    code: "DEV",
    number: "0.1.6",
  };

  const [messages, setMessages] = createSignal<Message[]>([]);
  const [config, setConfig] = createSignal<CoreData>({
    theme: "auto",
    endpoint: "",
    apiKey: "",
    modelName: "",
  });
  const [aiStatus, setAiStatus] = createSignal<AiStatus>("offline");

  onMount(() => {
    invoke<CoreData>("config_read").then((config) => {
      setConfig(config);
      switchTheme(config.theme);
      invoke("ai_service_init", {
        endpoint: config.endpoint,
        apiKey: config.apiKey,
        modelName: config.modelName,
      })
        .then(() => setAiStatus("online"))
        .catch(parseServiceError);
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

  const saveConfig = () => {
    invoke("config_set", config())
      .then(() => {
        invoke("config_save").catch(parseServiceError);
      })
      .catch(parseServiceError);
  };

  const [showSettings, setShowSettings] = createSignal(false);
  const handleShowSettings = () => {
    setShowSettings(!showSettings());
    switchTo(showSettings() ? Pages.SettingPage : Pages.HomePage);
    if (!showSettings()) {
      inputArea.focus();
      saveConfig();
    }
  };
  const handleSubmit = (text: string): boolean => {
    append({ sender: Sender.Own, content: text });
    scrollToBottom();
    new Promise<void>(async (resolve) => {
      setAiStatus("typing");
      const over = () => {
        setAiStatus("online");
        markdownMessage.over();
      };
      const markdownMessage = streamAiMessage(
        {
          append,
          set,
          close,
          alignBottom,
        },
        Sender.Other
      );
      const streamChannel = new Channel<StreamEvent>();
      streamChannel.onmessage = (message) => {
        switch (message.event) {
          case "push":
            markdownMessage.push(message.data);
            break;
          case "end":
            if (message.data.messages.length === 0) break;
            setMessages(message.data.messages);
            if (message.data.interrupted) {
              markdownMessage.setBottomBar(
                createRoot((dispose) => {
                  dispose();
                  return <MessageStatusBar label="打断" type="nothing" />;
                })
              );
            }
            over();
            break;
          case "error":
            switch (message.data.type) {
              case "emptyParameter":
                const items = (message.data.detail as Parameter[]).map(
                  (value) => {
                    switch (value) {
                      case "endpoint":
                        return (
                          <div
                            style={{
                              padding: "4px 8px",
                              "border-radius": "8px",
                              "background-color":
                                "var(--color-msg-nothing-back)",
                            }}
                          >
                            URL
                          </div>
                        );
                      case "apiKey":
                        return (
                          <div
                            style={{
                              padding: "4px 8px",
                              "border-radius": "8px",
                              "background-color":
                                "var(--color-msg-nothing-back)",
                            }}
                          >
                            密钥
                          </div>
                        );
                      case "modelName":
                        return (
                          <div
                            style={{
                              padding: "4px 8px",
                              "border-radius": "8px",
                              "background-color":
                                "var(--color-msg-nothing-back)",
                            }}
                          >
                            模型名称
                          </div>
                        );
                    }
                  }
                );
                markdownMessage.setBottomBar(
                  <div class="chat-markdown" style={{ "user-select": "none" }}>
                    <p style={{ "font-weight": "bold" }}>空参数</p>
                    <div style={{ display: "inline-flex", gap: "8px" }}>
                      {items}
                    </div>
                  </div>
                );
                break;
              case "requestSending":
                append({
                  sender: Sender.System,
                  content: requestErrorTip(
                    "请求出错",
                    message.data.detail as string
                  ),
                });
                break;
            }
            over();
            break;
        }
      };
      invoke("ai_service_send", {
        content: text,
        channel: streamChannel,
      }).catch((e) => {
        parseServiceError(e);
        markdownMessage.setBottomBar(
          createRoot((dispose) => {
            dispose();
            return <MessageStatusBar label="程序运行错误" type="error" />;
          })
        );
        over();
      });
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
      .catch(parseServiceError);
  };
  const resetService = () => {
    setAiStatus("offline");
    invoke("ai_service_reset", {
      endpoint: config().endpoint,
      apiKey: config().apiKey,
      modelName: config().modelName,
    })
      .then(() => {
        setAiStatus("online");
        append({ sender: Sender.System, content: "重置服务配置" });
        scrollToBottom();
      })
      .catch(parseServiceError);
  };
  createKeyBinding([
    {
      key: "F9",
      callback: () => {
        invoke<string>("ai_service_test")
          .then((msg) => {
            append({ sender: Sender.Other, content: msg });
          })
          .catch(parseServiceError);
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
        invoke("ai_service_clear").catch(parseServiceError);
        clearHistory();
      },
    },
    {
      key: "L",
      keyModifiers: "Shift",
      callback: (e) => {
        if (e.target === inputArea) return;
        e.preventDefault();
        invoke<CoreData>("config_load")
          .then((config) => {
            setConfig(config);
            switchTheme(config.theme);
            append({ sender: Sender.System, content: "读取本地配置" });
          })
          .catch(parseServiceError);
      },
    },
  ]);

  let inputArea: HTMLTextAreaElement;

  let switchTheme: (theme: Theme) => void;
  let switchTo: (_index: number) => void;

  let append: (info: ChatMessage, open?: boolean) => number;
  let set: (index: number, content: any, align?: boolean) => void;
  let close: (index: number) => void;
  let clearHistory: () => void;
  let alignBottom: (sudden?: boolean) => void;
  let scrollToBottom: () => void;

  return (
    <AppWindow
      aiStatus={aiStatus()}
      title="深度折叠"
      showSettings={handleShowSettings}
    >
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
          config={[config, setConfig]}
          operations={{
            back: () => handleShowSettings(),
            clearMessages,
            resetService,
            saveConfig,
          }}
          getOps={(st) => (switchTheme = st)}
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
          area.style.transitionDuration = "0.4s";
          setTimeout(() => {
            area.style.transitionDuration = "0.2s";
          }, 400);
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
            e.target.style.height = "6rem";
          }
        }}
        onBlur={(e) => {
          const box = e.target.parentElement;
          if (box) {
            box.style.borderColor = "var(--color-border-default)";
            e.target.style.height = "5.5rem";
          }
        }}
      />
    </AppWindow>
  );
}

export default App;
