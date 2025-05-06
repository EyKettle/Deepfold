import { toolCallTip } from "../controls/MessageWidgets";

export const parseToolCall = (data: { name: tools; state: string }) => {
  let icon = "";
  switch (data.name) {
    case "program_send_message":
      icon = "M";
      break;
  }
  return toolCallTip(icon, data.name, data.state);
};
