import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SITE_NAME } from "@/lib/site";
import Home from "./page";

describe("Home", () => {
  it("shows the site name as the heading", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: SITE_NAME }),
    ).toBeInTheDocument();
  });
});
