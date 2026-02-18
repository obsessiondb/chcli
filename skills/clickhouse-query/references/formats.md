# Output Formats Reference

chcli supports format aliases that map to ClickHouse native format names. Use the `-F` / `--format` flag to specify the output format.

## Default Behavior

- **TTY (interactive terminal):** `pretty` (PrettyCompactMonoBlock) — human-readable tables
- **Piped/redirected output:** `tsv` (TabSeparatedWithNames) — machine-friendly tab-separated values

## Format Alias Table

| Alias | ClickHouse Format | Description |
|-------|-------------------|-------------|
| `json` | JSON | Full JSON object with `data` array, column metadata, row count, and statistics |
| `jsonl` | JSONEachRow | One JSON object per line (newline-delimited JSON) |
| `ndjson` | JSONEachRow | Alias for `jsonl` |
| `jsoncompact` | JSONCompact | JSON with column names separate from row data (arrays instead of objects) |
| `csv` | CSVWithNames | Comma-separated values with a header row |
| `tsv` | TabSeparatedWithNames | Tab-separated values with a header row |
| `pretty` | PrettyCompactMonoBlock | Human-readable bordered table |
| `vertical` | Vertical | Each column on its own line (useful for wide rows) |
| `markdown` | Markdown | Markdown-formatted table |
| `sql` | SQLInsert | Output as SQL INSERT statements |

Any format name not in this table is passed directly to ClickHouse, so you can use any native ClickHouse format (e.g., `Parquet`, `Arrow`, `Avro`).

## Choosing a Format

### For Agent/Programmatic Use

- **`json`** — Best for structured parsing. Returns a complete JSON object:
  ```json
  {
    "meta": [{"name": "count()", "type": "UInt64"}],
    "data": [{"count()": "42"}],
    "rows": 1,
    "statistics": {"elapsed": 0.001, "rows_read": 100}
  }
  ```
- **`jsonl`** — Best for large result sets or streaming. One JSON object per line:
  ```
  {"id": 1, "name": "Alice"}
  {"id": 2, "name": "Bob"}
  ```
- **`csv`** — Good for tabular data and import/export workflows.

### For Human Display

- **`pretty`** — Default in terminals. Bordered table layout.
- **`vertical`** — Useful when rows have many columns. Each row displayed vertically.
- **`markdown`** — Useful for embedding query results in documentation.
