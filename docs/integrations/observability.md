---
title: Observability Integrations
description: Monitor your logs and application health.
---

# Observability Integrations

Keep track of what's happening inside your workflows by sending logs to external monitoring tools.

## Supported Providers

### Loki
Push logs to a Grafana Loki instance.
- **Configuration**:
    - **Base URL**: The address of your Loki instance.
    - **Username/Password**: Authenticated access (optional).

### OpenTelemetry Logs (OTLP)
Send logs to any OpenTelemetry-compatible observability backend via the OTLP HTTP JSON standard.

- **Configuration**:
    - **Base URL**: The OTLP Logs endpoint of your provider.
    - **Credentials/Base64 Value**: Basic Auth credentials (or API Keys) for your provider.

#### Examples

**Datadog**
- **Base URL**: `https://http-intake.logs.datadoghq.com/api/v2/logs`
- **Credentials**: Select "Base64 Encoded" and provide your Datadog API Key.

**OpenObserve**
- **Base URL**: `https://<YOUR_OPENOBSERVE_HOST>/api/<ORG_ID>`
- **Credentials**: Select "Credentials" and enter your OpenObserve Email and Password.

**Better Stack**
- **Base URL**: `https://in.logs.betterstack.com/v1/logs`
- **Credentials**: Select "Base64 Encoded" and provide your Better Stack Source Token.

## functionality

Once configured, use the **Cloud Logs** block to send structured logs (Info, Warning, Error) directly to these services from your workflow.
