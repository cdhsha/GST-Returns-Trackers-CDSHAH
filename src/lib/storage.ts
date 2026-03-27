import { Client, GSTReturn, User } from '../types/gst';
import bcrypt from 'bcryptjs';

const STORAGE_KEY = 'gst_tracker_data';

interface AppData {
  clients: Client[];
  returns: GSTReturn[];
  users: User[];
}

const defaultData: AppData = {
  clients: [],
  returns: [],
  users: [
    {
      id: '1',
      username: 'admin',
      passwordHash: bcrypt.hashSync('admin123', 10), // Hashed default password
      role: 'admin',
      displayName: 'Administrator'
    }
  ]
};

const getData = (): AppData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return defaultData;

  const parsedData = JSON.parse(data);
  let needsSave = false;

  // Fix duplicate client IDs that might have been created by bulk import
  const seenClientIds = new Set<string>();
  if (parsedData.clients) {
    parsedData.clients.forEach((client: Client) => {
      if (seenClientIds.has(client.id)) {
        client.id = Date.now().toString() + Math.random().toString(36).substring(2);
        needsSave = true;
      }
      seenClientIds.add(client.id);
    });
  }

  if (needsSave) {
    saveData(parsedData);
  }

  return parsedData;
};

const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Auth
export const login = (username: string, passwordString: string) => {
  const data = getData();
  const user = data.users.find(u => u.username === username);
  if (user) {
    let isValid = false;
    
    if (user.passwordHash.startsWith('$2')) {
      isValid = bcrypt.compareSync(passwordString, user.passwordHash);
    } else {
      // Fallback for legacy plain text passwords
      isValid = passwordString === user.passwordHash;
      if (isValid) {
        // Auto-upgrade to hashed password
        updateUser(user.id, { passwordHash: passwordString });
      }
    }

    if (isValid) {
      sessionStorage.setItem('gst_session', JSON.stringify(user));
      return true;
    }
  }
  return false;
};

export const logout = () => {
  sessionStorage.removeItem('gst_session');
};

export const isLoggedIn = () => {
  return !!sessionStorage.getItem('gst_session');
};

export const getSession = (): User | null => {
  const session = sessionStorage.getItem('gst_session');
  return session ? JSON.parse(session) : null;
};

// Clients
export const getClients = () => getData().clients;
export const addClient = (client: Omit<Client, 'id' | 'createdAt'>) => {
  const data = getData();
  const newClient: Client = {
    ...client,
    id: Date.now().toString() + Math.random().toString(36).substring(2),
    createdAt: Date.now()
  };
  data.clients.push(newClient);
  saveData(data);
  return newClient;
};
export const updateClient = (id: string, client: Partial<Client>) => {
  const data = getData();
  data.clients = data.clients.map(c => c.id === id ? { ...c, ...client } : c);
  saveData(data);
};
export const deleteClient = (id: string) => {
  const data = getData();
  data.clients = data.clients.filter(c => c.id !== id);
  data.returns = data.returns.filter(r => r.clientId !== id);
  saveData(data);
};

// Returns
export const getReturns = () => getData().returns;
export const addReturn = (ret: Omit<GSTReturn, 'id'>) => {
  const data = getData();
  const newReturn: GSTReturn = {
    ...ret,
    id: Date.now().toString() + Math.random().toString(36).substring(2)
  };
  data.returns.push(newReturn);
  saveData(data);
  return newReturn;
};
export const updateReturn = (id: string, ret: Partial<GSTReturn>) => {
  const data = getData();
  data.returns = data.returns.map(r => r.id === id ? { ...r, ...ret } : r);
  saveData(data);
};
export const deleteReturn = (id: string) => {
  const data = getData();
  data.returns = data.returns.filter(r => r.id !== id);
  saveData(data);
};

// Users
export const getUsers = () => getData().users;
export const addUser = (user: Omit<User, 'id'>) => {
  const data = getData();
  const newUser: User = {
    ...user,
    passwordHash: bcrypt.hashSync(user.passwordHash, 10),
    id: Date.now().toString() + Math.random().toString(36).substring(2)
  };
  data.users.push(newUser);
  saveData(data);
  return newUser;
};
export const updateUser = (id: string, user: Partial<User>) => {
  const data = getData();
  data.users = data.users.map(u => {
    if (u.id === id) {
      const updatedUser = { ...u, ...user };
      if (user.passwordHash && user.passwordHash !== u.passwordHash) {
        updatedUser.passwordHash = bcrypt.hashSync(user.passwordHash, 10);
      }
      return updatedUser;
    }
    return u;
  });
  saveData(data);
};
export const deleteUser = (id: string) => {
  const data = getData();
  data.users = data.users.filter(u => u.id !== id);
  saveData(data);
};

// Export/Import
export const exportCSV = (fy: string) => {
  const data = getData();
  const fyReturns = data.returns.filter(r => r.financialYear === fy);
  
  let csv = 'Client Name,GSTIN,Type,Month,Status,Due Date,Filed Date,ARN\n';
  fyReturns.forEach(r => {
    const client = data.clients.find(c => c.id === r.clientId);
    if (client) {
      csv += `"${client.name}","${client.gstin}","${r.type}","${r.month}","${r.status}","${r.dueDate}","${r.filedDate || ''}","${r.arn || ''}"\n`;
    }
  });
  return csv;
};

export const exportHTMLReport = (fy: string) => {
  const data = getData();
  const fyReturns = data.returns.filter(r => r.financialYear === fy);
  
  let html = `
    <html>
      <head>
        <title>GST Report - ${fy}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .status-Pending { color: orange; }
          .status-Filed { color: green; }
          .status-Overdue { color: red; }
        </style>
      </head>
      <body>
        <h1>GST Returns Report - ${fy}</h1>
        <table>
          <tr>
            <th>Client Name</th>
            <th>GSTIN</th>
            <th>Type</th>
            <th>Month</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Filed Date</th>
            <th>ARN</th>
          </tr>
  `;
  
  fyReturns.forEach(r => {
    const client = data.clients.find(c => c.id === r.clientId);
    if (client) {
      html += `
        <tr>
          <td>${client.name}</td>
          <td>${client.gstin}</td>
          <td>${r.type}</td>
          <td>${r.month}</td>
          <td class="status-${r.status}">${r.status}</td>
          <td>${r.dueDate}</td>
          <td>${r.filedDate || '-'}</td>
          <td>${r.arn || '-'}</td>
        </tr>
      `;
    }
  });
  
  html += `
        </table>
      </body>
    </html>
  `;
  return html;
};

export const exportBackup = () => {
  return JSON.stringify(getData(), null, 2);
};

export const importBackup = (jsonString: string) => {
  try {
    const data = JSON.parse(jsonString);
    if (data.clients && data.returns && data.users) {
      saveData(data);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
};

const getMonthIndex = (month: string) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months.indexOf(month);
};

const calculateDueDate = (fy: string, month: string, type: string, frequency: string) => {
  const startYear = parseInt(fy.split('-')[0]);
  const monthIdx = getMonthIndex(month);
  
  // April(3) to December(11) are in startYear. Jan(0) to March(2) are in startYear + 1
  const year = monthIdx >= 3 ? startYear : startYear + 1;
  
  // Next month calculation
  let nextMonthIdx = monthIdx + 1;
  let nextMonthYear = year;
  if (nextMonthIdx > 11) {
    nextMonthIdx = 0;
    nextMonthYear++;
  }

  const pad = (n: number) => n.toString().padStart(2, '0');
  const nextMonthStr = pad(nextMonthIdx + 1);

  if (type === 'GSTR-1') {
    const day = frequency === 'Quarterly' ? '13' : '11';
    return `${nextMonthYear}-${nextMonthStr}-${day}`;
  } else if (type === 'GSTR-3B') {
    const day = frequency === 'Quarterly' ? '22' : '20'; // Simplified, assuming 22nd for quarterly
    return `${nextMonthYear}-${nextMonthStr}-${day}`;
  }
  
  return '';
};

export const autoGenerateReturns = (financialYear: string, month: string) => {
  const data = getData();
  const clients = data.clients;
  const existingReturns = data.returns.filter(r => r.financialYear === financialYear && r.month === month);
  
  let addedCount = 0;

  clients.forEach(client => {
    const freq = client.returnFrequency || 'Monthly';
    
    // GSTR-1 (or IFF for quarterly)
    const hasGstr1 = existingReturns.some(r => r.clientId === client.id && r.type === 'GSTR-1');
    if (!hasGstr1) {
      data.returns.push({
        id: Date.now().toString() + Math.random().toString(36).substring(2),
        clientId: client.id,
        type: 'GSTR-1',
        financialYear,
        month,
        status: 'Pending',
        dueDate: calculateDueDate(financialYear, month, 'GSTR-1', freq)
      });
      addedCount++;
    }

    // GSTR-3B
    const hasGstr3b = existingReturns.some(r => r.clientId === client.id && r.type === 'GSTR-3B');
    const isQuarterEnd = ['June', 'September', 'December', 'March'].includes(month);
    
    if (!hasGstr3b) {
      if (freq === 'Monthly' || (freq === 'Quarterly' && isQuarterEnd)) {
        data.returns.push({
          id: Date.now().toString() + Math.random().toString(36).substring(2),
          clientId: client.id,
          type: 'GSTR-3B',
          financialYear,
          month,
          status: 'Pending',
          dueDate: calculateDueDate(financialYear, month, 'GSTR-3B', freq)
        });
        addedCount++;
      }
    }
  });

  if (addedCount > 0) {
    saveData(data);
  }
  
  return addedCount;
};
