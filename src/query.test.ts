import { test, expect, describe } from "bun:test";
import { resolveQuery } from "./query";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("resolveQuery", () => {
  test("returns inline query from --query flag", async () => {
    const query = await resolveQuery({ query: "SELECT 1" } as any);
    expect(query).toBe("SELECT 1");
  });

  test("reads query from file via --file flag", async () => {
    const path = join(tmpdir(), `chcli-test-${Date.now()}.sql`);
    await Bun.write(path, "SELECT version()");
    const query = await resolveQuery({ file: path } as any);
    expect(query).toBe("SELECT version()");
  });

  test("prefers --query over --file", async () => {
    const query = await resolveQuery({
      query: "SELECT 1",
      file: "/tmp/should-not-read.sql",
    } as any);
    expect(query).toBe("SELECT 1");
  });
});
