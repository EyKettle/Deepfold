/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App";
import { webviewWindow } from "@tauri-apps/api";

webviewWindow
  .getCurrentWebviewWindow()
  .theme()
  .then((theme) => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  });

render(() => <App />, document.getElementById("root") as HTMLElement);
