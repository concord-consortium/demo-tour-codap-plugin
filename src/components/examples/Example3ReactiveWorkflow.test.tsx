import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { codapInterface } from "@concord-consortium/codap-plugin-api";
import {
  Example3ReactiveWorkflow, isTableCreatedNotice, isTablesMenuOpenedNotice
} from "./Example3ReactiveWorkflow";

jest.mock("@concord-consortium/codap-plugin-api", () => ({
  codapInterface: { sendRequest: jest.fn() }
}));

const tableCreated = {
  action: "notify", resource: "component",
  values: { operation: "create", id: 892779840614354, type: "table", diType: "caseTable" }
};

const tablesMenuOpened = {
  action: "notify", resource: "uiNotificationNotice",
  values: {
    eventType: "appear", region: "header",
    target: { testId: "tool-shelf-button-table", tourKey: "toolShelf.table" },
    monitor: { id: 1 }
  }
};

describe("isTableCreatedNotice", () => {
  it("matches CODAP's create notice for a case table", () => {
    expect(isTableCreatedNotice(tableCreated)).toBe(true);
  });

  it("ignores the create notice for another tile type", () => {
    const graphCreated = { ...tableCreated, values: { ...tableCreated.values, type: "graph", diType: "graph" } };
    expect(isTableCreatedNotice(graphCreated)).toBe(false);
  });

  it("ignores other operations on a case table", () => {
    const tableOpened = {
      ...tableCreated, values: { ...tableCreated.values, operation: "open case table", type: "DG.CaseTable" }
    };
    expect(isTableCreatedNotice(tableOpened)).toBe(false);
  });
});

describe("isTablesMenuOpenedNotice", () => {
  it("matches the appear notice for the Tables button", () => {
    expect(isTablesMenuOpenedNotice(tablesMenuOpened)).toBe(true);
  });

  it("ignores the disappear notice when the menu closes", () => {
    const closed = { ...tablesMenuOpened, values: { ...tablesMenuOpened.values, eventType: "disappear" } };
    expect(isTablesMenuOpenedNotice(closed)).toBe(false);
  });

  it("ignores another tool shelf button", () => {
    const graph = {
      ...tablesMenuOpened,
      values: { ...tablesMenuOpened.values, target: { testId: "tool-shelf-button-graph" } }
    };
    expect(isTablesMenuOpenedNotice(graph)).toBe(false);
  });
});

describe("Example3ReactiveWorkflow's Tables menu monitor", () => {
  const sendRequest = codapInterface.sendRequest as jest.Mock;
  let pendingMonitors: ((id: number) => void)[];

  beforeEach(() => {
    pendingMonitors = [];
    sendRequest.mockReset();
    sendRequest.mockImplementation((request: any) => {
      if (request.action === "notify" && request.resource === "uiNotificationMonitor") {
        return new Promise(resolve => {
          pendingMonitors.push((id: number) => resolve({ success: true, values: { id } }));
        });
      }
      return Promise.resolve({ success: true });
    });
  });

  const deletedMonitors = () => sendRequest.mock.calls
    .map(([request]) => request)
    .filter(request => request.action === "delete")
    .map(request => request.resource);

  const renderExample = () => render(
    <Example3ReactiveWorkflow addNotification={jest.fn()} setNotificationHandler={jest.fn()} />
  );

  it("deletes every monitor when Start, Reset and Start overlap their requests", async () => {
    renderExample();
    fireEvent.click(screen.getByText("Start"));
    fireEvent.click(screen.getByText("Reset"));
    fireEvent.click(screen.getByText("Start"));
    expect(pendingMonitors).toHaveLength(2);

    await act(async () => { pendingMonitors[0](1); });
    await act(async () => { pendingMonitors[1](2); });
    fireEvent.click(screen.getByText("Reset"));

    expect(deletedMonitors()).toEqual(["uiNotificationMonitor[1]", "uiNotificationMonitor[2]"]);
  });

  it("drops a monitor that arrives after Reset and does not highlight the Tables button", async () => {
    renderExample();
    fireEvent.click(screen.getByText("Start"));
    fireEvent.click(screen.getByText("Reset"));

    await act(async () => { pendingMonitors[0](1); });

    expect(deletedMonitors()).toEqual(["uiNotificationMonitor[1]"]);
    const highlights = sendRequest.mock.calls.filter(([request]) => request.values?.request === "highlight");
    expect(highlights).toHaveLength(0);
  });

  it("deletes a monitor that arrives after the example unmounts", async () => {
    const { unmount } = renderExample();
    fireEvent.click(screen.getByText("Start"));
    unmount();

    await act(async () => { pendingMonitors[0](1); });

    expect(deletedMonitors()).toEqual(["uiNotificationMonitor[1]"]);
  });
});
