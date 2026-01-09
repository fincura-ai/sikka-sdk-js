# Sikka SDK for JavaScript/TypeScript

TypeScript SDK for [Sikka ONE API](https://www.sikkasoft.com/oneapi). This library provides type-safe wrappers for Sikka's REST APIs, enabling integration with 400+ practice management systems across dental, medical, and veterinary healthcare.

> [!NOTE]
> This is an unofficial third-party SDK for integrating with Sikka APIs. It is not affiliated with or endorsed by Sikka Software. Learn more [about us](#about-us).

[![npm version](https://img.shields.io/npm/v/@fincuratech/sikka-sdk-js.svg)](https://www.npmjs.com/package/@fincuratech/sikka-sdk-js)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Features

- Complete TypeScript definitions for API methods and responses
- Type-safe client for Sikka ONE API
- Automatic token refresh handling
- Flexible logging with support for custom loggers (Winston, Pino, etc.)

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [TypeScript Support](#typescript-support)
- [Logging](#logging)
- [Contributing](#contributing)
- [License](#license)
- [Resources](#resources)
- [Support](#support)
- [About Us](#about-us)

## Requirements

- Node.js >= 20.x
- TypeScript >= 5.0 (for development)

## Installation

```bash
npm install @fincuratech/sikka-sdk-js
```

or with yarn:

```bash
yarn add @fincuratech/sikka-sdk-js
```

or with pnpm:

```bash
pnpm add @fincuratech/sikka-sdk-js
```

## Quick Start

```typescript
import { createSikkaClient } from '@fincuratech/sikka-sdk-js';

// Create a client with your credentials
const sikka = createSikkaClient({
  appId: 'your-app-id',
  appKey: 'your-app-key',
  officeId: 'practice-office-id',
  secretKey: 'practice-secret-key',
});

// Authenticate (required before making other API calls)
await sikka.authenticate();

// Example: Search for patients
const patients = await sikka.patients.list({
  firstname: 'John',
  lastname: 'Doe',
});
```

## API Reference

### Authentication

The client is initialized with all credentials upfront:

- `appId` - Your Sikka app ID
- `appKey` - Your Sikka app key
- `officeId` - The practice/office identifier
- `secretKey` - The practice secret key

#### `authenticate()`

Authenticate with the Sikka API for a specific practice. Must be called before making any other API requests. The request key is valid for 24 hours and is automatically refreshed when needed.

```typescript
await sikka.authenticate();
```

**Additional methods:**

- `isAuthenticated()` - Check if authenticated
- `getRequestKey()` - Get current request key (throws if not authenticated)
- `clearAuth()` - Clear authentication
- `refreshAuthentication()` - Manually refresh the token

---

### Patients

#### `patients.list(params)`

Search for patients by name, birthdate, or patient ID.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `firstname` | string | | Filter by first name |
| `lastname` | string | | Filter by last name |
| `birthdate` | string | | Filter by birthdate |
| `patient_id` | string | | Filter by patient ID |
| `limit` | number | | Results per page |
| `offset` | number | | Pagination offset |

**Returns:** `Promise<SikkaPatient[]>`

```typescript
const patients = await sikka.patients.list({
  firstname: 'John',
  lastname: 'Doe',
});
```

---

### Claims

#### `claims.list(params)`

Retrieve insurance claims for patients.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `patient_id` | string | | Filter by patient ID |
| `claim_id` | string | | Filter by claim ID |
| `status` | string | | Filter by claim status |
| `start_date` | string | | Filter claims after this date |
| `end_date` | string | | Filter claims before this date |
| `limit` | number | | Results per page |
| `offset` | number | | Pagination offset |

**Returns:** `Promise<SikkaClaim[]>`

```typescript
const claims = await sikka.claims.list({
  patient_id: '12345',
  status: 'Pending',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
});
```

---

### Payment Types

#### `paymentTypes.list(params)`

List payment types configured for the practice.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `code` | string | | Filter by payment type code |
| `practice_id` | string | | Filter by practice ID |
| `customer_id` | string | | Filter by customer ID |
| `is_insurance_type` | boolean | | Return only insurance payment types |
| `is_adjustment_type` | boolean | | Return only credit adjustment types |
| `is_debit_adjustment_type` | boolean | | Return only debit adjustment types |
| `are_credit_card_details_required` | boolean | | Return types requiring credit card details (Planet DDS only) |
| `limit` | number | | Results per page |
| `offset` | number | | Pagination offset |

**Returns:** `Promise<SikkaPaymentType[]>`

```typescript
// Get all payment types
const types = await sikka.paymentTypes.list();

// Get only insurance payment types
const insuranceTypes = await sikka.paymentTypes.list({
  is_insurance_type: true,
});

// Find a specific payment type by code
const cashType = await sikka.paymentTypes.list({ code: '1' });
```

---

### Transactions

Transactions represent both procedures (service line items) and payments.

#### `transactions.list(params)`

List transactions for a claim or patient.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `claim_sr_no` | string | | Filter by claim serial number |
| `patient_id` | string | | Filter by patient ID |
| `transaction_type` | string | | Filter by type (`Procedure` or `Payment`) |
| `limit` | number | | Results per page |
| `offset` | number | | Pagination offset |

**Returns:** `Promise<SikkaTransaction[]>`

```typescript
const transactions = await sikka.transactions.list({
  claim_sr_no: '123456',
});
```

---

#### `transactions.listProcedures(claimSrNo)`

Convenience method to list only procedure transactions for a claim.

**Returns:** `Promise<SikkaTransaction[]>`

```typescript
const procedures = await sikka.transactions.listProcedures('123456');
```

---

### Claim Payments

#### `claimPayment.post(request)`

Post a payment to a claim. Uses pipe-delimited values for posting payments across multiple line items.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `claim_sr_no` | string | ✓ | Claim serial number |
| `practice_id` | string | ✓ | Practice ID |
| `payment_amount` | string | ✓ | Pipe-delimited payment amounts |
| `transaction_sr_no` | string | ✓ | Pipe-delimited transaction IDs |
| `write_off` | string | ✓ | Pipe-delimited write-off amounts |
| `claim_payment_date` | string | ✓ | Payment date (YYYY-MM-DD) |
| `payment_mode` | string | ✓ | `Cash`, `Check`, or `EFT` |
| `cheque_no` | string | ✓ | Check/EFT reference number |
| `is_payment_by_procedure_code` | string | ✓ | `'true'` or `'false'` |
| `note` | string | ✓ | Payment notes |

**Returns:** `Promise<SikkaClaimPaymentResponse>`

```typescript
const result = await sikka.claimPayment.post({
  claim_sr_no: '123456',
  practice_id: 'practice-id',
  payment_amount: '100.00|50.00',      // Payment for each line item
  transaction_sr_no: '789|790',         // Corresponding transaction IDs
  write_off: '0.00|0.00',
  claim_payment_date: '2024-01-15',
  payment_mode: 'EFT',
  cheque_no: 'CHK123',
  is_payment_by_procedure_code: 'false',
  note: 'Insurance payment',
});
```

---

## TypeScript Support

This SDK is written in TypeScript and provides full type definitions.

### Available Types

```typescript
import type {
  // Client & Config
  SikkaClient,
  SikkaClientConfig,
  SikkaClientCredentials,

  // Authentication
  SikkaRequestKeyRequest,
  SikkaRequestKeyResponse,
  SikkaGrantType,

  // Patients
  SikkaPatient,
  SikkaPatientListParams,
  SikkaPatientListResponse,

  // Claims
  SikkaClaim,
  SikkaClaimListParams,
  SikkaClaimListResponse,

  // Transactions
  SikkaTransaction,
  SikkaTransactionType,
  SikkaTransactionListParams,
  SikkaTransactionListResponse,

  // Payment Types
  SikkaPaymentType,
  SikkaPaymentTypeListParams,
  SikkaPaymentTypeListResponse,

  // Claim Payments
  SikkaClaimPaymentRequest,
  SikkaClaimPaymentResponse,
  SikkaPaymentMode,

  // Common
  SikkaPaginatedResponse,
  SikkaApiError,
} from '@fincuratech/sikka-sdk-js';
```

## Logging

The SDK is **silent by default**. Enable logging for debugging:

```typescript
import { createSikkaClient, setLogger, createConsoleLogger } from '@fincuratech/sikka-sdk-js';

setLogger(createConsoleLogger('debug'));

const sikka = createSikkaClient({
  appId: 'your-app-id',
  appKey: 'your-app-key',
  officeId: 'office-id',
  secretKey: 'secret-key',
});
```

Available log levels: `'debug'` | `'info'` | `'warn'` | `'error'`

### Custom Logger

Integrate any logging framework by implementing the `Logger` interface:

```typescript
import { setLogger, type Logger } from '@fincuratech/sikka-sdk-js';

const customLogger: Logger = {
  debug: (message, meta) => { /* ... */ },
  info: (message, meta) => { /* ... */ },
  warn: (message, meta) => { /* ... */ },
  error: (message, meta) => { /* ... */ },
};

setLogger(customLogger);
```

## Contributing

Contributions are welcome. Please follow these guidelines:

### Development Setup

**Use pnpm** - npm has issues with platform-specific native bindings (especially on macOS).

```bash
pnpm install
pnpm test
pnpm run lint
pnpm run build
```

### Guidelines

- Write tests for new features
- Follow the existing code style
- Update documentation for API changes
- Ensure all tests pass before submitting PRs
- Use conventional commit messages

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for full details.

Copyright (c) 2024 Fincura Technologies, Inc.

## Resources

- [Sikka ONE API](https://www.sikkasoft.com/oneapi)
- [Sikka Software](https://www.sikkasoft.com)

## Support

For issues and questions:

- Open an issue on [GitHub](https://github.com/fincura-ai/sikka-sdk-js/issues)
- Contact Us at [tech@fincura.ai](mailto:tech@fincura.ai)

## About Us

Developed by [Fincura Technologies, Inc.](https://fincura.ai)

We provide healthcare practices and providers with automated insurance payment reconciliation and posting software, enabling provider staff to get paid 2.5x faster by payers and automate 40 hours per month in payment reconciliations.

Our platform leverages multiple sources to access ERA 835 payment remittance details of health insurance claims, including direct payer integrations and clearinghouse partners. This SDK powers integrations with Sikka's ONE API for patient management, claims data, and payment posting across 400+ practice management systems.
