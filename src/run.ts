import { parseCliArgs, printHelp, printVersion } from "./cli";
import { createClickHouseClient } from "./client";
import { resolveQuery } from "./query";
import { resolveFormat } from "./format";
import { runEnvCommand } from "./env";
import { getEnvironment, getDefault } from "./config";
import type { Environment } from "./config";

const DATA_QUERY_PATTERN = /^\s*(SELECT|SHOW|DESCRIBE|DESC|EXPLAIN|EXISTS|WITH)\b/i;

async function resolveNamedEnvironment(
  envFlag: string | undefined,
): Promise<Environment | undefined> {
  // --env flag takes highest priority
  if (envFlag) {
    const env = await getEnvironment(envFlag);
    if (!env) {
      throw new Error(`Environment "${envFlag}" not found. Run \`chcli env list\` to see available environments.`);
    }
    return env;
  }

  // Fall back to folder default
  const defaultName = await getDefault(process.cwd());
  if (defaultName) {
    return getEnvironment(defaultName);
  }

  return undefined;
}

export async function run() {
  // Route `chcli env ...` subcommand before strict arg parsing
  const rawArgs = process.argv.slice(2);
  if (rawArgs[0] === "env") {
    await runEnvCommand(rawArgs.slice(1));
    return;
  }

  const config = parseCliArgs();

  if (config.help) {
    printHelp();
    return;
  }

  if (config.version) {
    printVersion();
    return;
  }

  const namedEnv = await resolveNamedEnvironment(config.env);
  const query = await resolveQuery(config);
  const format = resolveFormat(config.format);
  const client = createClickHouseClient(config, namedEnv);

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
