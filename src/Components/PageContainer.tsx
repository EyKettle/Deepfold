import {
  Component,
  createMemo,
  createEffect,
  Suspense,
  Show,
  For,
  createSignal,
} from "solid-js";
import { PageWrapper, PageManager } from "../utils/PageManager";
// import { animations } from "../utils/Animations";
// import { createKeyBinding } from "../debugger";

interface ContainerProps {
  showSettings?: boolean;
  children: PageWrapper | PageWrapper[];
  current?: number;
  home?: number;
}

export const PageContainer: Component<ContainerProps> = (props) => {
  const [currentIndex, setCurrentIndex] = createSignal(props.current);

  const children = createMemo(() => {
    return Array.isArray(props.children) ? props.children : [props.children];
  });
  const pageManager = new PageManager(children());

  /*
   * 调试功能
   *
   */
  // const [visible, setVisible] = createSignal([false, false, false]);
  // createKeyBinding("F9", () => {
  //   setVisible((prev) => [false, !prev[1], false]);
  // });

  const pageSwitch = (current: number, prev: number) => {
    new Promise(() => {
      pageManager.switch(current, prev ?? 0);
      // if (current === 1) settingPageAnimate();
    });
  };
  // const settingPageAnimate = () => {
  //   const element = document.getElementById(children()[1].id);
  //   if (element) {
  //     animations.slideIn(element);
  //   }
  // };
  createEffect((prev) => {
    const current = currentIndex();
    if (current === undefined) return;
    pageSwitch(current, prev as number);
    return current;
  }, 0);

  createEffect(() => {
    const showSettings = props.showSettings;
    if (showSettings) {
      setCurrentIndex(1);
    } else {
      setCurrentIndex(0);
    }
  });

  return (
    <div class="page-container">
      <Show
        when={children().length > 0}
        fallback={<div class="void-page">虚空页面</div>}
      >
        <For each={children()}>
          {(page) => {
            return (
              <Suspense fallback={<div class="loading" />}>
                {page.content}
              </Suspense>
            );
          }}
        </For>
      </Show>
    </div>
  );
};

interface PageProps {
  id: string;
  content?: string;
  children?: any;
  style?: {
    isFloat?: boolean;
    isMarkdown?: boolean;
  };
  initialStyle?: any;
}

export const Page: Component<PageProps> = (props) => {
  const pageClass = createMemo(() => {
    const classes = ["page"];
    if (props.style?.isFloat) classes.push("float");
    if (props.style?.isMarkdown) classes.push("markdown");
    return classes.join(" ");
  });

  return (
    <div
      id={props.id}
      class={pageClass()}
      innerHTML={props.content}
      style={props.initialStyle}
    >
      <Show when={!props.content}>{props.children}</Show>
    </div>
  );
};
