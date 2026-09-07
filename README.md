# T3N Vendor Guard

An enterprise supplier price-list intake agent with deterministic review rules and a T3N TEE boundary.

## What it does

- validates required fields: SKU, name, currency, unit price, and minimum order quantity;
- rejects duplicate SKUs, invalid currencies, non-positive prices, and non-positive quantities;
- emits stable issue codes and a reviewable JSON report;
- fails closed before ERP writes, vendor calls, or payments;
- keeps the T3N API key in the shell environment and never in source control.

## Local verification

The full implementation and tests are in the local project used for this submission. The public repository contains the core validator at [src/validator.mjs](src/validator.mjs).

## T3N quickstart

Set the one-time sandbox key in the environment only:

    export T3N_API_KEY="<copy from the T3N claim page>"

The documented ADK flow is: handshake, authenticate, read the assigned DID, and check sandbox credits. Do not commit or publish the key.

## Handover

I prefer to hand this over to Terminal 3 to host and maintain after judging. The public submission document is [here](https://docs.google.com/document/d/172jrGdNxlyT-DVn4PlEyYaQxEUYzzSFeY3P81lwSqzQ/edit?usp=sharing).
