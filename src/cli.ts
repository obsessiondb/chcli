import { parseArgs } from "node:util";

const options = {
  query: { type: "string", short: "q" },
  file: { type: "string", short: "f" },
  host: { type: "string" },
  port: { type: "string" },
  user: { type: "string", short: "u" },
  password: { type: "string" },
  database: { type: "string", short: "d" },
  secure: { type: "boolean", short: "s", default: false },
  format: { type: "string", short: "F" },
  time: { type: "boolean", short: "t", default: false },
  verbose: { type: "boolean", short: "v", default: false },
  help: { type: "boolean", default: false },
  version: { type: "boolean", default: false },
} as const;

export type CliConfig = ReturnType<typeof parseCliArgs>;

export function parseCliArgs(args?: string[]) {
  const { values } = parseArgs({
    options,
    strict: true,
    args: args ?? process.argv.slice(2),
  });
  return values;
}

export function printHelp() {
  console.log(`chcli — ClickHouse CLI

Usage: chcli [options]

Query input (one of):
  -q, --query <sql>       Inline SQL query
  -f, --file <path>       Path to .sql file
  (stdin)                 Pipe query via stdin

Connection:
      --host <host>       ClickHouse host (env: CLICKHOUSE_HOST, default: localhost)
      --port <port>       HTTP port (env: CLICKHOUSE_PORT, default: 8123)
  -u, --user <user>       Username (env: CLICKHOUSE_USER, default: default)
      --password <pass>   Password (env: CLICKHOUSE_PASSWORD, default: "")
  -d, --database <db>     Database (env: CLICKHOUSE_DATABASE, default: default)
  -s, --secure            Use HTTPS (env: CLICKHOUSE_SECURE)

Output:
  -F, --format <fmt>      Output format (json, jsonl, csv, tsv, pretty, vertical, markdown, sql)
  -t, --time              Print execution time to stderr
  -v, --verbose           Print query metadata to stderr

Other:
      --help              Show help text
      --version           Print version`);
}

export function printVersion() {
  const pkg = require("../package.json");
  console.log(`chcli ${pkg.version}`);
}
