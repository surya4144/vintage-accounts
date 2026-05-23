import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

// --- DATABASE CONNECTION ---
const supabaseUrl = 'https://gsscocpxmsmtevjadxjd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzc2NvY3B4bXNtdGV2amFkeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MDMxODMsImV4cCI6MjA5NDA3OTE4M30._HUjYhFo34US81UiA6hCoxv_emo9K0sOa_oq8TjxKpk';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [activeTab, setActiveTab] = useState('daily');
  const [isDataLoaded, setIsDataLoaded] = useState(false); 

  // NEW: Separate UI Date Selector from the Actual Database Date
  const [dateSelection, setDateSelection] = useState(new Date().toISOString().split('T')[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [yesterdayCash, setYesterdayCash] = useState(0);
  const [yesterdayOnline, setYesterdayOnline] = useState(0);
  const [cashSale, setCashSale] = useState(0);
  const [onlineSale, setOnlineSale] = useState(0);
  
  const [onlineExpenses, setOnlineExpenses] = useState([]);
  const [cashExpenses, setCashExpenses] = useState([]);
  const [staffPayments, setStaffPayments] = useState([]);
  
  const [creditSales, setCreditSales] = useState([]);
  const [creditReceived, setCreditReceived] = useState([]);
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

  // --- 1. SUPABASE AUTHENTICATION ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Login Failed: " + error.message);
  };

  const handleLogout = async () => await supabase.auth.signOut();

  // --- 2. GLOBAL HISTORY FETCH ---
  const loadHistory = async () => {
    setIsLoadingHistory(true);
    const { data } = await supabase.from('daily_logs').select('*').order('date', { ascending: false });
    if (data) setHistoryLogs(data);
    setIsLoadingHistory(false);
  };

  useEffect(() => { if (session) loadHistory(); }, [session]);

  // --- 3. SMART CATEGORY LEARNING ---
  const defaultCategories = ["Vegetables & Groceries", "Meat & Poultry", "Dairy & Milk", "Cleaning Supplies", "Water Bottles/Cans", "Maintenance/Repairs"];
  const dynamicCategories = useMemo(() => {
    const cats = new Set(defaultCategories);
    historyLogs.forEach(log => {
      log.expense_details?.online?.forEach(e => e.category && cats.add(e.category.trim()));
      log.expense_details?.cash?.forEach(e => e.category && cats.add(e.category.trim()));
    });
    return Array.from(cats).sort();
  }, [historyLogs]);

  // --- 4. FETCH DATA & RESTORE UNSAVED DRAFTS ---
  useEffect(() => {
    if (!session) return;
    let isMounted = true;
    
    const loadSpecificDateData = async () => {
      setIsDataLoaded(false); 
      
      const { data: currentData } = await supabase.from('daily_logs').select('*').eq('date', date).single();
      const draftStr = localStorage.getItem(`vintage_draft_${date}`);
      const draft = draftStr ? JSON.parse(draftStr) : null;

      if (isMounted) {
        if (draft) {
          setCashSale(draft.cashSale || 0); setOnlineSale(draft.onlineSale || 0);
          setOnlineExpenses(draft.onlineExpenses || []); setCashExpenses(draft.cashExpenses || []);
          setStaffPayments(draft.staffPayments || []); setCreditSales(draft.creditSales || []);
          setCreditReceived(draft.creditReceived || []); setNotes(draft.notes || { 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', coins: '' });
        } else if (currentData) {
          setCashSale(currentData.expense_details?.sales?.cash || 0); setOnlineSale(currentData.expense_details?.sales?.online || 0);
          setOnlineExpenses(currentData.expense_details?.online || []); setCashExpenses(currentData.expense_details?.cash || []);
          setStaffPayments(currentData.expense_details?.staff || []); setCreditSales(currentData.expense_details?.credit_sales || []);
          setCreditReceived(currentData.expense_details?.credit_received || []);
          setNotes({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', coins: '' }); 
        } else {
          setCashSale(0); setOnlineSale(0);
          setOnlineExpenses([]); setCashExpenses([]); setStaffPayments([]);
          setCreditSales([]); setCreditReceived([]);
          setNotes({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', coins: '' });
        }

        const { data: prevData } = await supabase.from('daily_logs').select('total_cash_in_hand, total_online_balance').lt('date', date).order('date', { ascending: false }).limit(1);
        if (prevData && prevData.length > 0) {
          setYesterdayCash(prevData[0].total_cash_in_hand); setYesterdayOnline(prevData[0].total_online_balance);
        } else {
          setYesterdayCash(0); setYesterdayOnline(0);
        }
        setIsDataLoaded(true); 
      }
    };
    
    loadSpecificDateData();
    return () => { isMounted = false; };
  }, [date, session]);

  // --- 5. BACKGROUND AUTO-SAVE ---
  useEffect(() => {
    if (isDataLoaded && session) {
      const draft = { cashSale, onlineSale, onlineExpenses, cashExpenses, staffPayments, creditSales, creditReceived, notes };
      localStorage.setItem(`vintage_draft_${date}`, JSON.stringify(draft));
    }
  }, [isDataLoaded, session, date, cashSale, onlineSale, onlineExpenses, cashExpenses, staffPayments, creditSales, creditReceived, notes]);

  // --- MATH LOGIC ---
  const totalOnlineExpenses = onlineExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalCashExpenses = cashExpenses.filter(exp => exp.type === 'Cash').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalCounterExpenses = cashExpenses.filter(exp => exp.type === 'Counter').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalStaffCash = staffPayments.filter(s => s.method === 'Cash').reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const totalStaffOnline = staffPayments.filter(s => s.method === 'Online').reduce((sum, s) => sum + Number(s.amount || 0), 0);

  const totalCreditSales = creditSales.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const creditReceivedCash = creditReceived.filter(c => c.method === 'Cash').reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const creditReceivedOnline = creditReceived.filter(c => c.method === 'Online').reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const grossCashSale = Number(cashSale) + totalCounterExpenses;
  const trueGrossSale = grossCashSale + Number(onlineSale) + totalCreditSales;

  const totalCashInHand = yesterdayCash + Number(cashSale) + creditReceivedCash - totalCashExpenses - totalStaffCash;
  const totalOnlineBalance = yesterdayOnline + Number(onlineSale) + creditReceivedOnline - totalOnlineExpenses - totalStaffOnline;
  const totalAmountLeft = totalCashInHand + totalOnlineBalance;

  const actualDrawerTotal = (Number(notes[500]) * 500) + (Number(notes[200]) * 200) + (Number(notes[100]) * 100) + (Number(notes[50]) * 50) + (Number(notes[20]) * 20) + (Number(notes[10]) * 10) + Number(notes.coins);
  const drawerDifference = actualDrawerTotal - totalCashInHand;

  // --- HANDLERS ---
  const addArrItem = (setter, arr, defaults) => setter([...arr, { id: Date.now(), ...defaults }]);
  const updateArrItem = (setter, arr, id, field, value) => setter(arr.map(item => item.id === id ? { ...item, [field]: value } : item));
  
  const addCreditSale = () => addArrItem(setCreditSales, creditSales, { name: '', amount: 0 });
  const addCreditReceived = () => addArrItem(setCreditReceived, creditReceived, { name: '', amount: 0, method: 'Cash' });
  const addOnlineExpense = () => addArrItem(setOnlineExpenses, onlineExpenses, { category: '', description: '', amount: 0 });
  const addCashExpense = () => addArrItem(setCashExpenses, cashExpenses, { category: '', description: '', amount: 0, type: 'Cash' });
  const addStaffPayment = () => addArrItem(setStaffPayments, staffPayments, { name: '', amount: 0, type: 'Full Wage', method: 'Cash' });

  const handleAddTask = () => { if (newTask.trim()) { setTasks([{ id: Date.now(), text: newTask, done: false }, ...tasks]); setNewTask(''); }};
  const toggleTask = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));
  useEffect(() => { localStorage.setItem('vintage_tasks', JSON.stringify(tasks)); }, [tasks]);

  const saveDailyAccounts = async () => {
    const { error } = await supabase.from('daily_logs').upsert({ 
        date: date, total_cash_in_hand: totalCashInHand, total_online_balance: totalOnlineBalance,
        expense_details: { online: onlineExpenses, cash: cashExpenses, staff: staffPayments, sales: { cash: cashSale, online: onlineSale }, credit_sales: creditSales, credit_received: creditReceived, drawer_difference: drawerDifference }
      }, { onConflict: 'date' });
    if (error) {
      alert("Error saving data: " + error.message); 
    } else {
      alert("Vintage Daily Accounts Saved securely!");
      localStorage.removeItem(`vintage_draft_${date}`); 
      loadHistory(); 
    }
  };

  const exportToExcel = () => {
    if (historyLogs.length === 0) return alert("No data to export!");
    const summaryData = []; const detailedData = [];

    historyLogs.forEach(log => {
      let netCashSale = log.expense_details?.sales?.cash || 0;
      let onlineSales = log.expense_details?.sales?.online || 0;
      let counterTotal = log.expense_details?.cash?.filter(e => e.type === 'Counter').reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;
      let cSales = log.expense_details?.credit_sales?.reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0;
      let cRecv = log.expense_details?.credit_received?.reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0;

      summaryData.push({
        "Date": log.date, "Gross Cash Sales (₹)": Number(netCashSale) + Number(counterTotal), "Online Sales (₹)": onlineSales,
        "Credit Sales Given (₹)": cSales, "Credit Payments Received (₹)": cRecv,
        "Closing Cash In Hand (₹)": log.total_cash_in_hand, "Closing Online Balance (₹)": log.total_online_balance,
      });

      const pushData = (arr, mainType) => {
        if (!arr) return;
        arr.forEach(item => {
          detailedData.push({
            "Date": log.date, "Type": mainType, "Method": item.type || item.method || 'N/A',
            "Details": item.category || item.name || 'N/A', "Note": item.description || '', "Amount (₹)": Number(item.amount || 0)
          });
        });
      };
      pushData(log.expense_details?.online, "Online Exp"); pushData(log.expense_details?.cash, "Offline/Owner Exp");
      pushData(log.expense_details?.staff, "Staff Payment"); pushData(log.expense_details?.credit_sales, "Credit Sale Given");
      pushData(log.expense_details?.credit_received, "Credit Payment Received");
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Daily Summary");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailedData), "Detailed Entries");
    XLSX.writeFile(wb, `Vintage_Accounts_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // --- AUTOMATIC KHATA (LEDGER) CALCULATOR ---
  const ledgerData = useMemo(() => {
    const balances = {};
    historyLogs.forEach(log => {
      (log.expense_details?.credit_sales || []).forEach(c => {
        const key = c.name?.trim().toUpperCase() || 'UNKNOWN';
        if (!balances[key]) balances[key] = { name: c.name || 'Unknown', given: 0, received: 0 };
        balances[key].given += Number(c.amount || 0);
      });
      (log.expense_details?.credit_received || []).forEach(c => {
        const key = c.name?.trim().toUpperCase() || 'UNKNOWN';
        if (!balances[key]) balances[key] = { name: c.name || 'Unknown', given: 0, received: 0 };
        balances[key].received += Number(c.amount || 0);
      });
    });
    return Object.values(balances).map(b => ({ ...b, balance: b.given - b.received })).filter(b => b.balance !== 0).sort((a, b) => b.balance - a.balance);
  }, [historyLogs]);

  // --- AUTOMATIC ANALYTICS CALCULATOR ---
  const analyticsData = useMemo(() => {
    const filtered = historyLogs.filter(log => log.date >= analyticsStart && log.date <= analyticsEnd);
    let totalSales = 0; let totalExpenses = 0; const categoryTotals = {};
    filtered.forEach(log => {
      let logNetCashSale = Number(log.expense_details?.sales?.cash || 0);
      let logCounterExp = log.expense_details?.cash?.filter(e => e.type === 'Counter').reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;
      let logCreditSales = log.expense_details?.credit_sales?.reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0;
      
      totalSales += logNetCashSale + logCounterExp + logCreditSales + Number(log.expense_details?.sales?.online || 0);
      
      const processExp = (arr) => {
        if(!arr) return;
        arr.forEach(exp => {
          if (['Credit', 'Counter', 'Teja', 'Anil'].includes(exp.type)) return; 
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
        <div style={{ ...cardStyle, textAlign: 'center', padding: '40px', maxWidth: '400px', width: '100%' }}>
          <img src="https://cdn-icons-png.flaticon.com/512/3170/3170733.png" alt="Vintage Logo" style={{ width: '80px', marginBottom: '10px' }}/>
          <h2 style={{marginTop: 0, color: '#1f2937'}}>Vintage Restaurant</h2>
          <p style={{color: '#6b7280', marginBottom: '20px'}}>Secure Admin Portal</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="email" placeholder="Admin Email" value={email} onChange={e => setEmail(e.target.value)} style={{...inputStyle, padding: '15px'}} required/>
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{...inputStyle, padding: '15px'}} required/>
            <button type="submit" style={{ ...btnStyle, width: '100%', fontSize: '18px', padding: '15px' }}>Secure Login</button>
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

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('daily')} style={{ ...tabStyle, backgroundColor: activeTab === 'daily' ? '#10b981' : '#e5e7eb', color: activeTab === 'daily' ? 'white' : 'black' }}>📝 Daily Entry</button>
        <button onClick={() => setActiveTab('ledger')} style={{ ...tabStyle, backgroundColor: activeTab === 'ledger' ? '#ec4899' : '#e5e7eb', color: activeTab === 'ledger' ? 'white' : 'black' }}>📒 Customer Khata</button>
        <button onClick={() => setActiveTab('history')} style={{ ...tabStyle, backgroundColor: activeTab === 'history' ? '#3b82f6' : '#e5e7eb', color: activeTab === 'history' ? 'white' : 'black' }}>📋 History</button>
        <button onClick={() => setActiveTab('analytics')} style={{ ...tabStyle, backgroundColor: activeTab === 'analytics' ? '#8b5cf6' : '#e5e7eb', color: activeTab === 'analytics' ? 'white' : 'black' }}>📈 Analytics</button>
        <button onClick={() => setActiveTab('tasks')} style={{ ...tabStyle, backgroundColor: activeTab === 'tasks' ? '#f59e0b' : '#e5e7eb', color: activeTab === 'tasks' ? 'white' : 'black' }}>🔔 Reminders</button>
      </div>

      {activeTab === 'daily' && (
        <>
          <datalist id="common-expenses">
            {dynamicCategories.map((cat, i) => <option key={i} value={cat} />)}
          </datalist>

          <div style={flexRow}>
            {/* NEW FETCH BUTTON FEATURE */}
            <div style={{...cardStyle, flex: 1, border: '2px solid #3b82f6'}}>
              <h3 style={{ color: '#1d4ed8', marginTop: 0 }}>📅 Select Date</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="date" value={dateSelection} onChange={e => setDateSelection(e.target.value)} style={{...inputStyle, borderColor: '#3b82f6', fontWeight: 'bold', flex: 1}}/>
                <button onClick={() => setDate(dateSelection)} style={{...btnStyle, backgroundColor: '#2563eb'}}>📥 Fetch</button>
              </div>
              {date !== dateSelection && <p style={{color: '#ef4444', fontSize: '12px', marginTop: '5px', marginBottom: 0}}>Click Fetch to load selected date!</p>}
            </div>
            
            <div style={{...cardStyle, flex: 1}}><h3>Yesterday</h3><div style={flexRow}><label>Cash: <input type="number" value={yesterdayCash} onChange={e => setYesterdayCash(Number(e.target.value))} style={inputStyle}/></label><label>Online: <input type="number" value={yesterdayOnline} onChange={e => setYesterdayOnline(Number(e.target.value))} style={inputStyle}/></label></div></div>
            <div style={{...cardStyle, flex: 1}}>
              <h3>Today Sales</h3>
              <div style={flexRow}>
                <label style={{position: 'relative'}}>Cash (Net Box): <input type="number" value={cashSale} onChange={e => setCashSale(Number(e.target.value))} style={inputStyle}/>
                  {totalCounterExpenses > 0 && <span style={{fontSize: '12px', color: '#059669', position: 'absolute', bottom: '-20px', left: 0}}>True Gross: ₹{grossCashSale}</span>}
                </label>
                <label>Online: <input type="number" value={onlineSale} onChange={e => setOnlineSale(Number(e.target.value))} style={inputStyle}/></label>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ ...cardStyle, flex: 1, minWidth: '350px', borderTop: '4px solid #f43f5e' }}>
              <h3 style={{color: '#e11d48'}}>🔴 Give Credit (Sale Today, Pay Later)</h3>
              {creditSales.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                  <input placeholder="Customer/App Name" value={c.name} onChange={e => updateArrItem(setCreditSales, creditSales, c.id, 'name', e.target.value)} style={{...inputStyle, flex: 1}}/>
                  <input type="number" placeholder="Amount" value={c.amount} onChange={e => updateArrItem(setCreditSales, creditSales, c.id, 'amount', e.target.value)} style={{...inputStyle, flex: 1}}/>
                </div>
              ))}
              <button onClick={addCreditSale} style={{...btnStyle, backgroundColor: '#e11d48'}}>+ Add Credit Sale</button>
            </div>

            <div style={{ ...cardStyle, flex: 1, minWidth: '350px', borderTop: '4px solid #10b981' }}>
              <h3 style={{color: '#059669'}}>🟢 Receive Credit Payment</h3>
              {creditReceived.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                  <input placeholder="Customer Name" value={c.name} onChange={e => updateArrItem(setCreditReceived, creditReceived, c.id, 'name', e.target.value)} style={{...inputStyle, flex: 1}}/>
                  <input type="number" placeholder="Amount" value={c.amount} onChange={e => updateArrItem(setCreditReceived, creditReceived, c.id, 'amount', e.target.value)} style={{...inputStyle, flex: 1}}/>
                  <select value={c.method} onChange={e => updateArrItem(setCreditReceived, creditReceived, c.id, 'method', e.target.value)} style={{...inputStyle, flex: 1}}>
                    <option>Cash</option><option>Online</option>
                  </select>
                </div>
              ))}
              <button onClick={addCreditReceived} style={{...btnStyle, backgroundColor: '#059669'}}>+ Settle Payment</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ ...cardStyle, flex: 1, minWidth: '350px' }}>
              <h3 style={{color: '#3b82f6'}}>💳 Online Expenses</h3>
              {onlineExpenses.map(exp => (
                <div key={exp.id} style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                  <input list="common-expenses" placeholder="Category" value={exp.category} onChange={e => updateArrItem(setOnlineExpenses, onlineExpenses, exp.id, 'category', e.target.value)} style={{...inputStyle, flex: 1}}/>
                  <input placeholder="Details" value={exp.description} onChange={e => updateArrItem(setOnlineExpenses, onlineExpenses, exp.id, 'description', e.target.value)} style={{...inputStyle, flex: 1}}/>
                  <input type="number" placeholder="Amount" value={exp.amount} onChange={e => updateArrItem(setOnlineExpenses, onlineExpenses, exp.id, 'amount', e.target.value)} style={{...inputStyle, flex: 1}}/>
                </div>
              ))}
              <button onClick={addOnlineExpense} style={btnStyle}>+ Add Online Exp</button>
            </div>

            <div style={{ ...cardStyle, flex: 1, minWidth: '350px' }}>
              <h3 style={{color: '#10b981'}}>💵 Offline & Owner Expenses</h3>
              {cashExpenses.map(exp => (
                <div key={exp.id} style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                  <input list="common-expenses" placeholder="Category" value={exp.category} onChange={e => updateArrItem(setCashExpenses, cashExpenses, exp.id, 'category', e.target.value)} style={{...inputStyle, flex: 1}}/>
                  <input placeholder="Details" value={exp.description} onChange={e => updateArrItem(setCashExpenses, cashExpenses, exp.id, 'description', e.target.value)} style={{...inputStyle, flex: 1}}/>
                  <input type="number" placeholder="Amount" value={exp.amount} onChange={e => updateArrItem(setCashExpenses, cashExpenses, exp.id, 'amount', e.target.value)} style={{...inputStyle, flex: 1}}/>
                  <select value={exp.type} onChange={e => updateArrItem(setCashExpenses, cashExpenses, exp.id, 'type', e.target.value)} style={{...inputStyle, flex: 1}}>
                    <option value="Cash">Cash (Deduct from Till)</option>
                    <option value="Counter">Counter (Net Sale)</option>
                    <option value="Credit">Credit (Owe Later)</option>
                    <option value="Teja">Teja Paid</option>
                    <option value="Anil">Anil Paid</option>
                  </select>
                </div>
              ))}
              <button onClick={addCashExpense} style={btnStyle}>+ Add Offline Exp</button>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{color: '#8b5cf6'}}>👨‍🍳 Staff Wages & Advances</h3>
            {staffPayments.map(s => (
              <div key={s.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input placeholder="Staff Name" value={s.name} onChange={e => updateStaffPayment(s.id, 'name', e.target.value)} style={{...inputStyle, flex: 1}}/>
                <select value={s.type} onChange={e => updateStaffPayment(s.id, 'type', e.target.value)} style={{...inputStyle, flex: 1}}><option>Full Wage</option><option>Cash Advance</option></select>
                <input type="number" placeholder="Amount" value={s.amount} onChange={e => updateStaffPayment(s.id, 'amount', e.target.value)} style={{...inputStyle, flex: 1}}/>
                <select value={s.method} onChange={e => updateStaffPayment(s.id, 'method', e.target.value)} style={{...inputStyle, flex: 1}}><option>Cash</option><option>Online</option></select>
              </div>
            ))}
            <button onClick={addStaffPayment} style={{...btnStyle, backgroundColor: '#8b5cf6'}}>+ Log Staff Payment</button>
          </div>

          <div style={{ ...cardStyle, backgroundColor: '#fdfbc8', border: '1px solid #fde047' }}>
            <h3 style={{ color: '#854d0e', marginTop: 0 }}>🧮 Count Physical Cash Drawer</h3>
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
            <h3>Final System Balances (For {date})</h3>
            <div style={{ textAlign: 'center', marginBottom: '20px', padding: '10px', backgroundColor: '#374151', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#9ca3af' }}>True Gross Sales Today (Includes App/Credit Sales)</p>
              <h2 style={{ margin: 0, color: '#fcd34d' }}>₹{trueGrossSale}</h2>
            </div>
            <div style={flexRow}>
              <h4 style={{flex: 1}}>Expected Cash In Hand: <br/><span style={{ color: '#34d399', fontSize: '24px' }}>{totalCashInHand}</span></h4>
              <h4 style={{flex: 1}}>Online Balance: <br/><span style={{ color: '#60a5fa', fontSize: '24px' }}>{totalOnlineBalance}</span></h4>
              <h3 style={{ flex: 1 }}>Total Money Left: <br/>{totalAmountLeft}</h3>
            </div>
            <button onClick={saveDailyAccounts} style={{ ...btnStyle, backgroundColor: '#10b981', width: '100%', marginTop: '20px', fontSize: '18px', padding: '15px' }}>💾 Save Data For {date}</button>
          </div>
        </>
      )}

      {activeTab === 'ledger' && (
        <div style={cardStyle}>
          <h2 style={{ color: '#ec4899', margin: '0 0 5px 0' }}>📒 Outstanding Khata & Delivery Apps</h2>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>This is automatically calculated from all past credit sales and payments. Anyone with a balance of ₹0 is hidden.</p>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ccc', backgroundColor: '#f3f4f6' }}>
                <th style={{padding: '12px'}}>Customer / App Name</th><th style={{padding: '12px'}}>Credit Given</th><th style={{padding: '12px'}}>Paid Back</th><th style={{padding: '12px', color: '#e11d48'}}>Balance Due</th>
              </tr>
            </thead>
            <tbody>
              {ledgerData.length === 0 ? <tr><td colSpan="4" style={{padding: '20px', textAlign: 'center'}}>No outstanding balances!</td></tr> : null}
              {ledgerData.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{row.name}</td><td style={{ padding: '12px', color: '#e11d48' }}>₹{row.given}</td><td style={{ padding: '12px', color: '#059669' }}>₹{row.received}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: row.balance > 0 ? '#e11d48' : '#059669' }}>₹{row.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
              <thead><tr style={{ borderBottom: '2px solid #ccc' }}><th style={{padding: '10px'}}>Date</th><th style={{padding: '10px'}}>Cash</th><th style={{padding: '10px'}}>Online</th><th style={{padding: '10px'}}>Total</th></tr></thead>
              <tbody>
                {historyLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}><strong>{log.date}</strong></td>
                    <td style={{ padding: '10px', color: 'green' }}>{log.total_cash_in_hand}</td>
                    <td style={{ padding: '10px', color: 'blue' }}>{log.total_online_balance}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{Number(log.total_cash_in_hand) + Number(log.total_online_balance)}</td>
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
              <p style={{margin: 0, color: '#065f46', fontWeight: 'bold'}}>Total Sales</p><h2 style={{margin: 0, color: '#059669'}}>₹{analyticsData.totalSales}</h2>
            </div>
            <div style={{ flex: 1, padding: '20px', background: '#fef2f2', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{margin: 0, color: '#991b1b', fontWeight: 'bold'}}>Total Expenses</p><h2 style={{margin: 0, color: '#dc2626'}}>₹{analyticsData.totalExpenses}</h2>
            </div>
          </div>
          <h3>Category Expenses Breakdown</h3>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            {analyticsData.sortedCategories.length === 0 ? <p>No expenses found in this date range.</p> : 
              analyticsData.sortedCategories.map(([category, amount]) => (
              <div key={category} style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong>{category}</strong><span>₹{amount}</span></div>
                <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '4px', height: '12px', overflow: 'hidden' }}><div style={{ height: '100%', backgroundColor: '#3b82f6', width: `${(amount / analyticsData.maxCatVal) * 100}%` }}></div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div style={{ ...cardStyle, maxWidth: '600px', margin: '0 auto' }}>
          <h2>🔔 Front Desk Tasks & Reminders</h2>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input type="text" placeholder="Add a task..." value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTask()} style={{ ...inputStyle, flex: 1 }} />
            <button onClick={handleAddTask} style={{ ...btnStyle, backgroundColor: '#f59e0b' }}>Add Task</button>
          </div>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {tasks.map(task => (
              <li key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', backgroundColor: task.done ? '#f3f4f6' : 'white', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '10px' }}>
                <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} style={{ transform: 'scale(1.5)' }} />
                <span style={{ flex: 1, fontSize: '18px', textDecoration: task.done ? 'line-through' : 'none' }}>{task.text}</span>
                <button onClick={() => deleteTask(task.id)} style={{ padding: '5px 10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px' }}>Delete</button>
              </li>
            ))}  
          </ul>
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