import { animate } from "motion/mini";
import { AnimationPlaybackControls } from "motion/react";

export interface PageWrapper {
  id: string;
  title: string;
  position: [number, number];
  defaultStyle?: any;
  content?: any;
}

export class PageManager {
  private pages: {
    id: string;
    position: [number, number];
    defaultStyle?: any;
  }[];
  private animations: AnimationPlaybackControls[] = [];

  constructor(children: PageWrapper[]) {
    this.pages = children.map((child) => {
      return {
        id: child.id,
        position: child.position,
        defaultStyle: child.defaultStyle,
      };
    });
  }

  private calcMotion(targetIndex: number, prevIndex: number) {
    let isDefaultExist = this.pages[targetIndex].defaultStyle !== undefined;
    const initialStyle = {
      translate: isDefaultExist
        ? this.pages[targetIndex].defaultStyle.translate
        : `0 0`,
      scale: isDefaultExist ? this.pages[targetIndex].defaultStyle.scale : 1,
    };

    const targetMotion = {
      opacity: 1,
      filter: "blur(0px)",
      translate: `0 0`,
      scale: 1,
    };

    const prevMotion = {
      ...(this.pages[prevIndex].defaultStyle ?? {
        opacity: 0,
        filter: "blur(16px)",
        translate: `0 0`,
        scale: 0,
      }),
    };

    isDefaultExist = this.pages[prevIndex].defaultStyle !== undefined;
    const targetY = this.pages[targetIndex].position[1];
    const prevY = this.pages[prevIndex].position[1];
    if (targetY !== prevY) {
      if (targetY > prevY) {
        initialStyle.scale = 0.8;
        if (!isDefaultExist) prevMotion.scale = 1.4;
      } else {
        initialStyle.scale = 1.4;
        if (!isDefaultExist) prevMotion.scale = 0.8;
      }
    }

    const targetX = this.pages[targetIndex].position[0];
    const prevX = this.pages[prevIndex].position[0];
    if (targetX !== prevX) {
      if (targetX > prevX) {
        initialStyle.translate = `100% 0`;
        if (!isDefaultExist) prevMotion.translate = `-100% 0`;
      } else {
        initialStyle.translate = `-100% 0`;
        if (!isDefaultExist) prevMotion.translate = `100% 0`;
      }
    }

    const element = document.getElementById(this.pages[targetIndex].id);
    if (element) {
      element.style.transform = `translate(${initialStyle.translate}) scale(${initialStyle.scale})`;
    }
    return {
      target: targetMotion,
      prev: prevMotion,
    };
  }

  private checkTransition(transition?: any) {
    return (
      transition ?? {
        duration: 0.25,
        ease: [0.1, 0, 0, 1],
      }
    );
  }

  animate(index: number | string, motion: any, transition?: any) {
    const elementId = typeof index === "string" ? index : this.pages[index].id;
    const element = document.getElementById(elementId);
    const transitionConfig = this.checkTransition(transition);
    if (element) {
      animate(element, motion, transitionConfig);
    } else {
      console.warn(`Element with id ${elementId} not found`);
    }
  }

  switch(targetIndex: number, prevIndex: number, transition?: any) {
    this.animations.forEach((animation) => {
      animation.stop();
    });
    this.animations = [];

    const transitionConfig = this.checkTransition(transition);

    if (targetIndex === prevIndex) {
      const element = document.getElementById(this.pages[targetIndex].id);
      if (element) {
        const animation = animate(
          element,
          {
            opacity: 1,
            filter: "blur(0px)",
            translate: `0 0`,
            scale: 1,
          },
          {
            duration: 0.25,
            ease: [0.1, 0, 0, 1],
          }
        );
        this.animations.push(animation);
      }
      return;
    }

    const prevElement = document.getElementById(this.pages[prevIndex].id);
    const targetElement = document.getElementById(this.pages[targetIndex].id);
    const motions = this.calcMotion(targetIndex, prevIndex);

    if (prevElement) {
      prevElement.classList.add("leave");
      const prevAnimation = animate(
        prevElement,
        motions.prev,
        transitionConfig
      );
      this.animations.push(prevAnimation);
    }
    if (targetElement) {
      targetElement.classList.remove("leave");
      const targetAnimation = animate(
        targetElement,
        motions.target,
        transitionConfig
      );
      this.animations.push(targetAnimation);
    }
  }
}
