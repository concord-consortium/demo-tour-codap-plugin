import React, { useCallback, useEffect, useRef, useState } from "react";
import { codapInterface, initializePlugin } from "@concord-consortium/codap-plugin-api";
import { Example1SimpleOrientation } from "./examples/Example1SimpleOrientation";
import { Example2GuidedTour } from "./examples/Example2GuidedTour";
import { Example3ReactiveWorkflow } from "./examples/Example3ReactiveWorkflow";
import { Example4AutoAdvancingTutorial } from "./examples/Example4AutoAdvancingTutorial";
import { Example5LocalizedTour } from "./examples/Example5LocalizedTour";
import { Example6HighlightNoOverlay } from "./examples/Example6HighlightNoOverlay";
import "./App.css";

const kPluginName = "Tour API Demo";
const kVersion = "0.1.0";
const kInitialDimensions = { width: 380, height: 520 };

const examples = [
  { key: "1", label: "1 — Simple UI Orientation", Component: Example1SimpleOrientation },
  { key: "2", label: "2 — Guided Tour with Custom Text", Component: Example2GuidedTour },
  { key: "3", label: "3 — Reactive Workflow", Component: Example3ReactiveWorkflow },
  { key: "4", label: "4 — Auto-Advancing Tutorial", Component: Example4AutoAdvancingTutorial },
  { key: "5", label: "5 — Localized Tour", Component: Example5LocalizedTour },
  { key: "6", label: "6 — Highlight Without Overlay", Component: Example6HighlightNoOverlay },
];

export const App = () => {
  const [selectedExample, setSelectedExample] = useState("");
  const [notifications, setNotifications] = useState<string[]>([]);
  const notificationHandlerRef = useRef<((notice: any) => void) | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializePlugin({ pluginName: kPluginName, version: kVersion, dimensions: kInitialDimensions });

    // Register a single global listener that forwards to the active example's handler
    codapInterface.on("notify", "interactiveFrame", (notice: any) => {
      notificationHandlerRef.current?.(notice);
    });

    // Also listen for component notifications (for examples 3 & 4)
    codapInterface.on("notify", "component", (notice: any) => {
      notificationHandlerRef.current?.(notice);
    });
  }, []);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [notifications]);

  const addNotification = useCallback((msg: string) => {
    setNotifications(prev => [...prev.slice(-49), msg]);
  }, []);

  const setNotificationHandler = useCallback((handler: ((notice: any) => void) | null) => {
    notificationHandlerRef.current = handler;
  }, []);

  const handleExampleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Clear any active highlights/tours when switching
    codapInterface.sendRequest({
      action: "notify", resource: "interactiveFrame",
      values: { request: "clearHighlight" }
    });
    codapInterface.sendRequest({
      action: "notify", resource: "interactiveFrame",
      values: { request: "endTour" }
    });
    setSelectedExample(e.target.value);
    setNotifications([]);
    notificationHandlerRef.current = null;
  };

  const entry = examples.find(ex => ex.key === selectedExample);

  return (
    <div className="App">
      <h1>Tour API Demo</h1>
      <div className="example-select">
        <label htmlFor="example-selector">Choose an example:</label>
        <select id="example-selector" value={selectedExample} onChange={handleExampleChange}>
          <option value="">— Select an example —</option>
          {examples.map(ex => (
            <option key={ex.key} value={ex.key}>{ex.label}</option>
          ))}
        </select>
      </div>

      {!entry && (
        <div className="placeholder">
          Select an example above to explore the Tour API.
        </div>
      )}

      {entry && (
        <div className="example-panel">
          <entry.Component
            key={entry.key}
            addNotification={addNotification}
            setNotificationHandler={setNotificationHandler}
          />
          <div className="notification-log">
            <label>Notifications:</label>
            <div className="log-content" ref={logRef}>
              {notifications.length === 0
                ? "No notifications yet."
                : notifications.map((n, i) => <div key={i}>{n}</div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
