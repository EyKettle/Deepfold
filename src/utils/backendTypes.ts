type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

type StreamEndMessage = {
  interrupted: boolean;
  messages: Message[];
};
