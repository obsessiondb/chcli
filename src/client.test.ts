import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { parseClickHouseUrl, resolveConnectionConfig } from "./client";

describe("parseClickHouseUrl", () => {
  test("parses https URL with explicit port", () => {
    const result = parseClickHouseUrl("https://ch.example.com:8443");
    expect(result).toEqual({
      host: "ch.example.com",
      port: "8443",
      secure: true,
      password: undefined,
    });
  });

  test("defaults port to 8443 for https", () => {
    const result = parseClickHouseUrl("https://ch.example.com");
    expect(result.port).toBe("8443");
    expect(result.secure).toBe(true);
  });

  test("defaults port to 8123 for http", () => {
    const result = parseClickHouseUrl("http://ch.example.com");
    expect(result.port).toBe("8123");
    expect(result.secure).toBe(false);
  });

  test("extracts password from URL", () => {
    const result = parseClickHouseUrl("https://user:s3cret@ch.example.com:8443");
    expect(result.password).toBe("s3cret");
  });

  test("password is undefined when not in URL", () => {
    const result = parseClickHouseUrl("https://ch.example.com:8443");
    expect(result.password).toBeUndefined();
  });
});

describe("resolveConnectionConfig", () => {
  const saved: Record<string, string | undefined> = {};
  const envKeys = [
    "CLICKHOUSE_URL",
    "CLICKHOUSE_HOST",
    "CLICKHOUSE_PORT",
    "CLICKHOUSE_SECURE",
    "CLICKHOUSE_USER",
    "CLICKHOUSE_USERNAME",
    "CLICKHOUSE_PASSWORD",
    "CLICKHOUSE_DATABASE",
    "CLICKHOUSE_DB",
  ];

  beforeEach(() => {
    for (const key of envKeys) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of envKeys) {
      if (saved[key] !== undefined) {
        process.env[key] = saved[key];
      } else {
        delete process.env[key];
      }
    }
  });

  const emptyConfig = {} as Parameters<typeof resolveConnectionConfig>[0];

  test("uses defaults when no env vars or flags set", () => {
    const result = resolveConnectionConfig(emptyConfig);
    expect(result).toEqual({
      url: "http://localhost:8123",
      username: "default",
      password: "",
      database: "default",
    });
  });

  test("CLICKHOUSE_URL sets host, port, secure", () => {
    process.env.CLICKHOUSE_URL = "https://ch.prod.com:8443";
    const result = resolveConnectionConfig(emptyConfig);
    expect(result.url).toBe("https://ch.prod.com:8443");
  });

  test("CLICKHOUSE_URL password is used as fallback", () => {
    process.env.CLICKHOUSE_URL = "https://user:urlpass@ch.prod.com:8443";
    const result = resolveConnectionConfig(emptyConfig);
    expect(result.password).toBe("urlpass");
  });

  test("CLICKHOUSE_PASSWORD takes precedence over URL password", () => {
    process.env.CLICKHOUSE_URL = "https://user:urlpass@ch.prod.com:8443";
    process.env.CLICKHOUSE_PASSWORD = "envpass";
    const result = resolveConnectionConfig(emptyConfig);
    expect(result.password).toBe("envpass");
  });

  test("CLICKHOUSE_HOST takes precedence over CLICKHOUSE_URL", () => {
    process.env.CLICKHOUSE_URL = "https://from-url.com:8443";
    process.env.CLICKHOUSE_HOST = "from-host-env.com";
    const result = resolveConnectionConfig(emptyConfig);
    expect(result.url).toBe("https://from-host-env.com:8443");
  });

  test("CLICKHOUSE_USERNAME is used when CLICKHOUSE_USER is not set", () => {
    process.env.CLICKHOUSE_USERNAME = "doppler_user";
    const result = resolveConnectionConfig(emptyConfig);
    expect(result.username).toBe("doppler_user");
  });

  test("CLICKHOUSE_USER takes precedence over CLICKHOUSE_USERNAME", () => {
    process.env.CLICKHOUSE_USER = "primary";
    process.env.CLICKHOUSE_USERNAME = "fallback";
    const result = resolveConnectionConfig(emptyConfig);
    expect(result.username).toBe("primary");
  });

  test("CLICKHOUSE_DB is used when CLICKHOUSE_DATABASE is not set", () => {
    process.env.CLICKHOUSE_DB = "doppler_db";
    const result = resolveConnectionConfig(emptyConfig);
    expect(result.database).toBe("doppler_db");
  });

  test("CLICKHOUSE_DATABASE takes precedence over CLICKHOUSE_DB", () => {
    process.env.CLICKHOUSE_DATABASE = "primary";
    process.env.CLICKHOUSE_DB = "fallback";
    const result = resolveConnectionConfig(emptyConfig);
    expect(result.database).toBe("primary");
  });

  test("CLI flags take precedence over all env vars", () => {
    process.env.CLICKHOUSE_URL = "https://from-url.com:9999";
    process.env.CLICKHOUSE_USER = "env_user";
    process.env.CLICKHOUSE_DATABASE = "env_db";
    process.env.CLICKHOUSE_PASSWORD = "env_pass";

    const config = {
      host: "flag-host",
      port: "1234",
      user: "flag_user",
      password: "flag_pass",
      database: "flag_db",
      secure: true,
    } as Parameters<typeof resolveConnectionConfig>[0];

    const result = resolveConnectionConfig(config);
    expect(result).toEqual({
      url: "https://flag-host:1234",
      username: "flag_user",
      password: "flag_pass",
      database: "flag_db",
    });
  });
});
