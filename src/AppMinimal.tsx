import React, { useState, useEffect } from 'react';
import type { CryptoData } from './types/crypto';
import './App.css';

function AppMinimal() {
  const [cryptoData] = useState<CryptoData[]>([
    {
      symbol: 'BTCUSDT',
      name: 'Bitcoin (BTC)',
      price: 43250.00,
      change: 1250.00,
      changePercent: 2.98,
      volume: 28500000000,
      high24h: 44100,
      low24h: 41800
    }
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-6">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Binance Dashboard v1
          </h1>
          <div className="text-green-400 font-semibold">
            Market Open - Real-time Data
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cryptoData.map(crypto => (
            <div key={crypto.symbol} className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-white font-bold text-lg mb-2">{crypto.name}</h3>
              <div className="text-white text-2xl font-bold">${crypto.price.toLocaleString()}</div>
              <div className="text-green-400 text-lg font-semibold">
                +{crypto.changePercent.toFixed(2)}% (+${crypto.change.toFixed(2)})
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AppMinimal;