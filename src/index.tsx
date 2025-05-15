/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App";
import { window } from "@tauri-apps/api";
import "virtual:svg-icons/register";

window
  .getCurrentWindow()
  .theme()
  .then((theme) => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  })
  .then(() => {
    render(() => <App />, document.getElementById("root")!);
  });
