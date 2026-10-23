import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/mcp/route";

function rpc(body: unknown) {
  return POST(new Request("http://localhost/api/mcp", { method: "POST", body: JSON.stringify(body) }));
}

describe("MCP route", () => {
  it("echoes the JSON-RPC request id and lists the real tools", async () => {
    const body = await (await rpc({ jsonrpc: "2.0", id: 7, method: "tools/list" })).json();
    expect(body.id).toBe(7);
    expect(body.result.tools.map((t: { name: string }) => t.name)).toEqual(["get_links", "search_links"]);
  });

  it("get_links returns the authored links", async () => {
    const { result } = await (await rpc({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "get_links" } })).json();
    expect(result.links.map((l: { url: string }) => l.url)).toEqual(["https://bookchaowalit.com", "https://github.com/bookchaowalit", "https://knowledgehub.bookchaowalit.com"]);
  });

  it("search_links matches label or URL, case-insensitive", async () => {
    const { result } = await (await rpc({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "search_links", arguments: { query: "GITHUB" } } })).json();
    expect(result.links.map((l: { id: string }) => l.id)).toEqual(["2"]);
  });

  it("rejects an unknown tool instead of pretending to call it", async () => {
    const body = await (await rpc({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "publish_link" } })).json();
    expect(body.result).toBeUndefined();
    expect(body.error.code).toBe(-32602);
    expect(body.id).toBe(4);
  });

  it("answers an unknown method and malformed JSON with JSON-RPC errors", async () => {
    expect((await (await rpc({ jsonrpc: "2.0", id: 5, method: "nope" })).json()).error.code).toBe(-32601);
    const res = await POST(new Request("http://localhost/api/mcp", { method: "POST", body: "{" }));
    expect((await res.json()).error.code).toBe(-32700);
  });
});
