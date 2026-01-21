import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders shop", () => {
  render(<App />);
  expect(screen.getByText(/SignalForge Shop/i)).toBeInTheDocument();
});
