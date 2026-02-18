import { createClient } from "@clickhouse/client";
import type { CliConfig } from "./cli";

export function parseClickHouseUrl(raw: string) {
  const url = new URL(raw);
  return {
    host: url.hostname,
    port: url.port || (url.protocol === "https:" ? "8443" : "8123"),
    secure: url.protocol === "https:",
    password: url.password || undefined,
  };
}

export function resolveConnectionConfig(config: CliConfig) {
  const parsed = process.env.CLICKHOUSE_URL
    ? parseClickHouseUrl(process.env.CLICKHOUSE_URL)
    : undefined;

  const host =
    config.host || process.env.CLICKHOUSE_HOST || parsed?.host || "localhost";
  const port =
    config.port || process.env.CLICKHOUSE_PORT || parsed?.port || "8123";
  const secure =
    config.secure ||
    process.env.CLICKHOUSE_SECURE === "true" ||
    (parsed?.secure ?? false);
  const protocol = secure ? "https" : "http";

  return {
    url: `${protocol}://${host}:${port}`,
    username:
      config.user ||
      process.env.CLICKHOUSE_USER ||
      process.env.CLICKHOUSE_USERNAME ||
      "default",
    password:
      config.password ||
      process.env.CLICKHOUSE_PASSWORD ||
      parsed?.password ||
      "",
    database:
      config.database ||
      process.env.CLICKHOUSE_DATABASE ||
      process.env.CLICKHOUSE_DB ||
      "default",
  };
}

export function createClickHouseClient(config: CliConfig) {
  return createClient(resolveConnectionConfig(config));
}
