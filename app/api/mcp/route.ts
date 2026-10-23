import { NextResponse } from "next/server";
import { DEFAULT_LINKS } from "@/lib/linktree";

// Stateless JSON-RPC MCP endpoint over the authored link list. Links a visitor adds or removes stay in that
// browser, so the server only knows the defaults, and no tool can publish or change a link.

type RpcRequest = { id?: number | string | null; method?: string; params?: { name?: string; arguments?: Record<string, unknown> } };

const TOOLS = [
  { name: "get_links", description: "The authored links on the page (visitor edits stay in their browser)", inputSchema: { type: "object", properties: {} } },
  {
    name: "search_links",
    description: "Authored links whose label or URL contains the query (case-insensitive)",
    inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  },
];

class RpcError extends Error {
  constructor(readonly code: number, message: string) {
    super(message);
  }
}

function callTool(name: string | undefined, args: Record<string, unknown> = {}) {
  switch (name) {
    case "get_links":
      return { links: DEFAULT_LINKS };
    case "search_links": {
      const query = typeof args.query === "string" ? args.query.trim().toLowerCase() : "";
      return { links: DEFAULT_LINKS.filter((link) => `${link.label} ${link.url}`.toLowerCase().includes(query)) };
    }
    default:
      throw new RpcError(-32602, `Unknown tool: ${String(name)}`);
  }
}

export async function POST(request: Request) {
  let id: RpcRequest["id"] = null;
  try {
    const body = (await request.json()) as RpcRequest;
    id = body.id ?? null;
    let result: unknown;
    switch (body.method) {
      case "initialize":
        result = { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "Linktree", version: "1.0.0" } };
        break;
      case "tools/list":
        result = { tools: TOOLS };
        break;
      case "tools/call":
        result = callTool(body.params?.name, body.params?.arguments);
        break;
      default:
        throw new RpcError(-32601, `Unknown method: ${String(body.method)}`);
    }
    return NextResponse.json({ jsonrpc: "2.0", id, result });
  } catch (error) {
    const code = error instanceof RpcError ? error.code : -32700;
    const message = error instanceof RpcError ? error.message : "Parse error";
    return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } }, { status: 400 });
  }
}
