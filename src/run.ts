import { parseCliArgs, printHelp, printVersion } from "./cli";
import { createClickHouseClient } from "./client";
import { resolveQuery } from "./query";
import { resolveFormat } from "./format";

const DATA_QUERY_PATTERN = /^\s*(SELECT|SHOW|DESCRIBE|DESC|EXPLAIN|EXISTS|WITH)\b/i;

export async function run() {
  const config = parseCliArgs();

  if (config.help) {
    printHelp();
    return;
  }

  if (config.version) {
    printVersion();
    return;
  }

  const query = await resolveQuery(config);
  const format = resolveFormat(config.format);
  const client = createClickHouseClient(config);

  try {
    const start = performance.now();

    if (DATA_QUERY_PATTERN.test(query)) {
      const result = await client.query({
        query,
        format: format as any,
      });
      const text = await result.text();
      if (text) {
        process.stdout.write(text);
      }
    } else {
      await client.command({ query });
    }

    const elapsed = performance.now() - start;

    if (config.time) {
      console.error(`Elapsed: ${(elapsed / 1000).toFixed(3)}s`);
    }

    if (config.verbose) {
      console.error(`Format: ${format}`);
      console.error(`Elapsed: ${(elapsed / 1000).toFixed(3)}s`);
    }
  } finally {
    await client.close();
  }
}
