import { createSignal, onMount, Show } from "solid-js";

import { AiStatus, AppWindow } from "./controls/AppWindow";

import HomePage from "./pages/HomePage";
import SettingPage from "./pages/SettingPage";

import "./App.css";
import { createKeyBinding, parseServiceError, Version } from "./utils/debugger";
import { Channel, invoke } from "@tauri-apps/api/core";
import ChatInputBox from "./components/chat/chatInputBox";
import { PageContainer } from "./components/pageContainer";
import { ChatMessage, Sender } from "./components/chat/chatMessageBox";
import { streamAiMessage } from "./components/chat/MessageUtils";
import { requestErrorTip, toolCallTip } from "./controls/MessageWidgets";
import StreamLog from "./popUps/streamLogs";
import { parseToolCall } from "./utils/aiService";
import { createSpring, waapi } from "animejs";
import RequestTest from "./popUps/requestTest";
import { popup } from "./popUps/utils";

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
          alignWith,
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
              markdownMessage.setStatus({ label: "打断", type: "nothing" });
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
        markdownMessage.setStatus({ label: "程序内部错误", type: "error" });
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
  let alignWith: (fun: () => void, duration?: number) => void;
  let scrollToBottom: (duration?: number) => void;

  let pageContainer: HTMLDivElement;
  let streamLogWindow: HTMLDivElement;
  const [log, setLog] = createSignal<string[]>([]);
  const [logHidden, setLogHidden] = createSignal(true);
  let logClose: (() => void) | undefined;

  let requestTestWindow: HTMLDivElement;
  const [requestHidden, setRequestHidden] = createSignal(true);
  let requestClose: (() => void) | undefined;

  const openLog = async (startingElement: HTMLButtonElement) => {
    setLog(await invoke<string[]>("ai_service_get_logs", { index: 0 }));
    popup(
      setLogHidden,
      () => ({
        background: pageContainer,
        startingElement,
        targetElement: streamLogWindow,
      }),
      (fn) =>
        (logClose = () => {
          logClose = undefined;
          fn();
        })
    );
  };
  const openRequest = async (startingElement: HTMLButtonElement) =>
    popup(
      setRequestHidden,
      () => ({
        background: pageContainer,
        startingElement,
        targetElement: requestTestWindow,
      }),
      (fn) =>
        (requestClose = () => {
          requestClose = undefined;
          fn();
        })
    );

  return (
    <AppWindow
      aiStatus={aiStatus()}
      title="深度折叠"
      showSettings={handleShowSettings}
      disableLabel={!logHidden() || !requestHidden()}
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
              waapi.animate(prev, {
                opacity: 0,
                filter: "blur(1rem)",
                duration: 300,
                ease: "cubicBezier(0, 0, 0, 1)",
              });
              waapi.animate(prev, {
                scale: 0.8,
                duration: 300,
                ease: "cubicBezier(0.5, 0, 0, 1)",
              });
              waapi.animate(cur, {
                opacity: [0, 1],
                filter: ["blur(1rem)", "blur(0)"],
                duration: 300,
                ease: "cubicBezier(0, 0, 0, 1)",
              });
              waapi.animate(cur, {
                scale: [0.2, 1],
                translate: ["-40vw -40vh", "0 0"],
                ease: createSpring({
                  stiffness: 500,
                  damping: 35,
                }),
                onComplete: () => resolve(),
              });
            } else if (dir[0] === Pages.SettingPage) {
              waapi.animate(prev, {
                opacity: 0,
                filter: "blur(1rem)",
                duration: 300,
                ease: "cubicBezier(0, 0, 0, 1)",
              });
              waapi.animate(prev, {
                scale: 0,
                translate: ["0 0", "-50vw -50vh"],
                duration: 300,
                ease: "out",
              });
              waapi.animate(cur, {
                opacity: [0, 1],
                filter: ["blur(1rem)", "blur(0)"],
                duration: 300,
                ease: "cubicBezier(0, 0, 0, 1)",
              });
              waapi.animate(cur, {
                scale: [0.8, 1],
                duration: 300,
                ease: "cubicBezier(0.5, 0, 0, 1)",
                onComplete: () => resolve(),
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
              waapi.animate(container, {
                transform: "translateY(0)",
                opacity: 1,
                filter: "blur(0)",
                duration: 300,
                ease: "cubicBezier(0.5, 0, 0, 1)",
              });
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
            openLog,
            openRequest,
          }}
          getOps={(st) => (switchTheme = st)}
        />
        <HomePage
          getOps={(a, s, cs, cr, aw, b) => {
            append = a;
            set = s;
            close = cs;
            clearHistory = cr;
            alignWith = aw;
            scrollToBottom = b;
          }}
        />
      </PageContainer>
      <Show when={!logHidden()}>
        <StreamLog
          ref={(e) => (streamLogWindow = e)}
          operations={{
            close: () => {
              logClose?.();
            },
          }}
          children={log()}
        />
      </Show>
      <Show when={!requestHidden()}>
        <RequestTest
          ref={(e) => (requestTestWindow = e)}
          operations={{
            close: () => {
              requestClose?.();
            },
          }}
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
