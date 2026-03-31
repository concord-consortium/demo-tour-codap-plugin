import React, { useEffect, useState } from "react";
import { codapInterface } from "@concord-consortium/codap-plugin-api";
import { ExampleProps } from "./types";

export const Example6HighlightNoOverlay: React.FC<ExampleProps> = ({ addNotification, setNotificationHandler }) => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setNotificationHandler((notice: any) => {
      if (notice.values?.operation === "highlightUpdate") {
        addNotification(`highlightUpdate: ${notice.values.type} — ${notice.values.tourKey || ""}`);
        if (notice.values.type === "highlightCleared") {
          setActive(false);
        }
      }
    });
    return () => setNotificationHandler(null);
  }, [addNotification, setNotificationHandler]);

  const handleHighlight = async () => {
    await codapInterface.sendRequest({
      action: "notify", resource: "interactiveFrame",
      values: {
        request: "highlight",
        tourKey: "toolShelf.graph",
        overlayOpacity: 0,
        popover: {
          title: "Try it!",
          description: "Go ahead and click this button to create a graph.",
          side: "bottom"
        }
      }
    });
    setActive(true);
    addNotification("Highlight shown (no overlay).");
  };

  const handleClear = () => {
    codapInterface.sendRequest({
      action: "notify", resource: "interactiveFrame",
      values: { request: "clearHighlight" }
    });
    setActive(false);
    addNotification("Highlight cleared.");
  };

  return (
    <div>
      <h2>Example 6: Highlight Without Overlay</h2>
      <p>
        Uses <code>overlayOpacity: 0</code> to highlight an element without dimming
        the rest of the interface. Students can interact with CODAP while the
        highlight is visible.
      </p>
      <div className="button-row">
        <button className="primary" onClick={handleHighlight} disabled={active}>
          Highlight Graph Button
        </button>
        {active && <button onClick={handleClear}>Clear Highlight</button>}
      </div>
      {active && (
        <div className="status">
          Highlight active — go ahead and click the Graph button in CODAP!
        </div>
      )}
    </div>
  );
};
