import express from "express";
import compression from "compression";
import cors from "cors";
import { tools } from "./tools/index.js";

const app = express();
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "1mb" }));

app.get("/healthz", (_req, res) => res.json({ ok: true }));
app.get("/warm", async (_req, res) => {
  try { res.json({ ok: true, time: Date.now() }); }
  catch (e: any) { res.status(500).json({ ok: false, error: e?.message }); }
});

// Simple HTTP tool endpoint compatible with generic MCP clients
app.post("/mcp", async (req, res) => {
  const { tool, input } = req.body || {};
  const spec = (tools as any)[tool];
  if (!spec) return res.status(404).json({ error: "Tool not found", tool });

  try {
    const result = await spec.execute(input || {});
    return res.json(result);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "ToolError", code: "TOOL_FAIL" });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`MCP server on :${port}`);
});
