import React, { useState } from 'react';
import Navbar from './components/Navbar';
import AddTransactionModal from './components/AddTransactionModal';
import SettingsDrawer from './components/SettingsDrawer';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import SmsUpiParser from './pages/SmsUpiParser';
import ReceiptScanner from './pages/ReceiptScanner';
import Subscriptions from './pages/Subscriptions';
import Investments from './pages/Investments';
import PredictiveBudget from './pages/PredictiveBudget';
import AiStudio from './pages/AiStudio';
import Profile from './pages/Profile';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTransactionAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeTab === 'dashboard' && (
          <Dashboard 
            key={`dash-${refreshTrigger}`} 
            onNavigate={setActiveTab} 
            onOpenAddModal={() => setIsAddModalOpen(true)} 
          />
        )}
        {activeTab === 'transactions' && (
          <Transactions 
            key={`txn-${refreshTrigger}`} 
            onOpenAddModal={() => setIsAddModalOpen(true)} 
          />
        )}
        {activeTab === 'sms' && (
          <SmsUpiParser 
            onNavigate={setActiveTab} 
          />
        )}
        {activeTab === 'receipts' && (
          <ReceiptScanner 
            onNavigate={setActiveTab} 
          />
        )}
        {activeTab === 'subscriptions' && (
          <Subscriptions 
            key={`sub-${refreshTrigger}`} 
          />
        )}
        {activeTab === 'investments' && (
          <Investments 
            key={`inv-${refreshTrigger}`} 
          />
        )}
        {activeTab === 'predictive' && (
          <PredictiveBudget 
            key={`pred-${refreshTrigger}`} 
          />
        )}
        {activeTab === 'ai-studio' && (
          <AiStudio />
        )}
        {activeTab === 'profile' && (
          <Profile />
        )}
      </main>

      {/* Add Transaction Global Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleTransactionAdded}
      />

      {/* Pop-out Settings Drawer from Left */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onNavigate={setActiveTab}
      />

    </div>
  );
}

export default App;
