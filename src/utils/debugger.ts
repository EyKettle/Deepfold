import { createEffect, onCleanup } from "solid-js";
import { readFile } from "@tauri-apps/plugin-fs";

export type VersionNumber = `${number}.${number}.${number}`;

export type Version = {
  code: "REL" | "BET" | "DEV";
  number: VersionNumber;
};

export type ServiceError = {
  type: string;
  message: string;
};

export function parseServiceError(error: ServiceError) {
  switch (error.type) {
    case "Warn":
      console.warn(error.message);
      break;
    case "Error":
      console.error(error.message);
      break;
  }
}

const apiUrl = (head: string) => `https://api.${head}/v1/chat/completions`;

export async function botConfigTemples(
  type: "SiliconCloud" | "Deepseek" | "OpenAIGemini"
): Promise<ServiceConfig> {
  try {
    let names = {
      folderName: "SiliconCloud",
      url: apiUrl("siliconflow.cn"),
      modelName: "Qwen/Qwen2.5-7B-Instruct",
    };
    switch (type) {
      case "Deepseek":
        names.folderName = "Deepseek";
        names.url = apiUrl("deepseek.com");
        names.modelName = "deepseek-chat";
        break;
      case "OpenAIGemini":
        names.folderName = "Gemini";
        names.url = "https://gemini.eykettle.top/v1/chat/completions";
        names.modelName = "gemini-2.5-flash-preview-04-17";
        break;
    }
    const api = await readFile(
      `E:\\Developing\\Profiles\\${names.folderName}\\API.txt`
    ).then((e) => e.toString());
    return {
      endpoint: names.url,
      apiKey: api,
      modelName: names.modelName,
    };
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
  callback: (e: KeyboardEvent) => void;
  state?: "keydown" | "keyup";
  keyModifiers?: string;
}

export function createKeyBinding(options: KeyBindingOptions[]) {
  const createKeyBindingSingle = (
    key: string,
    callback: (e: KeyboardEvent) => void,
    state: "keydown" | "keyup" = "keyup",
    keyModifiers?: string
  ) => {
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === key) {
        if (keyModifiers && !event.getModifierState(keyModifiers)) return;
        callback(event);
      }
    };

    window.addEventListener(state, handleKeyUp);

    onCleanup(() => {
      window.removeEventListener(state, handleKeyUp);
    });
  };
  for (const option of options) {
    createKeyBindingSingle(
      option.key,
      option.callback,
      option.state,
      option.keyModifiers
    );
  }
}
