import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "../App";

// Mock the hooks and components
jest.mock("../hooks/useCsvData", () => ({
  __esModule: true,
  default: () => ({
    sessionId: null,
    filesData: {},
    loading: false,
    validationResult: null,
    uploadFiles: jest.fn(),
    updateData: jest.fn(),
    validateData: jest.fn(),
    exportFile: jest.fn(),
    resetSession: jest.fn(),
  }),
}));

describe("App", () => {
  test("renders main heading", () => {
    render(<App />);
    expect(screen.getByText("CSV Data Management System")).toBeInTheDocument();
  });

  test("shows upload section when no session", () => {
    render(<App />);
    expect(screen.getByText("Upload CSV Files")).toBeInTheDocument();
  });

  test("renders footer", () => {
    render(<App />);
    expect(
      screen.getByText("© 2025 CSV Data Management System")
    ).toBeInTheDocument();
  });
});
