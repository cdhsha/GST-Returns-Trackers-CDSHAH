import React, { useState, useCallback, useRef } from 'react';
import { isLoggedIn, logout, exportCSV, exportBackup, importBackup, exportHTMLReport, getSession, login } from '@/lib/storage';
import { getFinancialYears, getCurrentFY } from '@/types/gst';
import LoginScreen from '@/components/LoginScreen';
import AppSidebar, { View } from '@/components/AppSidebar';
import Dashboard from '@/components/Dashboard';
import ClientManager from '@/components/ClientManager';
import GSTTracker from '@/components/GSTTracker';
import MonthlyPending from '@/components/MonthlyPending';
import UserManager from '@/components/UserManager';
import { Menu, X } from 'lucide-react';
import { toast } from 'sonner';

const Index: React.FC = () => {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [view, setView] = useState<View>('dashboard');
  const [fy, setFy] = useState(getCurrentFY());
  const [refresh, setRefresh] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const session = getSession();
  const isAdmin = session?.role === 'admin';

  const handleLogout = () => { logout(); setLoggedIn(false); };
  const handleRefresh = useCallback(() => setRefresh(r => r + 1), []);

  const handleExportCSV = () => {
    const csv = exportCSV(fy);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `GST_Returns_${fy}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const handleExportHTML = () => {
    const html = exportHTMLReport(fy);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `GST_Report_${fy}.html`; a.click();
    URL.revokeObjectURL(url);
    toast.success('HTML report downloaded — open it in any browser');
  };

  const handleBackup = () => {
    const json = exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `GST_Backup_${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup downloaded');
  };

  const handleRestore = () => { fileInputRef.current?.click(); };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (importBackup(reader.result as string)) {
        toast.success('Data restored successfully');
        handleRefresh();
      } else {
        toast.error('Invalid backup file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;

  // Non-admin users can't access admin-only views
  const safeView = (!isAdmin && (view === 'clients' || view === 'users')) ? 'dashboard' : view;

  return (
    <div className="flex min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`fixed lg:static z-40 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <AppSidebar
          currentView={safeView}
          onViewChange={v => { setView(v); setSidebarOpen(false); }}
          onExportCSV={handleExportCSV}
          onExportHTML={handleExportHTML}
          onBackup={handleBackup}
          onRestore={handleRestore}
          onLogout={handleLogout}
          isAdmin={isAdmin}
          userName={session?.displayName || 'User'}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
          <button className="lg:hidden p-2 rounded-md hover:bg-muted" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <label className="text-sm font-medium text-muted-foreground">Financial Year:</label>
            <select
              value={fy}
              onChange={e => setFy(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              {getFinancialYears().map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {safeView === 'dashboard' && <Dashboard financialYear={fy} key={`d-${refresh}`} />}
          {safeView === 'clients' && <ClientManager onRefresh={handleRefresh} key={`c-${refresh}`} />}
          {safeView === 'tracker' && <GSTTracker financialYear={fy} key={`t-${refresh}`} />}
          {safeView === 'pending' && <MonthlyPending financialYear={fy} key={`p-${refresh}`} />}
          {safeView === 'users' && <UserManager key={`u-${refresh}`} />}
        </main>
      </div>

      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileRestore} />
    </div>
  );
};

export default Index;
