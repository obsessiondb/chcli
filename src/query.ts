import type { CliConfig } from "./cli";
import { printHelp } from "./cli";

export async function resolveQuery(config: CliConfig): Promise<string> {
  if (config.query) {
    return config.query;
  }

  if (config.file) {
    return await Bun.file(config.file).text();
  }

  if (!process.stdin.isTTY) {
    return await Bun.stdin.text();
  }

  printHelp();
  process.exit(1);
}
