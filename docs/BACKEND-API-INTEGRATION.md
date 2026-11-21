# SunFlow Backend API Integration — Catalogue, Inventory, BOM, Quotations

This document covers the endpoints added in the current backend milestone on `server/backend-development`.

Base URL: `/api`

Content type: `application/json`

Authentication: `Authorization: Bearer <JWT>` on every endpoint in this document.

`ANY` below means any authenticated SunFlow role: `ADMIN`, `SALES`, `WAREHOUSE`, `TECHNICIAN`, or `SUPPORT`.

## Conventions

- List endpoints accept `?page=1&pageSize=20`. `pageSize` maximum is `100`.
- List responses use `{ "data": [...], "meta": { "page": 1, "pageSize": 20, "total": 134 } }`.
- Single-resource responses use `{ "data": { ... } }`.
- IDs are opaque `cuid` strings. The IDs in examples are illustrative.
- All money fields are decimal strings with exactly two decimal places, for example `"45.50"`.
- Dates in responses are ISO-8601 UTC strings. Request `validUntil` is a `YYYY-MM-DD` date string.
- Product categories: `PANEL`, `INVERTER`, `BATTERY`, `CHARGE_CONTROLLER`, `WIRING_BOX`, `EARTHING`, `STAND`, `CONNECTOR`, `WIRE`, `SWITCH`, `OTHER`.
- System types: `ON_GRID`, `OFF_GRID`.
- Quote statuses: `DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`, `EXPIRED`.

## Error envelope

All errors use the standard envelope:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "A product with this SKU already exists"
  }
}
```

Validation errors include field details:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "fields": {
      "unitPrice": "unitPrice must be a non-negative decimal with up to 2 places",
      "quantity": "Expected number, received string"
    }
  }
}
```

Common status codes:

| Status | Code | Meaning |
|---:|---|---|
| 400 | `VALIDATION_ERROR` | Request body, query, or params failed validation, or a business input is invalid. |
| 401 | `UNAUTHENTICATED` | Missing, invalid, expired, or inactive-user token. |
| 403 | `FORBIDDEN` | Authenticated user does not have the required role. |
| 404 | `NOT_FOUND` | Resource or matching active BOM template does not exist. |
| 409 | `CONFLICT` | Duplicate SKU, overlapping BOM range, invalid workflow state, or quote already converted. |
| 422 | `UNPROCESSABLE` | A valid request cannot be applied without violating stock or BOM quantity rules. |
| 500 | `INTERNAL_ERROR` | Unexpected server error; details are logged server-side only. |

---

# Products

## GET /api/products

Permissions: `ANY`

Query:

| Parameter | Type | Required | Notes |
|---|---|---|---|
| `page` | integer | No | Default `1`, minimum `1`. |
| `pageSize` | integer | No | Default `20`, range `1`–`100`. |
| `category` | ProductCategory | No | Exact category filter. |
| `isSerialized` | boolean string | No | `true` or `false`. |

Example: `GET /api/products?page=1&pageSize=20&category=PANEL&isSerialized=false`

Success `200`:

```json
{
  "data": [
    {
      "id": "clp1",
      "sku": "PANEL-550W",
      "name": "550 W mono panel",
      "category": "PANEL",
      "isSerialized": false,
      "unitPrice": "10500.00",
      "unit": "piece",
      "warrantyMonths": 144,
      "isActive": true,
      "createdAt": "2026-11-21T05:30:00.000Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 1 }
}
```

Errors: `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`.

## POST /api/products

Permissions: `ADMIN`, `WAREHOUSE`

Request body:

| Field | Type | Required | Notes |
|---|---|---|---|
| `sku` | string | Yes | Trimmed, `1`–`64` chars, unique. |
| `name` | string | Yes | Trimmed, non-empty. |
| `category` | ProductCategory | Yes | One of the supported categories. |
| `isSerialized` | boolean | Yes | Serialized products do not get an inventory row. |
| `unitPrice` | decimal string | Yes | Non-negative, up to two decimal places. |
| `unit` | string | Yes | Trimmed, non-empty. |
| `warrantyMonths` | integer | No | Non-negative, default `0`. |

```json
{
  "sku": "PANEL-550W",
  "name": "550 W mono panel",
  "category": "PANEL",
  "isSerialized": false,
  "unitPrice": "10500.00",
  "unit": "piece",
  "warrantyMonths": 144
}
```

Success `201`:

```json
{
  "data": {
    "id": "clp1",
    "sku": "PANEL-550W",
    "name": "550 W mono panel",
    "category": "PANEL",
    "isSerialized": false,
    "unitPrice": "10500.00",
    "unit": "piece",
    "warrantyMonths": 144,
    "isActive": true,
    "createdAt": "2026-11-21T05:30:00.000Z"
  }
}
```

Business rule: creating a non-serialized product also creates its `Inventory` row with `quantityOnHand: 0` in the same transaction.

Errors: `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `409 CONFLICT` for duplicate SKU.

## PATCH /api/products/:id

Permissions: `ADMIN`, `WAREHOUSE`

Request body: any subset of `sku`, `name`, `category`, `isSerialized`, `unitPrice`, `unit`, `warrantyMonths`, `isActive`. At least one field is required. Validation rules match `POST /api/products`.

```json
{
  "unitPrice": "10900.00",
  "isActive": true
}
```

Success `200`:

```json
{
  "data": {
    "id": "clp1",
    "sku": "PANEL-550W",
    "name": "550 W mono panel",
    "category": "PANEL",
    "isSerialized": false,
    "unitPrice": "10900.00",
    "unit": "piece",
    "warrantyMonths": 144,
    "isActive": true,
    "createdAt": "2026-11-21T05:30:00.000Z"
  }
}
```

Business rules:

- Changing a non-serialized product to serialized is rejected when `quantityOnHand > 0`.
- Changing a serialized product to non-serialized is rejected when serialized equipment already exists.
- Inventory row creation/deletion happens inside the same transaction.

Errors: `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 CONFLICT` for duplicate SKU or invalid serialization change.

## GET /api/products/:id/stock-movements

Permissions: `ADMIN`, `WAREHOUSE`

Query: `page`, `pageSize`.

Success `200`:

```json
{
  "data": [
    {
      "id": "clm1",
      "productId": "clp1",
      "type": "INBOUND",
      "quantity": 25,
      "referenceType": "GOODS_RECEIPT",
      "referenceId": null,
      "notes": "GRN-2026-001",
      "createdByUserId": "clu1",
      "createdAt": "2026-11-21T05:30:00.000Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 1 }
}
```

Errors: `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND` for unknown product.

---

# Inventory and stock movements

## GET /api/inventory

Permissions: `WAREHOUSE`, `ADMIN`

Query: `page`, `pageSize`. Only non-serialized products are returned.

Success `200`:

```json
{
  "data": [
    {
      "id": "cli1",
      "productId": "clp1",
      "quantityOnHand": 25,
      "reorderLevel": 10,
      "warehouseLocation": "Rack A1",
      "updatedAt": "2026-11-21T05:30:00.000Z",
      "product": {
        "id": "clp1",
        "sku": "PANEL-550W",
        "name": "550 W mono panel",
        "category": "PANEL",
        "isSerialized": false,
        "unitPrice": "10500.00",
        "unit": "piece",
        "warrantyMonths": 144,
        "isActive": true,
        "createdAt": "2026-11-21T05:30:00.000Z"
      }
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 1 }
}
```

Errors: `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `403 FORBIDDEN`.

## POST /api/inventory/:productId/adjust

Permissions: `WAREHOUSE`, `ADMIN`

Request body:

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | enum | Yes | `INBOUND`, `OUTBOUND`, or `ADJUSTMENT`. |
| `quantity` | integer | Yes | Positive integer. |
| `referenceType` | string | Yes | Trimmed, `1`–`64` chars, for example `GOODS_RECEIPT`. |
| `notes` | string | No | Trimmed, max `500` chars, stored in the stock ledger. |

```json
{
  "type": "INBOUND",
  "quantity": 25,
  "referenceType": "GOODS_RECEIPT",
  "notes": "GRN-2026-001"
}
```

Success `200`:

```json
{
  "data": {
    "inventory": {
      "id": "cli1",
      "productId": "clp1",
      "quantityOnHand": 25,
      "reorderLevel": 10,
      "warehouseLocation": "Rack A1",
      "updatedAt": "2026-11-21T05:30:00.000Z"
    },
    "stockMovement": {
      "id": "clm1",
      "productId": "clp1",
      "type": "INBOUND",
      "quantity": 25,
      "referenceType": "GOODS_RECEIPT",
      "referenceId": null,
      "notes": "GRN-2026-001",
      "createdByUserId": "clu1",
      "createdAt": "2026-11-21T05:30:00.000Z"
    }
  }
}
```

Business rules:

- Only non-serialized products can be adjusted.
- `INBOUND` increments stock.
- `OUTBOUND` and `ADJUSTMENT` decrement stock.
- The stock update and immutable `StockMovement` insert are atomic. A decrement that would make `quantityOnHand` negative leaves both unchanged.

Errors:

```json
{
  "error": {
    "code": "UNPROCESSABLE",
    "message": "The movement would reduce quantityOnHand below zero"
  }
}
```

Also: `400 VALIDATION_ERROR` for invalid body or serialized product, `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND` for unknown product.

---

# BOM templates

## GET /api/bom-templates

Permissions: `ANY`

Query: `page`, `pageSize`, optional `systemType`.

Success `200`:

```json
{
  "data": [
    {
      "id": "clb1",
      "name": "On-grid 1-3 kW",
      "systemType": "ON_GRID",
      "minCapacityKw": 1,
      "maxCapacityKw": 3,
      "description": "Standard residential package",
      "isActive": true
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 1 }
}
```

Errors: `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`.

## POST /api/bom-templates

Permissions: `ADMIN`

Request body:

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Trimmed, non-empty. |
| `systemType` | enum | Yes | `ON_GRID` or `OFF_GRID`. |
| `minCapacityKw` | number | Yes | `1`–`5`. |
| `maxCapacityKw` | number | Yes | `1`–`5`, greater than or equal to `minCapacityKw`. |
| `description` | string | No | Trimmed. |
| `items` | array | Yes | At least one item. |
| `items[].productId` | string | Yes | Existing product ID; unique within the template. |
| `items[].quantityPerKw` | number | One of | Positive finite number; cannot be combined with `quantityFixed`. |
| `items[].quantityFixed` | integer | One of | Positive integer, max `2147483647`; cannot be combined with `quantityPerKw`. |
| `items[].notes` | string | No | Trimmed, max `500` chars. |

```json
{
  "name": "On-grid 1-3 kW",
  "systemType": "ON_GRID",
  "minCapacityKw": 1,
  "maxCapacityKw": 3,
  "description": "Standard residential package",
  "items": [
    { "productId": "clp1", "quantityPerKw": 2 },
    { "productId": "clp2", "quantityFixed": 1, "notes": "One per installation" }
  ]
}
```

Success `201`:

```json
{
  "data": {
    "id": "clb1",
    "name": "On-grid 1-3 kW",
    "systemType": "ON_GRID",
    "minCapacityKw": 1,
    "maxCapacityKw": 3,
    "description": "Standard residential package",
    "isActive": true,
    "items": [
      {
        "id": "clbi1",
        "bomTemplateId": "clb1",
        "productId": "clp1",
        "quantityPerKw": 2,
        "quantityFixed": null,
        "notes": null,
        "product": {
          "id": "clp1",
          "sku": "PANEL-550W",
          "name": "550 W mono panel",
          "category": "PANEL",
          "isSerialized": false,
          "unitPrice": "10500.00",
          "unit": "piece",
          "warrantyMonths": 144,
          "isActive": true,
          "createdAt": "2026-11-21T05:30:00.000Z"
        }
      }
    ]
  }
}
```

Business rules:

- Each item must have exactly one of `quantityPerKw` or `quantityFixed`.
- Product IDs must be unique within the template and must exist.
- Capacity ranges of active templates for the same `systemType` cannot overlap.

Errors:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Capacity range overlaps active BOM template \"On-grid 1-3 kW\""
  }
}
```

Also: `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `403 FORBIDDEN`.

## POST /api/bom-templates/resolve

Permissions: `SALES`, `ADMIN`

Request body:

```json
{
  "systemType": "ON_GRID",
  "capacityKw": 2.5
}
```

Success `200`:

```json
{
  "data": {
    "bomTemplateId": "clb1",
    "capacityKw": 2.5,
    "items": [
      {
        "productId": "clp1",
        "name": "550 W mono panel",
        "quantity": 5,
        "unitPrice": "10500.00",
        "lineTotal": "52500.00"
      },
      {
        "productId": "clp2",
        "name": "String inverter",
        "quantity": 1,
        "unitPrice": "25000.00",
        "lineTotal": "25000.00"
      }
    ],
    "subtotal": "77500.00"
  }
}
```

Business rule: `quantityPerKw` quantities are expanded with `Math.ceil(quantityPerKw * capacityKw)`. `quantityFixed` is used unchanged. Unit prices come from the current product catalogue and are serialized as decimal strings.

Errors:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "No active BOM template covers this capacity/system type"
  }
}
```

Also: `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `422 UNPROCESSABLE` for an expanded quantity that is not a valid integer.

## GET /api/bom-templates/:id

Permissions: `ANY`

Success `200`: same template shape as `POST /api/bom-templates`, including `items` and each item’s serialized `product`.

Errors: `401 UNAUTHENTICATED`, `404 NOT_FOUND`.

---

# Quotations

All quotation routes are mounted under `/api` and require `SALES` or `ADMIN`.

## POST /api/leads/:leadId/quotes

Permissions: `SALES`, `ADMIN`

Request body:

| Field | Type | Required | Notes |
|---|---|---|---|
| `systemType` | enum | Yes | `ON_GRID` or `OFF_GRID`. |
| `capacityKw` | number | Yes | `1`–`5`. |
| `discount` | decimal string | No | Non-negative, up to two decimals, default `"0.00"`. |
| `tax` | decimal string | No | Non-negative, up to two decimals, default `"0.00"`. |
| `validUntil` | date string | No | `YYYY-MM-DD`, converted to UTC midnight. |

```json
{
  "systemType": "ON_GRID",
  "capacityKw": 2.5,
  "discount": "1000.00",
  "tax": "500.00",
  "validUntil": "2026-12-31"
}
```

Success `201`:

```json
{
  "data": {
    "id": "clq1",
    "leadId": "cll1",
    "customerId": "clc1",
    "bomTemplateId": "clb1",
    "systemType": "ON_GRID",
    "capacityKw": 2.5,
    "subtotal": "77500.00",
    "discount": "1000.00",
    "tax": "500.00",
    "total": "77000.00",
    "status": "DRAFT",
    "validUntil": "2026-12-31T00:00:00.000Z",
    "createdByUserId": "clu1",
    "createdAt": "2026-11-21T05:30:00.000Z",
    "updatedAt": "2026-11-21T05:30:00.000Z",
    "items": [
      {
        "id": "clqi1",
        "quoteId": "clq1",
        "productId": "clp1",
        "quantity": 5,
        "unitPriceAtQuote": "10500.00",
        "lineTotal": "52500.00",
        "product": {
          "id": "clp1",
          "sku": "PANEL-550W",
          "name": "550 W mono panel",
          "category": "PANEL",
          "unit": "piece",
          "unitPrice": "10500.00"
        }
      }
    ]
  }
}
```

Business rules:

- The lead must exist and be in `SURVEY_APPROVED` or `QUOTED`, with an `APPROVED` site survey.
- BOM lines and prices are generated from the matching active BOM template.
- `unitPriceAtQuote` and `lineTotal` are frozen on the quote; later product price changes do not alter it.
- `total = subtotal - discount + tax`; a negative total is rejected.
- The lead is moved to `QUOTED` in the same transaction.

Errors:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Lead survey is not approved"
  }
}
```

Also: `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND` for missing lead or active BOM template.

## GET /api/quotes/:id

Permissions: `SALES`, `ADMIN`

Success `200`: same quote response shape as `POST /api/leads/:leadId/quotes`.

Errors: `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`.

## PATCH /api/quotes/:id/items

Permissions: `SALES`, `ADMIN`

Request body:

```json
{
  "items": [
    { "productId": "clp1", "quantity": 4 },
    { "productId": "clp2", "quantity": 1 }
  ]
}
```

Rules:

- Each item needs a `productId` and positive integer `quantity` (`1`–`2147483647`).
- `productId` values must be unique.
- The product set must exactly match the products already on the quote. Products cannot be added or removed.
- Only `DRAFT` quotes can be adjusted.
- Frozen `unitPriceAtQuote` is used to recalculate `lineTotal`, `subtotal`, and `total`.

Success `200`: same quote response shape as `POST /api/leads/:leadId/quotes`.

Errors:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Only a DRAFT quote can be adjusted"
  }
}
```

Also: `400 VALIDATION_ERROR` for invalid or mismatched item set, `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`.

## POST /api/quotes/:id/send

Permissions: `SALES`, `ADMIN`

No request body.

Success `200`: same quote response shape with `"status": "SENT"`.

Errors:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Only a DRAFT quote can be sent"
  }
}
```

Also: `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`.

## POST /api/quotes/:id/accept

Permissions: `SALES`, `ADMIN`

No request body.

Success `200`:

```json
{
  "data": {
    "quote": {
      "id": "clq1",
      "status": "ACCEPTED"
    },
    "order": {
      "id": "clo1",
      "status": "CONFIRMED",
      "totalAmount": "77000.00",
      "balanceDue": "77000.00"
    }
  }
}
```

Business rules:

- Only a `SENT` quote whose lead is still `QUOTED` can be accepted.
- Acceptance atomically marks the quote `ACCEPTED`, creates one `InstallationOrder` with `balanceDue = totalAmount`, and moves the lead to `CONVERTED`.
- The order has a unique `quoteId`; duplicate conversion is rejected.
- If any step fails, the entire transaction rolls back.

Errors:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Only a SENT quote can be accepted"
  }
}
```

Other conflict cases:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "This quote already has an InstallationOrder"
  }
}
```

Also: `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`.

## POST /api/quotes/:id/reject

Permissions: `SALES`, `ADMIN`

No request body.

Success `200`: same quote response shape with `"status": "REJECTED"`.

Errors:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Only a DRAFT or SENT quote can be rejected"
  }
}
```

Also: `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`.

---

# Workflow summary

1. Create catalogue products with `POST /api/products`.
2. Receive stock with `POST /api/inventory/:productId/adjust`; the ledger is written automatically.
3. Create an active BOM template with `POST /api/bom-templates`.
4. Preview generated quantities and prices with `POST /api/bom-templates/resolve`.
5. Ensure a lead has an approved site survey, then create a quote with `POST /api/leads/:leadId/quotes`.
6. Optionally adjust draft quantities with `PATCH /api/quotes/:id/items`.
7. Send with `POST /api/quotes/:id/send`.
8. Accept with `POST /api/quotes/:id/accept` to create the installation order and convert the lead, or reject with `POST /api/quotes/:id/reject`.

# Database changes in this milestone

Migration: `prisma/migrations/20261121113100_stock_movement_notes_quote_updated_at/migration.sql`

- Adds nullable `StockMovement.notes TEXT`.
- Adds required `Quote.updatedAt DATETIME`, backfilled from `createdAt` for existing rows.
- Recreates the `Quote` indexes during the table redefinition.

# Automated coverage

`tests/catalogue-inventory-bom-quotes.integration.test.js` adds seven subtests covering catalogue roles and validation, inventory-only-for-non-serialized products, atomic stock movements and negative-stock prevention, BOM validation/overlap/expansion, survey-approval gating and frozen quote prices, quote send/accept idempotency, and transaction rollback on failed acceptance.

Run with:

```bash
npm test
```
