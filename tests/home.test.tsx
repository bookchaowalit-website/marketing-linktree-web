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
// detail 0 = keyboard (Enter/Space) click, 1 = pointer click.
const press = (el: Element, detail = 1) => act(() => { el.dispatchEvent(new MouseEvent("click", { bubbles: true, detail })); });
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

  it("copies the link instead when the share sheet cannot open, and shows the result", async () => {
    const share = vi.fn().mockRejectedValue(Object.assign(new Error("blocked"), { name: "NotAllowedError" }));
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    act(() => root.render(<Home />));
    await act(async () => { button("Share this page").click(); });
    expect(share).toHaveBeenCalled();
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/`);
    expect(button("Link copied")).toBeTruthy();
    const result = $(".lt-share-result");
    expect(result?.getAttribute("role")).toBe("status");
    expect(result?.textContent).toBe("Page address copied to the clipboard.");
  });

  it("shows the address to copy by hand when neither sharing nor the clipboard works", async () => {
    Object.defineProperty(navigator, "share", { value: vi.fn().mockRejectedValue(new Error("blocked")), configurable: true });
    Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) }, configurable: true });
    act(() => root.render(<Home />));
    await act(async () => { button("Share this page").click(); });
    expect($(".lt-share-result")?.textContent).toBe(`Could not share or copy. The address is ${window.location.origin}/`);
  });

  it("treats a dismissed share sheet as no error and does not copy", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: vi.fn().mockRejectedValue(Object.assign(new Error("cancel"), { name: "AbortError" })), configurable: true });
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    act(() => root.render(<Home />));
    await act(async () => { button("Share this page").click(); });
    expect(writeText).not.toHaveBeenCalled();
    expect($(".lt-share-result")?.textContent).toBe("");
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

  it("consecutive removes restore together with one Undo, each in its place", () => {
    vi.useFakeTimers();
    act(() => root.render(<EditLinks />));
    const before = labels();
    expect(before).toHaveLength(3);
    press(button(`Remove ${before[1]}`));
    act(() => { vi.advanceTimersByTime(4000); });
    press(button(`Remove ${before[0]}`));
    expect(labels()).toEqual([before[2]]);
    expect($(".as-toast span")?.textContent).toBe("Removed 2 links");
    expect(button("Undo").getAttribute("aria-label")).toBe("Undo remove of 2 links");
    // The second removal restarted the 6 s window.
    act(() => { vi.advanceTimersByTime(4000); });
    press(button("Undo"));
    expect(labels()).toEqual(before);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]")).toHaveLength(3);
    expect($('[aria-live="polite"]')?.textContent).toBe("Restored 2 links.");
    expect($(".as-toast")).toBeNull();
  });

  it("keyboard remove focuses Undo; Undo focuses the restored link, Escape the next one", () => {
    act(() => root.render(<EditLinks />));
    const [first, second, third] = labels();
    press(button(`Remove ${first}`), 0);
    expect(document.activeElement).toBe(button("Undo remove"));
    press(button("Undo remove"), 0);
    expect(labels()[0]).toBe(first);
    expect(document.activeElement).toBe(button(`Remove ${first}`));
    press(button(`Remove ${first}`), 0);
    act(() => { $(".as-toast")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    expect($(".as-toast")).toBeNull();
    expect(document.activeElement).toBe(button(`Remove ${second}`));
    // The last link: Escape lands on the one before it.
    press(button(`Remove ${third}`), 0);
    act(() => { $(".as-toast")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    expect(document.activeElement).toBe(button(`Remove ${second}`));
  });

  it("Restore default links closes the Undo toast, so a later Undo cannot reorder the restored list", () => {
    vi.useFakeTimers();
    act(() => root.render(<EditLinks />));
    type(field("Label"), "Custom");
    type(field("Web address"), "https://example.test/custom");
    submit();
    for (const label of labels()) press(button(`Remove ${label}`));
    expect($(".as-toast")).not.toBeNull();
    press(button("Restore default links"));
    expect($(".as-toast")).toBeNull();
    expect(labels()).toEqual(DEFAULT_LINKS.map((link) => link.label));
    expect($('[aria-live="polite"]')?.textContent).toBe("Restored the default links.");
    // Focus moves off the gone empty-state button to the first restored row.
    expect(document.activeElement).toBe(button(`Remove ${DEFAULT_LINKS[0].label}`));
  });

  it("shows each link's full destination and lets the owner open it to check before removing", () => {
    act(() => root.render(<EditLinks />));
    for (const path of ["alpha", "beta"]) {
      type(field("Label"), "Project");
      type(field("Web address"), `https://example.test/${path}?ref=1`);
      submit();
    }
    const rows = [...host.querySelectorAll(".as-row[data-link]")].slice(-2);
    const opens = rows.map((row) => row.querySelector<HTMLAnchorElement>("a.lt-dest"));
    expect(opens.map((a) => a?.getAttribute("href"))).toEqual(["https://example.test/alpha?ref=1", "https://example.test/beta?ref=1"]);
    expect(opens.map((a) => a?.textContent)).toEqual(["example.test/alpha?ref=1 (opens in a new tab)", "example.test/beta?ref=1 (opens in a new tab)"]);
    expect(opens[0]?.getAttribute("target")).toBe("_blank");
    expect(opens[0]?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("a pointer remove leaves focus alone and the toast reserves its height while it shows", () => {
    vi.useFakeTimers();
    act(() => root.render(<EditLinks />));
    press(button("Remove Portfolio"));
    expect(document.activeElement).not.toBe(button("Undo remove"));
    expect(document.documentElement.style.getPropertyValue("--as-toast-space")).toMatch(/px$/);
    act(() => { vi.advanceTimersByTime(6000); });
    expect($(".as-toast")).toBeNull();
    expect(document.documentElement.style.getPropertyValue("--as-toast-space")).toBe("");
  });
});
