"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

function Shell({
  title,
  subtitle,
  badge = "Portfolio demo · local-only",
  children,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{badge}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
        </header>
        {children}
        <footer className="mt-10 border-t border-zinc-200 pt-4 text-xs text-zinc-500 dark:border-zinc-800">
          Honest demo: no multi-tenant backend. State (if any) stays in this browser.
        </footer>
      </div>
    </div>
  );
}

function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50 " +
    className;
  const styles =
    variant === "primary"
      ? "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
      : variant === "secondary"
        ? "bg-white text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700"
        : variant === "danger"
          ? "bg-red-600 text-white hover:bg-red-500"
          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900";
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950";

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value, ready]);
  return [value, setValue] as const;
}

function uid() {
  return crypto.randomUUID();
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}


type Link = { id: string; label: string; url: string };
export default function Home() {
  const [links, setLinks] = useLocalStorage<Link[]>("linktree-v1", [
    { id: "1", label: "Portfolio", url: "https://bookchaowalit.com" },
    { id: "2", label: "GitHub", url: "https://github.com/bookchaowalit" },
    { id: "3", label: "LinkedIn", url: "https://linkedin.com" },
  ]);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  return (
    <Shell title="Linktree" subtitle="Personal links page with editable entries stored locally.">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 text-xl text-white dark:bg-zinc-100 dark:text-zinc-900">B</div>
          <h2 className="mt-3 font-semibold">@bookchaowalit</h2>
        </div>
        <div className="space-y-2">
          {links.map((l) => (
            <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-zinc-200 bg-white px-4 py-3 text-center font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900">
              {l.label}
            </a>
          ))}
        </div>
        <div className="mt-6 space-y-2 rounded-xl border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
          <input className={inputClass} placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
          <input className={inputClass} placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button onClick={() => { if (!label || !url) return; setLinks((p) => [...p, { id: uid(), label, url }]); setLabel(""); setUrl(""); }}>Add link</Button>
        </div>
      </div>
    </Shell>
  );
}
