# endpointwatch

A lightweight CLI tool for monitoring REST API uptime and latency with configurable alerting thresholds.

---

## Installation

```bash
npm install -g endpointwatch
```

Or run directly with npx:

```bash
npx endpointwatch
```

---

## Usage

Define your endpoints in a `endpoints.json` config file:

```json
{
  "endpoints": [
    {
      "name": "Production API",
      "url": "https://api.example.com/health",
      "interval": 30,
      "thresholds": {
        "latency": 500,
        "statusCode": 200
      }
    }
  ]
}
```

Then start monitoring:

```bash
endpointwatch --config ./endpoints.json
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--config` | Path to config file | `./endpoints.json` |
| `--interval` | Global poll interval (seconds) | `60` |
| `--alert` | Alert output: `console`, `webhook` | `console` |
| `--verbose` | Enable detailed logging | `false` |

**Example output:**

```
✔  Production API     142ms   200 OK
✖  Payments Service  timeout  503 Service Unavailable  [ALERT]
```

---

## Requirements

- Node.js >= 16
- TypeScript >= 5.0

---

## License

[MIT](LICENSE)