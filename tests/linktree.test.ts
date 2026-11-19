import { describe, expect, it } from "vitest";
import { DEFAULT_LINKS, addLink, linkError, linkHost, normalizeUrl, parseLinks, removeLink, restoreLink } from "@/lib/linktree";

describe("normalizeUrl", () => {
  it("keeps http(s) and normalises it", () => {
    expect(normalizeUrl(" https://example.com ")).toBe("https://example.com/");
  });

  it("refuses javascript:, data:, mailto: and unparsable input", () => {
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeUrl("data:text/html,x")).toBeNull();
    expect(normalizeUrl("mailto:a@b.c")).toBeNull();
    expect(normalizeUrl("example.com")).toBeNull();
  });
});

describe("addLink / removeLink", () => {
  it("appends a trimmed link with a normalised URL", () => {
    const next = addLink(DEFAULT_LINKS, "  Shop ", "https://shop.example", "x");
    expect(next).toHaveLength(4);
    expect(next[3]).toEqual({ id: "x", label: "Shop", url: "https://shop.example/" });
  });

  it("changes nothing for a blank label or a bad URL", () => {
    expect(addLink(DEFAULT_LINKS, "  ", "https://a.b", "x")).toBe(DEFAULT_LINKS);
    expect(addLink(DEFAULT_LINKS, "Bad", "javascript:alert(1)", "x")).toBe(DEFAULT_LINKS);
  });

  it("removes by id only", () => {
    expect(removeLink(DEFAULT_LINKS, "2").map((l) => l.id)).toEqual(["1", "3"]);
    expect(removeLink(DEFAULT_LINKS, "nope")).toEqual(DEFAULT_LINKS);
  });
});

describe("parseLinks", () => {
  it("returns null for nothing saved, bad JSON or a non-array", () => {
    expect(parseLinks(null)).toBeNull();
    expect(parseLinks("{")).toBeNull();
    expect(parseLinks('{"id":"1"}')).toBeNull();
  });

  it("drops entries of the wrong shape and saved links that are not http(s)", () => {
    const raw = JSON.stringify([
      { id: "a", label: "Ok", url: "https://ok.example/" },
      { id: "b", label: "Script", url: "javascript:alert(1)" },
      { id: "c", label: 3, url: "https://x.y" },
      "text",
    ]);
    expect(parseLinks(raw)).toEqual([{ id: "a", label: "Ok", url: "https://ok.example/" }]);
  });

  it("keeps an empty saved list (the visitor removed every link)", () => {
    expect(parseLinks("[]")).toEqual([]);
  });
});

describe("linkError, restoreLink and linkHost", () => {
  it("names the field that blocks Add", () => {
    expect(linkError(" ", "https://a.test")).toEqual({ field: "label", message: "Give the link a label." });
    expect(linkError("A", "")).toEqual({ field: "url", message: "Add the address the link opens." });
    expect(linkError("A", "javascript:alert(1)")?.message).toBe("Use a full web address starting with https:// or http://.");
    expect(linkError("A", "https://a.test")).toBeNull();
  });
  it("restores a removed link at its old place, once", () => {
    const [first, second] = DEFAULT_LINKS;
    expect(restoreLink([second], first, 0)).toEqual([first, second]);
    expect(restoreLink([second], first, 9)).toEqual([second, first]);
    expect(restoreLink([first], first, 0)).toEqual([first]);
  });
  it("shows the host without www", () => {
    expect(linkHost("https://www.example.test/a")).toBe("example.test");
    expect(linkHost("not a url")).toBe("not a url");
  });
});
