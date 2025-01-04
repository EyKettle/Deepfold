import { Component } from "solid-js"
import { createSignal, onMount, Suspense } from "solid-js"
import { Window } from "@tauri-apps/api/window"

const appWindow = new Window('main');

interface AppWindowProps {
    title: string,
    children?: any,
    showSettings?: () => void
}

export const AppWindow: Component<AppWindowProps> = (props) => {
    return (
        <main class="app-window">
            <TitleBar title={props.title} showSettings={props.showSettings}/>
            <div class="window-content">
                <Suspense fallback={<div class="loading"/>}>
                    {props.children}
                </Suspense>
            </div>
        </main>
    )
}

interface TitleBarProps {
    title?: string;
    showSettings?: () => void;
  }
  
  const TitleBar: Component<TitleBarProps> = (props) => {
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
  
    return (
      <div data-tauri-drag-region class="icon titlebar">
        <div class="titlebar-title">
          <label id='titlebar-title' onClick={() => {
              props.showSettings?.();
            }}>
            {props.title || 'Window'}
          </label>
        </div>
        <button
          class='titlebar-button'
          id='titlebar-min'
          onclick={() => appWindow.minimize()}
        >
          &#x002d;
        </button>
        <button
          class='titlebar-button'
          id='titlebar-max'
          onclick={async () => appWindow.toggleMaximize() }
        >
          { maximizeIcon() }
        </button>
        <button
          class='titlebar-close'
          id='titlebar-close'
          onclick={() => appWindow.close()}
        >
          &#x00d7;
        </button>
      </div>
    );
  };