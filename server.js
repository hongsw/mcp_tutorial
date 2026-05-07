#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "simple-mcp-server",
  version: "1.0.0",
});

server.tool(
  "add",
  "Add two numbers together",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => {
    console.error(`[DEBUG] add called with a=${a}, b=${b}`);
    return {
      content: [{ type: "text", text: String(a + b) }],
    };
  }
);

async function main() {
  console.error("[DEBUG] Server starting with stdio transport...");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[DEBUG] Server connected!");
}

main().catch(console.error);