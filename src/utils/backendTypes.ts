type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

type Parameter = "endpoint" | "apiKey" | "modelName";

type StreamEvent =
  | {
      event: "push";
      data: string;
    }
  | {
      event: "end";
      data: {
        interrupted: boolean;
        messages: Message[];
      };
    }
  | {
      event: "error";
      data: {
        type: "emptyParameter" | "requestSending" | "serialize";
        detail: string | Parameter[];
      };
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
