"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { AppFoot, AppTop, PlusIcon } from "@/components/app-shell";
import { DEFAULT_LINKS, addLink, linkError, linkHost, linkStore, removeLink, restoreLink, type LinkItem } from "@/lib/linktree";

const SOURCE = "https://github.com/bookchaowalit-website/marketing-linktree-web";

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `link-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Shares the page: the native share sheet where there is one, else the address on the clipboard. */
function ShareButton() {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  async function share() {
    const url = window.location.origin + "/";
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "@bookchaowalit", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setState("copied");
      window.setTimeout(() => setState("idle"), 1800);
    } catch {
      setState("failed");
    }
  }
  return (
    <>
      <button type="button" className="as-plain" onClick={() => void share()}>{state === "copied" ? "Link copied" : "Share this page"}</button>
      <span className="as-sr" role="status">{state === "copied" ? "Page address copied." : state === "failed" ? "Could not share; copy the address from the browser bar." : ""}</span>
    </>
  );
}

/** The public link page (`editing` false) and the owner's editor at /edit (`editing` true) share one list. */
export function LinkPage({ editing }: { editing: boolean }) {
  const links = useSyncExternalStore(linkStore.subscribe, linkStore.getSnapshot, linkStore.getServerSnapshot);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<ReturnType<typeof linkError>>(null);
  const [removed, setRemoved] = useState<{ link: LinkItem; index: number } | null>(null);
  const [toastFocused, setToastFocused] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const labelRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  // The Undo toast closes 6 s after the latest removal, but never while it holds focus.
  useEffect(() => {
    if (!removed || toastFocused) return;
    const timer = window.setTimeout(() => setRemoved(null), 6000);
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
    setAnnouncement(`Added “${label.trim()}”.`);
    setLabel("");
    setUrl("");
    setError(null);
    labelRef.current?.focus();
  }

  function remove(link: LinkItem) {
    const index = links.findIndex((item) => item.id === link.id);
    linkStore.update((current) => removeLink(current, link.id));
    setRemoved({ link, index });
    setAnnouncement(`Removed “${link.label}”. Undo is available for a few seconds.`);
  }

  function undo() {
    if (!removed) return;
    linkStore.update((current) => restoreLink(current, removed.link, removed.index));
    setAnnouncement(`Restored “${removed.link.label}”.`);
    setRemoved(null);
    setToastFocused(false);
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
                <li className="as-row" key={link.id}>
                  <div>
                    <h3>{link.label}</h3>
                    <p>{linkHost(link.url)}</p>
                  </div>
                  <button type="button" className="as-plain as-danger" aria-label={`Remove ${link.label}`} onClick={() => remove(link)}>Remove</button>
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
                <div className="lt-empty-actions"><button type="button" className="as-plain" onClick={() => linkStore.update(() => DEFAULT_LINKS)}>Restore default links</button></div>
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
          className="as-toast"
          role="group"
          aria-label="Undo remove"
          onFocus={() => setToastFocused(true)}
          onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setToastFocused(false); }}
          onKeyDown={(event) => { if (event.key === "Escape") { setRemoved(null); setToastFocused(false); } }}
        >
          <span>Removed “{removed.link.label}”</span>
          <button type="button" className="as-plain" onClick={undo} aria-label="Undo remove">Undo</button>
        </div>
      ) : null}

      <AppFoot source={SOURCE} />
    </div>
  );
}
