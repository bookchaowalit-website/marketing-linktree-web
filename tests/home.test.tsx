import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("home page", () => {
  it("renders the profile, the authored links and the local-only notice", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("@bookchaowalit");
    expect(html).toContain("Portfolio / bookchaowalit.com");
    expect(html).toContain('href="https://github.com/bookchaowalit"');
    expect(html).toContain("nothing is published to a server");
    expect(html).toContain("LOCAL-ONLY DEMO");
  });

  it("starts with the editor closed", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("Edit this page");
    expect(html).not.toContain("Add a door");
  });
});
