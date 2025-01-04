import { createSignal, onMount } from "solid-js";

import { AppWindow } from "./Components/AppWindow";
import { PageContainer } from "./Components/PageContainer";
import { PageWrapper } from "./utils/PageManager";
import { InputBox } from "./Components/InputBox";

import { homePage, newMessage } from "./pages/HomePage";
import { settingPage } from "./pages/SettingPage";

import "./App.css";
import { Dynamic } from "solid-js/web";
import { createKeyBinding, readAPIKey } from "./debugger";
import { MsgInfo, MsgTip } from "./Components/MessageBox";
import { sendChatMessage } from "./Ai/ChatService";
import { ChatConfig, initModel } from "./Ai/LangChainService";

function App() {
  let appendMessage: (newMessage: newMessage) => number;
  let updateMessage: (text: string, index: number) => void;
  let tipPop: (tip: MsgTip, index: number) => void;
  let botConfig: ChatConfig;
  onMount(async () => {
    const apiKey = await readAPIKey();
    botConfig = {
      apiKey,
      endpoint: "https://api.siliconflow.cn/v1",
      model: "Qwen/Qwen2.5-7B-Instruct",
    };
    initModel(botConfig);
  });

  const [showSettings, setShowSettings] = createSignal(false);
  const handleShowSettings = () => setShowSettings(!showSettings());
  const content: PageWrapper[] = [
    {
      id: "page-home",
      title: "主页",
      position: [0, 0],
      content: (
        <Dynamic
          component={homePage}
          commands={(append, update, tip) => {
            appendMessage = append;
            updateMessage = update;
            tipPop = tip;
          }}
        />
      ),
    },
    {
      id: "page-setting",
      title: "设置",
      position: [0, -1],
      defaultStyle: {
        opacity: 0,
        filter: "blur(16px)",
        translate: "-50vw -50vh",
        scale: 0.1,
      },
      content: settingPage,
    },
  ];

  const [chatHistory, setChatHistory] = createSignal<Array<{ role: string; content: string }>>([]);

  const handleSubmit = async (text: string) => {
    appendMessage({
      sender: "user",
      content: text,
    } as MsgInfo);
    let messageIndex: number;
    
    const newHistory = await sendChatMessage(
      text,
      (response) => {
        messageIndex = appendMessage({
          sender: response.sender,
          content: response.content,
        } as MsgInfo);
      },
      (content) => {
        updateMessage(content, messageIndex);
      },
      (tip) => {
        tipPop(tip, messageIndex);
      },
      chatHistory()
    );
    
    setChatHistory(newHistory);
  };

  onMount(() => {
    const inputBox = document.getElementById("inputBox");
    if (inputBox) {
      inputBox.classList.add("leave");
      inputBox.clientHeight;
      inputBox.classList.remove("leave");
    }
  });

  createKeyBinding([
    {
      key: "F9",
      callback: () => {
        appendMessage({
          sender: "user",
          content: "F9 pressed",
        } as MsgInfo);
      },
    },
    {
      key: "l",
      keyModifiers: "Control",
      callback: () => {
        const inputBox = document.getElementById("inputBox");
        if (inputBox && inputBox.firstChild) {
          (inputBox.firstChild as HTMLInputElement).focus();
        }
      }
    }
  ]);

  // 监视焦点事件并输出元素
  const handleFocus = (e: FocusEvent) => {
    console.log(e.target);
  };
  document.addEventListener("focus", handleFocus);

  return (
    <AppWindow title="深度折叠" showSettings={handleShowSettings}>
      <PageContainer children={content} showSettings={showSettings()} />
      <InputBox show={!showSettings()} onSubmit={handleSubmit} />
    </AppWindow>
  );
}

export default App;
