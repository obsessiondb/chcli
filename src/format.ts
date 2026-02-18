const FORMAT_ALIASES: Record<string, string> = {
  json: "JSON",
  jsonl: "JSONEachRow",
  ndjson: "JSONEachRow",
  jsoncompact: "JSONCompact",
  csv: "CSVWithNames",
  tsv: "TabSeparatedWithNames",
  pretty: "PrettyCompactMonoBlock",
  vertical: "Vertical",
  markdown: "Markdown",
  sql: "SQLInsert",
};

export function resolveFormat(userFormat: string | undefined): string {
  if (userFormat) {
    return FORMAT_ALIASES[userFormat.toLowerCase()] ?? userFormat;
  }
  return process.stdout.isTTY ? "PrettyCompactMonoBlock" : "TabSeparatedWithNames";
}
