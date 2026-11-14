import React, { useEffect, useRef, useState } from "react";
import { codapInterface } from "@concord-consortium/codap-plugin-api";
import { ExampleProps } from "./types";

type Phase = "idle" | "waiting" | "created";

const kTablesButtonTestId = "tool-shelf-button-table";

// CODAP reports a menu opening, by pointer or keyboard, as an `appear` on its trigger button.
export const isTablesMenuOpenedNotice = (notice: any) =>
  notice.resource === "uiNotificationNotice" &&
  notice.values?.eventType === "appear" &&
  notice.values?.target?.testId === kTablesButtonTestId;

export const isTableCreatedNotice = (notice: any) =>
  notice.resource === "component" &&
  notice.values?.operation === "create" &&
  notice.values?.diType === "caseTable";

// Watches the Tables menu so the handler can clear "Click here" before its popover covers the menu.
const watchTablesMenu = async () => {
  const result: any = await codapInterface.sendRequest({
    action: "notify", resource: "uiNotificationMonitor",
    values: { eventTypes: ["appear"], targets: [kTablesButtonTestId] }
  });
  return result?.success ? result.values?.id as number : undefined;
};

const deleteMonitor = (monitorId: number | undefined) => {
  if (monitorId == null) return;
  codapInterface.sendRequest({ action: "delete", resource: `uiNotificationMonitor[${monitorId}]` });
};

const unwatchTablesMenu = (monitorRef: React.MutableRefObject<number | undefined>) => {
  deleteMonitor(monitorRef.current);
  monitorRef.current = undefined;
};

// Each Start takes a new token; Reset and unmount advance it so a pending Start can tell it is stale.
const nextStartToken = (tokenRef: React.MutableRefObject<number>) => ++tokenRef.current;

export const Example3ReactiveWorkflow: React.FC<ExampleProps> = ({ addNotification, setNotificationHandler }) => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [newTableId, setNewTableId] = useState<string | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const menuMonitorRef = useRef<number | undefined>(undefined);
  const startTokenRef = useRef(0);

  useEffect(() => {
    setNotificationHandler((notice: any) => {
      if (phaseRef.current === "waiting" && isTablesMenuOpenedNotice(notice)) {
        addNotification("Tables menu opened.");
        codapInterface.sendRequest({
          action: "notify", resource: "interactiveFrame",
          values: { request: "clearHighlight" }
        });
      }

      // Listen for component creation
      if (phaseRef.current === "waiting" && isTableCreatedNotice(notice)) {
        const tableId = String(notice.values.id);
        setNewTableId(tableId);
        phaseRef.current = "created";
        setPhase("created");
        addNotification(`Table created! Component ID: ${tableId}`);
        unwatchTablesMenu(menuMonitorRef);

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
              side: "bottom",
              align: "start"
            }
          }
        });
      }

      // Log highlight notifications
      if (notice.values?.operation === "highlightUpdate") {
        addNotification(`highlightUpdate: ${notice.values.type}`);
      }
    });
    return () => {
      setNotificationHandler(null);
      nextStartToken(startTokenRef);
      unwatchTablesMenu(menuMonitorRef);
    };
  }, [addNotification, setNotificationHandler]);

  const handleStart = async () => {
    const startToken = nextStartToken(startTokenRef);
    phaseRef.current = "waiting";
    setPhase("waiting");
    setNewTableId(null);
    addNotification("Waiting for table creation...");

    unwatchTablesMenu(menuMonitorRef);
    const monitorId = await watchTablesMenu();
    if (startToken !== startTokenRef.current) {
      deleteMonitor(monitorId);
      return;
    }
    menuMonitorRef.current = monitorId;

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
    nextStartToken(startTokenRef);
    unwatchTablesMenu(menuMonitorRef);
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
