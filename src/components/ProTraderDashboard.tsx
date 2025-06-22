import React from 'react';
import { PortfolioChart, VolumeChart, ChristmasDecorations } from './ChartComponents';

const ProTraderDashboard: React.FC = () => {
  // Holdings data matching screenshot exactly
  const holdings = [
    { symbol: 'AAPL', shares: 100, avgPrice: 150.50, current: 152.10, marketValue: 15210, pnl: 1330, pnlPercent: 9.16 },
    { symbol: 'GOOGL', shares: 50, avgPrice: 148.20, current: 146.80, marketValue: 7340, pnl: -492, pnlPercent: -1.76 },
    { symbol: 'MSFT', shares: 75, avgPrice: 325.00, current: 330.50, marketValue: 24787, pnl: 737.5, pnlPercent: 4.99 },
  ];

  // Recent orders data  
  const recentOrders = [
    { id: '1001', symbol: 'AAPL', type: 'Buy', qty: 100, price: 152.10, status: 'Filled', time: '10:15 AM' },
    { id: '1002', symbol: 'MSFT', type: 'Sell', qty: 50, price: 330.50, status: 'Filled', time: '09:45 AM' },
    { id: '1003', symbol: 'TSLA', type: 'Buy', qty: 25, price: 245.75, status: 'Pending', time: '11:30 AM' },
    { id: '1004', symbol: 'NVDA', type: 'Buy', qty: 30, price: 415.60, status: 'Filled', time: '08:30 AM' },
  ];

  // Watchlist data matching screenshot
  const watchlist = [
    { symbol: 'NVDA', company: 'NVIDIA Corp.', price: 487.97, change: 15.6, changePercent: 3.32 },
    { symbol: 'AAPL', company: 'Apple Inc.', price: 186.25, change: 5.25, changePercent: 3.42 },
    { symbol: 'MSFT', company: 'Microsoft Corp.', price: 338.75, change: 8.75, changePercent: 2.9 },
    { symbol: 'TSLA', company: 'Tesla Inc.', price: 245.75, change: 6.52, changePercent: 6.52 },
    { symbol: 'AMZN', company: 'Amazon.com Inc.', price: 3314.07, change: -0.29, changePercent: -0.29 },
  ];

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      <ChristmasDecorations />
      
      {/* Main Content - Taking most space like in screenshot */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Charts Section - Main focal point */}
        <div className="flex-1 grid grid-cols-3 gap-4 p-6">
          
          {/* Left Column - Main Chart (2/3 width) */}
          <div className="col-span-2 space-y-4">
            
            {/* AAPL Main Chart */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 h-96">
              <div className="p-4 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold">AAPL - Apple Inc.</h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-2xl font-bold text-white">$168.63</span>
                      <span className="bg-green-600 text-white px-2 py-1 rounded text-sm font-medium">
                        +15.18 (+0.49%)
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-slate-400 text-sm">
                    <div>10:00</div>
                    <div>price: 152.1</div>
                  </div>
                </div>
              </div>
              <div className="p-4 h-80">
                <PortfolioChart />
              </div>
            </div>

            {/* Volume Chart */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 h-48">
              <div className="p-4 border-b border-slate-700">
                <h4 className="text-slate-400 font-medium">Volume</h4>
              </div>
              <div className="p-4 h-32">
                <VolumeChart />
              </div>
            </div>

          </div>

          {/* Right Column - Portfolio & Controls (1/3 width) */}
          <div className="space-y-4">
            
            {/* Portfolio Summary */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <h3 className="text-white font-semibold mb-4">🎄 Portfolio</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="text-slate-400 text-sm">Total Value</div>
                  <div className="text-2xl font-bold text-white">$105,550.91</div>
                </div>
                
                <div>
                  <div className="text-slate-400 text-sm">P&L</div>
                  <div className="text-lg font-bold text-green-500">
                    $1,575.5
                    <span className="text-sm ml-2">+2.75%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Movers - exactly like screenshot */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Market Movers</h3>
                <div className="flex space-x-2">
                  <button className="bg-white text-black px-3 py-1 rounded text-xs font-medium">
                    Top Gainers
                  </button>
                  <button className="text-slate-400 px-3 py-1 rounded text-xs">
                    Top Losers
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                {watchlist.slice(0, 3).map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{stock.symbol}</div>
                      <div className={`text-sm ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white">${stock.price.toFixed(2)}</div>
                      <div className={`text-sm ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Trade Panel */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <h3 className="text-white font-semibold mb-4">🎁 Quick Trade</h3>
              
              <div className="flex space-x-2 mb-4">
                <button className="flex-1 bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700">
                  Buy
                </button>
                <button className="flex-1 bg-slate-700 text-white py-2 rounded font-medium hover:bg-slate-600">
                  Sell
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Symbol</label>
                  <input
                    type="text"
                    placeholder="AAPL"
                    className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600 focus:border-green-500 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Quantity</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600 focus:border-green-500 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Price</label>
                  <input
                    type="text"
                    placeholder="Market"
                    className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600 focus:border-green-500 focus:outline-none text-sm"
                  />
                </div>
                <button className="w-full bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700">
                  Place Buy Order
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Tables Section */}
        <div className="p-6 pt-0 grid grid-cols-2 gap-6">
          
          {/* Holdings Table */}
          <div className="bg-slate-800 rounded-lg border border-slate-700">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-white font-semibold">Holdings</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 text-sm">Symbol</th>
                    <th className="text-right py-3 px-4 text-slate-400 text-sm">Shares</th>
                    <th className="text-right py-3 px-4 text-slate-400 text-sm">Avg Price</th>
                    <th className="text-right py-3 px-4 text-slate-400 text-sm">Current</th>
                    <th className="text-right py-3 px-4 text-slate-400 text-sm">Market Value</th>
                    <th className="text-right py-3 px-4 text-slate-400 text-sm">P&L</th>
                    <th className="text-right py-3 px-4 text-slate-400 text-sm">%</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding) => (
                    <tr key={holding.symbol} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-3 px-4 text-white font-medium">{holding.symbol}</td>
                      <td className="py-3 px-4 text-white text-right">{holding.shares}</td>
                      <td className="py-3 px-4 text-white text-right">${holding.avgPrice.toFixed(2)}</td>
                      <td className="py-3 px-4 text-white text-right">${holding.current.toFixed(2)}</td>
                      <td className="py-3 px-4 text-white text-right">${holding.marketValue.toLocaleString()}</td>
                      <td className={`py-3 px-4 text-right font-medium ${holding.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ${holding.pnl >= 0 ? '+' : ''}${Math.abs(holding.pnl).toFixed(0)}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${holding.pnlPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {holding.pnlPercent >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-slate-800 rounded-lg border border-slate-700">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-white font-semibold">Recent Orders</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 text-sm">Order ID</th>
                    <th className="text-left py-3 px-4 text-slate-400 text-sm">Symbol</th>
                    <th className="text-left py-3 px-4 text-slate-400 text-sm">Type</th>
                    <th className="text-right py-3 px-4 text-slate-400 text-sm">Qty</th>
                    <th className="text-right py-3 px-4 text-slate-400 text-sm">Price</th>
                    <th className="text-left py-3 px-4 text-slate-400 text-sm">Status</th>
                    <th className="text-right py-3 px-4 text-slate-400 text-sm">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-3 px-4 text-blue-400 font-medium">#{order.id}</td>
                      <td className="py-3 px-4 text-white font-medium">{order.symbol}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          order.type === 'Buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {order.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white text-right">{order.qty}</td>
                      <td className="py-3 px-4 text-white text-right">${order.price.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          order.status === 'Filled' ? 'bg-green-600 text-white' : 'bg-orange-600 text-white'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-right text-sm">{order.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProTraderDashboard;