---
name: clickhouse-query
description: Query ClickHouse databases using the chcli CLI tool. Use when the user wants to run SQL queries against ClickHouse, explore database schemas, inspect tables, or extract data from ClickHouse.
metadata:
  author: obsessiondb
  version: "1.0"
compatibility: Requires bun or node (for bunx/npx). Needs network access to a ClickHouse instance.
allowed-tools: Bash(bunx chcli:*) Bash(npx chcli:*) Bash(chcli:*) Read Write
---

# chcli — ClickHouse CLI

chcli is a lightweight ClickHouse command-line client. Use it to run SQL queries, explore schemas, and extract data from ClickHouse databases.

## Running chcli

Prefer `bunx` if Bun is available, otherwise use `npx`:

```bash
bunx chcli -q "SELECT 1"
npx chcli -q "SELECT 1"
```

Or install globally:

```bash
bun install -g chcli
chcli -q "SELECT 1"
```

## Connection

Set connection details via environment variables (preferred for agent use) or CLI flags. CLI flags override env vars.

| Flag | Env Var | Default |
|------|---------|---------|
| `--host` | `CLICKHOUSE_HOST` | `localhost` |
| `--port` | `CLICKHOUSE_PORT` | `8123` |
| `-u, --user` | `CLICKHOUSE_USER` | `default` |
| `--password` | `CLICKHOUSE_PASSWORD` | *(empty)* |
| `-d, --database` | `CLICKHOUSE_DATABASE` | `default` |
| `-s, --secure` | `CLICKHOUSE_SECURE` | `false` |

For agent workflows, prefer setting env vars in a `.env` file (Bun loads `.env` automatically) so every invocation uses the same connection without repeating flags.

See `references/connection.md` for detailed connection examples.

## Query Patterns

**Inline query** (most common for agents):

```bash
bunx chcli -q "SELECT count() FROM events"
```

**From a SQL file:**

```bash
bunx chcli -f query.sql
```

**Via stdin pipe:**

```bash
echo "SELECT 1" | bunx chcli
```

## Output Formats

**Always use `-F json` or `-F csv` when the output will be parsed by an agent.** The default format (`pretty`) is for human display and is difficult to parse programmatically.

```bash
# JSON — best for structured parsing
bunx chcli -q "SELECT * FROM events LIMIT 5" -F json

# CSV — good for tabular data
bunx chcli -q "SELECT * FROM events LIMIT 5" -F csv

# JSONL (one JSON object per line) — good for streaming/large results
bunx chcli -q "SELECT * FROM events LIMIT 100" -F jsonl
```

Available format aliases: `json`, `jsonl`/`ndjson`, `jsoncompact`, `csv`, `tsv`, `pretty`, `vertical`, `markdown`, `sql`. Any native ClickHouse format name also works.

See `references/formats.md` for the full format reference.

## Common Workflows

### Schema Discovery

```bash
# List all databases
bunx chcli -q "SHOW DATABASES" -F json

# List tables in current database
bunx chcli -q "SHOW TABLES" -F json

# List tables in a specific database
bunx chcli -q "SHOW TABLES FROM analytics" -F json

# Describe table schema
bunx chcli -q "DESCRIBE TABLE events" -F json

# Show CREATE TABLE statement
bunx chcli -q "SHOW CREATE TABLE events"
```

### Data Exploration

```bash
# Row count
bunx chcli -q "SELECT count() FROM events" -F json

# Sample rows
bunx chcli -q "SELECT * FROM events LIMIT 10" -F json

# Column statistics
bunx chcli -q "SELECT uniq(user_id), min(created_at), max(created_at) FROM events" -F json
```

### Data Extraction

```bash
# Extract to CSV file
bunx chcli -q "SELECT * FROM events WHERE date = '2024-01-01'" -F csv > export.csv

# Extract as JSON
bunx chcli -q "SELECT * FROM events LIMIT 1000" -F json > export.json
```

## Additional Flags

| Flag | Description |
|------|-------------|
| `-t, --time` | Print execution time to stderr |
| `-v, --verbose` | Print query metadata (format, elapsed time) to stderr |
| `--help` | Show help text |
| `--version` | Print version |

## Best Practices for Agents

1. **Always specify `-F json` or `-F csv`** — never rely on the default format, which varies by TTY context.
2. **Always use `LIMIT`** on SELECT queries unless you know the table is small. ClickHouse tables can contain billions of rows.
3. **Start with schema discovery** — run `SHOW TABLES` and `DESCRIBE TABLE` before querying unfamiliar databases.
4. **Use `-t` for timing** — helps gauge whether queries are efficient.
5. **Prefer env vars for connection** — set them once in `.env` rather than repeating flags on every command.
6. **Use `count()` first** — before extracting data, check how many rows match to avoid overwhelming output.
