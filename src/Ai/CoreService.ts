import { invoke } from "@tauri-apps/api/core";

type Error = {
  kind: "error" | "warn";
  message: string;
};

export type MsgTip = {
  icon: string;
  title: string;
  description?: string;
  buttons?: string[];
  functions?: (() => void)[];
};

export interface ServiceConfig {
  endpoint: string;
  apiKey: string;
  modelName: string;
  hooks: string[];
  stream?: boolean;
}

export class CoreService {
  public readonly serviceConfig: ServiceConfig;
  showInfo: (text: string) => void;
  sendMessage: (message: string) => void;
  updateMessage: (content: string) => void;
  tipPop: (tip: MsgTip) => void;
  public initialized: boolean = false;
  constructor(
    config: ServiceConfig,
    showInfo: (text: string) => void,
    sendMessage: (message: string) => void,
    updateMessage: (content: string) => void,
    tipPop: (tip: MsgTip) => void
  ) {
    this.serviceConfig = config;
    this.showInfo = showInfo;
    this.sendMessage = sendMessage;
    this.updateMessage = updateMessage;
    this.tipPop = tipPop;
  }

  async init() {
    if (this.initialized) return;
    invoke("ai_service_init", {
      apiBase: this.serviceConfig.endpoint,
      apiKey: this.serviceConfig.apiKey,
      modelName: this.serviceConfig.modelName,
      hooks: this.serviceConfig.hooks,
    })
      .then(() => {
        this.initialized = true;
      })
      .catch((err: Error) => {
        if (err.kind === "error") {
          this.showInfo(`初始化失败，错误信息:\n${err.message}`);
        } else {
          this.initialized = true;
          this.showInfo(`初始化中存在问题:\n${err.message}`);
        }
      });
  }

  private processError(err: Error, prefix: string): string {
    if (err.kind === "error") {
      return `${prefix}失败，错误信息:\n${err.message}`;
    } else {
      return `${prefix}过程中存在问题:\n${err.message}`;
    }
  }

  async send(message: string) {
    if (!this.initialized) return;
    invoke("ai_send_message", {
      message,
    }).catch((err: Error) => {
      this.showInfo(this.processError(err, "发送"));
    });
  }

  async clear() {
    if (!this.initialized) return;
    invoke("ai_history_clear").catch((err: Error) => {
      this.showInfo(this.processError(err, "记录清空"));
    });
  }
}
