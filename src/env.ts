import { parseArgs } from "node:util";
import {
  readConfig,
  setEnvironment,
  removeEnvironment,
  setDefault,
  getEnvironment,
  type Environment,
} from "./config";
import { resolveConnectionConfig } from "./client";
import type { CliConfig } from "./cli";

export async function runEnvCommand(args: readonly string[]): Promise<void> {
  const subcommand = args[0];
  const rest = args.slice(1);

  switch (subcommand) {
    case "add":
      return envAdd(rest);
    case "list":
    case "ls":
      return envList();
    case "remove":
    case "rm":
      return envRemove(rest);
    case "use":
      return envUse(rest);
    case "show":
      return envShow(rest);
    default:
      printEnvHelp();
  }
}

function printEnvHelp() {
  console.log(`chcli env — Manage environments

Usage: chcli env <command>

Commands:
  add <name>     Add or update an environment
  list, ls       List all environments
  remove, rm     Remove an environment
  use <name>     Set default environment for current directory
  show <name>    Show environment details

Add options:
      --host <host>       ClickHouse host
      --port <port>       HTTP port
  -u, --user <user>       Username
      --password <pass>   Password
  -d, --database <db>     Database
  -s, --secure            Use HTTPS
      --url <url>         ClickHouse URL (sets host, port, secure, password)
      --no-verify         Skip connection verification

Examples:
  chcli env add prod --host ch.prod.com --port 8443 --secure -u admin
  chcli env use prod
  chcli -e staging -q "SELECT 1"`);
}

async function envAdd(args: readonly string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args: args as string[],
    options: {
      host: { type: "string" },
      port: { type: "string" },
      user: { type: "string", short: "u" },
      password: { type: "string" },
      database: { type: "string", short: "d" },
      secure: { type: "boolean", short: "s", default: false },
      url: { type: "string" },
      "no-verify": { type: "boolean", default: false },
    },
    allowPositionals: true,
    strict: true,
  });

  const name = positionals[0];
  if (!name) {
    console.error("Error: environment name is required\nUsage: chcli env add <name> [options]");
    process.exit(1);
  }

  const env: Environment = {};
  if (values.host) env.host = values.host;
  if (values.port) env.port = values.port;
  if (values.user) env.user = values.user;
  if (values.password) env.password = values.password;
  if (values.database) env.database = values.database;
  if (values.secure) env.secure = values.secure;
  if (values.url) env.url = values.url;

  const existing = await getEnvironment(name);
  const merged = existing ? { ...existing, ...env } : env;

  // Require at least a host or url
  if (!merged.host && !merged.url) {
    console.error("Error: at least --host or --url is required");
    process.exit(1);
  }

  // Verify connection unless --no-verify is passed
  if (!values["no-verify"]) {
    const { createClient } = await import("@clickhouse/client");

    const connConfig = resolveConnectionConfig({} as CliConfig, {},merged);
    const client = createClient(connConfig);
    try {
      await client.query({ query: "SELECT 1", format: "JSON" });
    } catch (firstErr: any) {
      // If not already secure, retry with HTTPS on port 8443
      if (!merged.secure && !merged.url) {
        const secureEnv = { ...merged, secure: true, port: merged.port || "8443" };
        const secureConfig = resolveConnectionConfig({} as CliConfig, {},secureEnv);
        const secureClient = createClient(secureConfig);
        try {
          await secureClient.query({ query: "SELECT 1", format: "JSON" });
          merged.secure = true;
          if (!merged.port) merged.port = "8443";
          console.log("Detected HTTPS on port 8443 — added automatically");
        } catch (secondErr: any) {
          const msg = firstErr?.message ?? String(firstErr);
          console.error(`Error: connection to ClickHouse failed\n${msg}`);
          process.exit(1);
        } finally {
          await secureClient.close();
        }
      } else {
        const msg = firstErr?.message ?? String(firstErr);
        console.error(`Error: connection to ClickHouse failed\n${msg}`);
        process.exit(1);
      }
    } finally {
      await client.close();
    }
  }

  if (existing) {
    await setEnvironment(name, merged);
    console.log(`Updated environment "${name}"`);
  } else {
    await setEnvironment(name, merged);
    console.log(`Added environment "${name}"`);
  }
}

async function envList(): Promise<void> {
  const config = await readConfig();
  const names = Object.keys(config.environments);

  if (names.length === 0) {
    console.log("No environments configured. Use `chcli env add <name>` to add one.");
    return;
  }

  const cwd = process.cwd();
  const defaultEnv = config.defaults[cwd];

  for (const name of names) {
    const env = config.environments[name];
    const isDefault = name === defaultEnv;
    const marker = isDefault ? " (default)" : "";
    const host = env?.url ?? env?.host ?? "localhost";
    console.log(`  ${name}${marker} — ${host}`);
  }
}

async function envRemove(args: readonly string[]): Promise<void> {
  const name = args[0];
  if (!name) {
    console.error("Error: environment name is required\nUsage: chcli env remove <name>");
    process.exit(1);
  }

  const removed = await removeEnvironment(name);
  if (removed) {
    console.log(`Removed environment "${name}"`);
  } else {
    console.error(`Environment "${name}" not found`);
    process.exit(1);
  }
}

async function envUse(args: readonly string[]): Promise<void> {
  const name = args[0];
  if (!name) {
    console.error("Error: environment name is required\nUsage: chcli env use <name>");
    process.exit(1);
  }

  const cwd = process.cwd();
  await setDefault(cwd, name);
  console.log(`Default environment for ${cwd} set to "${name}"`);
}

async function envShow(args: readonly string[]): Promise<void> {
  const name = args[0];
  if (!name) {
    console.error("Error: environment name is required\nUsage: chcli env show <name>");
    process.exit(1);
  }

  const env = await getEnvironment(name);
  if (!env) {
    console.error(`Environment "${name}" not found`);
    process.exit(1);
    return;
  }

  console.log(`Environment: ${name}`);
  if (env.url) console.log(`  url:      ${env.url}`);
  if (env.host) console.log(`  host:     ${env.host}`);
  if (env.port) console.log(`  port:     ${env.port}`);
  if (env.user) console.log(`  user:     ${env.user}`);
  if (env.password) console.log(`  password: ****`);
  if (env.database) console.log(`  database: ${env.database}`);
  if (env.secure) console.log(`  secure:   true`);
}
