import { waapi } from "animejs";
import { Setter } from "solid-js";
import { easeNormal, easeShort } from "../utils/animations";

export const popup = async (
  signal: Setter<boolean>,
  getElements: () => {
    background: HTMLElement;
    startingElement: HTMLElement;
    targetElement: HTMLElement;
  },
  closeFn: (value: () => void) => void
) => {
  signal(false);
  const { background, startingElement, targetElement } = getElements();
  waapi.animate(background, {
    scale: 0.9,
    opacity: 0.6,
    filter: "blur(0.75rem)",
    ...easeNormal,
  });

  background.style.userSelect = "none";
  background.ariaDisabled = "true";
  background.style.pointerEvents = "none";
  startingElement.style.visibility = "hidden";
  const { y, height, width } = startingElement.getBoundingClientRect();
  const containerRect = background.getBoundingClientRect();
  const startY = y - containerRect.y;
  const isMaxSize = targetElement.getBoundingClientRect().width >= 496;
  waapi.animate(targetElement, {
    translate: [`0 ${startY}px`, "0 32px"],
    height: [height, "calc(100vh - 12rem)"],
    width: [width, isMaxSize ? 496 : "calc(100vw - 2rem)"],
    border: ["1px solid transparent", "1px solid var(--color-border-default)"],
    borderTopColor: ["var(--color-border-up)", ""],
    borderBottomColor: ["var(--color-border-down)", ""],
    borderTopWidth: ["0", "0.0625rem"],
    borderBottomWidth: ["0", "0.0625rem"],
    backgroundColor: [
      startingElement.style.backgroundColor,
      "var(--color-surface-glass)",
    ],
    borderRadius: ["0.5rem", "1rem"],
    boxShadow: ["0 0 0 var(--color-shadow)", "0 16px 32px var(--color-shadow)"],
    onComplete() {
      if (getComputedStyle(targetElement).borderRadius === "16px") {
        targetElement.style.height = "calc(100vh - 12rem)";
        targetElement.style.width = "calc(100vw - 2rem)";
      }
    },
    ...easeNormal,
  });
  waapi.animate(targetElement.children[0].children[1] as HTMLElement, {
    opacity: [0, 1],
    ...easeShort,
  });
  closeFn(() => {
    const { height, width } = startingElement.getBoundingClientRect();
    const rect = targetElement.getBoundingClientRect();
    waapi.animate(background, {
      scale: 1,
      opacity: 1,
      filter: "blur(0)",
      ...easeNormal,
    });
    waapi
      .animate(targetElement, {
        translate: `0 ${startY}px`,
        height: [
          rect.height,
          height / parseFloat(getComputedStyle(background).scale),
        ],
        width: [
          rect.width,
          width / parseFloat(getComputedStyle(background).scale),
        ],
        border: "1px solid transparent",
        borderTopColor: "var(--color-border-up)",
        borderBottomColor: "var(--color-border-down)",
        borderTopWidth: "0.0625rem",
        borderBottomWidth: "0.0625rem",
        backgroundColor: startingElement.style.backgroundColor,
        borderRadius: "0.5rem",
        boxShadow: "0 0 0 var(--color-shadow)",
        ...easeNormal,
      })
      .then(() => {
        signal(true);
        background.style.userSelect = "unset";
        background.ariaDisabled = "false";
        background.style.pointerEvents = "unset";
        startingElement.style.visibility = "visible";
      });
    waapi.animate(targetElement.children[0].children[1] as HTMLElement, {
      opacity: 0,
      ...easeNormal,
    });
  });
};
