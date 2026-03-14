import express from "express";
import cors from "cors";
import { chat } from "./api/agent.js";

const app = express();
const port = process.env.PORT || 8010;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/chat", chat);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
