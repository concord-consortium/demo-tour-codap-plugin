import { isTableCreatedNotice, isTablesMenuOpenedNotice } from "./Example3ReactiveWorkflow";

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
