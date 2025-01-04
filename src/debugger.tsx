import { createEffect, onCleanup } from "solid-js";
import { MsgInfo, MsgPosition, MsgSender } from "./Components/MessageBox";
import { invoke } from "@tauri-apps/api/core";

export async function readAPIKey(): Promise<string> {
  try {
    const api = await invoke("read_path", { path: "F:\\Developing\\Tauri\\Deepfold\\api.txt" });
    return api as string;
  } catch (error) {
    console.error("读取API密钥失败:", error);
    throw error;
  }
}

export function createDOMDebugger(targetSelector: string) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      console.log("DOM变化类型:", mutation.type);
      console.log("变化时间:", new Date().toISOString());
      const attributeName = mutation.attributeName;
      if (attributeName) {
        const oldAttributeValue = mutation.oldValue;
        const newAttributeValue = (mutation.target as HTMLElement).getAttribute(
          attributeName
        );
        console.log("属性变化:", {
          element: mutation.target,
          attributeName,
          oldValue: oldAttributeValue,
          newValue: newAttributeValue,
        });
      }
    });
  });

  createEffect(() => {
    const target = document.querySelector(targetSelector);
    if (target) {
      observer.observe(target, {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: true,
      });
      console.log(
        "DOM初始状态:",
        {
          element: target,
          attributes: Array.from(target.attributes).reduce<
            Record<string, string>
          >((acc, attr) => {
            acc[attr.name] = attr.value;
            return acc;
          }, {}),
          childNodes: Array.from(target.childNodes).map((node) =>
            node.nodeType === Node.ELEMENT_NODE
              ? (node as HTMLElement).outerHTML
              : node.textContent
          ),
        },
        "---"
      );
    }
  });

  onCleanup(() => observer.disconnect());
}

interface KeyBindingOptions {
  key: string;
  keyModifiers?: string;
  callback: (e: KeyboardEvent) => void;
}

export function createKeyBinding(options: KeyBindingOptions[]) {
  const createKeyBindingSingle = (
    key: string,
    callback: (e: KeyboardEvent) => void,
    keyModifiers?: string
  ) => {
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === key) {
        if (keyModifiers && !event.getModifierState(keyModifiers)) return;
        callback(event);
      }
    };

    window.addEventListener("keyup", handleKeyUp);

    onCleanup(() => {
      window.removeEventListener("keyup", handleKeyUp);
    });
  };
  for (const option of options) {
    createKeyBindingSingle(option.key, option.callback, option.keyModifiers);
  }
}

export const testMessages: MsgInfo[] = [
  {
    sender: MsgSender.User,
    position: MsgPosition.Start,
    content: "你好",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Start,
    content: "你好，有何需求？",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Start,
    content: "帮我创建一个叫Newfile的md文件",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Start,
    content: "没问题，我帮你在这里创建了一个名为“Newfile”的MD文件。",
    extra: [
      {
        icon: "\ue160",
        title: "创建 Newfile.md",
        description: "./Deepfold/",
        buttons: ["\ued25"],
      },
    ],
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.End,
    content: "是否还有其他事情需要我的帮助？",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Start,
    content: "再帮我在里面随机写一点Markdown文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Start,
    content: "好的，帮你在文档中填入了一些有关乌龟的内容。",
    extra: [
      {
        icon: "\ue70f",
        title: "修改 增加乌龟文档",
        description: "./Deepfold/Newfile.md",
        buttons: ["\ued25"],
      },
    ],
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.End,
    content: "还有其他需要帮助的吗？",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Start,
    content: '文件名改成"Turtle"吧',
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Start,
    content: "好的，帮你在文档中修改了文件名。",
    extra: [
      {
        icon: "\ue8ac",
        title: "命名 Turtle.md",
        description: "./Deepfold/Newfile.md",
        buttons: ["\ued25"],
      },
    ],
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Start,
    content: "总结一下刚刚做的事情",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Start,
    content: "好的，下面是你刚刚做的事情的总结：",
    extra: [
      {
        icon: "\ue160",
        title: "创建 Newfile.md",
        description: "./Deepfold/",
      },
      {
        icon: "\ue70f",
        title: "修改 增加乌龟文档",
        description: "./Deepfold/Newfile.md",
      },
      {
        icon: "\ue8ac",
        title: "命名 Turtle.md",
        description: "./Deepfold/Newfile.md",
      },
    ],
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Start,
    content: "做得很好！下次再见！",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Start,
    content: "感谢你的认可，下次再见！",
  },
];

export const testBubbleMessages: MsgInfo[] = [
  {
    sender: MsgSender.User,
    position: MsgPosition.Start,
    content: "这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Start,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.End,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Start,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Middle,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.End,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Start,
    content: "这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Middle,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Middle,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.End,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Start,
    content: "这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Start,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.End,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Start,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Middle,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.End,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Start,
    content: "这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Middle,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Middle,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.End,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Start,
    content: "这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Start,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.End,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Start,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Middle,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.End,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Start,
    content: "这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Middle,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Middle,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.End,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Start,
    content: "这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Start,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.End,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Start,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Middle,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.End,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Start,
    content: "这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Middle,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Middle,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.End,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Start,
    content: "这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Start,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.End,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Start,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Middle,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.End,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Start,
    content: "这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Middle,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Middle,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.End,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Start,
    content: "这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Start,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.End,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Start,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Middle,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.End,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Start,
    content: "这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Middle,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Middle,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.End,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Start,
    content: "这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Start,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.End,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Start,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Middle,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.End,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Start,
    content: "这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Middle,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Middle,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.End,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Start,
    content: "这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Start,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.End,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Start,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.Middle,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.User,
    position: MsgPosition.End,
    content: "这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Start,
    content: "这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Middle,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.Middle,
    content: "这是一段测试文本这是一段测试文本这是一段测试文本这是一段测试文本",
  },
  {
    sender: MsgSender.Bot,
    position: MsgPosition.End,
    content: "这是一段测试文本",
  },
]