import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import EditableTable from "../components/EditableTable";

const mockData = [
  {
    Tier: "1",
    Industry: "General",
    Topic: "Compliance",
    Subtopic: "Audit Findings",
  },
  {
    Tier: "1",
    Industry: "General",
    Topic: "Finance",
    Subtopic: "Budget Proposals",
  },
];

const mockHeaders = ["Tier", "Industry", "Topic", "Subtopic"];

const mockProps = {
  data: mockData,
  headers: mockHeaders,
  fileType: "strings",
  onDataUpdate: jest.fn(),
  validationErrors: [],
  loading: false,
};

describe("EditableTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders table with data", () => {
    render(<EditableTable {...mockProps} />);

    expect(screen.getByText("Strings Data")).toBeInTheDocument();
    expect(screen.getByText("2 rows")).toBeInTheDocument();

    // Check headers
    mockHeaders.forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });

    // Check data
    expect(screen.getByDisplayValue("Compliance")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Finance")).toBeInTheDocument();
  });

  test("allows cell editing", async () => {
    render(<EditableTable {...mockProps} />);

    const input = screen.getByDisplayValue("Compliance");
    fireEvent.change(input, { target: { value: "Updated Compliance" } });

    expect(input.value).toBe("Updated Compliance");
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
  });

  test("adds new row", async () => {
    render(<EditableTable {...mockProps} />);

    const addButton = screen.getByText("Add Row");
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockProps.onDataUpdate).toHaveBeenCalled();
    });
  });

  test("displays validation errors", () => {
    const validationErrors = [
      {
        type: "invalid_combination",
        message: "Invalid combination",
        row: 1,
      },
    ];

    render(
      <EditableTable {...mockProps} validationErrors={validationErrors} />
    );

    const errorRows = screen.getAllByTitle("Invalid combination");
    expect(errorRows).toHaveLength(1);
  });

  test("handles empty data", () => {
    render(<EditableTable {...mockProps} data={[]} />);

    expect(screen.getByText("No data available")).toBeInTheDocument();
    expect(screen.getByText("Add First Row")).toBeInTheDocument();
  });
});
