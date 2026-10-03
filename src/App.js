import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

// --- DATABASE CONNECTION ---
const supabaseUrl = 'https://gsscocpxmsmtevjadxjd.supabase.co';
const supabaseKey = ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3Mi','OiJzdXBhYmFzZSIsInJlZiI6Imdzc2NvY3B4bXNtdGV2a','mFkeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MDMxODMsImV4cCI6MjA5NDA3OTE4M30._HUjYhFo34US81UiA6hCoxv_emo9K0sOa_oq8TjxKpk'].join('');
const supabase = createClient(supabaseUrl, supabaseKey);

const employeeNames = [
  "Bhavani",
  "Suven Paul",
  "Mani",
  "Chaitanya",
  "Raju",
  "Vijaya Lakshmi",
  "Sujatha",
  "Azaz",
  "Mustak",
  "David"
];

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [activeTab, setActiveTab] = useState('daily');
  const [isDataLoaded, setIsDataLoaded] = useState(false); 
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [dateSelection, setDateSelection] = useState(new Date().toISOString().split('T')[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [yesterdayCash, setYesterdayCash] = useState(0);
  const [yesterdayOnline, setYesterdayOnline] = useState(0);
  const [cashSale, setCashSale] = useState(0);
  const [onlineSale, setOnlineSale] = useState(0);
  const [parcelCounterCash, setParcelCounterCash] = useState(0);
  const [parcelCounterOnline, setParcelCounterOnline] = useState(0);
  
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
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0, 7));
  const [payrollLogs, setPayrollLogs] = useState([]);
  const [isLoadingPayroll, setIsLoadingPayroll] = useState(false);
  const [salaryMap, setSalaryMap] = useState(() => { try { return JSON.parse(localStorage.getItem('vintage_staff_salaries') || '{}'); } catch { return {}; } });
  

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

  const loadAttendance = async (targetDate = attendanceDate) => {
    setIsLoadingAttendance(true);
    const { data, error } = await supabase.from('employee_attendance').select('*').eq('attendance_date', targetDate).order('employee_name');
    if (error) console.error('Attendance fetch error:', error);
    setAttendanceLogs(data || []);
    setIsLoadingAttendance(false);
  };

  useEffect(() => {
    if (session && activeTab === 'attendance') loadAttendance(attendanceDate);
  }, [session, activeTab, attendanceDate]);

  const updateAttendance = async (id, changes) => {
    const { error } = await supabase.from('employee_attendance').update(changes).eq('id', id);
    if (error) return alert('Attendance update failed: ' + error.message);
    await loadAttendance(attendanceDate);
  };

  const attendanceHours = (row) => {
    if (!row.check_in || !row.check_out) return '—';
    const hours = (new Date(row.check_out) - new Date(row.check_in)) / 3600000;
    return hours >= 0 ? hours.toFixed(2) + ' h' : '—';
  };

  const attendanceSummary = useMemo(() => {
    const counts = { Present: 0, Absent: 0, 'Half Day': 0, Leave: 0, 'Weekly Off': 0 };
    attendanceLogs.forEach(row => { if (counts[row.status] !== undefined) counts[row.status] += 1; });
    return counts;
  }, [attendanceLogs]);

  const loadPayroll = async (month = payrollMonth) => {
    setIsLoadingPayroll(true);
    const start = month + '-01';
    const endDate = new Date(Number(month.slice(0,4)), Number(month.slice(5,7)), 0).toISOString().split('T')[0];
    const { data, error } = await supabase.from('employee_attendance').select('*').gte('attendance_date', start).lte('attendance_date', endDate).order('attendance_date');
    if (error) console.error('Payroll attendance fetch error:', error);
    setPayrollLogs(data || []);
    setIsLoadingPayroll(false);
  };

  useEffect(() => { if (session && activeTab === 'attendance') loadPayroll(payrollMonth); }, [session, activeTab, payrollMonth]);

  const payrollRows = useMemo(() => employeeNames.map(name => {
    const rows = payrollLogs.filter(r => r.employee_name === name);
    const present = rows.filter(r => r.status === 'Present').length;
    const absent = rows.filter(r => r.status === 'Absent').length;
    const half = rows.filter(r => r.status === 'Half Day').length;
    const leave = rows.filter(r => r.status === 'Leave').length;
    const weeklyOff = rows.filter(r => r.status === 'Weekly Off').length;
    const hours = rows.reduce((sum,r) => sum + (r.check_in && r.check_out ? Math.max(0,(new Date(r.check_out)-new Date(r.check_in))/3600000) : 0),0);
    const monthlySalary = Number(salaryMap[name] || 0);
    const payableDays = present + half * 0.5;
    const calendarDays = new Date(Number(payrollMonth.slice(0,4)), Number(payrollMonth.slice(5,7)), 0).getDate();
    const dailyRate = calendarDays ? monthlySalary / calendarDays : 0;
    const earnedPay = dailyRate * payableDays;

    // Staff payments recorded in the daily accounts for this month are treated as
    // money already taken/paid to the employee, including advances and wages.
    const monthPayments = historyLogs
      .filter(log => log.date?.slice(0, 7) === payrollMonth)
      .flatMap(log => log.expense_details?.staff || [])
      .filter(payment => payment.name === name);

    const totalTaken = monthPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const cashAdvance = monthPayments
      .filter(payment => payment.type === 'Cash Advance')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const wagesPaid = monthPayments
      .filter(payment => payment.type !== 'Cash Advance')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const balanceToPay = Math.max(0, earnedPay - totalTaken);
    const overpaid = Math.max(0, totalTaken - earnedPay);

    return {
      name, present, absent, half, leave, weeklyOff, hours, monthlySalary,
      payableDays, earnedPay, totalTaken, cashAdvance, wagesPaid, balanceToPay, overpaid
    };
  }), [payrollLogs, payrollMonth, salaryMap, historyLogs]);

  const saveSalary = (name, value) => {
    const next = { ...salaryMap, [name]: value };
    setSalaryMap(next);
    localStorage.setItem('vintage_staff_salaries', JSON.stringify(next));
  };

  const exportPayroll = () => {
    const rows = payrollRows.map(r => ({
      Employee:r.name,
      'Monthly Salary (₹)':r.monthlySalary,
      Present:r.present,
      'Half Day':r.half,
      Leave:r.leave,
      Absent:r.absent,
      'Weekly Off':r.weeklyOff,
      'Hours Worked':Number(r.hours.toFixed(2)),
      'Payable Days':r.payableDays,
      'Earned Salary (₹)':Number(r.earnedPay.toFixed(2)),
      'Already Taken/Paid (₹)':Number(r.totalTaken.toFixed(2)),
      'Cash Advances (₹)':Number(r.cashAdvance.toFixed(2)),
      'Wages Paid (₹)':Number(r.wagesPaid.toFixed(2)),
      'Balance To Pay (₹)':Number(r.balanceToPay.toFixed(2)),
      'Overpaid (₹)':Number(r.overpaid.toFixed(2))
    }));
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Payroll'); XLSX.writeFile(wb, `Attendance-Payroll-${payrollMonth}.xlsx`);
  };

  // --- 3. SMART CATEGORY LEARNING ---
  const defaultCategories = [
    // General business expenses
    "Vegetables & Groceries", "Meat & Poultry", "Dairy & Milk", "Cleaning Supplies", "Water Bottles/Cans", "Maintenance/Repairs",
    // Owner & personal expenses
    "Owner Personal Expenses", "Owner Personal Shopping", "Owner Family Expenses", "Owner Personal Travel", "Owner Medical Expenses", "Owner Education", "Owner Withdrawal",
    // Property & rent
    "House Rent", "Shop/Office Rent", "Property Maintenance", "Property Tax",
    // Utilities
    "Electricity", "Water", "Gas", "Internet", "Mobile/Telephone",
    // Travel & transportation
    "Fuel", "Auto/Taxi", "Parking", "Vehicle Maintenance", "Travel Expenses",
    // Business purchases
    "Business Supplies", "Stationery", "Kitchen Supplies", "Equipment", "Small Tools",
    // Staff & labour
    "Staff Advance", "Staff Meals", "Staff Transportation", "Staff Welfare", "Temporary Labour",
    // Banking & finance
    "Bank Charges", "Payment Gateway Charges", "Loan Payment", "Loan Interest", "Cash Withdrawal Charges",
    // Government & compliance
    "GST", "License Fees", "Registration Fees", "Taxes", "Fines/Penalties",
    // Marketing
    "Advertising", "Printing", "Promotions", "Discounts", "Social Media Marketing",
    // Maintenance
    "Building Repairs", "Furniture Repairs", "Electrical Repairs", "Plumbing", "Equipment Repairs",
    // Other
    "Donations", "Gifts", "Tips", "Emergency Expenses", "Miscellaneous"
  ];
  const dynamicCategories = useMemo(() => {
    const cats = new Set(defaultCategories);
    historyLogs.forEach(log => {
      log.expense_details?.online?.forEach(e => e.category && cats.add(e.category.trim()));
      log.expense_details?.cash?.forEach(e => e.category && cats.add(e.category.trim()));
    });
    return Array.from(cats).sort();
  }, [historyLogs]);

  // --- 4. EXPLICIT DATA FETCH FUNCTION ---
  const handleFetchData = async (targetDate, isManualClick = false) => {
    if (!session) return;
    setIsFetching(true);
    setIsDataLoaded(false); 

    try {
      const { data: currentDataArr, error: fetchErr } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('date', targetDate)
        .limit(1);

      if (fetchErr) console.error("Database Fetch Error:", fetchErr);

      const currentData = currentDataArr && currentDataArr.length > 0 ? currentDataArr[0] : null;
      const draftStr = localStorage.getItem(`vintage_draft_${targetDate}`);
      const draft = draftStr ? JSON.parse(draftStr) : null;

      // THE FIX: Priority overrides based on how the fetch was triggered
      if (isManualClick && currentData) {
        // User explicitly clicked fetch, and DB data exists -> OVERRIDE DRAFT
        setCashSale(currentData.expense_details?.sales?.cash || 0); setOnlineSale(currentData.expense_details?.sales?.online || 0); setParcelCounterCash(currentData.expense_details?.sales?.parcel_counter_cash || 0); setParcelCounterOnline(currentData.expense_details?.sales?.parcel_counter_online || 0);
        setOnlineExpenses(currentData.expense_details?.online || []); setCashExpenses(currentData.expense_details?.cash || []);
        setStaffPayments(currentData.expense_details?.staff || []); setCreditSales(currentData.expense_details?.credit_sales || []);
        setCreditReceived(currentData.expense_details?.credit_received || []);
        setNotes({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', coins: '' }); 
        alert(`✅ System loaded database records for ${targetDate}`);
      } 
      else if (isManualClick && !currentData) {
        // User explicitly clicked fetch, but DB is empty
        setCashSale(0); setOnlineSale(0); setParcelCounterCash(0); setParcelCounterOnline(0); setOnlineExpenses([]); setCashExpenses([]); setStaffPayments([]); setCreditSales([]); setCreditReceived([]); setNotes({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', coins: '' });
        alert(`ℹ️ No database records found for ${targetDate}. The page is clear.`);
      }
      else if (!isManualClick && draft) {
        // Initial page load, restore an unsaved draft if it exists
        setCashSale(draft.cashSale || 0); setOnlineSale(draft.onlineSale || 0); setParcelCounterCash(draft.parcelCounterCash || 0); setParcelCounterOnline(draft.parcelCounterOnline || 0); setOnlineExpenses(draft.onlineExpenses || []); setCashExpenses(draft.cashExpenses || []); setStaffPayments(draft.staffPayments || []); setCreditSales(draft.creditSales || []); setCreditReceived(draft.creditReceived || []); setNotes(draft.notes || { 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', coins: '' });
      } 
      else if (!isManualClick && currentData) {
        // Initial page load, load DB data
        setCashSale(currentData.expense_details?.sales?.cash || 0); setOnlineSale(currentData.expense_details?.sales?.online || 0); setParcelCounterCash(currentData.expense_details?.sales?.parcel_counter_cash || 0); setParcelCounterOnline(currentData.expense_details?.sales?.parcel_counter_online || 0); setOnlineExpenses(currentData.expense_details?.online || []); setCashExpenses(currentData.expense_details?.cash || []); setStaffPayments(currentData.expense_details?.staff || []); setCreditSales(currentData.expense_details?.credit_sales || []); setCreditReceived(currentData.expense_details?.credit_received || []); setNotes({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', coins: '' }); 
      } 
      else {
        // Initial page load, empty DB
        setCashSale(0); setOnlineSale(0); setParcelCounterCash(0); setParcelCounterOnline(0); setOnlineExpenses([]); setCashExpenses([]); setStaffPayments([]); setCreditSales([]); setCreditReceived([]); setNotes({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', coins: '' });
      }

      // Fetch yesterday's balances logically
      const { data: prevData } = await supabase.from('daily_logs').select('total_cash_in_hand, total_online_balance').lt('date', targetDate).order('date', { ascending: false }).limit(1);
      if (prevData && prevData.length > 0) {
        setYesterdayCash(prevData[0].total_cash_in_hand); setYesterdayOnline(prevData[0].total_online_balance);
      } else {
        setYesterdayCash(0); setYesterdayOnline(0);
      }

      setDate(targetDate);
      setDateSelection(targetDate);
    } catch (err) {
      console.error("Critical Runtime Error:", err);
    }

    setIsDataLoaded(true); 
    setIsFetching(false);
  };

  // Run automatically *only* once when the user first logs in
  useEffect(() => {
    if (session) {
      handleFetchData(dateSelection, false);
    }
  }, [session]);

  // --- 5. BACKGROUND AUTO-SAVE ---
  useEffect(() => {
    if (isDataLoaded && session) {
      const draft = { cashSale, onlineSale, parcelCounterCash, parcelCounterOnline, onlineExpenses, cashExpenses, staffPayments, creditSales, creditReceived, notes };
      localStorage.setItem(`vintage_draft_${date}`, JSON.stringify(draft));
    }
  }, [isDataLoaded, session, date, cashSale, onlineSale, parcelCounterCash, parcelCounterOnline, onlineExpenses, cashExpenses, staffPayments, creditSales, creditReceived, notes]);

  // --- MATH LOGIC ---
  const totalOnlineExpenses = onlineExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalCashExpenses = cashExpenses.filter(exp => exp.type === 'Cash').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalCounterExpenses = cashExpenses.filter(exp => exp.type === 'Counter').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalCreditExpenses = cashExpenses.filter(exp => exp.type === 'Credit').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalTejaExpenses = cashExpenses.filter(exp => exp.type === 'Teja').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalAnilExpenses = cashExpenses.filter(exp => exp.type === 'Anil').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalStaffCash = staffPayments.filter(s => s.method === 'Cash').reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const totalStaffCounter = staffPayments.filter(s => s.method === 'Counter').reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const totalStaffCredit = staffPayments.filter(s => s.method === 'Credit').reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const totalStaffTeja = staffPayments.filter(s => s.method === 'Teja').reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const totalStaffAnil = staffPayments.filter(s => s.method === 'Anil').reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const totalStaffOnline = staffPayments.filter(s => s.method === 'Online').reduce((sum, s) => sum + Number(s.amount || 0), 0);

  const totalCreditSales = creditSales.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const creditReceivedCash = creditReceived.filter(c => c.method === 'Cash').reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const creditReceivedOnline = creditReceived.filter(c => c.method === 'Online').reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const totalParcelCounterCash = Number(parcelCounterCash || 0);
  const totalParcelCounterOnline = Number(parcelCounterOnline || 0);
  const grossCashSale = Number(cashSale) + totalParcelCounterCash + totalCounterExpenses;
  const grossOnlineSale = Number(onlineSale) + totalParcelCounterOnline;
  const trueGrossSale = grossCashSale + grossOnlineSale + totalCreditSales;
  // Daily Snapshot Gross Sales = all sales entered in Today Sales, plus cash expenses that were already deducted from the till.
  // This restores the pre-expense gross sales figure without including credit sales or non-cash expense methods.
  const dailySnapshotGrossSale = trueGrossSale + totalCashExpenses;
  const totalOperatingExpenses = totalOnlineExpenses + totalCashExpenses + totalStaffCash + totalStaffCounter + totalStaffCredit + totalStaffTeja + totalStaffAnil;
  const estimatedProfit = trueGrossSale - totalOperatingExpenses;
  const formatINR = value => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  // Cash/online sales are entered by the cashier AFTER expenses are already paid and deducted.
  // Therefore, do not subtract expense entries again from the closing balances.
  // Expenses remain recorded separately for reporting/analytics.
  const totalCashInHand = yesterdayCash + Number(cashSale) + totalParcelCounterCash + creditReceivedCash;
  // Online expenses and online-paid staff wages are paid from the online balance, so deduct them from the available online amount.
  const totalOnlineBalance = yesterdayOnline + Number(onlineSale) + totalParcelCounterOnline + creditReceivedOnline - totalOnlineExpenses - totalStaffOnline;
  const totalAmountLeft = totalCashInHand + totalOnlineBalance;

  // Cash Drawer is a standalone physical cash-counting tool. It never affects accounting calculations.
  const actualDrawerTotal = (Number(notes[500]) * 500) + (Number(notes[200]) * 200) + (Number(notes[100]) * 100) + (Number(notes[50]) * 50) + (Number(notes[20]) * 20) + (Number(notes[10]) * 10) + Number(notes.coins);

  // --- HANDLERS ---
  const addArrItem = (setter, arr, defaults) => setter([...arr, { id: Date.now(), ...defaults }]);
  const updateArrItem = (setter, arr, id, field, value) => setter(arr.map(item => item.id === id ? { ...item, [field]: value } : item));
  const removeArrItem = (setter, arr, id) => setter(arr.filter(item => item.id !== id));
  
  const addCreditSale = () => addArrItem(setCreditSales, creditSales, { name: '', amount: 0 });
  const addCreditReceived = () => addArrItem(setCreditReceived, creditReceived, { name: '', amount: 0, method: 'Cash' });
  const addOnlineExpense = () => addArrItem(setOnlineExpenses, onlineExpenses, { category: '', description: '', amount: 0 });
  const addCashExpense = () => addArrItem(setCashExpenses, cashExpenses, { category: '', description: '', amount: 0, type: 'Cash' });
  const addStaffPayment = () => addArrItem(setStaffPayments, staffPayments, { name: '', amount: 0, type: 'Full Wage', method: 'Cash' });

  const handleAddTask = () => { if (newTask.trim()) { setTasks([{ id: Date.now(), text: newTask, done: false }, ...tasks]); setNewTask(''); }};
  const toggleTask = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));
  useEffect(() => { localStorage.setItem('vintage_tasks', JSON.stringify(tasks)); }, [tasks]);

  const clearUnsavedForm = () => {
    if (!window.confirm('Clear all unsaved entries for this date? Saved database records will not be deleted.')) return;
    setCashSale(0); setOnlineSale(0); setParcelCounterCash(0); setParcelCounterOnline(0); setOnlineExpenses([]); setCashExpenses([]); setStaffPayments([]); setCreditSales([]); setCreditReceived([]);
    setNotes({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', coins: '' });
    localStorage.removeItem(`vintage_draft_${date}`);
  };

  const saveDailyAccounts = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const { error } = await supabase.from('daily_logs').upsert({ 
        date: date, total_cash_in_hand: totalCashInHand, total_online_balance: totalOnlineBalance,
        expense_details: { online: onlineExpenses, cash: cashExpenses, staff: staffPayments, sales: { cash: cashSale, online: onlineSale, parcel_counter_cash: parcelCounterCash, parcel_counter_online: parcelCounterOnline }, credit_sales: creditSales, credit_received: creditReceived }
      }, { onConflict: 'date' });
    if (error) {
      alert("Error saving data: " + error.message); 
    } else {
      localStorage.removeItem(`vintage_draft_${date}`);
      await loadHistory();
      alert(`✅ Accounts saved for ${date}`);
    }
    setIsSaving(false);
  };

  const exportToExcel = () => {
    if (historyLogs.length === 0) return alert("No data to export!");
    const summaryData = []; const detailedData = [];

    historyLogs.forEach(log => {
      let netCashSale = log.expense_details?.sales?.cash || 0;
      let onlineSales = log.expense_details?.sales?.online || 0;
      let parcelCash = log.expense_details?.sales?.parcel_counter_cash || 0;
      let parcelOnline = log.expense_details?.sales?.parcel_counter_online || 0;
      let counterTotal = log.expense_details?.cash?.filter(e => e.type === 'Counter').reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;
      let cSales = log.expense_details?.credit_sales?.reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0;
      let cRecv = log.expense_details?.credit_received?.reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0;

      summaryData.push({
        "Date": log.date, "Gross Cash Sales (₹)": Number(netCashSale) + Number(parcelCash) + Number(counterTotal), "Online Sales (₹)": Number(onlineSales) + Number(parcelOnline), "Parcel Counter Cash (₹)": Number(parcelCash), "Parcel Counter Online (₹)": Number(parcelOnline),
        "Credit Sales Given (₹)": cSales, "Credit Payments Received (₹)": cRecv,
        "Closing Cash In Hand (₹)": log.total_cash_in_hand, "Closing Online Balance (₹)": log.total_online_balance,
      });

      const pushData = (arr, mainType) => {
        if (!arr) return;
        arr.forEach(item => {
          detailedData.push({
            "Date": log.date, "Type": mainType, "Method": item.type || item.method || 'N/A',
            "Details": item.category || item.name || 'N/A', "Paid To": item.employee || '', "Note": item.description || '', "Amount (₹)": Number(item.amount || 0)
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
    let cashSales = 0;
    let onlineSales = 0;
    let creditSales = 0;
    let creditReceived = 0;
    let operatingExpenses = 0;
    let staffCost = 0;
    let cashExpenses = 0;
    let onlineExpensesTotal = 0;
    let counterAdjustments = 0;
    const categoryTotals = {};
    const monthlyTotals = {};

    const addCategory = (category, amount) => {
      const value = Number(amount || 0);
      if (value <= 0) return;
      categoryTotals[category] = (categoryTotals[category] || 0) + value;
    };

    filtered.forEach(log => {
      const sales = log.expense_details?.sales || {};
      const logCash = Number(sales.cash || 0);
      const logOnline = Number(sales.online || 0);
      const logParcelCash = Number(sales.parcel_counter_cash || 0);
      const logParcelOnline = Number(sales.parcel_counter_online || 0);
      const logCredit = (log.expense_details?.credit_sales || []).reduce((sum, c) => sum + Number(c.amount || 0), 0);
      const logCreditReceived = (log.expense_details?.credit_received || []).reduce((sum, c) => sum + Number(c.amount || 0), 0);
      const logCounter = (log.expense_details?.cash || [])
        .filter(e => e.type === 'Counter')
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      cashSales += logCash + logParcelCash;
      onlineSales += logOnline + logParcelOnline;
      creditSales += logCredit;
      creditReceived += logCreditReceived;
      counterAdjustments += logCounter;

      (log.expense_details?.online || []).forEach(exp => {
        const amount = Number(exp.amount || 0);
        operatingExpenses += amount;
        onlineExpensesTotal += amount;
        addCategory(exp.category || 'Uncategorized', amount);
      });

      (log.expense_details?.cash || []).forEach(exp => {
        const amount = Number(exp.amount || 0);
        if (exp.type === 'Cash') {
          operatingExpenses += amount;
          cashExpenses += amount;
          addCategory(exp.category || 'Uncategorized', amount);
        } else if (!['Counter', 'Credit', 'Teja', 'Anil'].includes(exp.type)) {
          operatingExpenses += amount;
          addCategory(exp.category || 'Uncategorized', amount);
        }
      });

      (log.expense_details?.staff || []).forEach(s => {
        const amount = Number(s.amount || 0);
        operatingExpenses += amount;
        staffCost += amount;
        addCategory('Staff Wages & Advances', amount);
      });

      const totalSalesForDay = logCash + logParcelCash + logOnline + logParcelOnline + logCredit + logCounter;
      const monthKey = log.date?.slice(0, 7) || 'Unknown';
      if (!monthlyTotals[monthKey]) monthlyTotals[monthKey] = { sales: 0, expenses: 0, days: 0 };
      monthlyTotals[monthKey].sales += totalSalesForDay;
      monthlyTotals[monthKey].days += 1;
    });

    Object.keys(monthlyTotals).forEach(monthKey => {
      const monthLogs = filtered.filter(log => log.date?.slice(0, 7) === monthKey);
      let monthExpenses = 0;
      monthLogs.forEach(log => {
        (log.expense_details?.online || []).forEach(e => { monthExpenses += Number(e.amount || 0); });
        (log.expense_details?.cash || []).forEach(e => {
          if (e.type === 'Cash' || !['Counter', 'Credit', 'Teja', 'Anil'].includes(e.type)) monthExpenses += Number(e.amount || 0);
        });
        (log.expense_details?.staff || []).forEach(s => { monthExpenses += Number(s.amount || 0); });
      });
      monthlyTotals[monthKey].expenses = monthExpenses;
    });

    const totalSales = cashSales + onlineSales + creditSales + counterAdjustments;
    const estimatedProfit = totalSales - operatingExpenses;
    const operatingDays = filtered.length;
    const averageDailySales = operatingDays ? totalSales / operatingDays : 0;
    const averageDailyExpenses = operatingDays ? operatingExpenses / operatingDays : 0;
    const creditOutstanding = Math.max(0, creditSales - creditReceived);
    const maxCatVal = Math.max(...Object.values(categoryTotals), 1);
    const sortedCategories = Object.entries(categoryTotals).sort((a,b) => b[1] - a[1]);
    const monthlyRows = Object.entries(monthlyTotals).sort((a,b) => b[0].localeCompare(a[0]));

    return {
      totalSales, totalExpenses: operatingExpenses, estimatedProfit,
      cashSales, onlineSales, creditSales, creditReceived,
      cashExpenses, onlineExpensesTotal, staffCost, creditOutstanding,
      operatingDays, averageDailySales, averageDailyExpenses,
      sortedCategories, maxCatVal, monthlyRows
    };
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
        <button onClick={() => setActiveTab('attendance')} style={{ ...tabStyle, backgroundColor: activeTab === 'attendance' ? '#0ea5e9' : '#e5e7eb', color: activeTab === 'attendance' ? 'white' : 'black' }}>👥 Attendance</button>
        <button onClick={() => setActiveTab('tasks')} style={{ ...tabStyle, backgroundColor: activeTab === 'tasks' ? '#f59e0b' : '#e5e7eb', color: activeTab === 'tasks' ? 'white' : 'black' }}>🔔 Reminders</button>
      </div>

      {activeTab === 'daily' && (
        <>
          <datalist id="common-expenses">
            {dynamicCategories.map((cat, i) => <option key={i} value={cat} />)}
          </datalist>

          <div style={flexRow}>
            {/* UPDATED FETCH BUTTON FEATURE */}
            <div style={{...cardStyle, flex: 1, border: '2px solid #3b82f6'}}>
              <h3 style={{ color: '#1d4ed8', marginTop: 0 }}>📅 Select Date</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="date" value={dateSelection} onChange={e => setDateSelection(e.target.value)} style={{...inputStyle, borderColor: '#3b82f6', fontWeight: 'bold', flex: 1}}/>
                {/* true flag sent to explicitly bypass draft protection */}
                <button onClick={() => handleFetchData(dateSelection, true)} disabled={isFetching} style={{...btnStyle, backgroundColor: isFetching ? '#9ca3af' : '#2563eb'}}>
                  {isFetching ? '⏳ Fetching...' : '📥 Fetch'}
                </button>
              </div>
              {date !== dateSelection && !isFetching && <p style={{color: '#ef4444', fontSize: '12px', marginTop: '5px', marginBottom: 0}}>Click Fetch to load selected date!</p>}
            </div>
            
            <div style={{...cardStyle, flex: 1}}><h3>Yesterday</h3><div style={flexRow}><label>Cash: <input type="number" value={yesterdayCash} onChange={e => setYesterdayCash(Number(e.target.value))} style={inputStyle}/></label><label>Online: <input type="number" value={yesterdayOnline} onChange={e => setYesterdayOnline(Number(e.target.value))} style={inputStyle}/></label></div></div>
            <div style={{...cardStyle, flex: 1}}>
              <h3>Today Sales</h3>
              <div style={flexRow}>
                <label style={{position: 'relative'}}>Cash (Net Box): <input type="number" value={cashSale} onChange={e => setCashSale(Number(e.target.value))} style={inputStyle}/>
                  {totalCounterExpenses > 0 && <span style={{fontSize: '12px', color: '#059669', position: 'absolute', bottom: '-20px', left: 0}}>True Gross: ₹{grossCashSale}</span>}
                </label>
                <label>Online: <input type="number" value={onlineSale} onChange={e => setOnlineSale(Number(e.target.value))} style={inputStyle}/></label>
                <label>Parcel Counter Cash: <input type="number" value={parcelCounterCash} onChange={e => setParcelCounterCash(Number(e.target.value))} style={inputStyle}/></label>
                <label>Parcel Counter Online: <input type="number" value={parcelCounterOnline} onChange={e => setParcelCounterOnline(Number(e.target.value))} style={inputStyle}/></label>
              </div>
            </div>
          </div>

          <div style={{ ...cardStyle, padding: '14px 18px', background: 'linear-gradient(135deg, #111827, #374151)', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
              <div><div style={{ fontSize: '12px', color: '#d1d5db', textTransform: 'uppercase' }}>Daily Snapshot</div><div style={{ fontSize: '20px', fontWeight: '800' }}>₹{dailySnapshotGrossSale.toLocaleString('en-IN')}</div><div style={{ fontSize: '12px', color: '#d1d5db' }}>Gross sales (before till expenses)</div></div>
              <div><div style={{ fontSize: '12px', color: '#d1d5db' }}>Expenses</div><div style={{ fontSize: '18px', fontWeight: '700', color: '#fca5a5' }}>₹{(totalOnlineExpenses + totalCashExpenses + totalStaffCash + totalStaffOnline).toLocaleString('en-IN')}</div></div>
              <div><div style={{ fontSize: '12px', color: '#d1d5db' }}>Cash Available</div><div style={{ fontSize: '18px', fontWeight: '700', color: '#86efac' }}>₹{totalCashInHand.toLocaleString('en-IN')}</div></div>
              <div><div style={{ fontSize: '12px', color: '#d1d5db' }}>Online Available</div><div style={{ fontSize: '18px', fontWeight: '700', color: '#93c5fd' }}>₹{totalOnlineBalance.toLocaleString('en-IN')}</div></div>
              <div><div style={{ fontSize: '12px', color: '#d1d5db' }}>Est. Profit</div><div style={{ fontSize: '18px', fontWeight: '700', color: estimatedProfit >= 0 ? '#86efac' : '#fca5a5' }}>{formatINR(estimatedProfit)}</div></div>
              <div><div style={{ fontSize: '12px', color: '#d1d5db' }}>Drawer Count</div><div style={{ fontSize: '18px', fontWeight: '700', color: '#fcd34d' }}>₹{actualDrawerTotal.toLocaleString('en-IN')}</div></div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ ...cardStyle, flex: 1, minWidth: '350px', borderTop: '4px solid #f43f5e' }}>
              <h3 style={{color: '#e11d48'}}>🔴 Give Credit (Sale Today, Pay Later)</h3>
              {creditSales.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                  <input placeholder="Customer/App Name" value={c.name} onChange={e => updateArrItem(setCreditSales, creditSales, c.id, 'name', e.target.value)} style={{...inputStyle, flex: 1}}/>
                  <input type="number" placeholder="Amount" value={c.amount} onChange={e => updateArrItem(setCreditSales, creditSales, c.id, 'amount', e.target.value)} style={{...inputStyle, flex: 1}}/>
                  <button onClick={() => removeArrItem(setCreditSales, creditSales, c.id)} style={{...btnStyle, backgroundColor: '#ef4444', padding: '8px 10px'}}>✕</button>
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
                  <button onClick={() => removeArrItem(setCreditReceived, creditReceived, c.id)} style={{...btnStyle, backgroundColor: '#ef4444', padding: '8px 10px'}}>✕</button>
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
                  <button onClick={() => removeArrItem(setOnlineExpenses, onlineExpenses, exp.id)} style={{...btnStyle, backgroundColor: '#ef4444', padding: '8px 10px'}}>✕</button>
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
                  <button onClick={() => removeArrItem(setCashExpenses, cashExpenses, exp.id)} style={{...btnStyle, backgroundColor: '#ef4444', padding: '8px 10px'}}>✕</button>
                </div>
              ))}
              <button onClick={addCashExpense} style={btnStyle}>+ Add Offline Exp</button>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{color: '#8b5cf6'}}>👨‍🍳 Staff Wages & Advances</h3>
            {staffPayments.map(s => (
              <div key={s.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <select value={s.name || ''} onChange={e => updateArrItem(setStaffPayments, staffPayments, s.id, 'name', e.target.value)} style={{...inputStyle, flex: 1}}>
                  <option value="">Staff Name</option>
                  {employeeNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
                <select value={s.type} onChange={e => updateArrItem(setStaffPayments, staffPayments, s.id, 'type', e.target.value)} style={{...inputStyle, flex: 1}}><option>Full Wage</option><option>Cash Advance</option></select>
                <input type="number" inputMode="decimal" min="0" step="0.01" placeholder="Amount (₹)" value={s.amount ?? ''} onChange={e => updateArrItem(setStaffPayments, staffPayments, s.id, 'amount', e.target.value)} style={{...inputStyle, flex: 1}}/>
                <select value={s.method} onChange={e => updateArrItem(setStaffPayments, staffPayments, s.id, 'method', e.target.value)} style={{...inputStyle, flex: 1}}>
                  <option value="Cash">Cash (Deduct from Till)</option>
                  <option value="Counter">Counter (Net Sale)</option>
                  <option value="Credit">Credit (Owe Later)</option>
                  <option value="Teja">Teja Paid</option>
                  <option value="Anil">Anil Paid</option>
                  <option value="Online">Online (Deduct from Online Balance)</option>
                </select>
                <button onClick={() => removeArrItem(setStaffPayments, staffPayments, s.id)} style={{...btnStyle, backgroundColor: '#ef4444', padding: '8px 10px'}}>✕</button>
              </div>
            ))}
            <button onClick={addStaffPayment} style={{...btnStyle, backgroundColor: '#8b5cf6'}}>+ Log Staff Payment</button>
          </div>

          <div style={{ ...cardStyle, backgroundColor: '#fdfbc8', border: '1px solid #fde047' }}>
            <h3 style={{ color: '#854d0e', marginTop: 0 }}>🧮 Cash Drawer — Daily Count Only</h3>
            <p style={{ marginTop: 0, color: '#6b7280' }}>Count the physical cash in the drawer. This is a separate counting tool and does not change any accounting balance. The drawer starts fresh for each date.</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <label style={{ flex: 1 }}>₹500 x <input type="number" value={notes[500]} onChange={e => setNotes({...notes, 500: e.target.value})} style={inputStyle}/></label>
              <label style={{ flex: 1 }}>₹200 x <input type="number" value={notes[200]} onChange={e => setNotes({...notes, 200: e.target.value})} style={inputStyle}/></label>
              <label style={{ flex: 1 }}>₹100 x <input type="number" value={notes[100]} onChange={e => setNotes({...notes, 100: e.target.value})} style={inputStyle}/></label>
              <label style={{ flex: 1 }}>₹50 x <input type="number" value={notes[50]} onChange={e => setNotes({...notes, 50: e.target.value})} style={inputStyle}/></label>
              <label style={{ flex: 1 }}>₹20 x <input type="number" value={notes[20]} onChange={e => setNotes({...notes, 20: e.target.value})} style={inputStyle}/></label>
              <label style={{ flex: 1 }}>₹10 x <input type="number" value={notes[10]} onChange={e => setNotes({...notes, 10: e.target.value})} style={inputStyle}/></label>
              <label style={{ flex: 1.5 }}>Coins (Total ₹): <input type="number" value={notes.coins} onChange={e => setNotes({...notes, coins: e.target.value})} style={inputStyle}/></label>
            </div>
            
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#6b7280' }}>Total Physical Cash Counted</p>
              <h2 style={{ margin: 0, color: '#ca8a04' }}>₹{actualDrawerTotal.toLocaleString('en-IN')}</h2>
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
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={clearUnsavedForm} style={{ ...btnStyle, backgroundColor: '#6b7280', flex: 1 }}>↺ Clear Unsaved Form</button>
              <button onClick={saveDailyAccounts} disabled={isSaving} style={{ ...btnStyle, backgroundColor: isSaving ? '#9ca3af' : '#10b981', flex: 2, fontSize: '18px', padding: '15px' }}>{isSaving ? '⏳ Saving...' : `💾 Save Data For ${date}`}</button>
            </div>
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
        <div>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>📊 Business Analytics</h2>
            <p style={{ color: '#6b7280', marginTop: 0 }}>
              Review sales, operating costs, staff costs and customer credit for the selected period. Profit is an internal estimate based on the entries recorded here.
            </p>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', background: '#f3f4f6', padding: '15px', borderRadius: '8px', flexWrap: 'wrap' }}>
              <label style={{ flex: 1, minWidth: '220px' }}>Start Date:<input type="date" value={analyticsStart} onChange={e => setAnalyticsStart(e.target.value)} style={inputStyle}/></label>
              <label style={{ flex: 1, minWidth: '220px' }}>End Date:<input type="date" value={analyticsEnd} onChange={e => setAnalyticsEnd(e.target.value)} style={inputStyle}/></label>
            </div>

            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {[
                ['Sales', analyticsData.totalSales, '#ecfdf5', '#059669'],
                ['Operating Expenses', analyticsData.totalExpenses, '#fef2f2', '#dc2626'],
                ['Estimated Profit', analyticsData.estimatedProfit, '#eff6ff', '#2563eb'],
                ['Credit Outstanding', analyticsData.creditOutstanding, '#fff7ed', '#ea580c']
              ].map(([label, value, bg, color]) => (
                <div key={label} style={{ flex: 1, minWidth: '190px', padding: '18px', background: bg, borderRadius: '8px', textAlign: 'center' }}>
                  <p style={{ margin: 0, color, fontWeight: 'bold' }}>{label}</p>
                  <h2 style={{ margin: '6px 0 0', color }}>{formatINR(value)}</h2>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '25px' }}>
              {[
                ['Cash Sales', analyticsData.cashSales],
                ['Online Sales', analyticsData.onlineSales],
                ['Credit Sales', analyticsData.creditSales],
                ['Credit Received', analyticsData.creditReceived],
                ['Staff Cost', analyticsData.staffCost],
                ['Operating Days', analyticsData.operatingDays],
                ['Avg Daily Sales', analyticsData.averageDailySales],
                ['Avg Daily Expenses', analyticsData.averageDailyExpenses]
              ].map(([label, value]) => (
                <div key={label} style={{ flex: 1, minWidth: '150px', padding: '14px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}>
                  <div style={{ color: '#6b7280', fontSize: '13px' }}>{label}</div>
                  <strong style={{ display: 'block', marginTop: '5px', fontSize: '18px' }}>
                    {label === 'Operating Days' ? value : formatINR(value)}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ ...cardStyle, flex: 1, minWidth: '420px' }}>
              <h3 style={{ marginTop: 0 }}>📅 Monthly Performance</h3>
              {analyticsData.monthlyRows.length === 0 ? <p>No records found in this date range.</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Month</th>
                      <th style={{ textAlign: 'right', padding: '10px' }}>Sales</th>
                      <th style={{ textAlign: 'right', padding: '10px' }}>Expenses</th>
                      <th style={{ textAlign: 'right', padding: '10px' }}>Est. Profit</th>
                      <th style={{ textAlign: 'right', padding: '10px' }}>Days</th>
                    </tr></thead>
                    <tbody>
                      {analyticsData.monthlyRows.map(([month, row]) => (
                        <tr key={month} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>{month}</td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>{formatINR(row.sales)}</td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>{formatINR(row.expenses)}</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: row.sales - row.expenses >= 0 ? '#2563eb' : '#dc2626' }}>{formatINR(row.sales - row.expenses)}</td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>{row.days}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ ...cardStyle, flex: 1, minWidth: '420px' }}>
              <h3 style={{ marginTop: 0 }}>💰 Expense Breakdown</h3>
              {analyticsData.sortedCategories.length === 0 ? <p>No expenses found in this date range.</p> :
                analyticsData.sortedCategories.map(([category, amount]) => (
                  <div key={category} style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <strong>{category}</strong><span>{formatINR(amount)}</span>
                    </div>
                    <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '4px', height: '12px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', backgroundColor: '#3b82f6', width: `${(amount / analyticsData.maxCatVal) * 100}%` }}></div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          <div style={{ ...cardStyle, backgroundColor: '#f9fafb' }}>
            <strong>How to read this:</strong>
            <span style={{ color: '#6b7280' }}> Sales include the final cash/online amounts entered by the cashier after expenses have already been deducted, plus credit sales and recorded Counter adjustments. Expense entries are tracked separately for reporting and are not subtracted again from closing cash/online balances.</span>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div>
          <div style={{ ...cardStyle, borderTop: '4px solid #0ea5e9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ color: '#0284c7', margin: 0 }}>👥 Employee Attendance</h2>
                <p style={{ color: '#6b7280', marginBottom: 0 }}>Manage daily attendance, check-in/check-out times, and monthly payroll.</p>
              </div>
              <a href="/attendance.html" target="_blank" rel="noreferrer" style={{ ...btnStyle, backgroundColor: '#0ea5e9', textDecoration: 'none' }}>📱 Employee Phone Page</a>
            </div>
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px', alignItems: 'end', flexWrap: 'wrap' }}>
              <label style={{ minWidth: '220px', flex: 1 }}>
                Attendance Date:
                <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} style={inputStyle}/>
              </label>
              <button onClick={() => loadAttendance(attendanceDate)} disabled={isLoadingAttendance} style={{ ...btnStyle, backgroundColor: '#0284c7' }}>
                {isLoadingAttendance ? '⏳ Loading...' : '🔄 Refresh Attendance'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
              {Object.entries(attendanceSummary).map(([status, count]) => (
                <div key={status} style={{ padding: '10px 14px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  <strong>{status}:</strong> {count}
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...cardStyle, overflowX: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Daily Attendance — {attendanceDate}</h3>
            {isLoadingAttendance ? <p>Loading attendance...</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f8fafc' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Employee</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Check In</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Check Out</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Hours</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeNames.map(name => {
                    const row = attendanceLogs.find(r => r.employee_name === name);
                    const saveStatus = async (status) => {
                      if (row) {
                        await updateAttendance(row.id, { status });
                      } else {
                        const { error } = await supabase.from('employee_attendance').insert({
                          employee_name: name,
                          attendance_date: attendanceDate,
                          status
                        });
                        if (error) alert('Attendance save failed: ' + error.message);
                        else await loadAttendance(attendanceDate);
                      }
                    };
                    return (
                      <tr key={name} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{name}</td>
                        <td style={{ padding: '10px' }}>
                          <select value={row?.status || ''} onChange={e => saveStatus(e.target.value)} style={{ ...inputStyle, minWidth: '140px' }}>
                            <option value="">Not Marked</option>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Half Day">Half Day</option>
                            <option value="Leave">Leave</option>
                            <option value="Weekly Off">Weekly Off</option>
                          </select>
                        </td>
                        <td style={{ padding: '10px' }}>{row?.check_in ? new Date(row.check_in).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '—'}</td>
                        <td style={{ padding: '10px' }}>{row?.check_out ? new Date(row.check_out).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '—'}</td>
                        <td style={{ padding: '10px' }}>{row ? attendanceHours(row) : '—'}</td>
                        <td style={{ padding: '10px' }}>
                          <button onClick={async () => {
                            const note = window.prompt('Attendance note (optional):', row?.notes || '');
                            if (note === null) return;
                            if (row) await updateAttendance(row.id, { notes: note });
                            else {
                              const { error } = await supabase.from('employee_attendance').insert({ employee_name: name, attendance_date: attendanceDate, status: 'Present', notes: note });
                              if (error) alert('Attendance save failed: ' + error.message);
                              else await loadAttendance(attendanceDate);
                            }
                          }} style={{ ...btnStyle, backgroundColor: '#64748b', padding: '7px 10px' }}>📝 Note</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ ...cardStyle, overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0 }}>💰 Monthly Attendance & Payroll</h3>
                <p style={{ color: '#6b7280', marginBottom: 0 }}>Payroll is an estimate from attendance and salary values saved in this browser.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'end', flexWrap: 'wrap' }}>
                <label>
                  Month:
                  <input type="month" value={payrollMonth} onChange={e => setPayrollMonth(e.target.value)} style={inputStyle}/>
                </label>
                <button onClick={() => loadPayroll(payrollMonth)} disabled={isLoadingPayroll} style={{ ...btnStyle, backgroundColor: '#8b5cf6' }}>
                  {isLoadingPayroll ? '⏳ Loading...' : '🔄 Refresh Payroll'}
                </button>
                <button onClick={exportPayroll} style={{ ...btnStyle, backgroundColor: '#10b981' }}>📊 Export Payroll Excel</button>
              </div>
            </div>
            <div style={{ marginTop: '15px', overflowX: 'auto' }}>
              {isLoadingPayroll ? <p>Loading payroll...</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f8fafc' }}>
                      {['Employee','Monthly Salary','Present','Half Day','Leave','Absent','Weekly Off','Hours','Payable Days','Earned Salary','Taken/Paid','Balance To Pay'].map(h => <th key={h} style={{ padding: '9px', textAlign: h === 'Employee' ? 'left' : 'right' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {payrollRows.map(r => (
                      <tr key={r.name} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '9px', fontWeight: 'bold' }}>{r.name}</td>
                        <td style={{ padding: '9px' }}><input type="number" min="0" value={r.monthlySalary || ''} placeholder="₹ Salary" onChange={e => saveSalary(r.name, e.target.value)} style={{ ...inputStyle, minWidth: '120px' }}/></td>
                        <td style={{ padding: '9px', textAlign: 'right' }}>{r.present}</td>
                        <td style={{ padding: '9px', textAlign: 'right' }}>{r.half}</td>
                        <td style={{ padding: '9px', textAlign: 'right' }}>{r.leave}</td>
                        <td style={{ padding: '9px', textAlign: 'right' }}>{r.absent}</td>
                        <td style={{ padding: '9px', textAlign: 'right' }}>{r.weeklyOff}</td>
                        <td style={{ padding: '9px', textAlign: 'right' }}>{r.hours.toFixed(2)}</td>
                        <td style={{ padding: '9px', textAlign: 'right' }}>{r.payableDays}</td>
                        <td style={{ padding: '9px', textAlign: 'right', fontWeight: 'bold' }}>{formatINR(r.earnedPay)}</td>
                        <td style={{ padding: '9px', textAlign: 'right', color: '#b45309', fontWeight: 'bold' }}>
                          {formatINR(r.totalTaken)}
                          {r.cashAdvance > 0 && <div style={{ fontSize: '11px', fontWeight: 'normal', color: '#6b7280' }}>Advance: {formatINR(r.cashAdvance)}</div>}
                        </td>
                        <td style={{ padding: '9px', textAlign: 'right', fontWeight: 'bold', color: r.overpaid > 0 ? '#dc2626' : '#059669' }}>
                          {r.overpaid > 0 ? `Overpaid ${formatINR(r.overpaid)}` : formatINR(r.balanceToPay)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
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
