import React from 'react';
import { LayoutDashboard, Users, FileText, Clock, Settings, LogOut, Download, Upload, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type View = 'dashboard' | 'clients' | 'tracker' | 'pending' | 'users';

interface AppSidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onExportCSV: () => void;
  onExportHTML: () => void;
  onBackup: () => void;
  onRestore: () => void;
  onLogout: () => void;
  isAdmin: boolean;
  userName: string;
}

export default function AppSidebar({
  currentView, onViewChange, onExportCSV, onExportHTML, onBackup, onRestore, onLogout, isAdmin, userName
}: AppSidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tracker', label: 'GST Tracker', icon: FileText },
    { id: 'pending', label: 'Monthly Pending', icon: Clock },
    ...(isAdmin ? [
      { id: 'clients', label: 'Client Manager', icon: Users },
      { id: 'users', label: 'User Manager', icon: Settings }
    ] : [])
  ] as const;

  return (
    <div className="w-64 h-full bg-card border-r flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <FileText className="w-6 h-6" />
          C. D. SHAH & CO.
        </h1>
        <p className="text-xs text-muted-foreground mt-1 font-medium tracking-wider uppercase">Chartered Accountants</p>
        <p className="text-sm text-muted-foreground mt-4">Welcome, {userName}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as View)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === item.id 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}

        <div className="pt-6 mt-6 border-t space-y-1">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Data Management
          </p>
          <button onClick={onExportCSV} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={onExportHTML} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <FileCode className="w-4 h-4" /> Export HTML
          </button>
          {isAdmin && (
            <>
              <button onClick={onBackup} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                <Download className="w-4 h-4" /> Backup Data
              </button>
              <button onClick={onRestore} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                <Upload className="w-4 h-4" /> Restore Data
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="p-4 border-t">
        <Button variant="outline" className="w-full justify-start gap-2" onClick={onLogout}>
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
