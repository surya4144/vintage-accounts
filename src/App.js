import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- DATABASE CONNECTION ---
// ⚠️ PASTE YOUR KEYS HERE
const supabaseUrl = 'https://gsscocpxmsmtevjadxjd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzc2NvY3B4bXNtdGV2amFkeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MDMxODMsImV4cCI6MjA5NDA3OTE4M30._HUjYhFo34US81UiA6hCoxv_emo9K0sOa_oq8TjxKpk';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- APP SETTINGS ---
const MANAGER_PIN = '1234'; // Change this to whatever you want!

export default function App() {
  // --- SECURITY STATE ---
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');

  // --- STATE MANAGEMENT ---
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [yesterdayCash, setYesterdayCash] = useState(0);
  const [yesterdayOnline, setYesterdayOnline] = useState(0);

  const [cashSale, setCashSale] = useState(0);
  const [onlineSale, setOnlineSale] = useState(0);

  const [onlineExpenses, setOnlineExpenses] = useState([]);
  const [cashExpenses, setCashExpenses] = useState([]);

  // --- CALCULATIONS ---
  const totalSale = Number(cashSale) + Number(onlineSale);
  
  const totalOnlineExpenses = onlineExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  
  const totalCashExpenses = cashExpenses
    .filter(exp => exp.type === 'Cash')
    .reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
    
  const totalCreditExpenses = cashExpenses
    .filter(exp => exp.type === 'Credit')
    .reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

  const totalDailyExpenses = totalOnlineExpenses + totalCashExpenses;

  const totalCashInHand = yesterdayCash + Number(cashSale) - totalCashExpenses;
  const totalOnlineBalance = yesterdayOnline + Number(onlineSale) - totalOnlineExpenses;
  const totalAmountLeft = totalCashInHand + totalOnlineBalance;

  // --- HANDLERS ---
  const handleLogin = () => {
    if (pinInput === MANAGER_PIN) {
      setIsUnlocked(true);
    } else {
      alert("Incorrect PIN. Please try again.");
      setPinInput('');
    }
  };

  const addOnlineExpense = () => setOnlineExpenses([...onlineExpenses, { id: Date.now(), name: '', amount: 0 }]);
  const updateOnlineExpense = (id, field, value) => {
    setOnlineExpenses(onlineExpenses.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
  };

  const addCashExpense = () => setCashExpenses([...cashExpenses, { id: Date.now(), name: '', amount: 0, type: 'Cash' }]);
  const updateCashExpense = (id, field, value) => {
    setCashExpenses(cashExpenses.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
  };

  // --- FETCH YESTERDAY'S BALANCE ---
  useEffect(() => {
    const fetchYesterdayBalances = async () => {
      if (supabaseUrl === 'YOUR_PROJECT_URL') return; 

      const { data, error } = await supabase
        .from('daily_logs')
        .select('total_cash_in_hand, total_online_balance')
        .order('date', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setYesterdayCash(data[0].total_cash_in_hand);
        setYesterdayOnline(data[0].total_online_balance);
      }
    };

    fetchYesterdayBalances();
  }, []);

  // --- SAVE TO DATABASE ---
  const saveDailyAccounts = async () => {
    if (supabaseUrl === 'YOUR_PROJECT_URL') {
      alert("Please add your Supabase keys at the top of the code!");
      return;
    }

    const { data, error } = await supabase
      .from('daily_logs')
      .upsert({ 
        date: date, 
        total_cash_in_hand: totalCashInHand, 
        total_online_balance: totalOnlineBalance,
        expense_details: { online: onlineExpenses, cash: cashExpenses }
      }, { onConflict: 'date' });

    if (error) {
      alert("Error saving data: " + error.message);
    } else {
      alert("Daily accounts for Vintage saved successfully!");
    }
  };

  // --- LOCK SCREEN UI ---
  if (!isUnlocked) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
        <div style={{ ...cardStyle, textAlign: 'center', padding: '40px', maxWidth: '400px' }}>
          <h2 style={{ color: '#1f2937' }}>Vintage Restaurant</h2>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>Enter Manager PIN to access accounts</p>
          <input 
            type="password" 
            value={pinInput} 
            onChange={(e) => setPinInput(e.target.value)}
            style={{ ...inputStyle, textAlign: 'center', fontSize: '24px', letterSpacing: '8px', marginBottom: '20px' }}
            maxLength={4}
          />
          <button onClick={handleLogin} style={{ ...btnStyle, width: '100%', fontSize: '18px', padding: '15px' }}>
            Unlock Register
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN APP UI ---
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '800px', margin: '0 auto', backgroundColor: '#f9fafb' }}>
      
      {/* DATALISTS FOR DROPDOWNS */}
      <datalist id="common-expenses">
        <option value="Vegetables & Groceries" />
        <option value="Meat & Poultry" />
        <option value="Dairy & Milk" />
        <option value="Daily Wages" />
        <option value="Cleaning Supplies" />
        <option value="Water Bottles/Cans" />
      </datalist>

      <h1 style={{ textAlign: 'center', color: '#1f2937' }}>Vintage Restaurant - Daily Accounts</h1>
      <button onClick={() => setIsUnlocked(false)} style={{ display: 'block', margin: '0 auto 20px auto', padding: '5px 15px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Lock App</button>
      
      <div style={cardStyle}>
        <h3>1. Start of Day</h3>
        <div style={flexRow}>
          <label style={{flex: 1}}>Date: <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle}/></label>
          <label style={{flex: 1}}>Yesterday Cash: <input type="number" value={yesterdayCash} onChange={e => setYesterdayCash(Number(e.target.value))} style={inputStyle}/></label>
          <label style={{flex: 1}}>Yesterday Online: <input type="number" value={yesterdayOnline} onChange={e => setYesterdayOnline(Number(e.target.value))} style={inputStyle}/></label>
        </div>
      </div>

      <div style={cardStyle}>
        <h3>2. Today's Sales</h3>
        <div style={flexRow}>
          <label style={{flex: 1}}>Today Cash Sale: <input type="number" value={cashSale} onChange={e => setCashSale(Number(e.target.value))} style={inputStyle}/></label>
          <label style={{flex: 1}}>Today Online Sale: <input type="number" value={onlineSale} onChange={e => setOnlineSale(Number(e.target.value))} style={inputStyle}/></label>
          <div style={{...totalBoxStyle, flex: 1}}>Total Sale: <br/><strong>{totalSale}</strong></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ ...cardStyle, flex: 1, minWidth: '300px' }}>
          <h3>3. Online Expenses</h3>
          {onlineExpenses.map(exp => (
            <div key={exp.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input list="common-expenses" placeholder="Item" value={exp.name} onChange={e => updateOnlineExpense(exp.id, 'name', e.target.value)} style={inputStyle}/>
              <input type="number" placeholder="Amount" value={exp.amount} onChange={e => updateOnlineExpense(exp.id, 'amount', e.target.value)} style={inputStyle}/>
            </div>
          ))}
          <button onClick={addOnlineExpense} style={btnStyle}>+ Add Online Expense</button>
          <p style={{marginTop: '15px'}}>Total Online Expenses: <strong>{totalOnlineExpenses}</strong></p>
        </div>

        <div style={{ ...cardStyle, flex: 1, minWidth: '300px' }}>
          <h3>4. Cash & Credit Expenses</h3>
          {cashExpenses.map(exp => (
            <div key={exp.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input list="common-expenses" placeholder="Item" value={exp.name} onChange={e => updateCashExpense(exp.id, 'name', e.target.value)} style={inputStyle}/>
              <input type="number" placeholder="Amount" value={exp.amount} onChange={e => updateCashExpense(exp.id, 'amount', e.target.value)} style={inputStyle}/>
              <select value={exp.type} onChange={e => updateCashExpense(exp.id, 'type', e.target.value)} style={inputStyle}>
                <option value="Cash">Cash</option>
                <option value="Credit">Credit</option>
              </select>
            </div>
          ))}
          <button onClick={addCashExpense} style={btnStyle}>+ Add Cash/Credit Expense</button>
          <p style={{marginTop: '15px', marginBottom: '5px'}}>Total Cash Expenses: <strong>{totalCashExpenses}</strong></p>
          <p style={{ fontSize: '0.85em', color: '#6b7280', margin: 0 }}>(Credit Logged: {totalCreditExpenses})</p>
        </div>
      </div>

      <div style={{ ...cardStyle, backgroundColor: '#e5e7eb' }}>
        <h3>5. Final Balances</h3>
        <div style={flexRow}>
          <h4 style={{flex: 1}}>Cash in Hand: <br/><span style={{ color: 'green', fontSize: '24px' }}>{totalCashInHand}</span></h4>
          <h4 style={{flex: 1}}>Online Balance: <br/><span style={{ color: 'blue', fontSize: '24px' }}>{totalOnlineBalance}</span></h4>
          <h3 style={{ borderBottom: '2px solid black', flex: 1 }}>Total Left: <br/>{totalAmountLeft}</h3>
        </div>
        <button onClick={saveDailyAccounts} style={{ ...btnStyle, backgroundColor: '#10b981', color: 'white', width: '100%', marginTop: '20px', fontSize: '18px', padding: '15px' }}>
          Save & Close Register
        </button>
      </div>
    </div>
  );
}

// --- BASIC STYLES ---
const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' };
const flexRow = { display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' };
const inputStyle = { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px', width: '100%', boxSizing: 'border-box' };
const totalBoxStyle = { padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '16px', textAlign: 'center' };
const btnStyle = { padding: '10px 15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };