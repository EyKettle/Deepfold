import { Component, createSignal, JSX, onCleanup, Show } from "solid-js";

export type ScrollBarController = {
  set: (position?: number, length?: number, viewLen?: number) => void;
  add: (offset: number) => void;
};

interface ScrollBarProps {
  controllerRef?: (controller: ScrollBarController) => void;
  ref?: (track: HTMLDivElement, thumb: HTMLDivElement) => void;
  onScroll?: (scrollTop: number) => void;
  class?: string;
  style?: JSX.CSSProperties;
  thumbClass?: string;
  thumbStyle?: JSX.CSSProperties;
}

const ScrollBar: Component<ScrollBarProps> = (props) => {
  const [position, setPosition] = createSignal(0);
  const [length, setLength] = createSignal(0);
  const [viewLen, setViewLen] = createSignal(0);

  if (props.controllerRef) {
    const controller = {
      set(position?: number, length?: number, viewLen?: number) {
        requestAnimationFrame(() => {
          if (position) setPosition(position);
          if (length) setLength(length);
          if (viewLen) setViewLen(viewLen);
        });
      },
      add(offset: number) {
        setPosition((prev) => prev + offset);
      },
    };
    props.controllerRef(controller);
  }

  let track: HTMLDivElement | undefined;
  let thumb: HTMLDivElement;
  let hover = false;
  let drag = false;
  let trackRect: DOMRect | undefined;
  let thumbHead: number | undefined;
  let thumbRect: DOMRect | undefined;
  const mask = document.createElement("div");
  mask.style.position = "absolute";
  mask.style.inset = "0";
  mask.style.userSelect = "none";
  const maskMoving = (e: MouseEvent) => {
    requestAnimationFrame(() => {
      if (e.button === 0 && track && trackRect && thumbRect) {
        const deltaY = e.y - trackRect.y;
        let y = Math.floor(deltaY) - (thumbHead ?? 0);
        const max = trackRect.height - thumbRect.height;
        if (y < 0) y = 0;
        if (y > max) y = max;
        setPosition((y / trackRect.height) * length());
        props.onScroll?.(position());
      }
    });
  };
  const maskDispose = (e: MouseEvent) => {
    if (e.button === 0 && thumbRect && trackRect) {
      if (e.x < thumbRect.left || e.x > thumbRect.right) {
        if (track && e.x < trackRect.left) thumb.style.width = "2px";
        thumb.style.backgroundColor = "var(--color-scrollbar-thumb)";
      }
      trackRect = undefined;
      thumbRect = undefined;
      thumbHead = undefined;
      drag = false;
      document.documentElement.removeChild(mask);
    }
  };
  const overDispose = () => {
    if (!drag) return;
    thumb.style.width = "2px";
    thumb.style.backgroundColor = "var(--color-scrollbar-thumb)";
    trackRect = undefined;
    thumbRect = undefined;
    thumbHead = undefined;
    drag = false;
    document.documentElement.removeChild(mask);
  };
  mask.addEventListener("mousemove", maskMoving);
  mask.addEventListener("mouseup", maskDispose);
  window.addEventListener("mouseup", maskDispose);
  window.addEventListener("blur", overDispose);
  onCleanup(() => {
    mask.removeEventListener("mousemove", maskMoving);
    mask.removeEventListener("mouseup", maskDispose);
    window.removeEventListener("mouseup", maskDispose);
    window.removeEventListener("blur", overDispose);
  });
  return (
    <Show when={length() > viewLen()}>
      <div
        ref={(e) => (track = e)}
        class={props.class}
        style={{
          display: "grid",
          "justify-content": "right",
          position: "absolute",
          width: "16px",
          ...props.style,
        }}
        on:mouseenter={(e) => {
          (e.currentTarget.firstElementChild as HTMLDivElement).style.width =
            "7px";
          hover = true;
        }}
        on:mouseleave={(e) => {
          if (!drag)
            (e.currentTarget.firstElementChild as HTMLDivElement).style.width =
              "2px";
          hover = false;
        }}
        on:wheel={(e) => {
          let y = position() + e.deltaY;
          const max = length() - viewLen();
          if (y < 0) y = 0;
          if (y > max) y = max;
          setPosition(y);
          props.onScroll?.(position());
        }}
      >
        <div
          ref={(e) => {
            thumb = e;
            props.ref?.(e.parentElement as HTMLDivElement, e);
          }}
          class={props.thumbClass}
          style={{
            translate:
              "0 " +
              Math.floor(
                (position() / length()) *
                  (track?.getBoundingClientRect().height ?? 0)
              ) +
              "px",
            height: (viewLen() * 100) / length() + "%",
            width: drag || hover ? "7px" : "2px",
            "border-radius": "6px",
            "background-color": "var(--color-scrollbar-thumb)",
            transition: "width 0.2s, background-color 0.15s",
            ...props.thumbStyle,
          }}
          on:mouseenter={() =>
            (thumb.style.backgroundColor = "var(--color-scrollbar-thumb-hover)")
          }
          on:mouseleave={() => {
            if (!drag)
              thumb.style.backgroundColor = "var(--color-scrollbar-thumb)";
          }}
          on:mousedown={(e) => {
            if (e.button === 0) {
              thumb.style.backgroundColor =
                "var(--color-scrollbar-thumb-active)";
              trackRect = track?.getBoundingClientRect();
              thumbRect = thumb.getBoundingClientRect();
              thumbHead = e.y - thumbRect.y;
              drag = true;
              document.documentElement.appendChild(mask);
            }
          }}
        />
      </div>
    </Show>
  );
};

export default ScrollBar;
