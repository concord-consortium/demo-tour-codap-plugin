import { tutorialSteps } from "./Example4AutoAdvancingTutorial";

const [createGraphStep, dropOnXAxisStep] = tutorialSteps;
const { waitFor: isGraphCreated, onMatch: recordGraph } = createGraphStep;
const { waitFor: isXAxisDrop } = dropOnXAxisStep;

const graphCreated = {
  action: "notify", resource: "component",
  values: { operation: "create", id: 5, type: "graph", diType: "graph" }
};

// CODAP's notice for a drop on the x-axis of graph 5. A y-axis drop differs only in axisOrientation.
const xAxisDrop = {
  action: "notify", resource: "component",
  values: {
    operation: "attributeChange", id: 5, type: "DG.GraphView", diType: "graph",
    attributeId: 1, attributeName: "Attribute Name", plotType: "dotChart",
    primaryAxis: "x", axisOrientation: "horizontal"
  }
};

describe("tutorialSteps", () => {
  it("has the two steps the tests below cover", () => {
    expect(tutorialSteps).toHaveLength(2);
  });

  it("step 1 completes on a graph create and records the graph's id", () => {
    const state: Record<string, any> = {};
    expect(isGraphCreated(graphCreated, state)).toBe(true);
    recordGraph?.(graphCreated, state);
    expect(state.graphId).toBe(5);
  });

  it("step 1 ignores a table create", () => {
    const tableCreated = { ...graphCreated, values: { ...graphCreated.values, type: "table", diType: "caseTable" } };
    expect(isGraphCreated(tableCreated, {})).toBe(false);
  });

  it("step 2 completes on a drop on the x-axis of the tutorial's graph", () => {
    expect(isXAxisDrop(xAxisDrop, { graphId: 5 })).toBe(true);
  });

  it("step 2 ignores a drop on the y-axis, which also reports primaryAxis x", () => {
    const yAxisDrop = { ...xAxisDrop, values: { ...xAxisDrop.values, axisOrientation: "vertical" } };
    expect(isXAxisDrop(yAxisDrop, { graphId: 5 })).toBe(false);
  });

  it("step 2 ignores a drop on another graph", () => {
    expect(isXAxisDrop(xAxisDrop, { graphId: 6 })).toBe(false);
  });

  it("step 2 ignores a non-component notice", () => {
    const selection = {
      action: "notify", resource: "dataContextChangeNotice[Mammals]", values: { operation: "selectCases" }
    };
    expect(isXAxisDrop(selection, { graphId: 5 })).toBe(false);
  });
});
