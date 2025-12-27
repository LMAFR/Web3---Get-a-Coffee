import { createWalletClient, custom } from 'viem';

let walletClient;
let connectedAccount;

function toastWarn(text) {
  if (typeof window.Toastify === 'function') {
    window.Toastify({
      text,
      duration: 4500,
      gravity: 'top',
      position: 'right',
      close: true,
      style: {
        background: 'linear-gradient(135deg, #334155, #0ea5b7)',
        color: '#e5e7eb',
        border: '1px solid rgba(34, 211, 238, 0.35)',
      },
    }).showToast();
    return;
  }

  // Fallback if Toastify isn't available yet
  console.warn(text);
}

function getEthereumProvider() {
  // MetaMask injects window.ethereum
  const provider = window.ethereum;
  if (!provider) {
    toastWarn(
      'MetaMask not detected. Please install the official MetaMask browser extension to continue.'
    );
    return null;
  }
  return provider;
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

function wireUi() {
  const connectBtn = document.getElementById('connectBtn');
  if (connectBtn) {
    connectBtn.addEventListener('click', async () => {
      try {
        const account = await connectWallet();
        if (account) connectBtn.textContent = `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`;
      } catch (err) {
        console.error(err);
      }
    });
  }
}

wireUi();
