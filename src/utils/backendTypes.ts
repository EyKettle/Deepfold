type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

type StreamEndMessage = {
  interrupted: boolean;
  messages: Message[];
};

type ServiceConfig = {
  endpoint: string;
  apiKey: string;
  modelName: string;
};

type BackendError = {
  type: "RequestSending" | "EmptyParameter";
  detail: any;
};

type Theme = "auto" | "light" | "dark";

type CoreData = ServiceConfig & {
  theme: Theme;
};
