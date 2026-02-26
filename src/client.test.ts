import { describe, test, expect } from "bun:test";
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
  const emptyConfig = {} as Parameters<typeof resolveConnectionConfig>[0];
  const emptyEnv = {};

  test("uses defaults when no env vars or flags set", () => {
    const result = resolveConnectionConfig(emptyConfig, emptyEnv);
    expect(result).toEqual({
      url: "http://localhost:8123",
      username: "default",
      password: "",
      database: "default",
    });
  });

  test("CLICKHOUSE_URL sets host, port, secure", () => {
    const result = resolveConnectionConfig(emptyConfig, {
      CLICKHOUSE_URL: "https://ch.prod.com:8443",
    });
    expect(result.url).toBe("https://ch.prod.com:8443");
  });

  test("CLICKHOUSE_URL password is used as fallback", () => {
    const result = resolveConnectionConfig(emptyConfig, {
      CLICKHOUSE_URL: "https://user:urlpass@ch.prod.com:8443",
    });
    expect(result.password).toBe("urlpass");
  });

  test("CLICKHOUSE_PASSWORD takes precedence over URL password", () => {
    const result = resolveConnectionConfig(emptyConfig, {
      CLICKHOUSE_URL: "https://user:urlpass@ch.prod.com:8443",
      CLICKHOUSE_PASSWORD: "envpass",
    });
    expect(result.password).toBe("envpass");
  });

  test("CLICKHOUSE_HOST takes precedence over CLICKHOUSE_URL", () => {
    const result = resolveConnectionConfig(emptyConfig, {
      CLICKHOUSE_URL: "https://from-url.com:8443",
      CLICKHOUSE_HOST: "from-host-env.com",
    });
    expect(result.url).toBe("https://from-host-env.com:8443");
  });

  test("CLICKHOUSE_USERNAME is used when CLICKHOUSE_USER is not set", () => {
    const result = resolveConnectionConfig(emptyConfig, {
      CLICKHOUSE_USERNAME: "doppler_user",
    });
    expect(result.username).toBe("doppler_user");
  });

  test("CLICKHOUSE_USER takes precedence over CLICKHOUSE_USERNAME", () => {
    const result = resolveConnectionConfig(emptyConfig, {
      CLICKHOUSE_USER: "primary",
      CLICKHOUSE_USERNAME: "fallback",
    });
    expect(result.username).toBe("primary");
  });

  test("CLICKHOUSE_DB is used when CLICKHOUSE_DATABASE is not set", () => {
    const result = resolveConnectionConfig(emptyConfig, {
      CLICKHOUSE_DB: "doppler_db",
    });
    expect(result.database).toBe("doppler_db");
  });

  test("CLICKHOUSE_DATABASE takes precedence over CLICKHOUSE_DB", () => {
    const result = resolveConnectionConfig(emptyConfig, {
      CLICKHOUSE_DATABASE: "primary",
      CLICKHOUSE_DB: "fallback",
    });
    expect(result.database).toBe("primary");
  });

  test("CLI flags take precedence over all env vars", () => {
    const env = {
      CLICKHOUSE_URL: "https://from-url.com:9999",
      CLICKHOUSE_USER: "env_user",
      CLICKHOUSE_DATABASE: "env_db",
      CLICKHOUSE_PASSWORD: "env_pass",
    };

    const config = {
      host: "flag-host",
      port: "1234",
      user: "flag_user",
      password: "flag_pass",
      database: "flag_db",
      secure: true,
    } as Parameters<typeof resolveConnectionConfig>[0];

    const result = resolveConnectionConfig(config, env);
    expect(result).toEqual({
      url: "https://flag-host:1234",
      username: "flag_user",
      password: "flag_pass",
      database: "flag_db",
    });
  });
});
