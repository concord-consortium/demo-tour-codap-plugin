import React, { useEffect, useRef, useState } from "react";
import { codapInterface } from "@concord-consortium/codap-plugin-api";
import { ExampleProps } from "./types";

type Phase = "idle" | "waiting" | "created";

export const Example3ReactiveWorkflow: React.FC<ExampleProps> = ({ addNotification, setNotificationHandler }) => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [newTableId, setNewTableId] = useState<string | null>(null);
  const phaseRef = useRef<Phase>("idle");

  useEffect(() => {
    setNotificationHandler((notice: any) => {
      // Listen for component creation
      if (phaseRef.current === "waiting" &&
          notice.resource === "component" &&
          notice.values?.operation === "create" &&
          notice.values?.type === "caseTable") {
        const tableId = String(notice.values.id);
        setNewTableId(tableId);
        phaseRef.current = "created";
        setPhase("created");
        addNotification(`Table created! Component ID: ${tableId}`);

        // Clear the toolbar highlight
        codapInterface.sendRequest({
          action: "notify", resource: "interactiveFrame",
          values: { request: "clearHighlight" }
        });

        // Highlight the new table
        codapInterface.sendRequest({
          action: "notify", resource: "interactiveFrame",
          values: {
            request: "highlight",
            component: tableId,
            popover: {
              title: "Your New Table",
              description: "Great! This is your case table. You can type data directly into it.",
              side: "right"
            }
          }
        });
      }

      // Log highlight notifications
      if (notice.values?.operation === "highlightUpdate") {
        addNotification(`highlightUpdate: ${notice.values.type}`);
      }
    });
    return () => setNotificationHandler(null);
  }, [addNotification, setNotificationHandler]);

  const handleStart = async () => {
    phaseRef.current = "waiting";
    setPhase("waiting");
    setNewTableId(null);
    addNotification("Waiting for table creation...");

    // Highlight the Tables button
    await codapInterface.sendRequest({
      action: "notify", resource: "interactiveFrame",
      values: {
        request: "highlight",
        tourKey: "toolShelf.table",
        popover: {
          title: "Click here",
          description: "Click this button to create a new case table."
        }
      }
    });
  };

  const handleReset = () => {
    codapInterface.sendRequest({
      action: "notify", resource: "interactiveFrame",
      values: { request: "clearHighlight" }
    });
    phaseRef.current = "idle";
    setPhase("idle");
    setNewTableId(null);
    addNotification("Reset.");
  };

  return (
    <div>
      <h2>Example 3: Reactive Workflow</h2>
      <p>
        Highlights the Tables button and asks you to click it. When CODAP notifies
        the plugin that a table was created, the plugin highlights the new table.
      </p>
      <div className="button-row">
        <button className="primary" onClick={handleStart} disabled={phase === "waiting"}>
          Start
        </button>
        {phase !== "idle" && <button onClick={handleReset}>Reset</button>}
      </div>
      {phase === "waiting" && (
        <div className="instruction">
          Click the Tables button in the CODAP toolbar to create a new table.
        </div>
      )}
      {phase === "created" && (
        <div className="status">
          Table created (ID: <strong>{newTableId}</strong>). The new table is highlighted.
        </div>
      )}
    </div>
  );
};
