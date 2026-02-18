# chcli

A lightweight ClickHouse CLI built on [Bun](https://bun.sh).

## Install

```bash
npm install -g @obsessiondb/chcli
```

## Query input

Provide a query inline, from a file, or piped via stdin:

```bash
chcli -q "SELECT 1"
chcli -f query.sql
echo "SELECT 1" | chcli
```

## Connecting to ClickHouse

Connection can be configured via CLI flags or environment variables. Flags take precedence.

| Flag | Env var | Default |
|------|---------|---------|
| `--host <host>` | `CLICKHOUSE_HOST` | `localhost` |
| `--port <port>` | `CLICKHOUSE_PORT` | `8123` |
| `-u, --user <user>` | `CLICKHOUSE_USER` | `default` |
| `--password <pass>` | `CLICKHOUSE_PASSWORD` | *(empty)* |
| `-d, --database <db>` | `CLICKHOUSE_DATABASE` | `default` |
| `-s, --secure` | `CLICKHOUSE_SECURE` | `false` |

```bash
# Local instance with defaults
chcli -q "SHOW DATABASES"

# Remote instance
chcli --host ch.example.com --port 8443 --secure \
      -u admin --password secret \
      -d analytics -q "SELECT count() FROM events"
```

Or set your connection in a `.env` file (Bun loads it automatically):

```env
CLICKHOUSE_HOST=ch.example.com
CLICKHOUSE_PORT=8443
CLICKHOUSE_SECURE=true
CLICKHOUSE_USER=admin
CLICKHOUSE_PASSWORD=secret
CLICKHOUSE_DATABASE=analytics
```

## Output formats

| Flag | Description |
|------|-------------|
| `-F, --format <fmt>` | Output format (see table below) |
| `-t, --time` | Print execution time to stderr |
| `-v, --verbose` | Print query metadata to stderr |

Default format is `pretty` in a terminal, `tsv` when piping.

| Alias | ClickHouse format |
|-------|-------------------|
| `json` | JSON |
| `jsonl` / `ndjson` | JSONEachRow |
| `csv` | CSVWithNames |
| `tsv` | TabSeparatedWithNames |
| `pretty` | PrettyCompactMonoBlock |
| `vertical` | Vertical |
| `markdown` | Markdown |
| `sql` | SQLInsert |

Any native ClickHouse format name is also accepted directly.

```bash
chcli -q "SELECT * FROM events LIMIT 5" -F json
chcli -q "SHOW TABLES" -F csv > tables.csv
```

## Agent Skill

chcli ships as an [Agent Skill](https://agentskills.io) so AI coding agents (Claude Code, Cursor, etc.) can query your ClickHouse databases directly.

```bash
npx skills add obsessiondb/chcli
```

Once installed, your agent can run SQL queries, explore schemas, and extract data using `chcli` — no manual copy-pasting required.

---

Sponsored by [obsessiondb.com](https://obsessiondb.com)
