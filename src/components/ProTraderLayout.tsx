import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, TrendingUp, PieChart, Bell, Settings, Menu, X, Brain } from 'lucide-react';

interface ProTraderLayoutProps {
  children: React.ReactNode;
}

const ProTraderLayout: React.FC<ProTraderLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const sidebarItems = [
    { icon: TrendingUp, label: '대시보드', id: 'Dashboard', path: '/dashboard' },
    { icon: PieChart, label: '포트폴리오', id: 'Portfolio', path: '/portfolio' },
    { icon: Brain, label: 'AI 추천', id: 'AI', path: '/ai-recommendations' },
    { icon: Bell, label: '알림', id: 'Alerts', path: '/alerts' },
    { icon: Settings, label: '설정', id: 'Settings', path: '/settings' },
  ];

  const getActiveTab = () => {
    const currentPath = location.pathname;
    if (currentPath === '/' || currentPath === '/dashboard') return 'Dashboard';
    if (currentPath === '/portfolio') return 'Portfolio';
    if (currentPath === '/ai-recommendations') return 'AI';
    return 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-slate-800 border-r border-slate-700`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h1 className={`text-xl font-bold ${sidebarOpen ? 'block' : 'hidden'} text-green-400`}>🎄 Christmas Trading</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-700 rounded-md"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        <nav className="mt-4">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center px-4 py-3 text-left hover:bg-slate-700 transition-colors ${
                getActiveTab() === item.id ? 'bg-slate-700 border-r-2 border-green-500' : ''
              }`}
            >
              <item.icon size={20} className="min-w-[20px]" />
              {sidebarOpen && <span className="ml-3">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="종목 검색..."
                className="bg-slate-700 text-white pl-10 pr-4 py-2 rounded-md border border-slate-600 focus:border-green-500 focus:outline-none w-80"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-md">장중</span>
            <span className="text-slate-400">마지막 업데이트: 오후 1:41:34</span>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6 bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ProTraderLayout;