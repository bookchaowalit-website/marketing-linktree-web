"use client";

import { useEffect, useState } from "react";

type LinkItem = { id: string; label: string; url: string };
const DEFAULT_LINKS: LinkItem[] = [
  { id: "1", label: "Portfolio / bookchaowalit.com", url: "https://bookchaowalit.com" },
  { id: "2", label: "Code / github", url: "https://github.com/bookchaowalit" },
  { id: "3", label: "Writing / knowledge hub", url: "https://knowledgehub.bookchaowalit.com" },
];

function makeId() { return Math.random().toString(36).slice(2); }

export default function Home() {
  const [links, setLinks] = useState<LinkItem[]>(DEFAULT_LINKS);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try { const saved = localStorage.getItem("linktree-v2"); if (saved) setLinks(JSON.parse(saved) as LinkItem[]); } catch { /* local demo state is optional */ }
  }, []);
  useEffect(() => { localStorage.setItem("linktree-v2", JSON.stringify(links)); }, [links]);

  async function copyPage() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); }
  }
  function addLink() {
    if (!label.trim() || !url.trim()) return;
    try { const parsed = new URL(url); if (!['http:', 'https:'].includes(parsed.protocol)) return; setLinks((current) => [...current, { id: makeId(), label: label.trim(), url: parsed.toString() }]); setLabel(""); setUrl(""); } catch { /* wait for a valid URL */ }
  }

  return (
    <main className="signal-page">
      <div className="signal-sun" aria-hidden="true" /><div className="signal-grid" aria-hidden="true" />
      <header className="signal-topbar"><a href="/" className="signal-logo">BOOK / BROADCAST</a><span>personal link page · local edit mode</span><button onClick={() => void copyPage()}>{copied ? "Copied" : "Share page ↗"}</button></header>
      <section className="profile-stage"><div className="profile-sticker">B<span>01</span></div><p className="signal-kicker">A small index of where I am</p><h1>@bookchaowalit</h1><p className="profile-note">Builder, artist, and systems thinker. A few doors into the work.</p><div className="signal-links">{links.map((link, index) => <div className="signal-link-wrap" key={link.id}><a className="signal-link" href={link.url} target="_blank" rel="noreferrer"><span>{String(index + 1).padStart(2, "0")}</span><strong>{link.label}</strong><b>↗</b></a>{editMode && <button className="remove-link" onClick={() => setLinks((current) => current.filter((item) => item.id !== link.id))}>remove</button>}</div>)}</div></section>
      <section className="broadcast-note"><span>NOTE FROM THE EDITOR</span><p>This page is a local prototype. Add a link to test the rhythm; nothing is published to a server.</p><button onClick={() => setEditMode((value) => !value)}>{editMode ? "Close editor" : "Edit this page"} <b>+</b></button></section>
      {editMode && <section className="link-editor"><div><span>New transmission</span><strong>Add a door</strong></div><label><span>Label</span><input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. Latest project" /></label><label><span>URL</span><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://" /></label><button onClick={addLink}>Add link <b>↗</b></button></section>}
      <footer className="signal-footer"><span>BOOKCHAOWALIT / LINKTREE</span><span>EDITABLE PERSONAL LINKS · LOCAL-ONLY DEMO</span></footer>
    </main>
  );
}
