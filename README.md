# chcli

A lightweight ClickHouse CLI built on [Bun](https://bun.sh).

## Install

```bash
bun install
```

## Usage

```bash
bun run index.ts [options]
```

### Query input

Provide a query via one of three methods:

```bash
# Inline query
chcli -q "SELECT 1"

# From a .sql file
chcli -f query.sql

# Piped via stdin
echo "SELECT 1" | chcli
```

### ClickHouse connection

Connection parameters can be set via CLI flags or environment variables. CLI flags take precedence over environment variables.

| Flag | Env var | Default | Description |
|------|---------|---------|-------------|
| `--host <host>` | `CLICKHOUSE_HOST` | `localhost` | ClickHouse host |
| `--port <port>` | `CLICKHOUSE_PORT` | `8123` | HTTP port |
| `-u, --user <user>` | `CLICKHOUSE_USER` | `default` | Username |
| `--password <pass>` | `CLICKHOUSE_PASSWORD` | *(empty)* | Password |
| `-d, --database <db>` | `CLICKHOUSE_DATABASE` | `default` | Database |
| `-s, --secure` | `CLICKHOUSE_SECURE` | `false` | Use HTTPS |

#### Examples

Connect to a local instance (defaults):

```bash
chcli -q "SHOW DATABASES"
```

Connect to a remote instance:

```bash
chcli --host ch.example.com --port 8443 --secure \
      --user admin --password secret \
      -d analytics \
      -q "SELECT count() FROM events"
```

Using environment variables (Bun loads `.env` automatically):

```env
CLICKHOUSE_HOST=ch.example.com
CLICKHOUSE_PORT=8443
CLICKHOUSE_SECURE=true
CLICKHOUSE_USER=admin
CLICKHOUSE_PASSWORD=secret
CLICKHOUSE_DATABASE=analytics
```

```bash
chcli -q "SELECT count() FROM events"
```

### Output options

| Flag | Description |
|------|-------------|
| `-F, --format <fmt>` | Output format (see below) |
| `-t, --time` | Print execution time to stderr |
| `-v, --verbose` | Print query metadata to stderr |

#### Formats

When connected to a TTY, the default format is `pretty`. When piping output, the default is `tsv`.

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

You can also pass any native ClickHouse format name directly.

### Other flags

| Flag | Description |
|------|-------------|
| `--help` | Show help text |
| `--version` | Print version |
