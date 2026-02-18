# Connection Configuration Reference

chcli connects to ClickHouse over HTTP(S). Connection details can be set via environment variables or CLI flags.

## Precedence

CLI flags take precedence over environment variables. If neither is set, the default value is used.

```
CLI flag > Environment variable > Default value
```

## Configuration Options

| Flag | Env Var | Default | Description |
|------|---------|---------|-------------|
| `--host <host>` | `CLICKHOUSE_HOST` | `localhost` | ClickHouse server hostname or IP |
| `--port <port>` | `CLICKHOUSE_PORT` | `8123` | HTTP interface port |
| `-u, --user <user>` | `CLICKHOUSE_USER` | `default` | Authentication username |
| `--password <pass>` | `CLICKHOUSE_PASSWORD` | *(empty)* | Authentication password |
| `-d, --database <db>` | `CLICKHOUSE_DATABASE` | `default` | Default database for queries |
| `-s, --secure` | `CLICKHOUSE_SECURE` | `false` | Use HTTPS instead of HTTP |

## Connection URL

chcli constructs the connection URL as:

```
{protocol}://{host}:{port}
```

Where `protocol` is `https` if `--secure` is set or `CLICKHOUSE_SECURE=true`, otherwise `http`.

## Examples

### Local Development (defaults)

No configuration needed — connects to `http://localhost:8123` with user `default`:

```bash
bunx chcli -q "SELECT 1"
```

### Remote Instance via CLI Flags

```bash
bunx chcli \
  --host ch.example.com \
  --port 8443 \
  --secure \
  --user admin \
  --password secret \
  -d analytics \
  -q "SELECT count() FROM events"
```

### Remote Instance via Environment Variables

Create a `.env` file (Bun loads it automatically):

```env
CLICKHOUSE_HOST=ch.example.com
CLICKHOUSE_PORT=8443
CLICKHOUSE_SECURE=true
CLICKHOUSE_USER=admin
CLICKHOUSE_PASSWORD=secret
CLICKHOUSE_DATABASE=analytics
```

Then run queries without connection flags:

```bash
bunx chcli -q "SELECT count() FROM events"
```

### ClickHouse Cloud

ClickHouse Cloud uses HTTPS on port 8443:

```env
CLICKHOUSE_HOST=abc123.us-east-1.aws.clickhouse.cloud
CLICKHOUSE_PORT=8443
CLICKHOUSE_SECURE=true
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=your-password
```

### Mixed (Env Vars + Flag Override)

Set base connection in `.env`, override database per-query:

```bash
bunx chcli -d other_db -q "SHOW TABLES"
```
