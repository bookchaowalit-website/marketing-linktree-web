// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import EditLinks, { metadata as editMetadata } from "@/app/edit/page";
import { DEFAULT_LINKS, STORAGE_KEY } from "@/lib/linktree";

// Mounted tests for the link page on the App shell: the public list, sharing, and the owner's editor at /edit.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;
const $ = (selector: string) => host.querySelector(selector) as HTMLElement | null;
const button = (text: string) => [...host.querySelectorAll("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent?.trim())?.startsWith(text)) as HTMLButtonElement;
const press = (el: Element) => act(() => { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
const labels = () => [...host.querySelectorAll(".lt-label, .as-row h3")].map((el) => el.textContent);
const type = (input: HTMLInputElement, value: string) => act(() => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
});
const field = (label: string) => [...host.querySelectorAll("label")].find((l) => l.textContent?.startsWith(label))?.querySelector("input") as HTMLInputElement;
const submit = () => act(() => { ($("form.as-composer") as HTMLFormElement).dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });

beforeEach(() => {
  // The store keeps its last value while storage is empty, so each test starts from the default links explicitly.
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LINKS));
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("public link page", () => {
  it("server-renders the profile and the links, with no editor or prototype copy", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("@bookchaowalit");
    expect(html).toContain("Portfolio / bookchaowalit.com");
    expect(html).toContain('href="https://github.com/bookchaowalit"');
    expect(html).toContain("(opens in a new tab)");
    expect(html).not.toContain("Remove");
    expect(html).not.toContain("prototype");
    expect(html).toContain('href="https://bookchaowalit.com/"');
  });

  it("copies the page address when there is no share sheet", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    act(() => root.render(<Home />));
    await act(async () => { button("Share this page").click(); });
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/`);
    expect(button("Link copied")).toBeTruthy();
  });

  it("uses the share sheet when there is one and says so when sharing fails", async () => {
    const share = vi.fn().mockRejectedValue(new Error("blocked"));
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    act(() => root.render(<Home />));
    await act(async () => { button("Share this page").click(); });
    expect(share).toHaveBeenCalled();
    expect(host.textContent).toContain("Could not share");
  });

  it("points to the hub when this browser removed every link", () => {
    window.localStorage.setItem(STORAGE_KEY, "[]");
    act(() => root.render(<Home />));
    expect($(".as-empty")?.textContent).toContain("No links yet");
    expect($(".as-empty a")?.getAttribute("href")).toBe("https://bookchaowalit.com/");
  });
});

describe("owner editor at /edit", () => {
  it("is kept out of search results", () => {
    expect(editMetadata.robots).toEqual({ index: false, follow: false });
  });

  it("adds a link and shows errors under the field they are about", () => {
    act(() => root.render(<EditLinks />));
    submit();
    expect($("#label-error")?.textContent).toBe("Give the link a label.");
    expect(document.activeElement).toBe(field("Label"));
    type(field("Label"), "Latest");
    expect($("#label-error")).toBeNull();
    type(field("Web address"), "javascript:alert(1)");
    submit();
    expect($("#url-error")?.textContent).toBe("Use a full web address starting with https:// or http://.");
    expect(field("Web address").getAttribute("aria-invalid")).toBe("true");
    type(field("Web address"), "https://example.test/x");
    expect($("#url-error")).toBeNull();
    submit();
    expect(labels().at(-1)).toBe("Latest");
    expect(field("Label").value).toBe("");
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]")).toHaveLength(4);
  });

  it("removes with Undo, and offers the default links back when the list is empty", () => {
    vi.useFakeTimers();
    act(() => root.render(<EditLinks />));
    press(button("Remove Portfolio"));
    expect(labels()).toHaveLength(2);
    press(button("Undo remove"));
    expect(labels()[0]).toBe("Portfolio / bookchaowalit.com");
    for (const link of DEFAULT_LINKS) press(button(`Remove ${link.label}`));
    act(() => { vi.advanceTimersByTime(6000); });
    expect($(".as-toast")).toBeNull();
    expect($(".as-empty")?.textContent).toContain("Add the first link above");
    press(button("Restore default links"));
    expect(labels()).toHaveLength(3);
  });
});
