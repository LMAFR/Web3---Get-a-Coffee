# Web3---Get-a-Coffee

Simple dApp UI to interact with a `FundMe`-style smart contract deployed on a local **Anvil** chain (Foundry). The UI lets a user:

- Connect/Disconnect MetaMask
- *Buy coffee* (send ETH to the contract via `fund()`)
- Read the **contract (bakery) balance**
- Withdraw the accumulated ETH from the contract via `withdraw()` (only contract owner)

---

## Tech stack

- **Frontend:** plain HTML/CSS/JS
- **Web3 library:** [`viem`](https://viem.sh/)
- **Local chain:** **Anvil** (Foundry)
- **Notifications:** Toastify
- **Dev server:** Vite

---

## Prerequisites

1. **Node.js + npm**
2. **MetaMask** browser extension installed
3. **Foundry** installed (for Anvil + optional `cast` commands)

You can verify Foundry tools:

- `anvil --version`
- `cast --version`

---

## Project structure

- `index.html`  UI layout
- `index.css`  dark theme styling
- `index.js`  viem logic (connect, fund, read balance, withdraw)
- `constants-js.js`  `contractAddress` + `abi`

---

## Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Start Anvil

In a separate terminal:

```bash
anvil --host 127.0.0.1 --port 8545
```

- Chain id is typically **31337**
- RPC: `http://127.0.0.1:8545`

### 3) Ensure contract is deployed and constants are correct

Update `constants-js.js` with the **deployed** contract address and ABI.

> If you restart Anvil, previously deployed contract addresses are no longer valid, and you must redeploy and update `contractAddress`.

### 4) Start the frontend

```bash
npm run dev
```

Open the local URL shown by the dev server (commonly `http://127.0.0.1:5173/`).

---

## MetaMask configuration (Anvil)

To interact with Anvil from MetaMask:

- Network name: `Anvil (Local)`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency: `ETH`

Import an Anvil test account into MetaMask using one of the private keys that Anvil prints when it starts.

---

## How to use the UI

### Connect

Click **Connect** to request MetaMask addresses. After connecting the button toggles to **Disconnect**.

### Buy coffee (fund)

1. Enter a positive ETH amount in the input (e.g. `0.01`)
2. Click **Buy coffee**

The app uses `simulateContract` with `fund()` and sends the transaction with MetaMask.

After submission, a toast appears with a **copy** icon to copy the full transaction hash.

### Get Balance

Click **Get Balance** to view the **contract (bakery) balance** (no MetaMask connection required).

### Withdraw

Click **Withdraw** to call `withdraw()`.

- Requires MetaMask connection
- Typically only the **contract owner** can withdraw (otherwise it reverts)

---

## Verifying transactions on Anvil

You can verify a tx with the hash using Foundry `cast`:

```bash
cast receipt <TX_HASH> --rpc-url http://127.0.0.1:8545
```

To inspect the transaction:

```bash
cast tx <TX_HASH> --rpc-url http://127.0.0.1:8545
```

To check balances:

```bash
cast balance <ADDRESS> --rpc-url http://127.0.0.1:8545
```

---

## Troubleshooting

- **MetaMask not detected**: install the official MetaMask extension.
- **Get Balance fails**: ensure Anvil is running at `http://127.0.0.1:8545`.
- **Withdraw fails**: ensure the connected wallet is the contract owner.
- **Balances look wrong after restarting Anvil**: redeploy contract and update `constants-js.js`.

---

## Notes

This project is intentionally minimal and meant as a learning/demo environment for local Web3 interactions.
