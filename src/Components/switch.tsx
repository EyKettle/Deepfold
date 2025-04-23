import {
  Component,
  createEffect,
  createSignal,
  For,
  JSX,
  onCleanup,
  onMount,
} from "solid-js";

export type SwitchItem = {
  label: string;
  onClick: () => void;
};

interface SwitchProps {
  disabled?: boolean;
  default?: number;
  children: SwitchItem[];
  border?: {
    width?: string;
    color?: string;
  };
  backgroundColor?: string;
  fontSize?: string;
  class?: string;
  style?: JSX.CSSProperties;
  itemClass?: string;
  itemStyle?: JSX.CSSProperties;
  onChange?: (index: number) => void;
}

interface SwitchItemProps {
  disabled?: boolean;
  index: number;
  text: string;
  active: boolean;
  callback: (index: number) => void;
  event: () => void;
  hooks: (reset: () => void) => void;
  fontSize?: string;
  class?: string;
  style?: JSX.CSSProperties;
}

const SwitchItem: Component<SwitchItemProps> = (props) => {
  let element: HTMLButtonElement;

  const defaultStyle = {
    backgroundColor: "transparent",
  };

  const handleClick = () => {
    if (props.active) return;
    element.style.cursor = "auto";
    props.callback(props.index);
    props.event();
  };

  const reset = () => {
    element.style.color = "var(--color-theme-text)";
    element.style.backgroundColor = defaultStyle.backgroundColor;
    element.style.boxShadow = "none";
    element.style.translate = "0 0";
    element.style.borderTopWidth = "0";
    element.style.cursor = "pointer";
  };
  props.hooks(reset);

  const applyMousedown = () => {
    element.style.backgroundColor = "var(--color-switch-press)";
    element.style.boxShadow = "none";
    element.style.translate = "0 0";
    element.style.borderTopWidth = "0.0625rem";
  };
  const applyMouseup = () => {
    element.style.color = "var(--color-switch-onActive)";
    element.style.backgroundColor = "var(--color-switch-active)";
    element.style.boxShadow = "none";
    element.style.translate = "0 0";
    element.style.borderTopWidth = "0.0625rem";
  };

  const onEnterDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !props.disabled && !props.active && element) {
      e.preventDefault();
      element.style.scale = "0.95";
      applyMousedown();
    }
  };
  const onEnterUp = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !props.disabled && !props.active && element) {
      element.style.scale = "1";
      applyMouseup();
      handleClick();
    }
  };

  createEffect(() => {
    if (!element) return;
    if (props.disabled) element.tabIndex = -1;
    else if (props.active) element.tabIndex = -1;
    else element.tabIndex = 0;
  });

  onMount(() => {
    if (props.active) {
      element.style.color = "var(--color-switch-onActive)";
      element.style.backgroundColor = "var(--color-switch-active)";
      element.style.boxShadow = "none";
      element.style.translate = "0 0";
      element.style.borderTopWidth = "0.0625rem";
      element.style.cursor = "auto";
    } else {
      element.style.color = "var(--color-theme-text)";
      element.style.backgroundColor = defaultStyle.backgroundColor;
      element.style.boxShadow = "none";
      element.style.translate = "0 0";
      element.style.borderTopWidth = "0";
      element.style.cursor = "pointer";
    }

    if (!element) return;
    element.addEventListener("keydown", onEnterDown);
    element.addEventListener("keyup", onEnterUp);
  });

  onCleanup(() => {
    if (!element) return;
    element.removeEventListener("keydown", onEnterDown);
    element.removeEventListener("keyup", onEnterUp);
  });

  return (
    <button
      ref={(e) => (element = e)}
      class={props.class}
      style={{
        "flex-grow": 1,
        display: "grid",
        "place-items": "center",
        border: "none",
        padding: "0.5rem 1rem",
        "font-size": `${props.fontSize ?? "1.05rem"}`,
        "background-color": defaultStyle.backgroundColor,
        "border-radius": "0.5rem",
        "border-width": 0,
        "border-style": "solid",
        "border-top-width": "0",
        "border-color": "var(--color-border-down)",
        color: "var(--color-theme-text)",
        "transition-property": "background-color, scale",
        "transition-duration": "0.15s",
        "transition-timing-function": "cubic-bezier(0, 0, 0, 1)",
        ...props.style,
      }}
      on:click={handleClick}
      on:mouseenter={() => {
        if (props.active) return;
        element.style.backgroundColor = "var(--color-switch-hover)";
        element.style.boxShadow = "0 0.0625rem 0 var(--color-shadow)";
        element.style.translate = "0 -0.0625rem";
      }}
      on:mouseleave={() => {
        if (props.active) return;
        element.style.color = "var(--color-theme-text)";
        element.style.backgroundColor = defaultStyle.backgroundColor;
        element.style.boxShadow = "none";
        element.style.translate = "0 0";
        element.style.borderTopWidth = "0";
      }}
      on:mousedown={(e) => {
        if (e.button === 0) {
          if (props.active) return;
          applyMousedown();
        }
      }}
      on:mouseup={(e) => {
        if (e.button === 0) {
          if (props.active) return;
          applyMouseup();
        }
      }}
      on:touchstart={() => {
        if (props.active) return;
        element.style.backgroundColor = "var(--color-switch-hover)";
        element.style.boxShadow = "0 0.0625rem 0 var(--color-shadow)";
        element.style.translate = "0 -0.0625rem";
        element.style.borderTopWidth = "0";
      }}
      on:touchend={() => {
        if (props.active) return;
        element.style.color = "var(--color-theme-text)";
        element.style.backgroundColor = defaultStyle.backgroundColor;
        element.style.boxShadow = "none";
        element.style.translate = "0 0";
        element.style.borderTopWidth = "0";
      }}
      on:blur={() => {
        if (props.active) return;
        reset();
      }}
    >
      {props.text}
    </button>
  );
};

export const Switch: Component<SwitchProps> = (props) => {
  const [activeIndex, setActiveIndex] = createSignal(props.default ?? 0);
  const handleSwitch = (index: number) => {
    const prev = activeIndex();
    setActiveIndex(index);
    resetHandles[prev]();
    props.onChange?.(index);
  };
  let resetHandles: (() => void)[] = Array(props.children.length).fill(() =>
    console.warn("Switch item not found")
  );

  return (
    <div
      class={props.class}
      style={{
        display: "inline-flex",
        "min-height": "2.5rem",
        gap: "0.4rem",
        padding: "0.5rem",
        "background-color": `${
          props.backgroundColor ?? "var(--color-surface-light)"
        }`,
        "border-radius": "1rem",
        "border-style": "solid",
        "border-color": `${
          props.border?.color ?? "var(--color-border-default)"
        }`,
        "border-width": `${props.border?.width ?? "0.0625rem"}`,
        "box-shadow": "0 0.0625rem 0 var(--color-shadow-auto)",
        ...props.style,
      }}
    >
      <For each={props.children}>
        {(item, index) => (
          <SwitchItem
            index={index()}
            text={item.label}
            callback={handleSwitch}
            event={item.onClick}
            active={index() === activeIndex()}
            hooks={(r) => {
              resetHandles[index()] = r;
            }}
            disabled={props.disabled}
            fontSize={props.fontSize}
            class={props.itemClass}
            style={props.itemStyle}
          />
        )}
      </For>
    </div>
  );
};
