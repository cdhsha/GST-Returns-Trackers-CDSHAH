import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getClients, getReturns } from '@/lib/storage';
import { Users, FileCheck, Clock, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export default function Dashboard({ financialYear }: { financialYear: string }) {
  const clients = getClients();
  const returns = getReturns().filter(r => r.financialYear === financialYear);

  const stats = useMemo(() => {
    const pending = returns.filter(r => r.status === 'Pending').length;
    const filed = returns.filter(r => r.status === 'Filed').length;
    const overdue = returns.filter(r => r.status === 'Overdue').length;
    return { pending, filed, overdue };
  }, [returns]);

  const pieData = [
    { name: 'Filed', value: stats.filed, color: '#22c55e' },
    { name: 'Pending', value: stats.pending, color: '#f59e0b' },
    { name: 'Overdue', value: stats.overdue, color: '#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-blue-100 dark:border-blue-900 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Clients</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{clients.length}</div>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">Active registered clients</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40 border-emerald-100 dark:border-emerald-900 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Filed Returns</CardTitle>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
              <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{stats.filed}</div>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">Successfully filed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-amber-100 dark:border-amber-900 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-300">Pending Returns</CardTitle>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">{stats.pending}</div>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">Awaiting filing</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/40 border-red-100 dark:border-red-900 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-800 dark:text-red-300">Overdue Returns</CardTitle>
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900 dark:text-red-100">{stats.overdue}</div>
            <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">Requires immediate action</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1 shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-slate-800 dark:text-slate-200">Return Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px] pt-6">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No return data for this financial year
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-slate-800 dark:text-slate-200">Quick Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Total Clients</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Registered in system</p>
                  </div>
                </div>
                <div className="text-lg font-bold text-slate-800 dark:text-slate-200">{clients.length}</div>
              </div>
              
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
                    <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Total Returns</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">For {financialYear}</p>
                  </div>
                </div>
                <div className="text-lg font-bold text-slate-800 dark:text-slate-200">{returns.length}</div>
              </div>

              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Action Required</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Pending + Overdue</p>
                  </div>
                </div>
                <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{stats.pending + stats.overdue}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
