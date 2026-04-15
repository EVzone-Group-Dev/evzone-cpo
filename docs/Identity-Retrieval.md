# OCPP Device Identity Retrieval & TypeScript Architecture Guide

## Overview

You **can retrieve EVSE / charger identity details via OCPP**, but how much you get depends heavily on the OCPP version:

* **OCPP 1.6J** → Basic, flat identity
* **OCPP 2.0.1** → Rich, hierarchical identity

---

# ✅ 1. Primary Source of Identity (All Versions)

## BootNotification (Critical)

This is the **main identity entry point**.

### Payload fields:

* `chargePointVendor`
* `chargePointModel`
* `chargePointSerialNumber` *(optional)*
* `chargeBoxSerialNumber` *(optional)*
* `firmwareVersion` *(optional)*

### When it is sent:

* On initial boot
* On reboot / reconnection

### What you get:

* Manufacturer
* Model
* Serial number (if provided)
* Firmware version

### Limitations:

* No EVSE-level granularity (especially in 1.6)
* Optional fields may be missing

---

# ✅ 2. Identity via Connection

## WebSocket URL (Charge Point ID)

Example:

```
ws://csms/ocpp/{chargePointId}
```

### Key facts:

* This is your **primary unique identifier**
* Must be treated as the **canonical identity key**
* Everything else is metadata

---

# ✅ 3. OCPP 1.6 – Additional Identity Retrieval

## GetConfiguration

Request:

```
GetConfiguration.req
```

### Returns:

* `ChargePointSerialNumber`
* `MeterType`
* Vendor-specific keys

### Usage:

* After BootNotification
* For enrichment / syncing

### Limitations:

* Flat key-value structure
* Vendor inconsistencies

---

# 🚀 4. OCPP 2.0.1 – Advanced Identity Model

## Device Hierarchy

```
ChargingStation
  └── EVSE (evseId)
        └── Connector (connectorId)
```

---

## GetBaseReport (Best Option)

Request:

```
GetBaseReport (FullInventory)
```

Response:

```
NotifyReport
  → component (EVSE, Connector)
  → variables (serials, firmware)
```

### What you get:

* EVSE IDs
* Connector IDs
* Component-level metadata
* Much richer identity data

---

## GetVariables

Used for:

* Serial numbers
* Firmware
* Vendor-specific attributes

---

# ⚖️ Version Comparison

| Capability     | OCPP 1.6         | OCPP 2.0.1        |
| -------------- | ---------------- | ----------------- |
| Boot identity  | ✅ Basic          | ✅ Basic           |
| Unique ID      | chargePointId    | chargingStationId |
| EVSE identity  | ❌ No             | ✅ Yes             |
| Structure      | ❌ Flat           | ✅ Hierarchical    |
| Inventory      | ❌ Limited        | ✅ Full            |
| Config queries | GetConfiguration | GetVariables      |

---

# 🧠 TypeScript Architecture

## High-Level Design

```
Transport (WebSocket)
        ↓
Protocol Layer (1.6 / 2.0.1)
        ↓
Message Router
        ↓
Domain Services
```

---

# 📦 Domain Model (Normalized)

```ts
export interface ChargingStationIdentity {
  stationId: string;
  vendor?: string;
  model?: string;
  serialNumber?: string;
  firmwareVersion?: string;
  evses: EVSEIdentity[];
}

export interface EVSEIdentity {
  evseId: number;
  connectors: ConnectorIdentity[];
}

export interface ConnectorIdentity {
  connectorId: number;
}
```

---

# 🔌 WebSocket Server

```ts
import WebSocket, { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (socket, req) => {
  const stationId = extractStationId(req.url!);
  sessionManager.createSession(stationId, socket);
});
```

---

# 🔁 OCPP Message Format

```ts
type OcppMessage =
  | [2, string, string, any]
  | [3, string, any]
  | [4, string, string, any];

function parseMessage(raw: string): OcppMessage {
  return JSON.parse(raw);
}
```

---

# 🧠 Protocol Adapter Interface

```ts
export interface OcppAdapter {
  onBootNotification(stationId: string, payload: any): Promise<void>;
  onConnected(stationId: string): Promise<void>;
}
```

---

# ⚡ OCPP 1.6 Adapter

```ts
export class Ocpp16Adapter implements OcppAdapter {
  constructor(private deviceService: DeviceService) {}

  async onBootNotification(stationId: string, payload: any) {
    const identity = {
      stationId,
      vendor: payload.chargePointVendor,
      model: payload.chargePointModel,
      serialNumber: payload.chargePointSerialNumber,
      firmwareVersion: payload.firmwareVersion,
      evses: [{ evseId: 1, connectors: [] }]
    };

    await this.deviceService.upsert(identity);
  }

  async onConnected(stationId: string) {
    await this.deviceService.requestConfiguration(stationId);
  }
}
```

---

# 🚀 OCPP 2.0.1 Adapter

```ts
export class Ocpp201Adapter implements OcppAdapter {
  constructor(private deviceService: DeviceService) {}

  async onBootNotification(stationId: string, payload: any) {
    const identity = {
      stationId,
      vendor: payload.chargingStation.vendorName,
      model: payload.chargingStation.model,
      firmwareVersion: payload.chargingStation.firmwareVersion,
      evses: []
    };

    await this.deviceService.upsert(identity);

    await this.deviceService.requestBaseReport(stationId);
  }

  async onConnected() {}
}
```

---

# 📡 Message Router

```ts
function handleMessage(stationId: string, msg: OcppMessage) {
  const [type, , action, payload] = msg;

  if (type !== 2) return;

  switch (action) {
    case 'BootNotification':
      return adapter.onBootNotification(stationId, payload);

    case 'NotifyReport':
      return handleNotifyReport(stationId, payload);
  }
}
```

---

# 🧩 Handling NotifyReport (2.0.1)

```ts
async function handleNotifyReport(stationId: string, payload: any) {
  const evses = [];

  for (const report of payload.reportData) {
    if (report.component?.evse) {
      const evseId = report.component.evse.id;

      let evse = evses.find(e => e.evseId === evseId);
      if (!evse) {
        evse = { evseId, connectors: [] };
        evses.push(evse);
      }

      if (report.component?.connector) {
        evse.connectors.push({
          connectorId: report.component.connector.id
        });
      }
    }
  }

  await deviceService.updateEVSEs(stationId, evses);
}
```

---

# 🔍 Enrichment Strategy

## OCPP 1.6

```ts
await sendCall(stationId, 'GetConfiguration', {
  key: ['ChargePointSerialNumber', 'MeterType', 'FirmwareVersion']
});
```

## OCPP 2.0.1

```ts
await sendCall(stationId, 'GetBaseReport', {
  requestId: 1,
  reportBase: 'FullInventory'
});
```

---

# 🧠 Version Detection

## Option 1 (Recommended)

```
/ocpp/1.6/{stationId}
/ocpp/2.0.1/{stationId}
```

## Option 2

```ts
protocols: ['ocpp1.6', 'ocpp2.0.1']
```

---

# 🗄️ Database Design

## stations

```
station_id (PK)
vendor
model
serial_number
firmware_version
protocol_version
```

## evses

```
id (PK)
station_id (FK)
evse_id
```

## connectors

```
id (PK)
evse_id (FK)
connector_id
```

---

# ⚠️ Real-World Pitfalls

* Serial numbers often missing
* Vendor inconsistencies in 1.6
* Minimal BootNotification payloads
* No EVSE identity in 1.6

---

# 🧭 Recommended Strategy

## Always:

* Use `stationId` as primary key
* Store BootNotification data
* Enrich asynchronously

## Prefer:

* OCPP 2.0.1 for new deployments

## Build:

* Protocol adapters
* Normalized domain model

---

# 💡 TL;DR

* YES — identity is retrievable via OCPP
* Primary method: **BootNotification**
* Enrichment:

  * 1.6 → GetConfiguration
  * 2.0.1 → GetBaseReport
* EVSE-level identity → **only in 2.0.1**

---
