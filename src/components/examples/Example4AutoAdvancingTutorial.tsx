import React, { useCallback, useEffect, useRef, useState } from "react";
import { codapInterface } from "@concord-consortium/codap-plugin-api";
import { ExampleProps } from "./types";

interface TutorialStep {
  instruction: string;
  highlight: Record<string, any> | ((state: Record<string, any>) => Record<string, any>);
  waitFor: (notice: any, state: Record<string, any>) => boolean;
  onMatch?: (notice: any, state: Record<string, any>) => void;
}

const tutorialSteps: TutorialStep[] = [
  {
    instruction: "Create a graph by clicking the Graph button.",
    highlight: { tourKey: "toolShelf.graph" },
    waitFor: (notice) =>
      notice.resource === "component" &&
      notice.values?.operation === "create" &&
      notice.values?.type === "graph",
    onMatch: (notice, state) => {
      state.graphId = notice.values.id;
    }
  },
  {
    instruction: "Now drag an attribute to the x-axis of your graph.",
    highlight: (state) => ({
      testId: "add-attribute-drop-bottom",
      component: String(state.graphId),
      popover: { description: "Drag an attribute here" }
    }),
    waitFor: (notice, state) =>
      notice.resource?.startsWith("dataContext") &&
      notice.values?.operation === "selectCases"
  }
];

export const Example4AutoAdvancingTutorial: React.FC<ExampleProps> = ({ addNotification, setNotificationHandler }) => {
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);
  const [instruction, setInstruction] = useState("");
  const stepIndexRef = useRef(-1);
  const stateRef = useRef<Record<string, any>>({});

  const runStep = useCallback(async (index: number) => {
    stepIndexRef.current = index;
    setStepIndex(index);

    if (index >= tutorialSteps.length) {
      setInstruction("Tutorial complete!");
      setRunning(false);
      addNotification("Tutorial complete!");
      return;
    }

    const step = tutorialSteps[index];
    setInstruction(step.instruction);
    addNotification(`Step ${index + 1}: ${step.instruction}`);

    const highlightConfig = typeof step.highlight === "function"
      ? step.highlight(stateRef.current)
      : step.highlight;

    await codapInterface.sendRequest({
      action: "notify", resource: "interactiveFrame",
      values: { request: "highlight", ...highlightConfig }
    });
  }, [addNotification]);

  useEffect(() => {
    setNotificationHandler((notice: any) => {
      const idx = stepIndexRef.current;
      if (idx >= 0 && idx < tutorialSteps.length) {
        const step = tutorialSteps[idx];
        if (step.waitFor(notice, stateRef.current)) {
          step.onMatch?.(notice, stateRef.current);
          addNotification(`Step ${idx + 1} completed!`);

          codapInterface.sendRequest({
            action: "notify", resource: "interactiveFrame",
            values: { request: "clearHighlight" }
          });

          runStep(idx + 1);
        }
      }

      // Also log highlight/tour notifications
      if (notice.values?.operation === "highlightUpdate" || notice.values?.operation === "tourUpdate") {
        addNotification(`${notice.values.operation}: ${notice.values.type}`);
      }
    });
    return () => setNotificationHandler(null);
  }, [addNotification, setNotificationHandler, runStep]);

  const handleStart = () => {
    stateRef.current = {};
    setRunning(true);
    runStep(0);
  };

  const handleStop = () => {
    codapInterface.sendRequest({
      action: "notify", resource: "interactiveFrame",
      values: { request: "clearHighlight" }
    });
    stepIndexRef.current = -1;
    setStepIndex(-1);
    setRunning(false);
    setInstruction("");
    addNotification("Tutorial stopped.");
  };

  return (
    <div>
      <h2>Example 4: Auto-Advancing Tutorial</h2>
      <p>
        A step-by-step tutorial that detects task completion via CODAP notifications
        and automatically advances. Create a graph, then drag an attribute to it.
      </p>
      <div className="button-row">
        <button className="primary" onClick={handleStart} disabled={running}>
          Start Tutorial
        </button>
        {running && <button className="danger" onClick={handleStop}>Stop</button>}
      </div>
      {instruction && <div className="instruction">{instruction}</div>}
      {running && stepIndex >= 0 && (
        <div className="step-indicator">
          Step {stepIndex + 1} of {tutorialSteps.length}
        </div>
      )}
    </div>
  );
};
