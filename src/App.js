import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

// --- DATABASE CONNECTION ---
const supabaseUrl = 'https://gsscocpxmsmtevjadxjd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzc2NvY3B4bXNtdGV2amFkeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MDMxODMsImV4cCI6MjA5NDA3OTE4M30._HUjYhFo34US81UiA6hCoxv_emo9K0sOa_oq8TjxKpk';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  // --- AUTHENTICATION STATE ---
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [activeTab, setActiveTab] = useState('daily');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [yesterdayCash, setYesterdayCash] = useState(0);
  const [yesterdayOnline, setYesterdayOnline] = useState(0);
  const [cashSale, setCashSale] = useState(0);
  const [onlineSale, setOnlineSale] = useState(0);
  
  const [onlineExpenses, setOnlineExpenses] = useState([]);
  const [cashExpenses, setCashExpenses] = useState([]);
  const [staffPayments, setStaffPayments] = useState([]);

  const [notes, setNotes] = useState({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', coins: '' });

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('vintage_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTask, setNewTask] = useState('');

  const [historyLogs, setHistoryLogs] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [analyticsStart, setAnalyticsStart] = useState(() => {
    let d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0];
  });
  const [analyticsEnd, setAnalyticsEnd] = useState(new Date().toISOString().split('T')[0]);

  const totalSale = Number(cashSale) + Number(onlineSale);
  const totalOnlineExpenses = onlineExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalCashExpenses = cashExpenses.filter(exp => exp.type === 'Cash').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalStaffCash = staffPayments.filter(s => s.method === 'Cash').reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const totalStaffOnline = staffPayments.filter(s => s.method === 'Online').reduce((sum, s) => sum + Number(s.amount || 0), 0);

  const totalCashInHand = yesterdayCash + Number(cashSale) - totalCashExpenses - totalStaffCash;
  const totalOnlineBalance = yesterdayOnline + Number(onlineSale) - totalOnlineExpenses - totalStaffOnline;
  const totalAmountLeft = totalCashInHand + totalOnlineBalance;

  const actualDrawerTotal = 
    (Number(notes[500]) * 500) + (Number(notes[200]) * 200) + (Number(notes[100]) * 100) + 
    (Number(notes[50]) * 50) + (Number(notes[20]) * 20) + (Number(notes[10]) * 10) + Number(notes.coins);
  
  const drawerDifference = actualDrawerTotal - totalCashInHand;

  // --- SUPABASE AUTHENTICATION HANDLERS ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Login Failed: " + error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const addOnlineExpense = () => setOnlineExpenses([...onlineExpenses, { id: Date.now(), category: '', description: '', amount: 0 }]);
  const updateOnlineExpense = (id, field, value) => setOnlineExpenses(onlineExpenses.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
  
  const addCashExpense = () => setCashExpenses([...cashExpenses, { id: Date.now(), category: '', description: '', amount: 0, type: 'Cash' }]);
  const updateCashExpense = (id, field, value) => setCashExpenses(cashExpenses.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));

  const addStaffPayment = () => setStaffPayments([...staffPayments, { id: Date.now(), name: '', amount: 0, type: 'Full Wage', method: 'Cash' }]);
  const updateStaffPayment = (id, field, value) => setStaffPayments(staffPayments.map(s => s.id === id ? { ...s, [field]: value } : s));

  useEffect(() => { localStorage.setItem('vintage_tasks', JSON.stringify(tasks)); }, [tasks]);
  const handleAddTask = () => { if (newTask.trim()) { setTasks([{ id: Date.now(), text: newTask, done: false }, ...tasks]); setNewTask(''); }};
  const toggleTask = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));

  useEffect(() => {
    if (!session) return;
    const fetchYesterday = async () => {
      const { data } = await supabase.from('daily_logs').select('total_cash_in_hand, total_online_balance').order('date', { ascending: false }).limit(1);
      if (data && data.length > 0) { setYesterdayCash(data[0].total_cash_in_hand); setYesterdayOnline(data[0].total_online_balance); }
    };
    fetchYesterday();
  }, [session]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    const { data } = await supabase.from('daily_logs').select('*').order('date', { ascending: false });
    if (data) setHistoryLogs(data);
    setIsLoadingHistory(false);
  };

  useEffect(() => { if (session && (activeTab === 'history' || activeTab === 'analytics')) loadHistory(); }, [activeTab, session]);

  const saveDailyAccounts = async () => {
    const { error } = await supabase.from('daily_logs').upsert({ 
        date: date, total_cash_in_hand: totalCashInHand, total_online_balance: totalOnlineBalance,
        expense_details: { online: onlineExpenses, cash: cashExpenses, staff: staffPayments, sales: { cash: cashSale, online: onlineSale }, drawer_difference: drawerDifference }
      }, { onConflict: 'date' });
    if (error) alert("Error saving data: " + error.message); else alert("Vintage Daily Accounts Saved securely!");
  };

  const printReceipt = (log) => {
    const printWindow = window.open('', '', 'height=600,width=400');
    printWindow.document.write(`
      <html><head><title>Print Report - ${log.date}</title>
      <style>body{font-family: monospace; padding: 20px;} h2{text-align:center;} .row{display:flex;justify-content:space-between;}</style>
      </head><body>
      <h2>VINTAGE RESTAURANT</h2><p style="text-align:center;">Daily Account Summary<br/>Date: ${log.date}</p><hr/>
      <div class="row"><span>Cash Sales:</span><span>${log.expense_details?.sales?.cash || 0}</span></div>
      <div class="row"><span>Online Sales:</span><span>${log.expense_details?.sales?.online || 0}</span></div><hr/>
      <div class="row"><b>Total Cash In Hand:</b><b>${log.total_cash_in_hand}</b></div>
      <div class="row"><b>Total Online Bal:</b><b>${log.total_online_balance}</b></div><hr/>
      <div class="row"><h3 style="margin:10px 0;">TOTAL LEFT:</h3><h3>${Number(log.total_cash_in_hand) + Number(log.total_online_balance)}</h3></div>
      <hr/><p style="text-align:center;font-size:12px;">Generated via Vintage Secure System</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const exportToExcel = () => {
    if (historyLogs.length === 0) return alert("No data to export!");
    const summaryData = []; const detailedExpenses = [];

    historyLogs.forEach(log => {
      let cashSales = log.expense_details?.sales?.cash || 0;
      let onlineSales = log.expense_details?.sales?.online || 0;
      let staffWages = log.expense_details?.staff ? log.expense_details.staff.reduce((sum, s) => sum + Number(s.amount || 0), 0) : 0;
      let totalLeft = Number(log.total_cash_in_hand) + Number(log.total_online_balance);

      summaryData.push({
        "Date": log.date, "Cash Sales (₹)": cashSales, "Online Sales (₹)": onlineSales,
        "Total Staff Wages Paid (₹)": staffWages, "Closing Cash In Hand (₹)": log.total_cash_in_hand,
        "Closing Online Balance (₹)": log.total_online_balance, "Total Money Left (₹)": totalLeft,
        "Physical Drawer Discrepancy (₹)": log.expense_details?.drawer_difference || 'Not Logged'
      });

      const pushExpense = (arr, mainType) => {
        if (!arr) return;
        arr.forEach(exp => {
          detailedExpenses.push({
            "Date": log.date, "Account Type": mainType, "Payment Method": exp.type || (mainType === 'Online Exp' ? 'Online' : 'Cash'),
            "Category": exp.category || 'Uncategorized', "Description": exp.description || 'N/A', "Amount (₹)": Number(exp.amount || 0)
          });
        });
      };

      pushExpense(log.expense_details?.online, "Online Exp"); pushExpense(log.expense_details?.cash, "Cash/Credit Exp");
      if (log.expense_details?.staff) {
        log.expense_details.staff.forEach(staff => {
          detailedExpenses.push({
            "Date": log.date, "Account Type": "Staff Wage/Advance", "Payment Method": staff.method || 'Cash',
            "Category": staff.type || 'Full Wage', "Description": staff.name || 'Staff Member', "Amount (₹)": Number(staff.amount || 0)
          });
        });
      }
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryData), "Daily Summary");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(detailedExpenses), "Expense Details");
    XLSX.writeFile(workbook, `Vintage_Accounts_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const analyticsData = useMemo(() => {
    const filtered = historyLogs.filter(log => log.date >= analyticsStart && log.date <= analyticsEnd);
    let totalSales = 0; let totalExpenses = 0; const categoryTotals = {};
    filtered.forEach(log => {
      totalSales += Number(log.expense_details?.sales?.cash || 0) + Number(log.expense_details?.sales?.online || 0);
      const processExp = (arr) => {
        if(!arr) return;
        arr.forEach(exp => {
          if (exp.type === 'Credit') return;
          totalExpenses += Number(exp.amount || 0);
          const cat = exp.category || exp.name || 'Uncategorized';
          categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(exp.amount || 0);
        });
      };
      processExp(log.expense_details?.online); processExp(log.expense_details?.cash);
      if(log.expense_details?.staff) {
        log.expense_details.staff.forEach(s => {
          totalExpenses += Number(s.amount || 0);
          categoryTotals['Staff Wages & Advances'] = (categoryTotals['Staff Wages & Advances'] || 0) + Number(s.amount || 0);
        });
      }
    });
    const maxCatVal = Math.max(...Object.values(categoryTotals), 1);
    const sortedCategories = Object.entries(categoryTotals).sort((a,b) => b[1] - a[1]);
    return { totalSales, totalExpenses, sortedCategories, maxCatVal };
  }, [historyLogs, analyticsStart, analyticsEnd]);


  // --- SECURE LOGIN SCREEN ---
  if (!session) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f9fafb', padding: '20px' }}>
        <div style={{ ...cardStyle, textAlign: 'center', padding: '40px', maxWidth: '400px', width: '100%', boxSizing: 'border-box' }}>
          <img src="https://cdn-icons-png.flaticon.com/512/3170/3170733.png" alt="Vintage Logo" style={{ width: '80px', marginBottom: '10px' }}/>
          <h2 style={{marginTop: 0, color: '#1f2937'}}>Vintage Restaurant</h2>
          <p style={{color: '#6b7280', marginBottom: '20px'}}>Secure Admin Portal</p>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="email" 
              placeholder="Admin Email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              style={{...inputStyle, padding: '15px'}} 
              required
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={{...inputStyle, padding: '15px'}} 
              required
            />
            <button type="submit" style={{ ...btnStyle, width: '100%', fontSize: '18px', padding: '15px', marginTop: '10px' }}>Secure Login</button>
          </form>
        </div>
      </div>
    );
  }

  // --- MAIN APP UI ---
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '1000px', margin: '0 auto', backgroundColor: '#f9fafb' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: 'white', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src="https://cdn-icons-png.flaticon.com/512/3170/3170733.png" alt="Vintage Logo" style={{ width: '45px' }}/>
          <h1 style={{ color: '#1f2937', margin: 0 }}>Vintage Accounts</h1>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>🚪 Log Out</button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('daily')} style={{ ...tabStyle, backgroundColor: activeTab === 'daily' ? '#10b981' : '#e5e7eb', color: activeTab === 'daily' ? 'white' : 'black' }}>📝 Daily Entry</button>
        <button onClick={() => setActiveTab('history')} style={{ ...tabStyle, backgroundColor: activeTab === 'history' ? '#3b82f6' : '#e5e7eb', color: activeTab === 'history' ? 'white' : 'black' }}>📋 History</button>
        <button onClick={() => setActiveTab('analytics')} style={{ ...tabStyle, backgroundColor: activeTab === 'analytics' ? '#8b5cf6' : '#e5e7eb', color: activeTab === 'analytics' ? 'white' : 'black' }}>📈 Analytics</button>
        <button onClick={() => setActiveTab('tasks')} style={{ ...tabStyle, backgroundColor: activeTab === 'tasks' ? '#f59e0b' : '#e5e7eb', color: activeTab === 'tasks' ? 'white' : 'black' }}>🔔 Reminders {tasks.filter(t => !t.done).length > 0 && `(${tasks.filter(t => !t.done).length})`}</button>
      </div>

      {activeTab === 'daily' && (
        <>
          <datalist id="common-expenses">
            <option value="Vegetables & Groceries" /><option value="Meat & Poultry" /><option value="Dairy & Milk" />
            <option value="Cleaning Supplies" /><option value="Water Bottles/Cans" /><option value="Maintenance/Repairs" />
          </datalist>

          <div style={flexRow}>
            <div style={{...cardStyle, flex: 1}}><h3>Start of Day</h3><label>Date: <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle}/></label></div>
            <div style={{...cardStyle, flex: 1}}><h3>Yesterday</h3><div style={flexRow}><label>Cash: <input type="number" value={yesterdayCash} onChange={e => setYesterdayCash(Number(e.target.value))} style={inputStyle}/></label><label>Online: <input type="number" value={yesterdayOnline} onChange={e => setYesterdayOnline(Number(e.target.value))} style={inputStyle}/></label></div></div>
            <div style={{...cardStyle, flex: 1}}><h3>Today Sales</h3><div style={flexRow}><label>Cash: <input type="number" value={cashSale} onChange={e => setCashSale(Number(e.target.value))} style={inputStyle}/></label><label>Online: <input type="number" value={onlineSale} onChange={e => setOnlineSale(Number(e.target.value))} style={inputStyle}/></label></div></div>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ ...cardStyle, flex: 1, minWidth: '350px' }}>
              <h3 style={{color: '#3b82f6'}}>💳 Online Expenses</h3>
              {onlineExpenses.map(exp => (
                <div key={exp.id} style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                  <input list="common-expenses" placeholder="Category" value={exp.category} onChange={e => updateOnlineExpense(exp.id, 'category', e.target.value)} style={{...inputStyle, flex: 1.5}}/>
                  <input placeholder="Specific Details" value={exp.description} onChange={e => updateOnlineExpense(exp.id, 'description', e.target.value)} style={{...inputStyle, flex: 2}}/>
                  <input type="number" placeholder="Amount" value={exp.amount} onChange={e => updateOnlineExpense(exp.id, 'amount', e.target.value)} style={{...inputStyle, flex: 1}}/>
                </div>
              ))}
              <button onClick={addOnlineExpense} style={btnStyle}>+ Add Online Exp</button>
            </div>

            <div style={{ ...cardStyle, flex: 1, minWidth: '350px' }}>
              <h3 style={{color: '#10b981'}}>💵 Cash / Credit Expenses</h3>
              {cashExpenses.map(exp => (
                <div key={exp.id} style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                  <input list="common-expenses" placeholder="Category" value={exp.category} onChange={e => updateCashExpense(exp.id, 'category', e.target.value)} style={{...inputStyle, flex: 1.5}}/>
                  <input placeholder="Details" value={exp.description} onChange={e => updateCashExpense(exp.id, 'description', e.target.value)} style={{...inputStyle, flex: 2}}/>
                  <input type="number" placeholder="Amount" value={exp.amount} onChange={e => updateCashExpense(exp.id, 'amount', e.target.value)} style={{...inputStyle, flex: 1}}/>
                  <select value={exp.type} onChange={e => updateCashExpense(exp.id, 'type', e.target.value)} style={{inputStyle, flex: 1}}><option>Cash</option><option>Credit</option></select>
                </div>
              ))}
              <button onClick={addCashExpense} style={btnStyle}>+ Add Cash/Credit Exp</button>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{color: '#8b5cf6'}}>👨‍🍳 Staff Wages & Advances</h3>
            {staffPayments.map(s => (
              <div key={s.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input placeholder="Staff Name" value={s.name} onChange={e => updateStaffPayment(s.id, 'name', e.target.value)} style={{...inputStyle, flex: 2}}/>
                <select value={s.type} onChange={e => updateStaffPayment(s.id, 'type', e.target.value)} style={{...inputStyle, flex: 1}}><option>Full Wage</option><option>Cash Advance</option></select>
                <input type="number" placeholder="Amount" value={s.amount} onChange={e => updateStaffPayment(s.id, 'amount', e.target.value)} style={{...inputStyle, flex: 1}}/>
                <select value={s.method} onChange={e => updateStaffPayment(s.id, 'method', e.target.value)} style={{...inputStyle, flex: 1}}><option>Cash</option><option>Online</option></select>
              </div>
            ))}
            <button onClick={addStaffPayment} style={{...btnStyle, backgroundColor: '#8b5cf6'}}>+ Log Staff Payment</button>
          </div>

          <div style={{ ...cardStyle, backgroundColor: '#fdfbc8', border: '1px solid #fde047' }}>
            <h3 style={{ color: '#854d0e', marginTop: 0 }}>🧮 Count Physical Cash Drawer</h3>
            <p style={{ fontSize: '14px', color: '#a16207', marginBottom: '15px' }}>Enter the quantity of notes currently in your register to check for missing funds.</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <label style={{ flex: 1 }}>₹500 x <input type="number" value={notes[500]} onChange={e => setNotes({...notes, 500: e.target.value})} style={inputStyle}/></label>
              <label style={{ flex: 1 }}>₹200 x <input type="number" value={notes[200]} onChange={e => setNotes({...notes, 200: e.target.value})} style={inputStyle}/></label>
              <label style={{ flex: 1 }}>₹100 x <input type="number" value={notes[100]} onChange={e => setNotes({...notes, 100: e.target.value})} style={inputStyle}/></label>
              <label style={{ flex: 1 }}>₹50 x <input type="number" value={notes[50]} onChange={e => setNotes({...notes, 50: e.target.value})} style={inputStyle}/></label>
              <label style={{ flex: 1 }}>₹20 x <input type="number" value={notes[20]} onChange={e => setNotes({...notes, 20: e.target.value})} style={inputStyle}/></label>
              <label style={{ flex: 1 }}>₹10 x <input type="number" value={notes[10]} onChange={e => setNotes({...notes, 10: e.target.value})} style={inputStyle}/></label>
              <label style={{ flex: 1.5 }}>Coins (Total ₹): <input type="number" value={notes.coins} onChange={e => setNotes({...notes, coins: e.target.value})} style={inputStyle}/></label>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
              <div>
                <p style={{ margin: 0, color: '#6b7280' }}>Actual Physical Cash:</p>
                <h2 style={{ margin: 0, color: '#ca8a04' }}>₹{actualDrawerTotal}</h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, color: '#6b7280' }}>Discrepancy (Physical vs System):</p>
                <h2 style={{ margin: 0, color: drawerDifference === 0 ? 'green' : 'red' }}>
                  {drawerDifference > 0 ? `+ ₹${drawerDifference} (Over)` : drawerDifference < 0 ? `- ₹${Math.abs(drawerDifference)} (Short)` : 'Perfect Match ✓'}
                </h2>
              </div>
            </div>
          </div>

          <div style={{ ...cardStyle, backgroundColor: '#1f2937', color: 'white' }}>
            <h3>Final System Balances</h3>
            <div style={flexRow}>
              <h4 style={{flex: 1}}>Expected Cash In Hand: <br/><span style={{ color: '#34d399', fontSize: '24px' }}>{totalCashInHand}</span></h4>
              <h4 style={{flex: 1}}>Online Balance: <br/><span style={{ color: '#60a5fa', fontSize: '24px' }}>{totalOnlineBalance}</span></h4>
              <h3 style={{ flex: 1 }}>Total Money Left: <br/>{totalAmountLeft}</h3>
            </div>
            <button onClick={saveDailyAccounts} style={{ ...btnStyle, backgroundColor: '#10b981', width: '100%', marginTop: '20px', fontSize: '18px', padding: '15px' }}>💾 Save & Close Register</button>
          </div>
        </>
      )}

      {activeTab === 'tasks' && (
        <div style={{ ...cardStyle, maxWidth: '600px', margin: '0 auto' }}>
          <h2>🔔 Front Desk Tasks & Reminders</h2>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>Log supplier payments, kitchen notes, or end-of-day duties here. These stay saved on your tablet until checked off!</p>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input 
              type="text" 
              placeholder="e.g. Pay milk vendor ₹1500 tomorrow morning..." 
              value={newTask} 
              onChange={e => setNewTask(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleAddTask()}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={handleAddTask} style={{ ...btnStyle, backgroundColor: '#f59e0b' }}>Add Task</button>
          </div>

          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {tasks.length === 0 ? <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>All caught up! No pending tasks.</p> : null}
            {tasks.map(task => (
              <li key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', backgroundColor: task.done ? '#f3f4f6' : 'white', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '10px', transition: '0.2s' }}>
                <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} style={{ transform: 'scale(1.5)', cursor: 'pointer' }} />
                <span style={{ flex: 1, fontSize: '18px', color: task.done ? '#9ca3af' : '#1f2937', textDecoration: task.done ? 'line-through' : 'none' }}>
                  {task.text}
                </span>
                <button onClick={() => deleteTask(task.id)} style={{ padding: '5px 10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'history' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{margin: 0}}>Past Records</h2>
            <button onClick={exportToExcel} style={{ ...btnStyle, backgroundColor: '#10b981' }}>📊 Download Multi-Sheet Excel</button>
          </div>
          {isLoadingHistory ? <p>Loading...</p> : (
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '2px solid #ccc' }}><th style={{padding: '10px'}}>Date</th><th style={{padding: '10px'}}>Cash</th><th style={{padding: '10px'}}>Online</th><th style={{padding: '10px'}}>Total</th><th style={{padding: '10px'}}>Action</th></tr></thead>
              <tbody>
                {historyLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}><strong>{log.date}</strong></td>
                    <td style={{ padding: '10px', color: 'green' }}>{log.total_cash_in_hand}</td>
                    <td style={{ padding: '10px', color: 'blue' }}>{log.total_online_balance}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{Number(log.total_cash_in_hand) + Number(log.total_online_balance)}</td>
                    <td style={{ padding: '10px' }}><button onClick={() => printReceipt(log)} style={{...btnStyle, padding: '5px 10px'}}>🖨️ Print</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div style={cardStyle}>
          <h2>Visual Analytics</h2>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', background: '#f3f4f6', padding: '15px', borderRadius: '8px' }}>
            <label>Start Date: <input type="date" value={analyticsStart} onChange={e => setAnalyticsStart(e.target.value)} style={inputStyle}/></label>
            <label>End Date: <input type="date" value={analyticsEnd} onChange={e => setAnalyticsEnd(e.target.value)} style={inputStyle}/></label>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
            <div style={{ flex: 1, padding: '20px', background: '#ecfdf5', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{margin: 0, color: '#065f46', fontWeight: 'bold'}}>Total Sales</p><h2 style={{margin: 0, color: '#059669'}}>{analyticsData.totalSales}</h2>
            </div>
            <div style={{ flex: 1, padding: '20px', background: '#fef2f2', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{margin: 0, color: '#991b1b', fontWeight: 'bold'}}>Total Expenses</p><h2 style={{margin: 0, color: '#dc2626'}}>{analyticsData.totalExpenses}</h2>
            </div>
          </div>

          <h3>Category Expenses Breakdown</h3>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            {analyticsData.sortedCategories.length === 0 ? <p>No expenses found in this date range.</p> : 
              analyticsData.sortedCategories.map(([category, amount]) => (
              <div key={category} style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <strong>{category}</strong><span>{amount}</span>
                </div>
                <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '4px', height: '12px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: '#3b82f6', width: `${(amount / analyticsData.maxCatVal) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' };
const flexRow = { display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' };
const inputStyle = { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px', width: '100%', boxSizing: 'border-box' };
const btnStyle = { padding: '10px 15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const tabStyle = { flex: 1, padding: '15px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' };