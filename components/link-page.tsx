"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { AppFoot, AppTop, PlusIcon } from "@/components/app-shell";
import { DEFAULT_LINKS, STORAGE_KEY, addLink, linkAddress, linkError, linkHost, linkStore, removeLink, restoreLink, type LinkItem } from "@/lib/linktree";

const SOURCE = "https://github.com/bookchaowalit-website/marketing-linktree-web";
// index: where it sat in the list when removed. next / prev: the links around it, for focus after Escape.
type RemovedEntry = { link: LinkItem; index: number; next?: string; prev?: string };
// saved: the list as saved right after the latest removal; Undo only applies while the saved list is still that one.
type RemovedBatch = { items: RemovedEntry[]; viaKeyboard: boolean; saved: string };
const removedLabel = (items: RemovedEntry[]) => (items.length === 1 ? `Removed “${items[0].link.label}”` : `Removed ${items.length} links`);

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `link-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Shares the page: the native share sheet where there is one, else (or when the sheet cannot open, e.g. in an
 * iframe without web-share) the address on the clipboard. Dismissing the sheet is not a failure, and a device with
 * no share target reports the same AbortError, so Copy link sits beside Share and copies directly. The result is
 * shown next to the buttons and announced.
 */
function ShareButton() {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  async function share() {
    const url = window.location.origin + "/";
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "@bookchaowalit", url });
        setState("idle");
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }
    await copy();
  }
  async function copy() {
    const url = window.location.origin + "/";
    try {
      if (!navigator.clipboard?.writeText) throw new Error("no clipboard");
      await navigator.clipboard.writeText(url);
      setState("copied");
      window.setTimeout(() => setState((current) => (current === "copied" ? "idle" : current)), 4000);
    } catch {
      setState("failed");
    }
  }
  const message = state === "copied" ? "Page address copied to the clipboard." : state === "failed" ? `Could not share or copy. The address is ${window.location.origin}/` : "";
  return (
    <>
      <button type="button" className="as-plain" onClick={() => void share()}>Share this page</button>
      <button type="button" className="as-plain" onClick={() => void copy()}>{state === "copied" ? "Link copied" : "Copy link"}</button>
      <p className="lt-share-result" role="status">{message}</p>
    </>
  );
}

/** The public link page (`editing` false) and the owner's editor at /edit (`editing` true) share one list. */
export function LinkPage({ editing }: { editing: boolean }) {
  const links = useSyncExternalStore(linkStore.subscribe, linkStore.getSnapshot, linkStore.getServerSnapshot);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<ReturnType<typeof linkError>>(null);
  // Every removal still inside the Undo window: one Undo puts them all back where they were.
  const [removed, setRemovedState] = useState<RemovedBatch | null>(null);
  // The latest batch, so two removals before a re-render still both land in it.
  const removedRef = useRef<RemovedBatch | null>(null);
  const setRemoved = (batch: RemovedBatch | null) => { removedRef.current = batch; setRemovedState(batch); };
  const [toastFocused, setToastFocused] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const labelRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const focusRowsNext = useRef<string[] | null>(null);

  // A removal made from the keyboard moves focus to Undo (the focused Remove button has just gone).
  useEffect(() => { if (removed?.viaKeyboard) undoRef.current?.focus(); }, [removed]);
  // When the toast closes after Undo or Escape, focus goes back near the removed row once the list has re-rendered:
  // the first of these rows still shown, else the Label field.
  useEffect(() => {
    const ids = focusRowsNext.current;
    if (removed || !ids) return;
    focusRowsNext.current = null;
    const shown = [...document.querySelectorAll<HTMLElement>(".as-row[data-link]")];
    const row = ids.map((id) => shown.find((entry) => entry.dataset.link === id)).find(Boolean);
    (row?.querySelector<HTMLButtonElement>(".as-danger") ?? labelRef.current)?.focus();
  }, [removed, links]);
  // While the toast shows, reserve its height (plus its 24px offset and a gap) at the bottom of the page and in
  // scroll-padding, so the footer links and anything focused behind it can scroll clear of it.
  const toastShown = removed !== null;
  useLayoutEffect(() => {
    const toast = toastRef.current;
    if (!toastShown || !toast) return;
    const rootStyle = document.documentElement.style;
    const reserve = () => rootStyle.setProperty("--as-toast-space", `${toast.offsetHeight + 32}px`);
    reserve();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(reserve) : null;
    observer?.observe(toast);
    return () => { observer?.disconnect(); rootStyle.removeProperty("--as-toast-space"); };
  }, [toastShown]);
  // The Undo toast closes 6 s after the latest removal (each removal restarts it), but never while it holds focus.
  useEffect(() => {
    if (!removed || toastFocused) return;
    const timer = window.setTimeout(() => { removedRef.current = null; setRemovedState(null); }, 6000);
    return () => window.clearTimeout(timer);
  }, [removed, toastFocused]);

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = linkError(label, url);
    if (problem) {
      setError(problem);
      (problem.field === "label" ? labelRef : urlRef).current?.focus();
      return;
    }
    linkStore.update((current) => addLink(current, label, url, createId()));
    // This tab's own change: a pending Undo still applies, against the list as saved now.
    // Ref only: re-setting the batch state would re-run the "focus Undo" effect and pull focus from the Label field.
    if (removedRef.current) removedRef.current = { ...removedRef.current, saved: JSON.stringify(linkStore.getSnapshot()) };
    setAnnouncement(`Added “${label.trim()}”.`);
    setLabel("");
    setUrl("");
    setError(null);
    labelRef.current?.focus();
  }

  function remove(link: LinkItem, viaKeyboard: boolean) {
    const current = linkStore.getSnapshot();
    const index = current.findIndex((item) => item.id === link.id);
    if (index < 0) return;
    linkStore.update((list) => removeLink(list, link.id));
    const entry: RemovedEntry = { link: current[index], index, next: current[index + 1]?.id, prev: index > 0 ? current[index - 1].id : undefined };
    const items = [...(removedRef.current?.items ?? []), entry];
    setRemoved({ items, viaKeyboard, saved: JSON.stringify(linkStore.getSnapshot()) });
    setAnnouncement(`${removedLabel(items)}. Undo is available for a few seconds.`);
  }

  function closeToast(focusIds?: string[]) {
    const last = removedRef.current?.items.at(-1);
    // Dismissed: the link after the removed one, else the one before it.
    focusRowsNext.current = focusIds ?? [last?.next, last?.prev].filter((id): id is string => Boolean(id));
    setRemoved(null);
    setToastFocused(false);
  }

  function undo() {
    const batch = removedRef.current;
    const items = batch?.items;
    if (!batch || !items?.length) return;
    // Another tab saved a different list (its storage event may not have arrived yet): keep that list, drop the batch.
    if (JSON.stringify(linkStore.getSnapshot()) !== batch.saved) {
      dropBatchForOtherTab();
      return;
    }
    // Latest removal first, so each index refers to the list as it was just before that removal.
    linkStore.update((current) => items.reduceRight((list, { link, index }) => restoreLink(list, link, index), current));
    setAnnouncement(items.length === 1 ? `Restored “${items[0].link.label}”.` : `Restored ${items.length} links.`);
    // Undone: back to the restored link (the latest one, where the user was last).
    closeToast([items[items.length - 1].link.id]);
  }

  // Another tab changed the saved list: the Undo batch's indexes refer to the list before that change, so it is dropped.
  function dropBatchForOtherTab() {
    if (!removedRef.current) return;
    const hadFocus = toastRef.current?.contains(document.activeElement) ?? false;
    removedRef.current = null;
    setRemovedState(null);
    setToastFocused(false);
    setAnnouncement("Undo is no longer available: the links changed in another tab.");
    // Undo held focus and is going away: keep focus on the page, in the Label field.
    if (hadFocus) labelRef.current?.focus();
  }
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      dropBatchForOtherTab();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // A fresh list, not an undoable step: the Undo batch refers to the list before the reset, so it is dropped.
  function restoreDefaults() {
    focusRowsNext.current = [DEFAULT_LINKS[0].id];
    removedRef.current = null;
    setRemovedState(null);
    setToastFocused(false);
    linkStore.update(() => DEFAULT_LINKS);
    setAnnouncement("Restored the default links.");
  }

  const fieldError = (field: "label" | "url") => (error?.field === field ? error.message : "");

  return (
    <div className="as">
      <a className="as-skip" href="#main">Skip to content</a>
      <AppTop name="Links" tagline="Where to find Bookchaowalit" />

      <main id="main" className="as-page">
        <div className="as-intro">
          <p className="as-eyebrow">{editing ? "Edit links" : "Links"}</p>
          <h1>@bookchaowalit</h1>
          <p>{editing ? "Add, remove or restore links. Changes are saved in this browser only." : "Builder, artist and systems thinker. A few doors into the work."}</p>
          <div className="lt-intro-actions">
            {editing ? <Link className="as-plain" href="/">Done editing</Link> : <ShareButton />}
          </div>
        </div>

        {editing ? (
          <form className="as-composer" onSubmit={add} aria-label="Add a link" noValidate>
            <label className="as-field">Label
              <input ref={labelRef} value={label} onChange={(event) => { setLabel(event.target.value); if (error?.field === "label") setError(null); }} placeholder="Latest project" autoComplete="off" aria-invalid={fieldError("label") ? true : undefined} aria-describedby={fieldError("label") ? "label-error" : undefined} />
            </label>
            {fieldError("label") ? <p id="label-error" className="lt-error" role="alert">{fieldError("label")}</p> : null}
            <label className="as-field">Web address
              <input ref={urlRef} type="url" inputMode="url" value={url} onChange={(event) => { setUrl(event.target.value); if (error?.field === "url") setError(null); }} placeholder="https://example.com" spellCheck={false} autoComplete="off" aria-invalid={fieldError("url") ? true : undefined} aria-describedby={fieldError("url") ? "url-error" : "url-hint"} />
            </label>
            {fieldError("url") ? <p id="url-error" className="lt-error" role="alert">{fieldError("url")}</p> : <p id="url-hint" className="lt-hint">Starts with https:// or http://.</p>}
            <div className="as-composer-actions">
              <button type="submit" className="as-button"><PlusIcon />Add link</button>
            </div>
          </form>
        ) : null}

        {links.length ? (
          <ul className="as-list as-list-links" aria-label="Links">
            {links.map((link) =>
              editing ? (
                <li className="as-row" key={link.id} data-link={link.id}>
                  <div>
                    <h3>{link.label}</h3>
                    <p><a className="lt-dest" href={link.url} target="_blank" rel="noopener noreferrer">{linkAddress(link.url)}<span className="as-sr"> (opens in a new tab)</span></a></p>
                  </div>
                  <button type="button" className="as-plain as-danger" aria-label={`Remove ${link.label}`} onClick={(event) => remove(link, event.detail === 0)}>Remove</button>
                </li>
              ) : (
                <li key={link.id}>
                  <a className="as-row-link" href={link.url} target="_blank" rel="noopener noreferrer">
                    <span>
                      <span className="lt-label">{link.label}</span>
                      <span className="lt-host">{linkHost(link.url)}<span className="as-sr"> (opens in a new tab)</span></span>
                    </span>
                    <span />
                    <span className="as-chevron" aria-hidden="true">↗</span>
                  </a>
                </li>
              ),
            )}
          </ul>
        ) : (
          <div className="as-list as-empty">
            <strong>No links yet</strong>
            {editing ? (
              <>
                Add the first link above, or bring back the default ones.
                <div className="lt-empty-actions"><button type="button" className="as-plain" onClick={restoreDefaults}>Restore default links</button></div>
              </>
            ) : (
              <>
                The links on this page were removed in this browser.
                <div className="lt-empty-actions"><a className="as-plain" href="https://bookchaowalit.com/">Go to bookchaowalit.com</a></div>
              </>
            )}
          </div>
        )}

        {editing ? <p className="as-note">Edits stay in this browser and change only what this browser shows; nothing is published.</p> : null}
      </main>

      <p className="as-sr" role="status" aria-live="polite">{announcement}</p>
      {removed ? (
        <div
          ref={toastRef}
          className="as-toast"
          role="group"
          aria-label="Undo remove"
          onFocus={() => setToastFocused(true)}
          onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setToastFocused(false); }}
          onKeyDown={(event) => { if (event.key === "Escape") closeToast(); }}
        >
          <span>{removedLabel(removed.items)}</span>
          <button ref={undoRef} type="button" className="as-plain" onClick={undo} aria-label={removed.items.length === 1 ? "Undo remove" : `Undo remove of ${removed.items.length} links`}>Undo</button>
        </div>
      ) : null}

      <AppFoot source={SOURCE} />
    </div>
  );
}
