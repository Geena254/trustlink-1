# @trustlink/sdk

Official TypeScript SDK for the [TrustLink](https://trustlink.app) escrow + M-Pesa API.

## Building

```bash
cd sdk
npm install   # installs typescript
npm run build # runs tsc → outputs to sdk/dist/
```

After building, the package is ready to publish:
```bash
npm publish --access public
```

## Installation (consumers)

```bash
npm install @trustlink/sdk
```

## Quick Start

```typescript
import { TrustLink } from "@trustlink/sdk";

const tl = new TrustLink({
  apiKey: process.env.TRUSTLINK_API_KEY, // tl_live_... or tl_test_...
});

// Create an escrow link
const escrow = await tl.escrows.create({
  amount: 50,
  chain: "base",
  sellerWallet: "0xYourWalletAddress",
  payoutMethod: "phone",
  mpesaPhone: "254712345678",
});

console.log(escrow.paymentUrl); // Share with buyer

// After buyer confirms delivery, release funds
await tl.escrows.release(escrow.id);

// Trigger M-Pesa off-ramp (USDC → KES)
await tl.escrows.withdraw(escrow.id);
```

## API Reference

### `tl.escrows.create(params)` → `Promise<Escrow>`
### `tl.escrows.list(params?)` → `Promise<ListEscrowsResponse>`
### `tl.escrows.get(id)` → `Promise<Escrow>`
### `tl.escrows.release(id)` → `Promise<{ id, status }>`
### `tl.escrows.withdraw(id)` → `Promise<{ id, status, mpesa }>`
### `tl.webhooks.create(params)` → `Promise<Webhook>`
### `tl.webhooks.list()` → `Promise<ListWebhooksResponse>`
### `tl.webhooks.delete(id)` → `Promise<{ deleted, id }>`
### `TrustLink.verifyWebhookSignature({ payload, signature, secret })` → `Promise<boolean>`

## License

MIT
