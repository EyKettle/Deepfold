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
