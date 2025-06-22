import React from 'react';
import { PortfolioChart, VolumeChart, ChristmasDecorations } from './ChartComponents';

const ProTraderDashboard: React.FC = () => {

  // Holdings data matching screenshot
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

  // Watchlist data
  const watchlist = [
    { symbol: 'AAPL', company: 'Apple Inc.', price: 186.25, change: 3.74, changePercent: 3.74 },
    { symbol: 'GOOGL', company: 'Alphabet Inc.', price: 146.80, change: -0.33, changePercent: -0.33 },
    { symbol: 'MSFT', company: 'Microsoft Corp.', price: 338.50, change: 9.33, changePercent: 9.33 },
    { symbol: 'TSLA', company: 'Tesla Inc.', price: 245.75, change: 6.52, changePercent: 6.52 },
    { symbol: 'AMZN', company: 'Amazon.com Inc.', price: 3314.07, change: -0.29, changePercent: -0.29 },
    { symbol: 'NVDA', company: 'NVIDIA Corp.', price: 487.97, change: 4.02, changePercent: 4.02 },
  ];

  return (
    <div className="grid grid-cols-12 gap-6 h-screen overflow-hidden">
      <ChristmasDecorations />
      
      {/* Main Content Area - Left Side */}
      <div className="col-span-8 space-y-6 overflow-y-auto">
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6">
          {/* Main Chart */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">AAPL - Apple Inc.</h3>
                <div className="flex items-center space-x-4">
                  <span className="text-2xl font-bold text-white">$168.63</span>
                  <span className="bg-green-600 text-white px-2 py-1 rounded text-sm">+15.18 (+0.49%)</span>
                </div>
              </div>
              <div className="text-right text-sm text-slate-400">
                10:00 | price: 152.1
              </div>
            </div>
            <div className="h-72">
              <PortfolioChart />
            </div>
          </div>

          {/* Volume Chart */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h4 className="text-sm font-medium text-slate-400 mb-4">Volume</h4>
            <div className="h-32">
              <VolumeChart />
            </div>
          </div>
        </div>

        {/* Holdings Table */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Holdings</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-2 text-slate-400 text-sm">Symbol</th>
                  <th className="text-right py-2 px-2 text-slate-400 text-sm">Shares</th>
                  <th className="text-right py-2 px-2 text-slate-400 text-sm">Avg Price</th>
                  <th className="text-right py-2 px-2 text-slate-400 text-sm">Current</th>
                  <th className="text-right py-2 px-2 text-slate-400 text-sm">Market Value</th>
                  <th className="text-right py-2 px-2 text-slate-400 text-sm">P&L</th>
                  <th className="text-right py-2 px-2 text-slate-400 text-sm">%</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => (
                  <tr key={holding.symbol} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-2 px-2 text-white font-medium">{holding.symbol}</td>
                    <td className="py-2 px-2 text-white text-right">{holding.shares}</td>
                    <td className="py-2 px-2 text-white text-right">${holding.avgPrice.toFixed(2)}</td>
                    <td className="py-2 px-2 text-white text-right">${holding.current.toFixed(2)}</td>
                    <td className="py-2 px-2 text-white text-right">${holding.marketValue.toLocaleString()}</td>
                    <td className={`py-2 px-2 text-right font-medium ${holding.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ${holding.pnl >= 0 ? '+' : ''}${Math.abs(holding.pnl).toFixed(0)}
                    </td>
                    <td className={`py-2 px-2 text-right font-medium ${holding.pnlPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {holding.pnlPercent >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-2 text-slate-400 text-sm">Order ID</th>
                  <th className="text-left py-2 px-2 text-slate-400 text-sm">Symbol</th>
                  <th className="text-left py-2 px-2 text-slate-400 text-sm">Type</th>
                  <th className="text-right py-2 px-2 text-slate-400 text-sm">Qty</th>
                  <th className="text-right py-2 px-2 text-slate-400 text-sm">Price</th>
                  <th className="text-left py-2 px-2 text-slate-400 text-sm">Status</th>
                  <th className="text-right py-2 px-2 text-slate-400 text-sm">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-2 px-2 text-blue-400 font-medium">#{order.id}</td>
                    <td className="py-2 px-2 text-white font-medium">{order.symbol}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.type === 'Buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {order.type}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-white text-right">{order.qty}</td>
                    <td className="py-2 px-2 text-white text-right">${order.price.toFixed(2)}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.status === 'Filled' ? 'bg-green-600 text-white' : 'bg-orange-600 text-white'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-slate-400 text-right text-sm">{order.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="col-span-4 space-y-6 overflow-y-auto">
        
        {/* Portfolio Summary */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">🎄 Portfolio</h3>
          <div>
            <div className="text-sm text-slate-400 mb-1">Total Value</div>
            <div className="text-2xl font-bold text-white mb-2">$105,550.91</div>
            
            <div className="text-sm text-slate-400 mb-1">P&L</div>
            <div className="text-lg font-bold text-green-500 flex items-center">
              $1,575.5
              <span className="text-sm ml-2">+1.52%</span>
            </div>
          </div>
        </div>

        {/* Market Movers */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Market Movers</h3>
            <div className="flex space-x-2">
              <button className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium">Top Gainers</button>
              <button className="text-slate-400 px-3 py-1 rounded text-xs">Top Losers</button>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-white font-medium">NVDA</div>
                <div className="text-green-500 text-sm">+3.32%</div>
              </div>
              <div className="text-right">
                <div className="text-white">$415.6</div>
                <div className="text-green-500 text-sm">+$15.6</div>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-white font-medium">AAPL</div>
                <div className="text-green-500 text-sm">+3.42%</div>
              </div>
              <div className="text-right">
                <div className="text-white">$186.25</div>
                <div className="text-green-500 text-sm">+$5.25</div>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-white font-medium">MSFT</div>
                <div className="text-green-500 text-sm">+2.9%</div>
              </div>
              <div className="text-right">
                <div className="text-white">$338.75</div>
                <div className="text-green-500 text-sm">+$8.75</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Trade */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">🎁 Quick Trade</h3>
          <div className="flex space-x-2 mb-4">
            <button className="flex-1 bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700 transition-colors">
              Buy
            </button>
            <button className="flex-1 bg-slate-700 text-white py-2 rounded font-medium hover:bg-slate-600 transition-colors">
              Sell
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Symbol</label>
              <select className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600 focus:border-green-500 focus:outline-none text-sm">
                <option>AAPL</option>
                <option>GOOGL</option>
                <option>MSFT</option>
                <option>NVDA</option>
                <option>TSLA</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Quantity</label>
              <input
                type="number"
                placeholder="0"
                className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600 focus:border-green-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Price</label>
              <select className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600 focus:border-green-500 focus:outline-none text-sm">
                <option>Market</option>
                <option>Limit</option>
                <option>Stop</option>
              </select>
            </div>
            <button className="w-full bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700 transition-colors">
              Place Buy Order
            </button>
          </div>
        </div>

        {/* Watchlist */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Watchlist</h3>
          <div className="space-y-2">
            {watchlist.map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between py-2 hover:bg-slate-700/30 rounded px-2 cursor-pointer">
                <div>
                  <div className="text-white font-medium text-sm">{stock.symbol}</div>
                  <div className="text-slate-400 text-xs">{stock.company}</div>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm">${stock.price.toFixed(2)}</div>
                  <div className={`text-xs ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProTraderDashboard;