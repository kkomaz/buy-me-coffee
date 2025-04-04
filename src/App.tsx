import React, { useState, useEffect } from 'react';
import { Coffee, ExternalLink, MessageCircle, Wallet } from 'lucide-react';
import { formatEther, parseEther } from 'ethers';
import { connectWallet, CONTRACT_ADDRESS, getReadOnlyContract } from './contract';
import toast, { Toaster } from 'react-hot-toast';

interface Contribution {
  supporter: string;
  amount: bigint;
  message: string;
  timestamp: bigint;
}

function App() {
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState('0.001');
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    loadContributions();
    checkConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
      window.ethereum.on('disconnect', handleDisconnect);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', () => {});
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);

  async function checkConnection() {
    if (window.ethereum && !isConnecting) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        } else {
          handleDisconnect();
        }
      } catch (error) {
        console.error('Error checking connection:', error);
        handleDisconnect();
      }
    }
  }

  async function handleAccountsChanged(accounts: string[]) {
    console.log('Accounts changed:', accounts);
    if (accounts.length === 0) {
      handleDisconnect();
    } else {
      try {
        // Reset connection state before reconnecting
        setIsConnected(false);
        setAccount(null);
        
        // Ensure we get the latest account
        const { signer } = await connectWallet();
        const address = await signer.getAddress();
        console.log('New signer address:', address);
        setAccount(address);
        setIsConnected(true);
        toast.success('Wallet switched!');
      } catch (error: any) {
        toast.error(error.message);
        console.error('Error switching wallet:', error);
        handleDisconnect();
      }
    }
  }

  async function loadContributions() {
    try {
      const contract = getReadOnlyContract();
      const contributions = await contract.getContributions();
      setContributions([...contributions].reverse());
    } catch (error) {
      console.error('Error loading contributions:', error);
      toast.error('Failed to load contributions');
    }
  }

  async function handleConnect() {
    if (isConnecting) return;
    setIsConnecting(true);

    try {
      const { signer } = await connectWallet();
      const address = await signer.getAddress();
      setAccount(address);
      setIsConnected(true);
      toast.success('Wallet connected!');
    } catch (error: any) {
      toast.error(error.message);
      console.error('Error connecting wallet:', error);
      handleDisconnect();
    } finally {
      setIsConnecting(false);
    }
  }

  function handleDisconnect() {
    setIsConnected(false);
    setAccount(null);
    setIsConnecting(false);
    toast.success('Wallet disconnected!');
  }

  async function handleBuyCoffee(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { contract } = await connectWallet();
      const tx = await contract.buyCoffee(message, {
        value: parseEther(amount),
      });

      toast.loading('Buying coffee...', { id: 'coffee' });
      await tx.wait();
      toast.success('Thank you for the coffee!', { id: 'coffee' });

      setMessage('');
      loadContributions();
    } catch (error: any) {
      toast.error(error.message, { id: 'coffee' });
      console.error('Error buying coffee:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="absolute inset-0 bg-[url('https://somnia.network/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      <div className="relative">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 relative">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Coffee className="w-12 h-12 text-purple-500" />
          </div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500 mb-4">Buy Me a Coffee</h1>
          <p className="text-gray-400">Support my work by buying me a virtual coffee!</p>

          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            >
              <Wallet className="w-5 h-5" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <div className="mt-6 flex flex-col items-center gap-2">
              <p className="text-gray-400">
                Connected: {account?.slice(0, 6)}...{account?.slice(-4)}
              </p>
              <button
                onClick={handleDisconnect}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 inline-flex items-center gap-2"
              >
                <Wallet className="w-5 h-5" />
                Disconnect Wallet
              </button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-900 rounded-xl shadow-xl p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500 mb-6">Buy a Coffee</h2>
            <form onSubmit={handleBuyCoffee}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount (STT)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                  min="0.001"
                  required
                  disabled={!isConnected}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                  rows={4}
                  required
                  disabled={!isConnected}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !isConnected}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 hover:opacity-90"
              >
                {loading ? 'Processing...' : 'Send Coffee'}
              </button>
            </form>
          </div>

          <div className="bg-gray-900 rounded-xl shadow-xl p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500 mb-6">Recent Supporters</h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {contributions.map((contribution, index) => (
                <div key={index} className="border-b border-gray-800 last:border-0 pb-4">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-purple-500 mt-1" />
                    <div>
                      <p className="text-gray-300 font-medium break-all">
                        {contribution.supporter.slice(0, 6)}...{contribution.supporter.slice(-4)}
                      </p>
                      <p className="text-gray-400">{contribution.message}</p>
                      <p className="text-sm text-gray-500">
                        {formatEther(contribution.amount)} STT •{' '}
                        {new Date(Number(contribution.timestamp) * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href={`https://explorer.somnia.network/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-gray-400 hover:text-purple-500 transition-colors"
          >
            View Contract on Explorer
            <ExternalLink className="w-4 h-4 ml-1" />
          </a>
        </div>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;