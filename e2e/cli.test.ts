import { describe, test, expect, beforeAll } from "bun:test";
import { $ } from "bun";

const CLI = "./dist/chcli";

beforeAll(async () => {
  await $`bun run build`.quiet();
  // Fail fast if ClickHouse is not reachable
  await $`${CLI} -q "SELECT 1"`.quiet();
});

describe("e2e", () => {
  test("SELECT 1 returns 1", async () => {
    const result = await $`${CLI} -q "SELECT 1 AS val" -F csv`.text();
    const lines = result.trim().split("\n");
    expect(lines[0]).toBe('"val"');
    expect(lines[1]).toBe("1");
  });

  test("inline query with json format", async () => {
    const result = await $`${CLI} -q "SELECT 42 AS answer" -F json`.text();
    const json = JSON.parse(result);
    expect(json.data).toEqual([{ answer: 42 }]);
  });

  test("pipe query via stdin", async () => {
    const result =
      await $`echo "SELECT 'hello' AS greeting" | ${CLI} -F csv`.text();
    const lines = result.trim().split("\n");
    expect(lines[0]).toBe('"greeting"');
    expect(lines[1]).toBe('"hello"');
  });

  test("query from file", async () => {
    const tmpFile = "/tmp/chcli-test-query.sql";
    await Bun.write(tmpFile, "SELECT 99 AS num");
    const result = await $`${CLI} -f ${tmpFile} -F csv`.text();
    const lines = result.trim().split("\n");
    expect(lines[1]).toBe("99");
  });

  test("--time flag prints elapsed time", async () => {
    const result = await $`${CLI} -q "SELECT 1" -t -F csv`.nothrow();
    const stderr = result.stderr.toString();
    expect(stderr).toContain("Elapsed:");
  });

  test("tsv format works", async () => {
    const result =
      await $`${CLI} -q "SELECT 1 AS a, 2 AS b" -F tsv`.text();
    const lines = result.trim().split("\n");
    expect(lines[0]).toBe("a\tb");
    expect(lines[1]).toBe("1\t2");
  });

  test("SHOW DATABASES returns results", async () => {
    const result = await $`${CLI} -q "SHOW DATABASES" -F csv`.text();
    expect(result).toContain("name");
  });

  test("multi-row query with markdown format", async () => {
    const result =
      await $`${CLI} -q "SELECT number AS n FROM system.numbers LIMIT 3" -F markdown`.text();
    expect(result).toContain("| n |");
    expect(result).toContain("| 0 |");
    expect(result).toContain("| 1 |");
    expect(result).toContain("| 2 |");
  });
});
