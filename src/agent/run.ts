import { runAgent } from "./agent.js";

async function main() {
  const result = await runAgent("Explain what an API is in 2 sentences");

  console.log(result);
}

main();
