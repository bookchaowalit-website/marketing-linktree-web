"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { addLink, linkStore, removeLink } from "@/lib/linktree";

export default function Home() {
  const links = useSyncExternalStore(linkStore.subscribe, linkStore.getSnapshot, linkStore.getServerSnapshot);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyPage() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); }
  }
  function addDoor() {
    const next = addLink(links, label, url, crypto.randomUUID());
    if (next === links) return;
    linkStore.update(() => next);
    setLabel(""); setUrl("");
  }

  return (
    <main className="signal-page">
      <div className="signal-sun" aria-hidden="true" /><div className="signal-grid" aria-hidden="true" />
      <header className="signal-topbar"><Link href="/" className="signal-logo">BOOK / BROADCAST</Link><span>personal link page · local edit mode</span><button type="button" onClick={() => void copyPage()}>{copied ? "Copied" : "Share page ↗"}</button></header>
      <section className="profile-stage"><div className="profile-sticker">B<span>01</span></div><p className="signal-kicker">A small index of where I am</p><h1>@bookchaowalit</h1><p className="profile-note">Builder, artist, and systems thinker. A few doors into the work.</p><div className="signal-links">{links.map((link, index) => <div className="signal-link-wrap" key={link.id}><a className="signal-link" href={link.url} target="_blank" rel="noreferrer"><span>{String(index + 1).padStart(2, "0")}</span><strong>{link.label}</strong><b>↗</b></a>{editMode && <button type="button" className="remove-link" onClick={() => linkStore.update((current) => removeLink(current, link.id))}>remove</button>}</div>)}</div></section>
      <section className="broadcast-note"><span>NOTE FROM THE EDITOR</span><p>This page is a local prototype. Add a link to test the rhythm; nothing is published to a server.</p><button type="button" onClick={() => setEditMode((value) => !value)}>{editMode ? "Close editor" : "Edit this page"} <b>+</b></button></section>
      {editMode && <section className="link-editor"><div><span>New transmission</span><strong>Add a door</strong></div><label><span>Label</span><input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. Latest project" /></label><label><span>URL</span><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://" /></label><button type="button" onClick={addDoor}>Add link <b>↗</b></button></section>}
      <footer className="signal-footer"><span>BOOKCHAOWALIT / LINKTREE</span><span>EDITABLE PERSONAL LINKS · LOCAL-ONLY DEMO</span></footer>
    </main>
  );
}
