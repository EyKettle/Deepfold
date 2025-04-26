import { Component, createEffect } from "solid-js";
import { createSignal, onMount, Suspense } from "solid-js";
import { Window } from "@tauri-apps/api/window";
import { animateMini } from "motion";

const appWindow = new Window("main");

export type AiStatus = "offline" | "online" | "typing" | "wrong";

interface AppWindowProps {
  title: string;
  aiStatus: AiStatus;
  children?: any;
  showSettings?: () => void;
}

export const AppWindow: Component<AppWindowProps> = (props) => {
  return (
    <main class="app-window">
      <TitleBar
        aiStatus={props.aiStatus}
        title={props.title}
        showSettings={props.showSettings}
      />
      <div class="window-content">
        <Suspense fallback={<div class="loading" />}>{props.children}</Suspense>
      </div>
    </main>
  );
};

interface TitleBarProps {
  title?: string;
  aiStatus: AiStatus;
  showSettings?: () => void;
}

const TitleBar: Component<TitleBarProps> = (props) => {
  let statusLight: SVGLineElement;

  const [maximizeIcon, setMaximizeIcon] = createSignal("\u0021");
  const updateMaximizeIcon = async () => {
    const isMaximized = await appWindow.isMaximized();
    setMaximizeIcon(isMaximized ? "\u003f" : "\u0021");
  };

  onMount(async () => {
    await appWindow.onResized(() => {
      updateMaximizeIcon();
    });
  });

  let animating: NodeJS.Timeout | undefined;
  createEffect(() => {
    if (props.aiStatus === "typing") {
      if (animating) return;
      statusLight.style.animation =
        "typingBar 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite alternate";
      new Promise<void>(async (resolve) => {
        animating = setInterval(() => {
          if (props.aiStatus !== "typing") {
            statusLight.style.animation = "";
            clearInterval(animating);
            animating = undefined;
          }
        }, 1200);
        resolve();
      });
    } else {
      animateMini(
        statusLight,
        {
          strokeWidth: [10, 16, 10],
        },
        {
          duration: 0.6,
          ease: [0.5, 0, 0, 1],
        }
      );
    }
  });

  return (
    <div data-tauri-drag-region class="icon titlebar">
      <div class="titlebar-title">
        <label
          tabIndex={0}
          id="titlebar-title"
          on:keypress={(e) => {
            if (e.key === "Enter") props.showSettings?.();
          }}
          onClick={() => {
            props.showSettings?.();
          }}
        >
          {props.title || "Window"}
        </label>
        <svg
          style={{
            "margin-left": "4px",
            stroke: `var(--color-status-${props.aiStatus})`,
            "stroke-linecap": "round",
            "stroke-width": "10",
            "stroke-dasharray": "20 40",
            "stroke-dashoffset": "19",
            "transition-property": "stroke, stroke-width, stroke-dashoffset",
            "transition-duration": "0.4s",
          }}
          width={42}
          height={20}
        >
          <line
            ref={(e) => (statusLight = e)}
            x1={10}
            y1={10}
            y2={10}
            x2={27}
          />
        </svg>
      </div>
      <button
        class="titlebar-button"
        id="titlebar-min"
        onclick={() => appWindow.minimize()}
      >
        &#x002d;
      </button>
      <button
        class="titlebar-button"
        id="titlebar-max"
        onclick={async () => appWindow.toggleMaximize()}
      >
        {maximizeIcon()}
      </button>
      <button
        class="titlebar-close"
        id="titlebar-close"
        onclick={() => appWindow.close()}
      >
        &#x00d7;
      </button>
    </div>
  );
};
