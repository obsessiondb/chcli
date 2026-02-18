# Connection Configuration Reference

chcli connects to ClickHouse over HTTP(S). Connection details can be set via environment variables or CLI flags.

## Resolution Order

```
CLI flag > Individual env var > CLICKHOUSE_URL (parsed) > Default value
```

When `CLICKHOUSE_URL` is set (e.g. `https://host:8443`), it is parsed into host, port, secure, and password. These parsed values are used as fallbacks only when the corresponding individual env var is not set.

## Configuration Options

| Flag | Env Var | Alt Env Var | Default | Description |
|------|---------|-------------|---------|-------------|
| `--host <host>` | `CLICKHOUSE_HOST` | | `localhost` | ClickHouse server hostname or IP |
| `--port <port>` | `CLICKHOUSE_PORT` | | `8123` | HTTP interface port |
| `-u, --user <user>` | `CLICKHOUSE_USER` | `CLICKHOUSE_USERNAME` | `default` | Authentication username |
| `--password <pass>` | `CLICKHOUSE_PASSWORD` | | *(empty)* | Authentication password |
| `-d, --database <db>` | `CLICKHOUSE_DATABASE` | `CLICKHOUSE_DB` | `default` | Default database for queries |
| `-s, --secure` | `CLICKHOUSE_SECURE` | | `false` | Use HTTPS instead of HTTP |
| *(none)* | `CLICKHOUSE_URL` | | *(none)* | Full connection URL (parsed into host, port, secure, password) |

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
bunx @obsessiondb/chcli -q "SELECT 1"
```

### Remote Instance via CLI Flags

```bash
bunx @obsessiondb/chcli \
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
bunx @obsessiondb/chcli -q "SELECT count() FROM events"
```

### Remote Instance via CLICKHOUSE_URL

If your provider gives you a single connection URL, set `CLICKHOUSE_URL`:

```env
CLICKHOUSE_URL=https://ch.example.com:8443
CLICKHOUSE_USER=admin
CLICKHOUSE_PASSWORD=secret
CLICKHOUSE_DATABASE=analytics
```

Host, port, and secure are parsed from the URL. You can still set user, password, and database individually — individual env vars always take precedence over values parsed from the URL.

```bash
bunx @obsessiondb/chcli -q "SELECT count() FROM events"
```

### ClickHouse Cloud

ClickHouse Cloud uses HTTPS on port 8443. You can use either individual env vars or `CLICKHOUSE_URL`:

```env
# Option A: Individual env vars
CLICKHOUSE_HOST=abc123.us-east-1.aws.clickhouse.cloud
CLICKHOUSE_PORT=8443
CLICKHOUSE_SECURE=true
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=your-password
```

```env
# Option B: CLICKHOUSE_URL
CLICKHOUSE_URL=https://abc123.us-east-1.aws.clickhouse.cloud:8443
CLICKHOUSE_PASSWORD=your-password
```

### Using a Secrets Manager (Doppler)

If you use Doppler or another secrets manager, wrap the chcli command:

```bash
doppler run -- bunx @obsessiondb/chcli -q "SELECT count() FROM events"
```

### Mixed (Env Vars + Flag Override)

Set base connection in `.env`, override database per-query:

```bash
bunx @obsessiondb/chcli -d other_db -q "SHOW TABLES"
```
