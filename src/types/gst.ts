export type GSTReturnType = 'GSTR-1' | 'GSTR-3B' | 'GSTR-9' | 'GSTR-9C';
export type ReturnStatus = 'Pending' | 'Filed' | 'Overdue';

export interface Client {
  id: string;
  name: string;
  gstin: string;
  email: string;
  phone: string;
  returnFrequency?: 'Monthly' | 'Quarterly';
  createdAt: number;
}

export interface GSTReturn {
  id: string;
  clientId: string;
  type: GSTReturnType;
  financialYear: string;
  month: string; // e.g., 'April', 'May'
  status: ReturnStatus;
  dueDate: string;
  filedDate?: string;
  arn?: string;
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'user';
  displayName: string;
}

export const getFinancialYears = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;
  return [
    `${startYear - 2}-${(startYear - 1).toString().slice(2)}`,
    `${startYear - 1}-${startYear.toString().slice(2)}`,
    `${startYear}-${(startYear + 1).toString().slice(2)}`,
    `${startYear + 1}-${(startYear + 2).toString().slice(2)}`,
  ];
};

export const getCurrentFY = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;
  return `${startYear}-${(startYear + 1).toString().slice(2)}`;
};

export const MONTHS = [
  'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December', 'January', 'February', 'March'
];
