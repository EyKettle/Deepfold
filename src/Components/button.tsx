import {
  type Component,
  createEffect,
  createSignal,
  For,
  JSX,
  onCleanup,
  onMount,
  Show,
} from "solid-js";

interface ButtonProps {
  icon?: string;
  iconColors?: string[];
  label?: string;
  type?: "button" | "ghost";
  rounded?: boolean;
  size?: "small" | "medium" | "large";
  color?: string;
  backgroundColor?: {
    default: string;
    hover: string;
    active: string;
  };
  borderRadius?: string;
  style?: JSX.CSSProperties;
  iconStyle?: JSX.CSSProperties[];
  disabled?: boolean;
  onClick?: () => void;
  getAnimates?: (press: () => void, release: () => void) => void;
}

export const Button: Component<ButtonProps> = (props) => {
  let element: HTMLButtonElement | null = null;
  let isTouch = false;

  const [defaultStyle, setDefaultStyle] = createSignal({
    fontSize: "1.05rem",
  });

  const onEnterDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !props.disabled && element) {
      e.preventDefault();
      element.style.scale = "0.95";
    }
  };
  const onEnterUp = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !props.disabled && element) {
      element.style.scale = "1";
      props.onClick?.();
    }
  };

  const applyMousedown = () => {
    if (element)
      element.style.backgroundColor = `var(--color-${props.type}-active)`;
  };
  const applyMouseup = () => {
    if (element)
      element.style.backgroundColor = `var(--color-${props.type}-default)`;
  };
  if (props.getAnimates) props.getAnimates(applyMousedown, applyMouseup);

  createEffect(() => {
    if (!element) return;
    if (props.disabled) {
      element.tabIndex = -1;
    } else {
      element.tabIndex = 0;
    }
  });

  onMount(() => {
    if (!element) {
      console.warn("Button element just disappeared?");
      return;
    }
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

    if (props.borderRadius) {
      element.style.borderRadius = props.borderRadius;
    } else if (props.rounded) element.style.borderRadius = "50%";
    if (props.size) {
      switch (props.size) {
        case "medium":
          element.style.minHeight = element.style.minWidth = "3rem";
          element.style.padding = "1rem";
          setDefaultStyle({ fontSize: "1.25rem" });
          if (props.rounded || props.borderRadius) break;
          element.style.borderRadius = "0.75rem";
          break;
        case "large":
          element.style.minHeight = element.style.minWidth = "3.5rem";
          element.style.padding = "1.5rem";
          setDefaultStyle({ fontSize: "1.75rem" });
          if (props.rounded || props.borderRadius) break;
          element.style.borderRadius = "1.25rem";
          break;
      }
    } else {
      element.style.padding = "0.75rem";
      if (!props.rounded && !props.borderRadius) {
        element.style.borderRadius = "0.5rem";
      }
    }

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
      style={{
        display: "flex",
        "flex-shrink": 0,
        "flex-direction": "row",
        "justify-content": "center",
        "align-items": "center",
        "line-height": "1",
        "min-height": "2.5rem",
        "min-width": "2.5rem",
        "font-size": defaultStyle().fontSize,
        "transition-property": "background-color, scale",
        "transition-duration": "0.3s",
        "transition-timing-function": "cubic-bezier(0, 0, 0, 1)",
        "will-change": "scale",
        cursor: "pointer",
        ...props.style,
      }}
      on:mouseenter={(e) => {
        if (!props.disabled && !isTouch)
          e.currentTarget.style.backgroundColor = `var(--color-${props.type}-hover)`;
      }}
      on:mouseleave={(e) => {
        if (!props.disabled && !isTouch)
          e.currentTarget.style.backgroundColor = `var(--color-${props.type}-default)`;
      }}
      on:mousedown={(e) => {
        if (!props.disabled && !isTouch && e.button === 0) applyMousedown();
      }}
      on:mouseup={(e) => {
        if (isTouch) {
          isTouch = false;
          return;
        }
        if (!props.disabled && e.button === 0) applyMouseup();
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
        if (!props.disabled && !isTouch) props.onClick?.();
      }}
    >
      <Show when={props.icon}>
        <div
          style={{
            "white-space": "nowrap",
            width: defaultStyle().fontSize,
            height: defaultStyle().fontSize,
          }}
        >
          <For each={Array.from(props.icon ?? "")}>
            {(char, index) => (
              <span
                style={{
                  position: "absolute",
                  "inset-block": 0,
                  "font-family": "var(--font-icon)",
                  zoom: index() === 0 ? 0.95 : 1,
                  color: props.iconColors ? props.iconColors[index()] : "unset",
                  ...props.iconStyle?.at(index()),
                }}
              >
                {char}
              </span>
            )}
          </For>
        </div>
      </Show>
      <Show when={props.label}>
        <span
          style={{
            "margin-inline": parseFloat(defaultStyle().fontSize) / 4 + "rem",
          }}
        >
          {props.label}
        </span>
      </Show>
    </button>
  );
};
