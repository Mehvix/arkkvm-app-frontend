# ArkKVM Frontend

## Overview

ArkKVM Frontend is the web frontend for ArkKVM device and cloud workflows. It is not a complete standalone KVM system.

Full functionality depends on compatible ArkKVM device backend, cloud backend, firmware, signaling service, and device-side APIs. This repository focuses on the frontend application, development/build scripts, and frontend artifacts for deployment.

## Requirements

- Node.js `20.18.0`
- pnpm `10.11.1`

These versions match the repository Volta configuration.

## Quick Start

Install dependencies:

```bash
pnpm install
```

Start device development mode:

```bash
DEVICE_IP=<device-ip> pnpm dev
```

Start cloud development mode:

```bash
API_DOMAIN=https://api.example.com pnpm dev:cloud
```

Build default artifacts:

```bash
pnpm build
```

## Development

Package scripts:

```bash
pnpm dev          # Start device development mode; requires DEVICE_IP
pnpm dev:cloud    # Start cloud development mode
pnpm build        # Build device and versioned cloud outputs
pnpm build:test   # Build test environment outputs
pnpm build:flat   # Build device and self-hosted flat cloud outputs
pnpm check        # Run project checks
pnpm lint         # Run ESLint
pnpm lint:fix     # Run ESLint with fixes
```

`run.sh` is the unified development and target build entry:

```bash
./run.sh <action> <target> [env] [value]
```

- `action`: `dev` or `build`
- `target`: `device` or `cloud`
- `env`: `test` or `pro`, default `test`
- `value`:
  - `device`: device IP
  - `cloud`: cloud API domain

Examples:

```bash
./run.sh dev device test <device-ip>
DEVICE_IP=<device-ip> ./run.sh dev device
./run.sh dev cloud test https://api.example.com
API_DOMAIN=https://api.example.com ./run.sh dev cloud
```

Default dev URLs:

- Device dev: `http://localhost:9000`
- Cloud dev: `http://localhost:80`

Port `80` may require elevated permissions or local configuration changes.

## Build

`build.sh` runs the full frontend build flow:

```bash
./build.sh [env] [version]
./build.sh [version]
```

- `env`: `pro` or `test`, default `pro`
- `version`: optional. If omitted, a version is generated automatically.
- Passing only a version uses the default `pro` environment.

Examples:

```bash
./build.sh
./build.sh test
./build.sh 1.2.3
./build.sh pro 1.2.3
```

Build output:

- `dist/device/`
- `dist/{version}/` or `dist/cloud/`
- `dist/{version}.zip` or `dist/cloud.zip`
- `dist/version`

## Cloud Build Modes

Cloud builds support two output modes.

Versioned mode is the default and is used for official cloud release layout:

- `dist/{version}/`
- `dist/{version}.zip`
- `assetPrefix = /{version}/`

```bash
./build.sh pro 0.2.26061893
```

Flat mode is intended for self-hosted deployments served from the domain root:

- `dist/cloud/`
- `dist/cloud.zip`
- `assetPrefix = /`

```bash
CLOUD_BUILD_MODE=flat ./build.sh pro 0.2.26061893
pnpm build:flat
```

If `CLOUD_BUILD_MODE` is omitted or set to any value other than `flat`, the build uses versioned mode.

## Environment Variables

| Variable | Description | Example / Default |
| --- | --- | --- |
| `DEVICE_IP` | Device IP for device dev mode when no script value is provided | `192.168.x.x` |
| `API_DOMAIN` | Cloud API domain override | `https://api.example.com` |
| `APP_DOMAIN` | Cloud app domain override | `https://app.example.com` |
| `RSB_API_BASE_URL_CLOUD` | Cloud API fallback before the built-in default | Not set |
| `CLOUD_BUILD_MODE` | Cloud output mode: `versioned` or `flat` | `versioned` |
| `DEBUG_RUN` | Print detailed `run.sh` environment values when set to `1` | Not set |
| `DEBUG_BUILD` | Print selected Rsbuild resolved values when set to `1` | Not set |

Cloud API domain resolution priority:

1. `value` argument when `target=cloud`
2. `API_DOMAIN`
3. `RSB_API_BASE_URL_CLOUD`
4. `RSB_API_BASE_URL_CLOUD` from `.env.{env}`
5. `https://api.example.com`

Cloud app domain resolution priority:

1. `APP_DOMAIN`
2. `RSB_APP_BASE_URL_CLOUD` from `.env.{env}`
3. `https://app.example.com`

## Project Structure

```text
.
├── build.sh
├── run.sh
├── rsbuild.config.ts
├── postcss.config.mjs
├── scripts/
├── src/
│   ├── api/
│   ├── assets/
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── i18n/
│   ├── pages/
│   ├── router/
│   ├── services/
│   ├── stores/
│   ├── styles/
│   ├── types/
│   ├── utils/
│   └── webrtc/
└── dist/
```

## Troubleshooting

### Device dev mode requires a device IP

Use either a positional value or `DEVICE_IP`:

```bash
./run.sh dev device test <device-ip>
DEVICE_IP=<device-ip> pnpm dev
```

### Cloud dev mode uses port 80

Cloud dev mode starts on `http://localhost:80`. Depending on your OS and shell, port `80` may require elevated permissions or local configuration changes.

### Node.js or pnpm version problems

Use the versions listed in Requirements:

```bash
node -v
pnpm -v
```

### WebRTC or device connection issues

Check that the relevant ArkKVM backend service is reachable and that the browser can access the device or cloud endpoint. Browser console logs, network logs, and WebRTC diagnostics are useful when reporting issues.

### Frontend-only runs have limited functionality

Starting this frontend alone does not make the full KVM workflow available. Device control, KVM streaming, media, USB, update, and cloud workflows require compatible backend and firmware support.

## Feedback and Security

Bug reports, feature requests, and documentation feedback can be submitted through Issues.

External pull requests are not accepted for this repository at this time.

Security vulnerabilities should not be reported through public Issues. Please follow the organization-level security reporting process.

## License

This project is licensed under the GNU General Public License v2.0 or later. See [LICENSE](./LICENSE).
