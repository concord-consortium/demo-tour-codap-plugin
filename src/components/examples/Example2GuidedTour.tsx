import React, { useEffect, useState } from "react";
import { codapInterface } from "@concord-consortium/codap-plugin-api";
import { ExampleProps } from "./types";

export const Example2GuidedTour: React.FC<ExampleProps> = ({ addNotification, setNotificationHandler }) => {
  const [tourId, setTourId] = useState<string | null>(null);
  const [stepInfo, setStepInfo] = useState<string>("");

  useEffect(() => {
    setNotificationHandler((notice: any) => {
      if (notice.values?.operation === "tourUpdate") {
        const v = notice.values;
        addNotification(`tourUpdate: ${v.type} step=${v.stepIndex} id=${v.id || ""}`);
        if (v.type === "stepStarted") {
          setStepInfo(`Step ${(v.stepIndex ?? 0) + 1} of ${v.totalSteps} — ${v.id || ""}`);
        } else if (v.type === "completed") {
          setTourId(null);
          setStepInfo("Tour completed!");
        } else if (v.type === "cancelled") {
          setTourId(null);
          setStepInfo("Tour cancelled.");
        }
      }
    });
    return () => setNotificationHandler(null);
  }, [addNotification, setNotificationHandler]);

  const handleStartTour = async () => {
    const result = await codapInterface.sendRequest({
      action: "notify", resource: "interactiveFrame",
      values: {
        request: "startTour",
        nextBtnText: "Next",
        prevBtnText: "Back",
        doneBtnText: "Let's go!",
        progressText: "Step {{current}} of {{total}}",
        showProgress: true,
        steps: [
          {
            tourKey: "toolShelf.table",
            id: "intro-table",
            popover: {
              title: "Step 1: Tables",
              description: "This button creates a new table to hold your data."
            }
          },
          {
            tourKey: "toolShelf.graph",
            id: "intro-graph",
            popover: {
              title: "Step 2: Graphs",
              description: "After you have data, use this button to create a graph."
            }
          },
          {
            tourKey: "menuBar.helpMenu",
            id: "intro-help",
            popover: {
              title: "Need Help?",
              description: "You can always find help resources here."
            }
          }
        ]
      }
    }) as any;

    if (result?.success) {
      setTourId(result.values.tourId);
      setStepInfo("Tour started...");
      addNotification(`Tour started: ${result.values.tourId}`);
    }
  };

  const handleEndTour = () => {
    codapInterface.sendRequest({
      action: "notify", resource: "interactiveFrame",
      values: { request: "endTour", tourId }
    });
    setTourId(null);
    setStepInfo("Tour ended.");
    addNotification("Tour ended by user.");
  };

  return (
    <div>
      <h2>Example 2: Guided Tour with Custom Text</h2>
      <p>
        Runs a multi-step tour walking through the toolbar with custom descriptions,
        button labels, and progress indicator.
      </p>
      <div className="button-row">
        <button className="primary" onClick={handleStartTour} disabled={!!tourId}>
          Start Tour
        </button>
        {tourId && <button className="danger" onClick={handleEndTour}>End Tour</button>}
      </div>
      {stepInfo && <div className="status">{stepInfo}</div>}
    </div>
  );
};
