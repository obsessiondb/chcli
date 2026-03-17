import { createClient } from "@clickhouse/client";
import type { CliConfig } from "./cli";
import type { Environment } from "./config";

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
  namedEnv?: Environment,
) {
  // Parse CLICKHOUSE_URL from env vars
  const parsed = env.CLICKHOUSE_URL
    ? parseClickHouseUrl(env.CLICKHOUSE_URL)
    : undefined;

  // Parse url from named environment
  const namedParsed = namedEnv?.url
    ? parseClickHouseUrl(namedEnv.url)
    : undefined;

  // Priority: CLI flags > named env > env vars > CLICKHOUSE_URL > defaults
  const host =
    config.host ||
    namedEnv?.host || namedParsed?.host ||
    env.CLICKHOUSE_HOST || parsed?.host ||
    "localhost";
  const port =
    config.port ||
    namedEnv?.port || namedParsed?.port ||
    env.CLICKHOUSE_PORT || parsed?.port ||
    "8123";
  const secure =
    config.secure ||
    namedEnv?.secure || (namedParsed?.secure ?? false) ||
    env.CLICKHOUSE_SECURE === "true" ||
    (parsed?.secure ?? false);
  const protocol = secure ? "https" : "http";

  return {
    url: `${protocol}://${host}:${port}`,
    username:
      config.user ||
      namedEnv?.user ||
      env.CLICKHOUSE_USER ||
      env.CLICKHOUSE_USERNAME ||
      "default",
    password:
      config.password ||
      namedEnv?.password || namedParsed?.password ||
      env.CLICKHOUSE_PASSWORD ||
      parsed?.password ||
      "",
    database:
      config.database ||
      namedEnv?.database ||
      env.CLICKHOUSE_DATABASE ||
      env.CLICKHOUSE_DB ||
      "default",
  };
}

export function createClickHouseClient(
  config: CliConfig,
  namedEnv?: Environment,
) {
  return createClient(resolveConnectionConfig(config, process.env, namedEnv));
}
