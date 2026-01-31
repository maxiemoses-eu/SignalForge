// Overwrite src/tests/store-ui.test.js with this:
import { render, screen } from "@testing-library/react";
import App from "../App";
import "@testing-library/jest-dom";

test("renders SignalForge title", async () => {
  render(<App />);
  const title = await screen.findByText(/SignalForge/i);
  expect(title).toBeInTheDocument();
});