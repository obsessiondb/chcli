import { test, expect, describe } from "bun:test";
import { parseCliArgs } from "./cli";

describe("parseCliArgs", () => {
  test("parses inline query with -q", () => {
    const config = parseCliArgs(["-q", "SELECT 1"]);
    expect(config.query).toBe("SELECT 1");
  });

  test("parses inline query with --query", () => {
    const config = parseCliArgs(["--query", "SELECT 1"]);
    expect(config.query).toBe("SELECT 1");
  });

  test("parses file with -f", () => {
    const config = parseCliArgs(["-f", "/tmp/test.sql"]);
    expect(config.file).toBe("/tmp/test.sql");
  });

  test("parses connection flags", () => {
    const config = parseCliArgs([
      "--host", "db.example.com",
      "--port", "9000",
      "-u", "admin",
      "--password", "secret",
      "-d", "analytics",
      "-s",
    ]);
    expect(config.host).toBe("db.example.com");
    expect(config.port).toBe("9000");
    expect(config.user).toBe("admin");
    expect(config.password).toBe("secret");
    expect(config.database).toBe("analytics");
    expect(config.secure).toBe(true);
  });

  test("parses output flags", () => {
    const config = parseCliArgs(["-q", "SELECT 1", "-F", "json", "-t", "-v"]);
    expect(config.format).toBe("json");
    expect(config.time).toBe(true);
    expect(config.verbose).toBe(true);
  });

  test("parses --help flag", () => {
    const config = parseCliArgs(["--help"]);
    expect(config.help).toBe(true);
  });

  test("parses --version flag", () => {
    const config = parseCliArgs(["--version"]);
    expect(config.version).toBe(true);
  });

  test("defaults booleans to false", () => {
    const config = parseCliArgs(["-q", "SELECT 1"]);
    expect(config.secure).toBe(false);
    expect(config.time).toBe(false);
    expect(config.verbose).toBe(false);
    expect(config.help).toBe(false);
    expect(config.version).toBe(false);
  });

  test("leaves unspecified string options as undefined", () => {
    const config = parseCliArgs([]);
    expect(config.query).toBeUndefined();
    expect(config.file).toBeUndefined();
    expect(config.host).toBeUndefined();
    expect(config.format).toBeUndefined();
  });
});
