import {
  Component,
  createEffect,
  JSX,
  onCleanup,
  onMount,
  Show,
} from "solid-js";

type Effect = "none" | "float" | "3d" | "all";
const EFFECT_MAP = {
  valid: new Set<Effect>(["none", "float", "3d", "all"]),
  rotate: new Set<Effect>(["all", "3d"]),
  float: new Set<Effect>(["all", "float"]),
};

interface CardProps {
  title?: string;
  description?: string;
  children?: any;
  effect?: Effect;
  textAlign?: string;
  textJustify?: string;
  height?: string;
  width?: string;
  disableShadow?: boolean;
  style?: JSX.CSSProperties;
  disabled?: boolean;
  interactType?: "hover" | "click";
  onClick?: () => boolean;
}

export const Card: Component<CardProps> = (props) => {
  if (!props.interactType) props.interactType = "click";

  let isTouch = false;

  let pressColor = "var(--color-surface-active)";
  const getTextStyle = (size: string) => {
    return {
      "font-size": `${size}rem`,
      "text-align": "start",
      "text-overflow": "ellipsis",
      "white-space": "nowrap",
      overflow: "hidden",
      width: "100%",
      "pointer-events": "none",
    } as JSX.CSSProperties;
  };

  const resetStyle = () => {
    requestAnimationFrame(() => {
      if (!appearanceDiv) return;
      appearanceDiv.style.scale = "1";
      if (shadowBox) {
        shadowBox.style.translate = "0 0.0625rem";
        shadowBox.style.filter = "blur(0.0625rem)";
        shadowBox.style.opacity = "0.6";
        shadowBox.style.scale = "1";
      }
      appearanceDiv.style.borderColor = "var(--color-border-default)";
      appearanceDiv.parentElement!.style.zIndex = "1";
      appearanceDiv.style.backgroundColor = "var(--color-surface-light)";
      if (EFFECT_MAP.rotate.has(props.effect ?? "none")) {
        appearanceDiv.style.transformOrigin = "center";
        appearanceDiv.style.transform = "";
      }
    });
  };

  let appearanceDiv: HTMLDivElement | null = null;
  let shadowBox: HTMLDivElement | null = null;
  onMount(() => {
    if (!appearanceDiv) {
      console.warn("Element not found");
      return;
    }

    const parent = appearanceDiv.parentElement!.parentElement;
    if (!parent) return;

    if (parent.hasAttribute("card-text-wrap")) {
      if (props.title && props.description)
        (appearanceDiv.children[1] as HTMLDivElement).style.whiteSpace =
          "normal";
      else if (props.description)
        (appearanceDiv.children[0] as HTMLDivElement).style.whiteSpace =
          "normal";
    }
    if (props.textAlign) appearanceDiv.style.alignItems = props.textAlign;
    else if (parent.hasAttribute("card-text-align")) {
      appearanceDiv.style.alignItems =
        parent.getAttribute("card-text-align") || "center";
    }
    if (props.textJustify)
      appearanceDiv.style.justifyContent = props.textJustify;
    else if (parent.hasAttribute("card-text-justify")) {
      appearanceDiv.style.justifyContent =
        parent.getAttribute("card-text-justify") || "center";
    }
    if (props.height) appearanceDiv.parentElement!.style.height = props.height;
    else if (parent.hasAttribute("card-height")) {
      appearanceDiv.parentElement!.style.height =
        parent.getAttribute("card-height") || "auto";
    }
    if (props.width) appearanceDiv.parentElement!.style.width = props.width;
    else if (parent.hasAttribute("card-width")) {
      appearanceDiv.parentElement!.style.width =
        parent.getAttribute("card-width") || "auto";
    }
    if (!props.effect) {
      if (parent.hasAttribute("card-effect")) {
        const value = parent.getAttribute("card-effect");
        props.effect =
          value && EFFECT_MAP.valid.has(value as Effect)
            ? (value as Effect)
            : "all";
      } else props.effect = "float";
    }
    switch (props.effect) {
      case "all":
        appearanceDiv.parentElement!.style.touchAction = "none";
        pressColor = "var(--color-surface-light)";
        break;
      case "3d":
        pressColor = "var(--color-surface-pressed)";
        break;
    }
  });

  const rotateDelta = 10;
  let remValue: number;
  let isFrameScheduled = false;
  const handleRotate = (
    element: HTMLDivElement,
    clientX: number,
    clientY: number
  ) => {
    if (isFrameScheduled) return;
    isFrameScheduled = true;
    requestAnimationFrame(() => {
      const rect = element.getBoundingClientRect();
      const offsetX = clientX - rect.left;
      const offsetY = clientY - rect.top;
      const halfWidth = rect.width / 2;
      const halfHeight = rect.height / 2;
      const rotateY =
        ((offsetX - halfWidth) / halfWidth) *
        rotateDelta *
        (props.effect === "all" ? 1.5 : 1);
      const rotateX =
        ((offsetY - halfHeight) / halfHeight) *
        rotateDelta *
        -1 *
        (props.effect === "all" ? 1.5 : 1);
      element.style.transform = `perspective(64rem) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
      isFrameScheduled = false;
      if (props.effect === "all") {
        if (!shadowBox) return;
        const rotateYRad = (rotateY * Math.PI) / 180;
        const rotateXRad = (rotateX * Math.PI) / 180;
        const scaleX = Math.abs(Math.cos(rotateYRad));
        const scaleY = Math.abs(Math.cos(rotateXRad));
        shadowBox.style.scale = `${scaleX} ${scaleY}`;
      }
    });
  };

  const onEnterDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !props.disabled && appearanceDiv?.parentElement)
      appearanceDiv.parentElement.style.scale = "0.95";
  };
  const onEnterUp = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !props.disabled && appearanceDiv?.parentElement) {
      appearanceDiv.parentElement.style.scale = "1";
      props.onClick?.();
    }
  };

  createEffect(() => {
    if (!appearanceDiv?.parentElement) return;
    if (props.disabled) {
      appearanceDiv.parentElement.tabIndex = -1;
    } else {
      appearanceDiv.parentElement.tabIndex = 0;
    }
  });

  onMount(() => {
    if (!appearanceDiv?.parentElement) return;
    remValue = parseFloat(getComputedStyle(document.documentElement).fontSize);

    appearanceDiv.parentElement.addEventListener("keydown", onEnterDown);
    appearanceDiv.parentElement.addEventListener("keyup", onEnterUp);
  });

  onCleanup(() => {
    if (!appearanceDiv?.parentElement) return;
    appearanceDiv.parentElement.removeEventListener("keydown", onEnterDown);
    appearanceDiv.parentElement.removeEventListener("keyup", onEnterUp);
  });

  return (
    <div
      style={{
        display: "flex",
        "flex-shrink": "0",
        "z-index": "1",
        height: "fit-content",
        width: "fit-content",
        "border-radius": "1rem",
        transition: "scale 0.15s cubic-bezier(0.2, 0, 0, 1)",
        "will-change": "scale",
        cursor: props.disabled ? "unset" : "pointer",
        "user-select": "none",
        "-webkit-user-select": "none",
        "-moz-user-select": "none",
      }}
      on:mouseenter={() => {
        if (props.disabled || isTouch || !appearanceDiv) return;
        if (props.effect && EFFECT_MAP.float.has(props.effect)) {
          appearanceDiv.style.scale = "1.1";
          if (!shadowBox) return;
          shadowBox.style.translate = "0 0.625rem";
          shadowBox.style.filter = "blur(0.25rem)";
        }
        appearanceDiv.style.borderColor = "var(--color-border-active)";
        appearanceDiv.parentElement!.style.zIndex = "2";
        appearanceDiv.style.backgroundColor = "var(--color-surface-hover)";
      }}
      on:mouseleave={() => {
        if (!props.disabled && !isTouch) resetStyle();
      }}
      on:mousedown={(e) => {
        if (
          props.disabled ||
          props.interactType === "hover" ||
          isTouch ||
          !appearanceDiv
        )
          return;
        if (e.button === 0) {
          appearanceDiv.style.backgroundColor = pressColor;
          if (props.effect && props.effect !== "none") {
            if (EFFECT_MAP.rotate.has(props.effect)) {
              handleRotate(appearanceDiv, e.clientX, e.clientY);
              if (props.effect === "3d") {
                appearanceDiv.style.scale = "0.95";
                if (!shadowBox) return;
                shadowBox.style.opacity = "0";
                shadowBox.style.scale = "0.95";
              }
            }
            if (EFFECT_MAP.float.has(props.effect)) {
              appearanceDiv.style.scale = "1.05";
              if (!shadowBox) return;
              shadowBox.style.translate = "0 0.375rem";
              shadowBox.style.filter = "blur(0.125rem)";
            }
          }
        }
      }}
      on:mouseup={(e) => {
        if (isTouch) {
          isTouch = false;
          return;
        }
        if (props.disabled || props.interactType === "hover" || !appearanceDiv)
          return;
        if (e.button === 0) {
          appearanceDiv.style.backgroundColor = "var(--color-surface-hover)";
          if (props.effect && props.effect !== "none") {
            if (EFFECT_MAP.rotate.has(props.effect)) {
              appearanceDiv.style.transform = "";
              if (props.effect === "3d") {
                appearanceDiv.style.scale = "1";
                if (!shadowBox) return;
                shadowBox.style.opacity = "0.6";
                shadowBox.style.scale = "1";
              }
            }
            if (EFFECT_MAP.float.has(props.effect)) {
              appearanceDiv.style.scale = "1.1";
              if (!shadowBox) return;
              shadowBox.style.translate = "0 0.625rem";
              shadowBox.style.filter = "blur(0.25rem)";
            }
          }
        }
      }}
      on:mousemove={(e) => {
        if (
          props.disabled ||
          props.interactType === "hover" ||
          isTouch ||
          !appearanceDiv
        )
          return;
        if (e.buttons === 1) {
          if (props.effect === "all") {
            handleRotate(appearanceDiv, e.clientX, e.clientY);
            appearanceDiv.style.backgroundColor = pressColor;
            appearanceDiv.style.scale = "1.05";
            if (!shadowBox) return;
            shadowBox.style.translate = "0 0.375rem";
            shadowBox.style.filter = "blur(0.125rem)";
          }
        }
      }}
      on:touchstart={(e) => {
        isTouch = true;
        if (props.disabled || props.interactType === "hover" || !appearanceDiv)
          return;
        if (props.effect !== "3d") {
          appearanceDiv.style.borderColor = "var(--color-border-active)";
        }
        if (props.effect) {
          if (props.effect === "none") {
            appearanceDiv.style.backgroundColor = "var(--color-surface-hover)";
            return;
          }
          if (EFFECT_MAP.rotate.has(props.effect)) {
            handleRotate(
              appearanceDiv,
              e.touches[0].clientX,
              e.touches[0].clientY
            );
            if (props.effect === "3d") {
              appearanceDiv.style.backgroundColor = pressColor;
              appearanceDiv.style.scale = "0.95";
              if (!shadowBox) return;
              shadowBox.style.opacity = "0";
              shadowBox.style.scale = "0.95";
            }
          }
          if (EFFECT_MAP.float.has(props.effect)) {
            appearanceDiv.style.backgroundColor = "var(--color-surface-hover)";
            {
              appearanceDiv.style.scale = "1.05";
            }
          }
        }
      }}
      on:touchmove={(e) => {
        if (
          !props.disabled &&
          props.interactType === "click" &&
          appearanceDiv &&
          props.effect === "all"
        ) {
          const rect = appearanceDiv.getBoundingClientRect();
          if (
            e.touches[0].clientX >= rect.left - 3 * remValue &&
            e.touches[0].clientX <= rect.right + 3 * remValue &&
            e.touches[0].clientY >= rect.top - 3 * remValue &&
            e.touches[0].clientY <= rect.bottom + 3 * remValue
          ) {
            appearanceDiv.style.backgroundColor = "var(--color-surface-hover)";
            appearanceDiv.style.borderColor = "var(--color-border-active)";
            appearanceDiv.style.scale = "1.05";
            if (!shadowBox) return;
            shadowBox.style.translate = "0 0.375rem";
            shadowBox.style.filter = "blur(0.125rem)";
            handleRotate(
              appearanceDiv,
              e.touches[0].clientX,
              e.touches[0].clientY
            );
          } else resetStyle();
        }
      }}
      on:touchend={() => {
        if (!props.disabled && props.interactType === "click") {
          resetStyle();
        }
      }}
      on:blur={() => {
        if (!props.disabled && props.interactType === "click") resetStyle();
      }}
      on:click={() => {
        if (!props.disabled && !isTouch && props.onClick) {
          if (props.onClick()) resetStyle();
        }
      }}
    >
      <Show when={!props.disableShadow}>
        <div
          ref={(e) => (shadowBox = e)}
          style={{
            position: "absolute",
            inset: 0,
            "border-radius": "1rem",
            "background-color": "var(--color-shadow)",
            opacity: 0.6,
            translate: "0 0.0625rem",
            filter: "blur(0.0625rem)",
            transition: "all 0.15s cubic-bezier(0.2, 0, 0, 1)",
            "pointer-events": "none",
          }}
        />
      </Show>
      <div
        ref={(e) => (appearanceDiv = e)}
        style={{
          display: "flex",
          "flex-grow": 1,
          "flex-direction": "column",
          width: "100%",
          height: "100%",
          "box-sizing": "border-box",
          "justify-content": "center",
          "align-items": "center",
          "border-radius": "1rem",
          "background-color": "var(--color-surface-light)",
          "border-style": "solid",
          "border-color": "var(--color-border-default)",
          "border-width": "0.0625rem",
          padding: "1rem",
          "transition-property": "all",
          "transition-duration": "0.15s",
          "transition-timing-function": "cubic-bezier(0.2, 0, 0, 1)",
          "will-change": "transform",
          ...props.style,
        }}
      >
        <Show when={props.title}>
          {" "}
          <div style={getTextStyle("1.5")}>{props.title}</div>
        </Show>
        <Show when={props.description}>
          <div style={getTextStyle("1.2")}>{props.description}</div>
        </Show>
        <Show when={typeof props.children !== "boolean"}>{props.children}</Show>
      </div>
    </div>
  );
};
