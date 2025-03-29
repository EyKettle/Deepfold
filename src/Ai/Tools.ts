import { tool } from "@langchain/core/tools";
import { invoke } from "@tauri-apps/api/core";

const aiTest = tool(
  async () => {
    try {
      return await invoke("ai_tool_call_test");
    } catch (error) {
      return `无法正常调用工具，错误信息：${error}`;
    }
  },
  {
    name: "AI测试工具",
    description: "测试AI工具的调用是否正常",
  }
);

export const tools = [aiTest];
