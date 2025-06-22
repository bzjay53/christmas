import { TrendingUp, PieChart, DollarSign } from 'lucide-react'
import { PortfolioChart } from '../components/ChartComponents'

export function Portfolio() {
  // Mock portfolio data
  const holdings = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      quantity: 100,
      avgPrice: 150.50,
      currentPrice: 152.10,
      totalValue: 15210,
      pnl: 160,
      pnlPercent: 1.06,
      allocation: 28.5
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      quantity: 50,
      avgPrice: 148.20,
      currentPrice: 146.80,
      totalValue: 7340,
      pnl: -70,
      pnlPercent: -0.94,
      allocation: 25.7
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      quantity: 75,
      avgPrice: 325.00,
      currentPrice: 330.50,
      totalValue: 24787.5,
      pnl: 412.5,
      pnlPercent: 1.69,
      allocation: 23.0
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corp.',
      quantity: 30,
      avgPrice: 400.00,
      currentPrice: 415.60,
      totalValue: 12468,
      pnl: 468,
      pnlPercent: 3.90,
      allocation: 22.8
    }
  ]

  const totalValue = holdings.reduce((sum, holding) => sum + holding.totalValue, 0)
  const totalPnL = holdings.reduce((sum, holding) => sum + holding.pnl, 0)
  const totalPnLPercent = (totalPnL / (totalValue - totalPnL)) * 100


  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Portfolio Value</p>
              <p className="text-3xl font-bold text-white">${totalValue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total P&L</p>
              <p className={`text-3xl font-bold flex items-center ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${Math.abs(totalPnL).toLocaleString()}
                {totalPnL >= 0 ? <TrendingUp className="w-6 h-6 ml-2" /> : null}
              </p>
              <p className={`text-sm ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalPnL >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Holdings Count</p>
              <p className="text-3xl font-bold text-green-500">{holdings.length}</p>
              <p className="text-xs text-slate-400">Diversification: Good</p>
            </div>
            <PieChart className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Performance Chart Area */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Portfolio Performance</h2>
          <div className="flex space-x-2">
            <button className="text-sm px-3 py-1 bg-green-600 text-white rounded">1W</button>
            <button className="text-sm px-3 py-1 text-slate-400 hover:bg-slate-700 rounded">1M</button>
            <button className="text-sm px-3 py-1 text-slate-400 hover:bg-slate-700 rounded">3M</button>
          </div>
        </div>
        
        {/* Portfolio Performance Chart */}
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <PortfolioChart />
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-6">Holdings</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 text-slate-400">Symbol</th>
                <th className="text-right py-3 text-slate-400">Shares</th>
                <th className="text-right py-3 text-slate-400">Avg Price</th>
                <th className="text-right py-3 text-slate-400">Current</th>
                <th className="text-right py-3 text-slate-400">Market Value</th>
                <th className="text-right py-3 text-slate-400">P&L</th>
                <th className="text-right py-3 text-slate-400">%</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding, index) => (
                <tr key={index} className="border-b border-slate-700/50">
                  <td className="py-4">
                    <div>
                      <div className="font-semibold text-white">{holding.symbol}</div>
                      <div className="text-sm text-slate-400">{holding.name}</div>
                    </div>
                  </td>
                  <td className="text-right py-4 text-white">{holding.quantity.toLocaleString()}</td>
                  <td className="text-right py-4 text-white">${holding.avgPrice.toFixed(2)}</td>
                  <td className="text-right py-4 text-white">${holding.currentPrice.toFixed(2)}</td>
                  <td className="text-right py-4 text-white font-semibold">${holding.totalValue.toLocaleString()}</td>
                  <td className="text-right py-4">
                    <div className={`font-semibold ${holding.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ${Math.abs(holding.pnl).toFixed(2)}
                    </div>
                  </td>
                  <td className="text-right py-4">
                    <div className={`font-semibold ${holding.pnlPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {holding.pnlPercent >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(2)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Portfolio Allocation */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <h3 className="font-semibold mb-4 text-white">Portfolio Allocation</h3>
          <div className="space-y-3">
            {holdings.map((holding, index) => (
              <div key={index} className="flex items-center">
                <div className="w-24 text-sm font-medium text-white">{holding.symbol}</div>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${holding.allocation}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-16 text-right text-sm font-medium text-white">{holding.allocation}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}