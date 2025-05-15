import {
  type Component,
  createEffect,
  JSX,
  Match,
  onCleanup,
  onMount,
  Show,
  Switch,
} from "solid-js";

interface ButtonProps {
  icon?: string | Element;
  iconColors?: string;
  label?: string;
  type?: "button" | "ghost";
  color?: string;
  backgroundColor?: {
    default: string;
    hover: string;
    active: string;
  };
  class?: string;
  style?: JSX.CSSProperties;
  iconStyle?: JSX.CSSProperties;
  disabled?: boolean;
  onClick?: (element: HTMLButtonElement) => void;
  getAnimates?: (press: () => void, release: () => void) => void;
}

export const Button: Component<ButtonProps> = (props) => {
  let element: HTMLButtonElement;
  let isTouch = false;

  const onEnterDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !props.disabled) {
      e.preventDefault();
      element.style.scale = "0.95";
    }
  };
  const onEnterUp = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !props.disabled) {
      element.style.scale = "1";
      props.onClick?.(element);
    }
  };

  const applyMousedown = () => {
    element.style.backgroundColor = `var(--color-${props.type}-active)`;
  };
  const applyMouseleave = () => {
    element.style.backgroundColor = `var(--color-${props.type}-default)`;
  };
  props.getAnimates?.(applyMousedown, applyMouseleave);

  createEffect(() => {
    if (props.disabled) {
      element.tabIndex = -1;
    } else {
      element.tabIndex = 0;
    }
  });

  onMount(() => {
    if (!props.type) props.type = "button";
    if (props.type === "button") {
      element.style.borderStyle = "solid";
      element.style.borderWidth = "0";
      element.style.borderTopColor = "var(--color-border-up)";
      element.style.borderTopWidth = "0.0625rem";
      element.style.borderBottomColor = "var(--color-border-down)";
      element.style.borderBottomWidth = "0.0625rem";
    }
    if (props.backgroundColor) {
      element.style.setProperty(
        `--color-${props.type}-default`,
        props.backgroundColor.default
      );
      element.style.setProperty(
        `--color-${props.type}-hover`,
        props.backgroundColor.hover
      );
      element.style.setProperty(
        `--color-${props.type}-active`,
        props.backgroundColor.active
      );
    }
    element.style.backgroundColor = `var(--color-${props.type}-default)`;
    element.style.color = props.color ? props.color : "var(--color-theme-text)";

    element.addEventListener("keydown", onEnterDown);
    element.addEventListener("keyup", onEnterUp);
  });

  onCleanup(() => {
    element.removeEventListener("keydown", onEnterDown);
    element.removeEventListener("keyup", onEnterUp);
  });

  return (
    <button
      ref={(e) => (element = e)}
      class={props.class}
      style={{
        padding: "0.5rem 1rem",
        "border-radius": "0.5rem",
        display: "inline-grid",
        "grid-template-columns": `${props.icon !== undefined && "auto"} ${
          props.label !== undefined && "auto"
        }`,
        "column-gap": "0.5rem",
        "align-items": "center",
        "vertical-align": "middle",
        "min-height": "2.5rem",
        "min-width": "2.5rem",
        "font-size": "1.125rem",
        "transition-property": "background-color, scale",
        "transition-duration": "0.3s",
        "transition-timing-function": "cubic-bezier(0, 0, 0, 1)",
        "will-change": "scale",
        cursor: props.disabled ? "unset" : "pointer",
        ...props.style,
      }}
      on:mouseenter={(e) => {
        if (!props.disabled && !isTouch)
          e.currentTarget.style.backgroundColor = `var(--color-${props.type}-hover)`;
      }}
      on:mouseleave={() => {
        if (!props.disabled && !isTouch) applyMouseleave();
      }}
      on:mousedown={(e) => {
        if (!props.disabled && !isTouch && e.button === 0) applyMousedown();
      }}
      on:mouseup={(e) => {
        if (isTouch) {
          isTouch = false;
          return;
        }
        if (!props.disabled && e.button === 0)
          e.currentTarget.style.backgroundColor = `var(--color-${props.type}-hover)`;
      }}
      on:touchstart={(e) => {
        isTouch = true;
        if (!props.disabled)
          e.currentTarget.style.backgroundColor = `var(--color-${props.type}-hover)`;
      }}
      on:touchend={(e) => {
        if (!props.disabled)
          e.currentTarget.style.backgroundColor = `var(--color-${props.type}-default)`;
      }}
      on:blur={(e) => {
        if (!props.disabled)
          e.currentTarget.style.backgroundColor = `var(--color-${props.type}-default)`;
      }}
      on:click={() => {
        if (!props.disabled && !isTouch) props.onClick?.(element);
      }}
    >
      <Switch>
        <Match when={typeof props.icon === "string"}>
          <span
            style={{
              "font-family": "var(--font-icon)",
              color: props.iconColors,
              "user-select": "none",
              ...props.iconStyle,
            }}
          >
            {props.icon}
          </span>
        </Match>
        <Match when={typeof props.icon === "object"}>{props.icon}</Match>
      </Switch>
      <Show when={props.label}>
        <span style={{ "user-select": "none" }}>{props.label}</span>
      </Show>
    </button>
  );
};
