import { Component, createSignal, Show } from "solid-js";
import Code from "../components/code";
import { Button } from "../components/button";
import Blocker from "../components/blocker";
import { Icons, svgIcon } from "../components/svgIcon";
import { buttonSize, roundButton } from "../components/utils";

interface StreamLogProps {
  ref: (element: HTMLDivElement) => void;
  children: string[];
  operations: {
    close: () => void;
  };
}

const StreamLog: Component<StreamLogProps> = (props) => {
  const [currentIndex, setIndex] = createSignal(0);
  const [disablePrev, setPrev] = createSignal(true);
  const [disableNext, setNext] = createSignal(false);
  const handleSwitch = (isNext: boolean) => {
    let current = currentIndex();
    const value = current + (isNext ? 1 : -1);
    if (value < 0 || value >= props.children.length) return;
    setIndex(value);
    if (value === 0) setPrev(true);
    else setPrev(false);
    if (value === props.children.length - 1) setNext(true);
    else setNext(false);
  };

  return (
    <>
      <Blocker
        style={{
          position: "absolute",
          inset: "-8px",
        }}
        onClick={props.operations.close}
      />
      <div
        ref={props.ref}
        style={{
          position: "absolute",
          height: "calc(100vh - 12rem)",
          width: "calc(100vw - 2rem)",
          top: "0",
          translate: "0 2rem",
          "max-width": "31rem",
          "box-sizing": "border-box",
          border: "1px solid var(--color-border-default)",
          "background-color": "var(--color-surface-glass)",
          "box-shadow": "0 16px 32px var(--color-shadow)",
          "border-radius": "1rem",
          overflow: "hidden",
        }}
      >
        <pre
          style={{
            padding: "0.5rem",
            margin: 0,
            overflow: "scroll",
            height: "100%",
            width: "100%",
            "min-height": "16rem",
            "max-width": "31rem",
            "box-sizing": "border-box",
            "white-space": "pre-wrap",
            "text-align": "start",
            display: "grid",
            "place-items": "center",
            "grid-template":
              '"title title title" 1.5rem\n"code code code" 1fr\n"prev blank next" auto / auto 1fr auto',
            "row-gap": "0.5rem",
          }}
        >
          <span
            style={{
              "grid-area": "title",
              "font-size": "1.125rem",
              "text-align": "center",
              "user-select": "none",
              translate: "0 -1px",
            }}
          >
            查询最新 Streaming
          </span>
          <Show
            when={props.children.length > 0}
            fallback={
              <span
                style={{
                  "grid-area": "code",
                  height: "100%",
                  width: "100%",
                  display: "grid",
                  "place-items": "center",
                  "user-select": "none",
                  color: "var(--color-theme-text-secondary)",
                }}
              >
                没有数据
              </span>
            }
          >
            <Code
              language="json"
              raw={props.children[currentIndex()]}
              style={{
                "box-sizing": "border-box",
                padding: "1rem",
                overflow: "scroll",
                "grid-area": "code",
                height: "100%",
                width: "100%",
                "border-radius": "0.5rem",
                "background-color": "var(--color-surface-glass)",
              }}
            />
            <Button
              disabled={disablePrev()}
              icon={svgIcon(Icons.Prev, 20)}
              type="ghost"
              style={{
                ...buttonSize("medium"),
                ...roundButton(),
                padding: "1rem",
                "grid-area": "prev",
                opacity: disablePrev() ? "0.4" : "1",
                "background-color": disablePrev()
                  ? "transparent"
                  : "transparent",
              }}
              onClick={() => handleSwitch(false)}
            />
            <label
              style={{
                "grid-area": "blank",
                "user-select": "none",
              }}
            >
              {currentIndex() + 1 + "/" + props.children.length}
            </label>
            <Button
              disabled={disableNext()}
              icon={svgIcon(Icons.Next, 20)}
              type="ghost"
              style={{
                ...buttonSize("medium"),
                ...roundButton(),
                padding: "1rem",
                "grid-area": "next",
                opacity: disableNext() ? "0.4" : "1",
                "background-color": disableNext()
                  ? "transparent"
                  : "transparent",
              }}
              onClick={() => handleSwitch(true)}
            />
          </Show>
        </pre>
      </div>
    </>
  );
};

export default StreamLog;
