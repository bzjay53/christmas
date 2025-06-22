import React from 'react';
import { TrendingUp, Wifi, WifiOff } from 'lucide-react';
import { PortfolioChart, VolumeChart, SectorPieChart, ChristmasDecorations } from './ChartComponents';
import { usePortfolio, useChristmasNotifications } from '../hooks/useRealTimeData';

const TradingDashboard: React.FC = () => {
  const { portfolio, isConnected } = usePortfolio();
  const { notifications, addNotification } = useChristmasNotifications();
  
  const topGainers = [
    { symbol: 'NVDA', price: 415.6, change: 15.6, changePercent: 3.32 },
    { symbol: 'AAPL', price: 186.25, change: 5.25, changePercent: 3.42 },
    { symbol: 'MSFT', price: 338.75, change: 8.75, changePercent: 2.99 },
  ];

  const holdings = [
    { symbol: 'AAPL', shares: 100, avgPrice: 150.50, current: 152.1, marketValue: 15210, pnl: 160, pnlPercent: 1.06 },
    { symbol: 'GOOGL', shares: 50, avgPrice: 148.20, current: 146.80, marketValue: 7340, pnl: -70, pnlPercent: -0.94 },
    { symbol: 'MSFT', shares: 75, avgPrice: 325.00, current: 330.50, marketValue: 24787.5, pnl: 412.5, pnlPercent: 1.69 },
  ];

  const recentOrders = [
    { id: '1001', symbol: 'AAPL', type: 'Buy', qty: 100, price: 152.10, status: 'Filled', time: '10:15 AM' },
    { id: '1002', symbol: 'MSFT', type: 'Sell', qty: 50, price: 330.50, status: 'Filled', time: '09:45 AM' },
    { id: '1003', symbol: 'TSLA', type: 'Buy', qty: 25, price: 245.75, status: 'Pending', time: '11:30 AM' },
    { id: '1004', symbol: 'NVDA', type: 'Buy', qty: 30, price: 415.60, status: 'Filled', time: '08:30 AM' },
  ];

  return (
    <div className="space-y-6 relative">
      <ChristmasDecorations />
      
      {/* Christmas Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse"
            >
              {notification}
            </div>
          ))}
        </div>
      )}
      {/* Portfolio Overview */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-300 mb-2">🎄 Christmas Portfolio</h2>
            <div className="text-3xl font-bold text-white">${portfolio.totalValue.toLocaleString()}</div>
            <div className="flex items-center mt-1">
              <TrendingUp size={16} className="text-green-500 mr-1" />
              <span className="text-green-500 text-sm">+${Math.abs(portfolio.totalChange).toLocaleString()} ({portfolio.totalChangePercent >= 0 ? '+' : ''}{portfolio.totalChangePercent.toFixed(2)}%)</span>
              {isConnected ? (
                <Wifi size={12} className="text-green-500 ml-2" />
              ) : (
                <WifiOff size={12} className="text-red-500 ml-2" />
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-sm">Total Value</div>
            <div className="text-2xl font-bold text-green-500">$1,575.6</div>
            <div className="text-green-500 text-sm">+2.75%</div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <div className="mb-4">
            <h4 className="text-sm text-slate-400 mb-2">Portfolio Performance</h4>
            <PortfolioChart />
          </div>
          <div>
            <h4 className="text-sm text-slate-400 mb-2">Trading Volume</h4>
            <VolumeChart />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Gainers */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span>Top Gainers</span>
            <span className="ml-auto bg-slate-700 px-2 py-1 text-xs rounded">Top Losers</span>
          </h3>
          <div className="space-y-3">
            {topGainers.map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">{stock.symbol}</div>
                  <div className="text-green-500 text-sm">+{stock.changePercent}%</div>
                </div>
                <div className="text-right">
                  <div className="text-white">${stock.price}</div>
                  <div className="text-green-500 text-sm">+${stock.change}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trading Panel */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-4">🎁 Christmas Trading</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Symbol</label>
              <select className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600 focus:border-green-500 focus:outline-none">
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
                placeholder="10"
                min="1"
                className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600 focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Order Type</label>
              <select className="w-full bg-slate-700 text-white p-2 rounded border border-slate-600 focus:border-green-500 focus:outline-none">
                <option>Market Order</option>
                <option>Limit Order</option>
                <option>Stop Loss</option>
              </select>
            </div>
            <div className="bg-slate-900 rounded p-3 border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">Estimated Total</div>
              <div className="text-lg font-bold text-white">$1,862.50</div>
              <div className="text-xs text-green-500">Commission: $0 (Christmas Special!)</div>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => addNotification('Buy order placed successfully!')}
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
              >
                🎄 Buy
              </button>
              <button 
                onClick={() => addNotification('Sell order placed successfully!')}
                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 transition-colors"
              >
                🎁 Sell
              </button>
            </div>
          </div>
        </div>

        {/* Portfolio Allocation */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-4">🎄 Portfolio Allocation</h3>
          <SectorPieChart />
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Technology</span>
              <span className="text-green-500">35%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Healthcare</span>
              <span className="text-blue-500">25%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Finance</span>
              <span className="text-purple-500">20%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Consumer</span>
              <span className="text-yellow-500">15%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Energy</span>
              <span className="text-red-500">5%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4">Holdings</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 text-slate-400">Symbol</th>
                <th className="text-left py-3 text-slate-400">Shares</th>
                <th className="text-left py-3 text-slate-400">Avg Price</th>
                <th className="text-left py-3 text-slate-400">Current</th>
                <th className="text-left py-3 text-slate-400">Market Value</th>
                <th className="text-left py-3 text-slate-400">P&L</th>
                <th className="text-left py-3 text-slate-400">%</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding) => (
                <tr key={holding.symbol} className="border-b border-slate-700/50">
                  <td className="py-3 text-white font-medium">{holding.symbol}</td>
                  <td className="py-3 text-white">{holding.shares}</td>
                  <td className="py-3 text-white">${holding.avgPrice.toFixed(2)}</td>
                  <td className="py-3 text-white">${holding.current.toFixed(2)}</td>
                  <td className="py-3 text-white">${holding.marketValue.toLocaleString()}</td>
                  <td className={`py-3 ${holding.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${Math.abs(holding.pnl).toFixed(2)}
                  </td>
                  <td className={`py-3 ${holding.pnlPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {holding.pnlPercent >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 text-slate-400">Order ID</th>
                <th className="text-left py-3 text-slate-400">Symbol</th>
                <th className="text-left py-3 text-slate-400">Type</th>
                <th className="text-left py-3 text-slate-400">Qty</th>
                <th className="text-left py-3 text-slate-400">Price</th>
                <th className="text-left py-3 text-slate-400">Status</th>
                <th className="text-left py-3 text-slate-400">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-slate-700/50">
                  <td className="py-3 text-blue-400">#{order.id}</td>
                  <td className="py-3 text-white font-medium">{order.symbol}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      order.type === 'Buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {order.type}
                    </span>
                  </td>
                  <td className="py-3 text-white">{order.qty}</td>
                  <td className="py-3 text-white">${order.price}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      order.status === 'Filled' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-black'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400">{order.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TradingDashboard;