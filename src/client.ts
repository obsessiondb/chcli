import { createClient } from "@clickhouse/client";
import type { CliConfig } from "./cli";

export function createClickHouseClient(config: CliConfig) {
  const host = config.host ?? process.env.CLICKHOUSE_HOST ?? "localhost";
  const port = config.port ?? process.env.CLICKHOUSE_PORT ?? "8123";
  const secure = config.secure || process.env.CLICKHOUSE_SECURE === "true";
  const protocol = secure ? "https" : "http";

  return createClient({
    url: `${protocol}://${host}:${port}`,
    username: config.user ?? process.env.CLICKHOUSE_USER ?? "default",
    password: config.password ?? process.env.CLICKHOUSE_PASSWORD ?? "",
    database: config.database ?? process.env.CLICKHOUSE_DATABASE ?? "default",
  });
}
