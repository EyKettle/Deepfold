import { Component } from "solid-js";
import { Page } from "../Components/PageContainer";

import "./SettingStyle.css";

export const settingPage: Component = () => {
  return (
    <Page
      id="page-setting"
      initialStyle={{
        opacity: 0,
        filter: "blur(16px)",
        translate: "-50vw -50vh",
        scale: 0.1,
      }}
    >
      <div class="setting-card">
        <label>设置卡片</label>
        <div>
          这是一段描述
        </div>
      </div>
    </Page>
  );
};
