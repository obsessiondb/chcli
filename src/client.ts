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

export function resolveConnectionConfig(
  config: CliConfig,
  env: Record<string, string | undefined> = process.env,
) {
  const parsed = env.CLICKHOUSE_URL
    ? parseClickHouseUrl(env.CLICKHOUSE_URL)
    : undefined;

  const host =
    config.host || env.CLICKHOUSE_HOST || parsed?.host || "localhost";
  const port =
    config.port || env.CLICKHOUSE_PORT || parsed?.port || "8123";
  const secure =
    config.secure ||
    env.CLICKHOUSE_SECURE === "true" ||
    (parsed?.secure ?? false);
  const protocol = secure ? "https" : "http";

  return {
    url: `${protocol}://${host}:${port}`,
    username:
      config.user ||
      env.CLICKHOUSE_USER ||
      env.CLICKHOUSE_USERNAME ||
      "default",
    password:
      config.password ||
      env.CLICKHOUSE_PASSWORD ||
      parsed?.password ||
      "",
    database:
      config.database ||
      env.CLICKHOUSE_DATABASE ||
      env.CLICKHOUSE_DB ||
      "default",
  };
}

export function createClickHouseClient(config: CliConfig) {
  return createClient(resolveConnectionConfig(config));
}
