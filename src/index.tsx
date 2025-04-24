/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App";
import { window } from "@tauri-apps/api";
import { openUrl } from "@tauri-apps/plugin-opener";

window
  .getCurrentWindow()
  .theme()
  .then((theme) => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  });

document.addEventListener("click", (e) => {
  if (e.target instanceof HTMLAnchorElement) {
    e.preventDefault();
    openUrl((e.target as HTMLAnchorElement).href);
  }
});

render(() => <App />, document.getElementById("root") as HTMLElement);
