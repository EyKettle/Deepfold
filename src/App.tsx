import { createSignal, onMount } from "solid-js";

import { AppWindow } from "./controls/AppWindow";

import HomePage from "./pages/HomePage";
import SettingPage from "./pages/SettingPage";

import "./App.css";
import {
  botConfigTemples,
  createKeyBinding,
  parseServiceError as catchServiceError,
  Version,
} from "./utils/debugger";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import ChatInputBox from "./components/chat/chatInputBox";
import { PageContainer } from "./components/pageContainer";
import { ChatMessage, Sender } from "./components/chat/chatMessageBox";
import { animateMini } from "motion";
import { createMarkdownMessage } from "./components/chat/MessageUtils";

enum Pages {
  SettingPage = 0,
  HomePage = 1,
}

function App() {
  let version: Version = {
    code: "DEV",
    number: "0.1.3",
  };
  onMount(async () => {
    botConfigTemples("SiliconCloud").then((config) => {
      invoke("ai_service_init", {
        endpoint: config.endpoint,
        apiKey: config.apiKey,
        modelName: config.modelName,
      }).catch(catchServiceError);
    });
  });

  // let getMessages: () => MsgInfo[];
  // let setMessage: (text: string, index: number) => void;
  // let appendMessage: (newMessage: newMessage) => number;
  // let pushStr: (text: string, index: number) => void;
  // let tipPop: (tip: MsgTip, index: number) => void;

  const [showSettings, setShowSettings] = createSignal(false);
  const handleShowSettings = () => {
    setShowSettings(!showSettings());
    switchTo(showSettings() ? Pages.SettingPage : Pages.HomePage);
  };
  // const content: PageWrapper[] = [
  //   {
  //     id: "page-home",
  //     title: "主页",
  //     position: [0, 0],
  //     content: (
  //       <Dynamic
  //         component={homePage}
  //         commands={(msgs, set, append, push, tip) => {
  //           getMessages = msgs;
  //           setMessage = set;
  //           appendMessage = append;
  //           pushStr = push;
  //           tipPop = tip;
  //         }}
  //       />
  //     ),
  //   },
  //   {
  //     id: "page-setting",
  //     title: "设置",
  //     position: [0, -1],
  //     defaultStyle: {
  //       opacity: 0,
  //       filter: "blur(16px)",
  //       translate: "-50vw -50vh",
  //       scale: 0.1,
  //     },
  //     content: settingPage,
  //   },
  // ];

  // const messageAdd = (text: string) => {
  //   messageIndex = appendMessage({
  //     sender: "bot",
  //     content: text,
  //   } as MsgInfo);
  // };
  // const messagePush = (text: string) => {
  //   if (!messageIndex) {
  //     console.error("Message index not found");
  //     return;
  //   }
  //   pushStr(text, messageIndex);
  // };
  // const messageTip = (tip: MsgTip) => {
  //   if (!messageIndex) {
  //     console.error("Message index not found");
  //     return;
  //   }
  //   tipPop(tip, messageIndex);
  // };

  // let aiService: CoreService | null = null;
  // onMount(async () => {
  //   //#region 生产环境代码
  //   // appendMessage({
  //   //   sender: "system",
  //   //   content:
  //   //     "将进行初始化，请在输入框内提交参数\n当前版本数据只临时存储到内存中且只能进行一次配置",
  //   // } as MsgInfo);
  //   // appendMessage({
  //   //   sender: "system",
  //   //   content: "• 需要请求地址",
  //   // } as MsgInfo);
  //   //#endregion

  //   //#region 测试环境代码
  //   appendMessage({
  //     sender: "system",
  //     content: "正在使用测试API",
  //   } as MsgInfo);
  //   const config = await botConfigTemples("SiliconCloud");
  //   aiService = new CoreService(
  //     config,
  //     (txt) => {
  //       appendMessage({
  //         sender: "system",
  //         content: txt,
  //       } as MsgInfo);
  //     },
  //     (msg) => messageAdd(msg),
  //     (msg) => messagePush(msg),
  //     (tip) => messageTip(tip)
  //   );
  //   aiService.init();
  //   //#endregion
  // });

  // let messageIndex: number | null = null;
  // listen<string>("message_add", (event) => messageAdd(event.payload));
  // listen<string>("message_push", (event) => messagePush(event.payload));
  // listen<MsgTip>("message_tip", (event) => messageTip(event.payload));

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
      const unlistenError = await listen<string>(`${hookId}_error`, (e) => {
        // TODO: error display logic
        markdownMessage.push(`出错了: ${e.payload}`);
        unlisten();
        unlistenReason();
        unlistenError();
        unlistenEnd();
      });
      const unlistenEnd = await listen(`${hookId}_end`, () => {
        unlisten();
        unlistenReason();
        unlistenError();
        unlistenEnd();
        markdownMessage.over();
      });
      invoke("ai_service_send", {
        content: text,
        hookId,
      }).catch((e) => {
        catchServiceError(e);
        markdownMessage.push("程序运行错误");
      });
      resolve();
    });

    return true;

    //#region 生产环境-初始化
    // if (!botConfig) {
    //   botConfig = {
    //     apiKey: "",
    //     endpoint: "",
    //     model: "",
    //   };
    // }
    // if (!botConfig.endpoint) {
    //   botConfig.endpoint = text;
    //   appendMessage({
    //     sender: "system",
    //     content: "• 需要API密钥",
    //   } as MsgInfo);
    //   return;
    // }
    // if (!botConfig.apiKey) {
    //   botConfig.apiKey = text;
    //   appendMessage({
    //     sender: "system",
    //     content: "• 需要指定模型",
    //   } as MsgInfo);
    //   return;
    // }
    // if (!botConfig.model) {
    //   botConfig.model = text;

    //   invoke("ai_service_init", {
    //     apiBase: botConfig.endpoint,
    //     apiKey: botConfig.apiKey,
    //     modelName: botConfig.model,
    //   }).catch((error) => {
    //     appendMessage({
    //       sender: "system",
    //       content: `初始化失败: ${(error as Error).message}`,
    //     } as MsgInfo);
    //     return;
    //   });

    //   appendMessage({
    //     sender: "system",
    //     content: "初始化完成",
    //   } as MsgInfo);
    //   return;
    // }
    //#endregion

    // appendMessage({
    //   sender: "user",
    //   content: text,
    // } as MsgInfo);

    // invoke("ai_send_message", {
    //   message: text,
    // }).catch((error: Error) => {
    //   appendMessage({
    //     sender: "system",
    //     content: `发送失败，错误信息:\n${error.message}`,
    //   } as MsgInfo);
    // });

    // const newHistory = await sendChatMessage(
    //   text,
    //   (response) => {
    //     messageIndex = appendMessage({
    //       sender: response.sender,
    //       content: response.content,
    //     } as MsgInfo);
    //   },
    //   (content) => {
    //     updateMessage(content, messageIndex);
    //   },
    //   (tip) => {
    //     tipPop(tip, messageIndex);
    //   },
    //   chatHistory()
    // );

    // setChatHistory(newHistory);
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
        invoke("ai_service_clear")
          .then(() =>
            append({ sender: Sender.System, content: "清除聊天记录" })
          )
          .catch(catchServiceError);
      },
    },
    {
      key: "F5",
      keyModifiers: "Shift",
      callback: () => {
        botConfigTemples("SiliconCloud").then((config) => {
          invoke("ai_service_reset", {
            endpoint: config.endpoint,
            apiKey: config.apiKey,
            modelName: config.modelName,
          })
            .then(() =>
              append({ sender: Sender.System, content: "重置服务配置" })
            )
            .catch(catchServiceError);
        });
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
  ]);

  let inputArea: HTMLTextAreaElement;

  let switchTo: (_index: number) => void;

  let append: (info: ChatMessage, open?: boolean) => number;
  let set: (index: number, content: any, align?: boolean) => void;
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
              animateMini(
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
              animateMini(
                cur,
                {
                  scale: [0.2, 1],
                  translate: ["-40vw -40vh", "0 0"],
                },
                {
                  duration: 0.3,
                  ease: [0.5, 0, 0, 1],
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
              animateMini(
                prev,
                {
                  scale: 0,
                  translate: "-50vw -50vh",
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
              animateMini(
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
        <SettingPage version={version} />
        <HomePage
          getOps={(a, s, _cs, cr, ab, b) => {
            append = a;
            set = s;
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
