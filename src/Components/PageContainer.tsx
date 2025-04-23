import { Component, JSX, JSXElement, onCleanup, onMount } from "solid-js";
import { render } from "solid-js/web";

type PageInfo = {
  name: string;
  memoPosition?: boolean;
  onPrepare?: () => void;
  onRouted?: (path: string, param?: string) => void;
  onLeave?: () => void;
};

interface PageContainerProps {
  children: JSXElement[];
  pageInfos: PageInfo[];
  class?: string;
  style?: JSX.CSSProperties;
  pageInit?: (page: HTMLDivElement, index: number) => void;
  loadedMotion?: (container: HTMLDivElement) => void;
  switchMotion?: (
    oldPage: HTMLDivElement,
    newPage: HTMLDivElement,
    isForward: boolean,
    switchDirection: [number, number],
    container: HTMLDivElement
  ) => Promise<void>;
  homeIndex?: number;
  defaultIndex: number;
  routeMode?: "none" | "spa" | "fakeRouter";
  getMethods: (
    switchTo: (index: number, param?: string, replace?: boolean) => void,
    getFrontIndex: () => number
  ) => void;
}

export const PageContainer: Component<PageContainerProps> = (props) => {
  let container: HTMLDivElement | null = null;

  let frontIndex: number = props.defaultIndex;
  let pages: HTMLDivElement[] = [];
  let scrollPos = new Map<HTMLDivElement, number>();
  let scrolledItems = new Set<HTMLDivElement>();

  const updateFrontPage = (target: number) => {
    if (!container) return;
    if (pages.length > 0) {
      if (target < 0 || target >= pages.length) target = 0;
      if (container.children.length > 0) {
        if (target === frontIndex) return;
        const isForward = target > frontIndex;
        const newPage = container.appendChild(pages[target]);
        const previous = frontIndex;
        frontIndex = target;
        if (props.pageInfos[previous].memoPosition !== false) saveScrollTop();
        const removeOldPage = () => {
          if (frontIndex !== previous) {
            if (props.pageInfos[previous]?.onLeave)
              props.pageInfos[previous].onLeave();
            if (container?.contains(pages[previous])) {
              container?.removeChild(pages[previous]);
            }
          }
        };
        if (props.switchMotion) {
          props
            .switchMotion(
              pages[previous],
              newPage,
              isForward,
              [previous, target],
              container
            )
            .then(removeOldPage);
        } else removeOldPage();
      } else {
        frontIndex = target;
        container.appendChild(pages[target]);
        props.loadedMotion?.(container);
      }
      if (props.pageInfos[target].memoPosition !== false) loadScrollTop();
      if (props.pageInfos[target]?.onPrepare)
        props.pageInfos[target].onPrepare!();
    }
  };

  let indexHistory: number[] = [];
  let historyPosition = 0;

  const handleSwitch = (
    index: number,
    param?: string,
    replace = false,
    first = false
  ) => {
    updateFrontPage(index);
    if (props.routeMode === "fakeRouter") {
      if (historyPosition < indexHistory.length - 1)
        indexHistory.splice(historyPosition + 1);
      indexHistory.push(index);
      historyPosition = indexHistory.length - 1;
      if (!first) {
        let url = props.pageInfos[index].name;
        if (param) url += "#" + param;
        if (replace) {
          window.history.replaceState(historyPosition, "", "/" + url);
        } else {
          window.history.pushState(historyPosition, "", "/" + url);
        }
      }
      if (props.pageInfos[index]?.onRouted)
        props.pageInfos[index].onRouted(props.pageInfos[index].name, param);
    }
  };

  const saveScrollTop = () => {
    scrolledItems.forEach((element) => {
      if (element.scrollTop === 0) scrollPos.delete(element);
      else scrollPos.set(element, element.scrollTop);
    });
    scrolledItems.clear();
  };
  const loadScrollTop = () => {
    scrollPos.forEach((pos, target) => (target.scrollTop = pos));
  };

  const handleLocationChange = (first = false, replace?: boolean) => {
    if (props.routeMode !== "fakeRouter") {
      console.warn(container, "LocationChange triggered without FakeRouter.");
      return;
    }
    const path = window.location.pathname.slice(1);
    const param = window.location.hash.slice(1);
    if (!first && path === "") return;
    const index =
      path === "" && first
        ? props.defaultIndex
        : props.pageInfos.findIndex((page) => page.name === path);
    if (props.homeIndex && index !== props.homeIndex) first = false;
    if (index >= 0 && index < pages.length)
      handleSwitch(index, param === "" ? undefined : param, replace, first);
  };

  const goBackward = () => {
    if (historyPosition > 0) {
      historyPosition--;
      updateFrontPage(indexHistory[historyPosition]);
    }
  };
  const goForward = () => {
    if (historyPosition < indexHistory.length - 1) {
      historyPosition++;
      updateFrontPage(indexHistory[historyPosition]);
    }
  };

  const handlePopState = (event: PopStateEvent) => {
    if (event.state === null) {
      handleLocationChange(true, true);
    } else {
      if (event.state > historyPosition) goForward();
      else if (event.state < historyPosition) goBackward();
    }
  };

  const getFrontIndex = () => frontIndex;
  props.getMethods(handleSwitch, getFrontIndex);

  const handleScroll = (e: Event) => {
    if (e.target instanceof HTMLDivElement) scrolledItems.add(e.target);
  };

  onMount(() => {
    pages = props.children.map((content, index) => {
      const page = document.createElement("div");
      page.style.position = "absolute";
      page.style.height = "100%";
      page.style.width = "100%";
      if (props.pageInit) props.pageInit(page, index);
      else {
        page.style.display = "flex";
        page.style.justifyContent = "center";
      }
      render(() => content, page);
      return page;
    });

    if (props.pageInfos.length !== pages.length)
      throw new Error("PageInfos length not matched.");

    if (props.routeMode !== "none")
      window.addEventListener("popstate", handlePopState);

    if (props.routeMode === "fakeRouter") handleLocationChange(true, true);
    else {
      handleSwitch(props.defaultIndex, undefined, true);
      if (
        props.routeMode !== "none" &&
        window.location.pathname.slice(1) !== ""
      )
        window.history.replaceState(null, "", "/");
    }

    container?.addEventListener("scroll", handleScroll, { capture: true });
  });

  onCleanup(() => {
    if (props.routeMode !== "none")
      window.removeEventListener("popstate", handlePopState);
    container?.removeEventListener("scroll", handleScroll, { capture: true });
  });

  return (
    <div
      ref={(e) => (container = e)}
      class={props.class}
      style={{
        height: "100%",
        width: "100%",
        ...props.style,
      }}
    ></div>
  );
};
