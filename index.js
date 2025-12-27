import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  formatEther,
  parseEther,
  defineChain
} from 'viem';
import { foundry } from 'viem/chains';
import { contractAddress, abi } from './constants-js.js';

let walletClient;
let publicClient;
let connectedAccount;

const TOAST_DURATION_MS = 3000;

function showToast({ text, variant }) {
  const toastifyFn = window.Toastify;
  if (typeof toastifyFn !== 'function') {
    if (variant === 'warn') console.warn(text);
    else console.log(text);
    return;
  }

  const style =
    variant === 'warn'
      ? {
          background: 'linear-gradient(135deg, #334155, #0ea5b7)',
          color: '#e5e7eb',
          border: '1px solid rgba(34, 211, 238, 0.35)',
        }
      : {
          background: 'linear-gradient(135deg, #0b0f14, #334155)',
          color: '#e5e7eb',
          border: '1px solid rgba(148, 163, 184, 0.35)',
        };

  toastifyFn({
    text,
    duration: TOAST_DURATION_MS,
    gravity: 'top',
    position: 'right',
    close: false,
    style,
  }).showToast();
}

function toastWarn(text) {
  showToast({ text, variant: 'warn' });
}

function toastInfo(text) {
  showToast({ text, variant: 'info' });
}

function toastTxSubmitted(txHash) {
  const toastifyFn = window.Toastify;
  if (typeof toastifyFn !== 'function') {
    console.log('Funding submitted:', txHash);
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.gap = '0.6rem';

  const text = document.createElement('span');
  text.textContent = `Funding submitted: ${shortenHex(txHash, { start: 4, end: 4 })}`;

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.title = 'Copy transaction hash';
  copyBtn.setAttribute('aria-label', 'Copy transaction hash');
  copyBtn.textContent = '⧉';
  copyBtn.style.border = '1px solid rgba(148, 163, 184, 0.35)';
  copyBtn.style.background = 'transparent';
  copyBtn.style.color = '#e5e7eb';
  copyBtn.style.borderRadius = '8px';
  copyBtn.style.padding = '0.15rem 0.45rem';
  copyBtn.style.cursor = 'pointer';
  copyBtn.style.lineHeight = '1.1';

  copyBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(txHash);
      toastInfo('Transaction hash copied.');
    } catch (err) {
      console.error(err);
      toastWarn('Could not copy transaction hash.');
    }
  });

  wrapper.appendChild(text);
  wrapper.appendChild(copyBtn);

  toastifyFn({
    node: wrapper,
    duration: TOAST_DURATION_MS,
    gravity: 'top',
    position: 'right',
    close: false,
    style: {
      background: 'linear-gradient(135deg, #0b0f14, #334155)',
      color: '#e5e7eb',
      border: '1px solid rgba(148, 163, 184, 0.35)',
    },
  }).showToast();
}

function shortenHex(hex, { start = 4, end = 4 } = {}) {
  if (!hex || typeof hex !== 'string') return '';
  if (hex.length <= start + end) return hex;
  return `${hex.slice(0, start)}…${hex.slice(-end)}`;
}

function getEthereumProvider() {
  const provider = window.ethereum;
  if (!provider) {
    toastWarn(
      'MetaMask not detected. Please install the official MetaMask browser extension to continue.'
    );
    return null;
  }
  return provider;
}

function ensurePublicClient() {
  if (publicClient) return publicClient;

  // Anvil default JSON-RPC
  publicClient = createPublicClient({
    chain: foundry,
    transport: http('http://127.0.0.1:8545'),
  });

  return publicClient;
}

async function connectWallet() {
  const provider = getEthereumProvider();
  if (!provider) return;

  walletClient = createWalletClient({
    transport: custom(provider),
  });

  const [account] = await walletClient.requestAddresses();
  connectedAccount = account;

  return account;
}

async function disconnectWallet() {
  // MetaMask doesn't provide a programmatic “disconnect” for injected providers.
  // We reset local state and UI.
  walletClient = undefined;
  connectedAccount = undefined;
  setConnectUiState(false);
}

async function showConnectedBalance() {
  if (!connectedAccount) {
    toastWarn('Connect your wallet first.');
    return;
  }

  const client = ensurePublicClient();

  // Uses eth_getBalance under the hood
  const balanceWei = await client.getBalance({ address: contractAddress });
  const balanceEth = formatEther(balanceWei);

  toastInfo(
    `Balance for ${shortenHex(connectedAccount, { start: 4, end: 4 })}: ${balanceEth} ETH`
  );
}

function setConnectUiState(isConnected) {
  const connectBtn = document.getElementById('connectBtn');
  const connectStatus = document.getElementById('connectStatus');

  if (connectBtn) {
    connectBtn.textContent = isConnected ? 'Disconnect' : 'Connect';
    connectBtn.classList.toggle('is-disconnect', Boolean(isConnected));
  }

  if (connectStatus) {
    connectStatus.textContent = isConnected && connectedAccount
      ? `Connected: ${shortenHex(connectedAccount, { start: 4, end: 4 })}`
      : '';
  }
}

function setGetBalanceEnabled(enabled) {
  const getBalanceBtn = document.getElementById('getBalanceBtn');
  if (!getBalanceBtn) return;

  // Keep it clickable so we can show a toast if user clicks before connecting.
  getBalanceBtn.disabled = false;

  getBalanceBtn.dataset.requiresConnection = enabled ? '0' : '1';
  getBalanceBtn.setAttribute('aria-disabled', enabled ? 'false' : 'true');
  getBalanceBtn.title = enabled ? '' : 'Connect your wallet first';

  // Visual hint while still allowing clicks
  getBalanceBtn.style.opacity = enabled ? '1' : '0.6';
  getBalanceBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
}

function getAmountEthFromInput() {
  const amountInput = document.getElementById('amount');
  const raw = (amountInput?.value ?? '').trim();

  if (!raw) return { ok: false, reason: 'empty' };

  // Basic positive numeric validation. parseEther will throw on invalid strings.
  const asNumber = Number(raw);
  if (!Number.isFinite(asNumber) || asNumber <= 0) return { ok: false, reason: 'nonPositive' };

  try {
    const value = parseEther(raw);
    if (value <= 0n) return { ok: false, reason: 'nonPositive' };
    return { ok: true, raw, value };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

async function fund() {
  if (!connectedAccount) {
    toastWarn('Connect your wallet first.');
    return;
  }

  const amount = getAmountEthFromInput();
  if (!amount.ok) {
    toastWarn('Set a valid positive amount in the input to buy a coffee.');
    return;
  }

  try {
    const client = ensurePublicClient();

    console.log('Current chain:', await getCurrentChain(client));

    // First simulate to get the correct request (gas, calldata, etc.)
    const { request } = await client.simulateContract({
      address: contractAddress,
      abi,
      chain: await getCurrentChain(client), // foundry chain ID
      functionName: 'fund',
      account: connectedAccount,
      value: amount.value,
    });

    if (!walletClient) {
      toastWarn('Wallet client not ready. Click Connect again.');
      return;
    }

    const txHash = await walletClient.writeContract(request);
    toastTxSubmitted(txHash);
  } catch (err) {
    console.error(err);
    toastWarn('Funding failed. Check your wallet network (Anvil 127.0.0.1:8545) and try again.');
  }
}

async function getCurrentChain(client) {
    const chainId = await client.getChainId()
    const currentChain = defineChain({
        id: chainId,
        name: "Custom Chain",
        nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
        },
        rpcUrls: {
        default: {
            http: ["http://localhost:8545"],
        },
        },
    })
    return currentChain
}

function wireUi() {
  const connectBtn = document.getElementById('connectBtn');
  const getBalanceBtn = document.getElementById('getBalanceBtn');
  const buyCoffeeForm = document.getElementById('buyCoffeeForm');

  setConnectUiState(false);
  setGetBalanceEnabled(false);

  if (connectBtn) {
    connectBtn.addEventListener('click', async () => {
      try {
        if (connectedAccount) {
          await disconnectWallet();
          setGetBalanceEnabled(false);
          return;
        }

        const account = await connectWallet();
        if (account) {
          setConnectUiState(true);
          setGetBalanceEnabled(true);
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  if (getBalanceBtn) {
    getBalanceBtn.addEventListener('click', async () => {
      try {
        if (!connectedAccount) {
          toastWarn('Connect your wallet first.');
          return;
        }

        await showConnectedBalance();
      } catch (err) {
        console.error(err);
        toastWarn('Failed to fetch balance. Is Anvil running at http://127.0.0.1:8545?');
      }
    });
  }

  if (buyCoffeeForm) {
    buyCoffeeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await fund();
    });
  }
}

wireUi();
