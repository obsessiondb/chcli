import { test, expect, describe } from "bun:test";
import { resolveFormat } from "./format";

describe("resolveFormat", () => {
  test("resolves known aliases to ClickHouse format names", () => {
    expect(resolveFormat("json")).toBe("JSON");
    expect(resolveFormat("jsonl")).toBe("JSONEachRow");
    expect(resolveFormat("ndjson")).toBe("JSONEachRow");
    expect(resolveFormat("jsoncompact")).toBe("JSONCompact");
    expect(resolveFormat("csv")).toBe("CSVWithNames");
    expect(resolveFormat("tsv")).toBe("TabSeparatedWithNames");
    expect(resolveFormat("pretty")).toBe("PrettyCompactMonoBlock");
    expect(resolveFormat("vertical")).toBe("Vertical");
    expect(resolveFormat("markdown")).toBe("Markdown");
    expect(resolveFormat("sql")).toBe("SQLInsert");
  });

  test("aliases are case-insensitive", () => {
    expect(resolveFormat("JSON")).toBe("JSON");
    expect(resolveFormat("Csv")).toBe("CSVWithNames");
    expect(resolveFormat("PRETTY")).toBe("PrettyCompactMonoBlock");
  });

  test("passes through unrecognized format strings as-is", () => {
    expect(resolveFormat("PrettySpace")).toBe("PrettySpace");
    expect(resolveFormat("Arrow")).toBe("Arrow");
    expect(resolveFormat("Native")).toBe("Native");
  });

  test("defaults to PrettyCompactMonoBlock when stdout is a TTY", () => {
    expect(resolveFormat(undefined, true)).toBe("PrettyCompactMonoBlock");
  });

  test("defaults to TabSeparatedWithNames when stdout is not a TTY", () => {
    expect(resolveFormat(undefined, false)).toBe("TabSeparatedWithNames");
  });
});
