import { ethers } from 'ethers';

export const CONTRACT_ADDRESS = '0x392a0124ffcFeaA44E082E47093945085cD85500';

export const CONTRACT_ABI = [
  "event CoffeeBought(address indexed supporter, uint256 amount, string message, uint256 timestamp)",
  "function buyCoffee(string memory message) external payable",
  "function getContributions() external view returns (tuple(address supporter, uint256 amount, string message, uint256 timestamp)[] memory)",
  "function owner() external view returns (address)",
  "function setOwner(address newOwner) external",
  "function withdraw() external"
];

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('Please install MetaMask');
  }

  // Force a refresh of accounts
  await window.ethereum.request({ 
    method: 'wallet_requestPermissions',
    params: [{ eth_accounts: {} }]
  });
  
  const accounts = await window.ethereum.request({ 
    method: 'eth_requestAccounts'
  });

  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found');
  }

  // Create a fresh provider and signer instance
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  // Verify the signer address matches the selected account
  const signerAddress = await signer.getAddress();
  if (signerAddress.toLowerCase() !== accounts[0].toLowerCase()) {
    throw new Error('Signer address mismatch');
  }

  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  return { signer, contract };
}

export function getReadOnlyContract() {
  const provider = new ethers.JsonRpcProvider('https://dream-rpc.somnia.network');
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}