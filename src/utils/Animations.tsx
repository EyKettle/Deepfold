import { animate, animateMini } from "motion";

export const animations = {
  slideIn: (element: HTMLElement) => {
    let elements = element.children;
    const Delta = 0.02;
    if (elements) {
      for (let i = 0; i < elements.length; i++) {
        animate(
          elements[i],
          {
            scale: [0.1, 1],
          },
          {
            duration: 0.3 + i * Delta,
            ease: [0.5, 0, 0, 1],
          }
        );
        animate(
          elements[i],
          {
            x: [-240, 0],
          },
          {
            duration: 0.3 + i * Delta,
            ease: [0.5, 0, 0, 1],
          }
        );
        animate(
          elements[i],
          {
            y: [-640, 0],
          },
          {
            duration: 0.3 + i * Delta,
            ease: [0, 0, 0, 1],
          }
        );
      }
    }
  },
};

export const textAnimations = {
  errorFlash: (element: HTMLElement) => {
    animateMini(
      element,
      {
        color: ["unset", "red", "unset"],
      },
      {
        duration: 0.8,
        ease: [0, 0, 0, 1],
      }
    );
  },
};
