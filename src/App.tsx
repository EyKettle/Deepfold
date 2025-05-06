import { createRoot, createSignal, onMount, Show } from "solid-js";

import { AiStatus, AppWindow } from "./controls/AppWindow";

import HomePage from "./pages/HomePage";
import SettingPage from "./pages/SettingPage";

import "./App.css";
import { createKeyBinding, parseServiceError, Version } from "./utils/debugger";
import { Channel, invoke } from "@tauri-apps/api/core";
import ChatInputBox from "./components/chat/chatInputBox";
import { PageContainer } from "./components/pageContainer";
import { ChatMessage, Sender } from "./components/chat/chatMessageBox";
import { animate, animateMini, AnimationOptions } from "motion";
import { streamAiMessage } from "./components/chat/MessageUtils";
import MessageStatusBar from "./controls/MessageStatusBar";
import { requestErrorTip, toolCallTip } from "./controls/MessageWidgets";
import StreamLog from "./popUps/streamLogs";
import { parseToolCall } from "./utils/aiService";

enum Pages {
  SettingPage = 0,
  HomePage = 1,
}

function App() {
  let version: Version = {
    code: "DEV",
    number: "0.1.7",
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
          alignCheck,
          scrollToBottom,
        },
        Sender.Other
      );
      const streamChannel = new Channel<StreamEvent>();
      let tips: Element[] = [];
      streamChannel.onmessage = (message) => {
        switch (message.event) {
          case "push":
            markdownMessage.push(message.data);
            break;
          case "tool":
            const tip = parseToolCall(message.data);
            tips.push(tip);
            markdownMessage.setBottomBar(tips);
            break;
          case "end":
            if (message.data.messages.length === 0) {
              over();
              break;
            }
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
              case "serialize":
                console.warn("Serialize error", message.data.detail);
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
        append({
          sender: Math.random() > 0.5 ? Sender.Own : Sender.Other,
          content: toolCallTip("X", "工具提示", "无状态", [
            {
              icon: "P",
              callback: () => console.log("Clicked!!!!"),
            },
          ]),
        });
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
  let alignCheck: () => boolean;
  let scrollToBottom: () => void;

  let pageContainer: HTMLDivElement;
  let streamLog: HTMLDivElement;
  const [log, setLog] = createSignal<string[]>([]);
  const [logHidden, setLogHidden] = createSignal(true);
  let logClose: (() => void) | undefined;
  const easeMedium: AnimationOptions = {
    ease: [0.5, 0, 0, 1],
    duration: 0.4,
  };
  const handleOpenLog = async (startingElement: HTMLButtonElement) => {
    setLog(await invoke<string[]>("ai_service_get_logs", { index: 0 }));
    setLogHidden(false);
    animateMini(
      pageContainer,
      {
        scale: 0.9,
        opacity: 0.6,
        filter: "blur(0.75rem)",
      },
      easeMedium
    );

    pageContainer.style.userSelect = "none";
    pageContainer.ariaDisabled = "true";
    pageContainer.style.pointerEvents = "none";
    startingElement.style.visibility = "hidden";
    const { y, height, width } = startingElement.getBoundingClientRect();
    const containerRect = pageContainer.getBoundingClientRect();
    const startY = y - containerRect.y;
    animateMini(
      streamLog,
      {
        translate: [`0 ${startY}px`, "0 2rem"],
        height: [height, "calc(100vh - 12rem)"],
        width: [width, "calc(100vw - 2rem)"],
        border: [
          "1px solid transparent",
          "1px solid var(--color-border-default)",
        ],
        backgroundColor: [
          startingElement.style.backgroundColor,
          "var(--color-surface-glass)",
        ],
        borderRadius: ["0.75rem", "1rem"],
        boxShadow: [
          "0 0 0 var(--color-shadow)",
          "0 16px 32px var(--color-shadow)",
        ],
      },
      easeMedium
    );
    animateMini(
      streamLog.children[0].children[1],
      {
        opacity: [0, 1],
      },
      easeMedium
    );
    logClose = () => {
      logClose = undefined;
      animateMini(
        pageContainer,
        {
          scale: 1,
          opacity: 1,
          filter: "blur(0)",
        },
        easeMedium
      );
      animateMini(
        streamLog,
        {
          translate: `0 ${startY}px`,
          height: height,
          width: width,
          border: "1px solid transparent",
          backgroundColor: startingElement.style.backgroundColor,
          borderRadius: "0.75rem",
          boxShadow: "0 0 0 var(--color-shadow)",
        },
        easeMedium
      ).then(() => {
        setLogHidden(true);
        pageContainer.style.userSelect = "unset";
        pageContainer.ariaDisabled = "false";
        pageContainer.style.pointerEvents = "unset";
        startingElement.style.visibility = "visible";
      });
      animateMini(
        streamLog.children[0].children[1],
        {
          opacity: 0,
        },
        easeMedium
      );
    };
  };

  return (
    <AppWindow
      aiStatus={aiStatus()}
      title="深度折叠"
      showSettings={handleShowSettings}
      disableLabel={!logHidden()}
    >
      <PageContainer
        ref={(c) => (pageContainer = c)}
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
        getOps={(to) => {
          switchTo = to;
        }}
        pageInit={(page) => {
          page.style.display = "grid";
          page.style.placeItems = "center";
          page.style.willChange = "opacity, scale, filter";
          page.style.overflow = "hidden";
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
            openLog: handleOpenLog,
          }}
          getOps={(st) => (switchTheme = st)}
        />
        <HomePage
          getOps={(a, s, cs, cr, ac, b) => {
            append = a;
            set = s;
            close = cs;
            clearHistory = cr;
            alignCheck = ac;
            scrollToBottom = b;
          }}
        />
      </PageContainer>
      <Show when={!logHidden()}>
        <StreamLog
          ref={(e) => (streamLog = e)}
          operations={{
            close: () => {
              logClose?.();
            },
          }}
          children={log()}
        />
      </Show>
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
