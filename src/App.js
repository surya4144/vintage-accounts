import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- DATABASE CONNECTION ---
const supabaseUrl = 'https://gsscocpxmsmtevjadxjd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzc2NvY3B4bXNtdGV2amFkeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MDMxODMsImV4cCI6MjA5NDA3OTE4M30._HUjYhFo34US81UiA6hCoxv_emo9K0sOa_oq8TjxKpk';
const supabase = createClient(supabaseUrl, supabaseKey);

const MANAGER_PIN = '1234'; 

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [activeTab, setActiveTab] = useState('daily'); // 'daily', 'history', 'analytics'

  // --- STATE: DAILY ACCOUNTS ---
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [yesterdayCash, setYesterdayCash] = useState(0);
  const [yesterdayOnline, setYesterdayOnline] = useState(0);
  const [cashSale, setCashSale] = useState(0);
  const [onlineSale, setOnlineSale] = useState(0);
  
  // Updated Expenses (Now with Category & Description)
  const [onlineExpenses, setOnlineExpenses] = useState([]);
  const [cashExpenses, setCashExpenses] = useState([]);
  
  // New Staff Tracker
  const [staffPayments, setStaffPayments] = useState([]);

  // --- STATE: HISTORY & ANALYTICS ---
  const [historyLogs, setHistoryLogs] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Analytics Dates (Default to last 7 days)
  const [analyticsStart, setAnalyticsStart] = useState(() => {
    let d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0];
  });
  const [analyticsEnd, setAnalyticsEnd] = useState(new Date().toISOString().split('T')[0]);

  // --- CALCULATIONS ---
  const totalSale = Number(cashSale) + Number(onlineSale);
  
  const totalOnlineExpenses = onlineExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalCashExpenses = cashExpenses.filter(exp => exp.type === 'Cash').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalCreditExpenses = cashExpenses.filter(exp => exp.type === 'Credit').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  
  // Calculate Staff Payments based on method
  const totalStaffCash = staffPayments.filter(s => s.method === 'Cash').reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const totalStaffOnline = staffPayments.filter(s => s.method === 'Online').reduce((sum, s) => sum + Number(s.amount || 0), 0);

  const totalDailyExpenses = totalOnlineExpenses + totalCashExpenses + totalStaffCash + totalStaffOnline;
  
  const totalCashInHand = yesterdayCash + Number(cashSale) - totalCashExpenses - totalStaffCash;
  const totalOnlineBalance = yesterdayOnline + Number(onlineSale) - totalOnlineExpenses - totalStaffOnline;
  const totalAmountLeft = totalCashInHand + totalOnlineBalance;

  // --- HANDLERS: INPUTS ---
  const handleLogin = () => { if (pinInput === MANAGER_PIN) setIsUnlocked(true); else { alert("Incorrect PIN."); setPinInput(''); }};

  const addOnlineExpense = () => setOnlineExpenses([...onlineExpenses, { id: Date.now(), category: '', description: '', amount: 0 }]);
  const updateOnlineExpense = (id, field, value) => setOnlineExpenses(onlineExpenses.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
  
  const addCashExpense = () => setCashExpenses([...cashExpenses, { id: Date.now(), category: '', description: '', amount: 0, type: 'Cash' }]);
  const updateCashExpense = (id, field, value) => setCashExpenses(cashExpenses.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));

  const addStaffPayment = () => setStaffPayments([...staffPayments, { id: Date.now(), name: '', amount: 0, type: 'Full Wage', method: 'Cash' }]);
  const updateStaffPayment = (id, field, value) => setStaffPayments(staffPayments.map(s => s.id === id ? { ...s, [field]: value } : s));

  // --- DATABASE SYNC ---
  useEffect(() => {
    const fetchYesterday = async () => {
      const { data } = await supabase.from('daily_logs').select('total_cash_in_hand, total_online_balance').order('date', { ascending: false }).limit(1);
      if (data && data.length > 0) { setYesterdayCash(data[0].total_cash_in_hand); setYesterdayOnline(data[0].total_online_balance); }
    };
    fetchYesterday();
  }, []);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    const { data } = await supabase.from('daily_logs').select('*').order('date', { ascending: false });
    if (data) setHistoryLogs(data);
    setIsLoadingHistory(false);
  };

  useEffect(() => { if (activeTab === 'history' || activeTab === 'analytics') loadHistory(); }, [activeTab]);

  const saveDailyAccounts = async () => {
    const { error } = await supabase.from('daily_logs').upsert({ 
        date: date, total_cash_in_hand: totalCashInHand, total_online_balance: totalOnlineBalance,
        expense_details: { online: onlineExpenses, cash: cashExpenses, staff: staffPayments, sales: { cash: cashSale, online: onlineSale } }
      }, { onConflict: 'date' });
    if (error) alert("Error saving data: " + error.message); else alert("Vintage Daily Accounts Saved!");
  };

  // --- PRINT FUNCTION ---
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
      <hr/><p style="text-align:center;font-size:12px;">Generated via Vintage System</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // --- ANALYTICS ENGINE ---
  const analyticsData = useMemo(() => {
    const filtered = historyLogs.filter(log => log.date >= analyticsStart && log.date <= analyticsEnd);
    let totalSales = 0; let totalExpenses = 0;
    const categoryTotals = {};

    filtered.forEach(log => {
      totalSales += Number(log.expense_details?.sales?.cash || 0) + Number(log.expense_details?.sales?.online || 0);
      
      const processExp = (arr) => {
        if(!arr) return;
        arr.forEach(exp => {
          if (exp.type === 'Credit') return; // Skip credit in expense totals
          totalExpenses += Number(exp.amount || 0);
          const cat = exp.category || exp.name || 'Uncategorized';
          categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(exp.amount || 0);
        });
      };
      
      processExp(log.expense_details?.online);
      processExp(log.expense_details?.cash);
      
      if(log.expense_details?.staff) {
        log.expense_details.staff.forEach(s => {
          totalExpenses += Number(s.amount || 0);
          categoryTotals['Staff Wages & Advances'] = (categoryTotals['Staff Wages & Advances'] || 0) + Number(s.amount || 0);
        });
      }
    });

    const maxCatVal = Math.max(...Object.values(categoryTotals), 1); // Avoid div by 0
    const sortedCategories = Object.entries(categoryTotals).sort((a,b) => b[1] - a[1]);

    return { totalSales, totalExpenses, sortedCategories, maxCatVal };
  }, [historyLogs, analyticsStart, analyticsEnd]);


  // --- UI RENDERS ---
  if (!isUnlocked) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f9fafb' }}>
        <div style={{ ...cardStyle, textAlign: 'center', padding: '40px', maxWidth: '400px' }}>
          <h2>Vintage Restaurant</h2><p>Enter Manager PIN</p>
          <input type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} style={{ ...inputStyle, textAlign: 'center', fontSize: '24px', letterSpacing: '8px', marginBottom: '20px' }} maxLength={4} />
          <button onClick={handleLogin} style={{ ...btnStyle, width: '100%', fontSize: '18px', padding: '15px' }}>Unlock App</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '1000px', margin: '0 auto', backgroundColor: '#f9fafb' }}>
      
      {/* TABS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('daily')} style={{ ...tabStyle, backgroundColor: activeTab === 'daily' ? '#10b981' : '#e5e7eb', color: activeTab === 'daily' ? 'white' : 'black' }}>📝 Daily Entry</button>
        <button onClick={() => setActiveTab('history')} style={{ ...tabStyle, backgroundColor: activeTab === 'history' ? '#3b82f6' : '#e5e7eb', color: activeTab === 'history' ? 'white' : 'black' }}>📋 History</button>
        <button onClick={() => setActiveTab('analytics')} style={{ ...tabStyle, backgroundColor: activeTab === 'analytics' ? '#8b5cf6' : '#e5e7eb', color: activeTab === 'analytics' ? 'white' : 'black' }}>📈 Analytics</button>
        <button onClick={() => setIsUnlocked(false)} style={{ ...tabStyle, flex: 0.3, backgroundColor: '#ef4444', color: 'white' }}>Lock</button>
      </div>

      {/* --- TAB 1: DAILY ENTRY --- */}
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

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {/* ONLINE EXPENSES */}
            <div style={{ ...cardStyle, flex: 1, minWidth: '350px' }}>
              <h3 style={{color: '#3b82f6'}}>💳 Online Expenses</h3>
              {onlineExpenses.map(exp => (
                <div key={exp.id} style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                  <input list="common-expenses" placeholder="Category" value={exp.category} onChange={e => updateOnlineExpense(exp.id, 'category', e.target.value)} style={{...inputStyle, flex: 1.5}}/>
                  <input placeholder="Specific Details/Note" value={exp.description} onChange={e => updateOnlineExpense(exp.id, 'description', e.target.value)} style={{...inputStyle, flex: 2}}/>
                  <input type="number" placeholder="Amount" value={exp.amount} onChange={e => updateOnlineExpense(exp.id, 'amount', e.target.value)} style={{...inputStyle, flex: 1}}/>
                </div>
              ))}
              <button onClick={addOnlineExpense} style={btnStyle}>+ Add Online Exp</button>
            </div>

            {/* CASH EXPENSES */}
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

          <div style={{ ...cardStyle, backgroundColor: '#1f2937', color: 'white' }}>
            <h3>Final Balances</h3>
            <div style={flexRow}>
              <h4 style={{flex: 1}}>Cash In Hand: <br/><span style={{ color: '#34d399', fontSize: '24px' }}>{totalCashInHand}</span></h4>
              <h4 style={{flex: 1}}>Online Balance: <br/><span style={{ color: '#60a5fa', fontSize: '24px' }}>{totalOnlineBalance}</span></h4>
              <h3 style={{ flex: 1 }}>Total Left: <br/>{totalAmountLeft}</h3>
            </div>
            <button onClick={saveDailyAccounts} style={{ ...btnStyle, backgroundColor: '#10b981', width: '100%', marginTop: '20px', fontSize: '18px', padding: '15px' }}>💾 Save & Close Register</button>
          </div>
        </>
      )}

      {/* --- TAB 2: HISTORY --- */}
      {activeTab === 'history' && (
        <div style={cardStyle}>
          <h2>Past Records</h2>
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

      {/* --- TAB 3: ANALYTICS --- */}
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

// --- STYLES ---
const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' };
const flexRow = { display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' };
const inputStyle = { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px', width: '100%', boxSizing: 'border-box' };
const totalBoxStyle = { padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '16px', textAlign: 'center' };
const btnStyle = { padding: '10px 15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const tabStyle = { flex: 1, padding: '15px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' };