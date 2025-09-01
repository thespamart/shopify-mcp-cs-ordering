import express, { Request, Response } from "express";
import compression from "compression";
import cors from "cors";
import { tools } from "./tools/index.js";

const app = express();
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "1mb" }));

app.get("/healthz", (_req: Request, res: Response) => res.json({ ok: true }));

app.get("/warm", async (_req: Request, res: Response) => {
  try { res.json({ ok: true, time: Date.now() }); }
  catch (e: any) { res.status(500).json({ ok: false, error: e?.message }); }
});

app.post("/mcp", async (req: Request, res: Response) => {
  const { tool, input } = (req.body || {}) as { tool?: string; input?: any };
  const spec = (tools as any)[tool as keyof typeof tools];
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
