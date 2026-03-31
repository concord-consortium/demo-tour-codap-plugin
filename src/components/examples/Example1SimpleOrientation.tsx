import React, { useCallback, useEffect, useRef, useState } from "react";
import { codapInterface } from "@concord-consortium/codap-plugin-api";
import { ExampleProps } from "./types";

const elementsToHighlight = ["toolShelf.graph", "toolShelf.table", "toolShelf.map"];

export const Example1SimpleOrientation: React.FC<ExampleProps> = ({ addNotification, setNotificationHandler }) => {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [running, setRunning] = useState(false);
  const currentIndexRef = useRef(-1);

  const highlightElement = useCallback((tourKey: string) => {
    codapInterface.sendRequest({
      action: "notify", resource: "interactiveFrame",
      values: { request: "highlight", tourKey }
    });
  }, []);

  useEffect(() => {
    setNotificationHandler((notice: any) => {
      if (notice.values?.operation === "highlightUpdate" &&
          notice.values?.type === "highlightCleared") {
        const nextIndex = currentIndexRef.current + 1;
        if (nextIndex < elementsToHighlight.length) {
          currentIndexRef.current = nextIndex;
          setCurrentIndex(nextIndex);
          highlightElement(elementsToHighlight[nextIndex]);
          addNotification(`Highlight cleared, advancing to: ${elementsToHighlight[nextIndex]}`);
        } else {
          currentIndexRef.current = -1;
          setCurrentIndex(-1);
          setRunning(false);
          addNotification("All elements highlighted. Orientation complete!");
        }
      } else if (notice.values?.operation === "highlightUpdate") {
        addNotification(`highlightUpdate: ${notice.values.type} — ${notice.values.tourKey || ""}`);
      }
    });
    return () => setNotificationHandler(null);
  }, [addNotification, setNotificationHandler, highlightElement]);

  const handleStart = () => {
    currentIndexRef.current = 0;
    setCurrentIndex(0);
    setRunning(true);
    highlightElement(elementsToHighlight[0]);
    addNotification(`Starting orientation: ${elementsToHighlight[0]}`);
  };

  const handleStop = () => {
    codapInterface.sendRequest({
      action: "notify", resource: "interactiveFrame",
      values: { request: "clearHighlight" }
    });
    currentIndexRef.current = -1;
    setCurrentIndex(-1);
    setRunning(false);
    addNotification("Orientation stopped.");
  };

  return (
    <div>
      <h2>Example 1: Simple UI Orientation</h2>
      <p>
        Highlights toolbar buttons one at a time. Dismiss each highlight (click overlay or press Escape)
        to advance to the next element.
      </p>
      <div className="button-row">
        <button className="primary" onClick={handleStart} disabled={running}>
          Start Orientation
        </button>
        {running && <button className="danger" onClick={handleStop}>Stop</button>}
      </div>
      {running && (
        <div className="status">
          Highlighting: <strong>{elementsToHighlight[currentIndex]}</strong>
          {" "}({currentIndex + 1} of {elementsToHighlight.length})
        </div>
      )}
    </div>
  );
};
