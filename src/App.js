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

const dailyUiStyles = `
.va-daily-toolbar{display:grid;grid-template-columns:1.15fr .85fr;gap:18px;margin-bottom:18px}
.va-date-card,.va-yesterday-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:20px;box-shadow:0 8px 25px rgba(15,23,42,.06)}
.va-date-card{display:flex;justify-content:space-between;gap:18px;align-items:center;border-left:4px solid #2563eb}
.va-date-card h3{margin:5px 0;font-size:20px}.va-date-card p{margin:0;color:#64748b;font-size:13px}
.va-date-actions{display:flex;gap:8px;align-items:center;min-width:280px}.va-date-actions input{flex:1}
.va-eyebrow{display:block;text-transform:uppercase;letter-spacing:.08em;font-size:11px;font-weight:800;color:#64748b}
.va-opening-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}
.va-opening-grid label,.va-sales-grid label{font-size:12px;font-weight:800;color:#475569}.va-opening-grid input,.va-sales-grid input{margin-top:6px}
.va-kpi-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;margin-bottom:18px}
.va-kpi{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:16px;min-height:92px;box-shadow:0 6px 20px rgba(15,23,42,.05);position:relative;overflow:hidden}
.va-kpi span{font-size:12px;color:#64748b;font-weight:800}.va-kpi strong{display:block;font-size:21px;margin-top:8px;color:#0f172a}.va-kpi small{display:block;color:#94a3b8;margin-top:4px;font-size:11px}
.va-kpi-sales{border-top:4px solid #2563eb}.va-kpi-cash{border-top:4px solid #16a34a}.va-kpi-online{border-top:4px solid #0ea5e9}.va-kpi-expense{border-top:4px solid #ef4444}.va-kpi-available{border-top:4px solid #8b5cf6}.va-kpi-profit{border-top:4px solid #f59e0b}
.va-sales-panel{background:#fff;border:1px solid #dbeafe;border-radius:18px;padding:20px;margin-bottom:20px;box-shadow:0 8px 25px rgba(15,23,42,.06)}
.va-section-heading{display:flex;justify-content:space-between;gap:15px;align-items:center;margin-bottom:16px}.va-section-heading h3{margin:4px 0;font-size:19px}.va-section-heading p{margin:0;color:#64748b;font-size:13px}.va-mini-total{padding:9px 12px;border-radius:10px;background:#eff6ff;color:#1d4ed8;font-weight:800}
.va-sales-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.va-sales-grid small{display:block;color:#059669;margin-top:4px}
@media(max-width:1100px){.va-kpi-grid{grid-template-columns:repeat(3,1fr)}.va-daily-toolbar{grid-template-columns:1fr}.va-sales-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:650px){.va-kpi-grid{grid-template-columns:repeat(2,1fr)}.va-date-card{display:block}.va-date-actions{min-width:0;margin-top:14px}.va-opening-grid,.va-sales-grid{grid-template-columns:1fr}.va-kpi strong{font-size:18px}.va-section-heading{display:block}.va-mini-total{display:inline-block;margin-top:10px}}
`;

const expenseUiStyles = `
.va-credit-grid,.va-expense-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-bottom:18px}
.va-entry-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:20px;box-shadow:0 8px 25px rgba(15,23,42,.055)}
.va-credit-card{border-top:4px solid #f43f5e}.va-receive-card{border-top:4px solid #10b981}.va-online-card{border-top:4px solid #3b82f6}.va-cash-card{border-top:4px solid #10b981}
.va-entry-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:15px}.va-entry-head h3{margin:4px 0;font-size:18px}.va-entry-head p{margin:0;color:#64748b;font-size:12px}.va-entry-total{font-weight:900;font-size:17px;color:#0f172a;white-space:nowrap}
.va-line-item{display:grid;grid-template-columns:1.4fr 1fr 38px;gap:8px;margin-bottom:9px}.va-receive-line{grid-template-columns:1.2fr 1fr .8fr 38px}
.va-expense-row{display:grid;grid-template-columns:1fr 1.1fr .7fr 38px;gap:8px;margin-bottom:9px}.va-cash-expense-row{grid-template-columns:.9fr 1fr .65fr 1.25fr 38px}
.va-icon-delete{border:0;border-radius:9px;background:#fee2e2;color:#dc2626;font-weight:900;cursor:pointer;min-height:42px}
.va-helper{background:#f5f3ff;color:#6d28d9;border:1px solid #ddd6fe;border-radius:10px;padding:10px 12px;font-size:12px;margin-bottom:12px}
@media(max-width:900px){.va-credit-grid,.va-expense-grid{grid-template-columns:1fr}.va-expense-row,.va-cash-expense-row{grid-template-columns:1fr 1fr}.va-expense-row .va-icon-delete,.va-cash-expense-row .va-icon-delete{grid-column:auto}}
@media(max-width:560px){.va-line-item,.va-receive-line,.va-expense-row,.va-cash-expense-row{grid-template-columns:1fr}.va-entry-head{display:block}.va-entry-total{display:inline-block;margin-top:8px}.va-icon-delete{width:100%}}
`;

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);

  const [cashierDate, setCashierDate] = useState(new Date().toISOString().split('T')[0]);
  const [cashierCashSale, setCashierCashSale] = useState(0);
  const [cashierOnlineSale, setCashierOnlineSale] = useState(0);
  const [cashierParcelCash, setCashierParcelCash] = useState(0);
  const [cashierParcelOnline, setCashierParcelOnline] = useState(0);
  const [cashierCreditSales, setCashierCreditSales] = useState([]);
  const [cashierCreditReceived, setCashierCreditReceived] = useState([]);
  const [cashierSaving, setCashierSaving] = useState(false);
  const [cashierMessage, setCashierMessage] = useState('');
  const [cashierActiveTab, setCashierActiveTab] = useState('sales');
  const [cashierOnlineExpenses, setCashierOnlineExpenses] = useState([]);
  const [cashierCashExpenses, setCashierCashExpenses] = useState([]);
  const [cashierAttendanceDate, setCashierAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [cashierActualCash, setCashierActualCash] = useState(0);
  const [cashierStaffPayments, setCashierStaffPayments] = useState([]);

  const [activeTab, setActiveTab] = useState('daily');
  const [isDataLoaded, setIsDataLoaded] = useState(false); 
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [dateSelection, setDateSelection] = useState(new Date().toISOString().split('T')[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [yesterdayCash, setYesterdayCash] = useState(0);
  const [yesterdayOnline, setYesterdayOnline] = useState(0);
  const [yesterdayAvailableCash, setYesterdayAvailableCash] = useState(0);
  const [cashSale, setCashSale] = useState(0);
  const [cashTakenToAvailable, setCashTakenToAvailable] = useState(0);
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
  const [attendanceLocationRequired, setAttendanceLocationRequired] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0, 7));
  const [payrollLogs, setPayrollLogs] = useState([]);
  const [isLoadingPayroll, setIsLoadingPayroll] = useState(false);
  const [cashierEntries, setCashierEntries] = useState([]);
  const [isLoadingCashierEntries, setIsLoadingCashierEntries] = useState(false);
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

  useEffect(() => {
    if (!session) {
      setRole(null);
      return;
    }
    let cancelled = false;
    const loadRole = async () => {
      setRoleLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (!cancelled) {
        if (error) {
          console.error('Role fetch error:', error);
          setRole(null);
        } else {
          setRole(data?.role || null);
        }
        setRoleLoading(false);
      }
    };
    loadRole();
    return () => { cancelled = true; };
  }, [session]);

  useEffect(() => { if (session && (role === 'admin' || role === 'manager')) loadHistory(); }, [session, role]);

  const loadAttendanceSettings = async () => {
    if (!session || !['admin','manager'].includes(role)) return;
    const { data, error } = await supabase.from('attendance_settings').select('location_required').eq('id', 1).maybeSingle();
    if (!error) setAttendanceLocationRequired(Boolean(data?.location_required));
  };

  const setAttendanceLocation = async (required) => {
    const { error } = await supabase.from('attendance_settings').update({ location_required: required, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) return alert('Unable to update attendance location setting: ' + error.message);
    setAttendanceLocationRequired(required);
  };

  const loadAttendance = async (targetDate = attendanceDate) => {
    setIsLoadingAttendance(true);
    const { data, error } = await supabase.from('employee_attendance').select('*').eq('attendance_date', targetDate).order('employee_name');
    if (error) console.error('Attendance fetch error:', error);
    setAttendanceLogs(data || []);
    setIsLoadingAttendance(false);
  };

  useEffect(() => {
    if (session && activeTab === 'attendance') {
      loadAttendance(attendanceDate);
      loadAttendanceSettings();
    }
  }, [session, role, activeTab, attendanceDate]);

  const updateAttendance = async (id, changes) => {
    const { error } = await supabase.from('employee_attendance').update(changes).eq('id', id);
    if (error) return alert('Attendance update failed: ' + error.message);
    await loadAttendance(attendanceDate);
  };

  const manualAttendanceAction = async (name, action) => {
    const now = new Date().toISOString();
    const row = attendanceLogs.find(r => r.employee_name === name);
    if (action === 'check_in') {
      if (row?.check_in) return alert(`${name} is already checked in.`);
      if (row) await updateAttendance(row.id, { status: 'Present', check_in: now });
      else {
        const { error } = await supabase.from('employee_attendance').insert({ employee_name: name, attendance_date: attendanceDate, status: 'Present', check_in: now });
        if (error) return alert('Manual check-in failed: ' + error.message);
        await loadAttendance(attendanceDate);
      }
    } else {
      if (!row?.check_in) return alert(`${name} must be checked in first.`);
      if (row?.check_out) return alert(`${name} is already checked out.`);
      await updateAttendance(row.id, { check_out: now });
    }
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

  const getPreviousMonth = (month) => {
    const [year, monthNumber] = month.split('-').map(Number);
    const d = new Date(year, monthNumber - 2, 1);
    return d.toISOString().slice(0, 7);
  };

  const loadPayroll = async (month = payrollMonth) => {
    setIsLoadingPayroll(true);
    const previousMonth = getPreviousMonth(month);
    const start = previousMonth + '-01';
    const endDate = new Date(Number(month.slice(0,4)), Number(month.slice(5,7)), 0).toISOString().split('T')[0];
    const { data, error } = await supabase.from('employee_attendance').select('*').gte('attendance_date', start).lte('attendance_date', endDate).order('attendance_date');
    if (error) console.error('Payroll attendance fetch error:', error);
    setPayrollLogs(data || []);
    setIsLoadingPayroll(false);
  };

  useEffect(() => { if (session && activeTab === 'payroll') loadPayroll(payrollMonth); }, [session, activeTab, payrollMonth]);

  const payrollRows = useMemo(() => employeeNames.map(name => {
    const previousMonth = getPreviousMonth(payrollMonth);
    const rows = payrollLogs.filter(r => r.employee_name === name && r.attendance_date?.slice(0, 7) === payrollMonth);
    const previousRows = payrollLogs.filter(r => r.employee_name === name && r.attendance_date?.slice(0, 7) === previousMonth);

    const present = rows.filter(r => r.status === 'Present').length;
    const absent = rows.filter(r => r.status === 'Absent').length;
    const half = rows.filter(r => r.status === 'Half Day').length;
    const leave = rows.filter(r => r.status === 'Leave').length;
    const weeklyOff = rows.filter(r => r.status === 'Weekly Off').length;
    const hours = rows.reduce((sum,r) => sum + (r.check_in && r.check_out ? Math.max(0,(new Date(r.check_out)-new Date(r.check_in))/3600000) : 0),0);

    const previousPresent = previousRows.filter(r => r.status === 'Present').length;
    const previousHalf = previousRows.filter(r => r.status === 'Half Day').length;
    const previousPayableDays = previousPresent + previousHalf * 0.5;

    const monthlySalary = Number(salaryMap[name] || 0);
    const payableDays = present + half * 0.5;
    const calendarDays = new Date(Number(payrollMonth.slice(0,4)), Number(payrollMonth.slice(5,7)), 0).getDate();
    const previousCalendarDays = new Date(Number(previousMonth.slice(0,4)), Number(previousMonth.slice(5,7)), 0).getDate();
    const dailyRate = calendarDays ? monthlySalary / calendarDays : 0;
    const previousDailyRate = previousCalendarDays ? monthlySalary / previousCalendarDays : 0;
    const earnedPay = dailyRate * payableDays;
    const previousEarnedPay = previousDailyRate * previousPayableDays;

    const allStaffPayments = historyLogs
      .flatMap(log => (log.expense_details?.staff || []).map(payment => ({
        ...payment,
        paymentDate: log.date,
        dueFor: payment.dueFor || log.date?.slice(0, 7)
      })))
      .filter(payment => payment.name === name);

    const currentPayments = allStaffPayments.filter(payment => payment.dueFor === payrollMonth);
    const previousPayments = allStaffPayments.filter(payment => payment.dueFor === previousMonth);

    const totalTaken = currentPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const cashAdvance = currentPayments.filter(payment => payment.type === 'Cash Advance').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const wagesPaid = currentPayments.filter(payment => payment.type !== 'Cash Advance').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const paidTowardPreviousDues = previousPayments
      .filter(payment => payment.paymentDate?.slice(0, 7) === payrollMonth)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const previousTotalPaid = previousPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const previousDue = Math.max(0, previousEarnedPay - previousTotalPaid);
    const previousDueAfterPayment = Math.max(0, previousDue - paidTowardPreviousDues);
    const currentBalanceToPay = Math.max(0, earnedPay - totalTaken);
    const totalBalanceToPay = previousDueAfterPayment + currentBalanceToPay;
    const overpaid = Math.max(0, totalTaken - earnedPay);

    return {
      name, present, absent, half, leave, weeklyOff, hours, monthlySalary,
      payableDays, earnedPay, totalTaken, cashAdvance, wagesPaid, balanceToPay: currentBalanceToPay,
      previousMonth, previousEarnedPay, previousDue, paidTowardPreviousDues,
      previousDueAfterPayment, totalBalanceToPay, overpaid
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
      'Already Taken/Paid For Month (₹)':Number(r.totalTaken.toFixed(2)),
      'Cash Advances (₹)':Number(r.cashAdvance.toFixed(2)),
      'Wages Paid (₹)':Number(r.wagesPaid.toFixed(2)),
      'Previous Month Due (₹)':Number(r.previousDueAfterPayment.toFixed(2)),
      'Paid Toward Previous Dues (₹)':Number(r.paidTowardPreviousDues.toFixed(2)),
      'Total Balance To Pay (₹)':Number(r.totalBalanceToPay.toFixed(2)),
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
        setCashSale(currentData.expense_details?.sales?.cash || 0); setCashTakenToAvailable(currentData.expense_details?.sales?.cash_taken_to_available || 0); setOnlineSale(currentData.expense_details?.sales?.online || 0); setParcelCounterCash(currentData.expense_details?.sales?.parcel_counter_cash || 0); setParcelCounterOnline(currentData.expense_details?.sales?.parcel_counter_online || 0);
        setOnlineExpenses(currentData.expense_details?.online || []); setCashExpenses(currentData.expense_details?.cash || []);
        setStaffPayments(currentData.expense_details?.staff || []); setCreditSales(currentData.expense_details?.credit_sales || []);
        setCreditReceived(currentData.expense_details?.credit_received || []);
        setNotes({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', coins: '' }); 
        alert(`✅ System loaded database records for ${targetDate}`);
      } 
      else if (isManualClick && !currentData) {
        // User explicitly clicked fetch, but DB is empty
        setCashSale(0); setCashTakenToAvailable(0); setOnlineSale(0); setParcelCounterCash(0); setParcelCounterOnline(0); setOnlineExpenses([]); setCashExpenses([]); setStaffPayments([]); setCreditSales([]); setCreditReceived([]); setNotes({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', coins: '' });
        alert(`ℹ️ No database records found for ${targetDate}. The page is clear.`);
      }
      else if (!isManualClick && draft) {
        // Initial page load, restore an unsaved draft if it exists
        setCashSale(draft.cashSale || 0); setCashTakenToAvailable(draft.cashTakenToAvailable || 0); setOnlineSale(draft.onlineSale || 0); setParcelCounterCash(draft.parcelCounterCash || 0); setParcelCounterOnline(draft.parcelCounterOnline || 0); setOnlineExpenses(draft.onlineExpenses || []); setCashExpenses(draft.cashExpenses || []); setStaffPayments(draft.staffPayments || []); setCreditSales(draft.creditSales || []); setCreditReceived(draft.creditReceived || []); setNotes(draft.notes || { 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', coins: '' });
      } 
      else if (!isManualClick && currentData) {
        // Initial page load, load DB data
        setCashSale(currentData.expense_details?.sales?.cash || 0); setCashTakenToAvailable(currentData.expense_details?.sales?.cash_taken_to_available || 0); setOnlineSale(currentData.expense_details?.sales?.online || 0); setParcelCounterCash(currentData.expense_details?.sales?.parcel_counter_cash || 0); setParcelCounterOnline(currentData.expense_details?.sales?.parcel_counter_online || 0); setOnlineExpenses(currentData.expense_details?.online || []); setCashExpenses(currentData.expense_details?.cash || []); setStaffPayments(currentData.expense_details?.staff || []); setCreditSales(currentData.expense_details?.credit_sales || []); setCreditReceived(currentData.expense_details?.credit_received || []); setNotes({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', coins: '' }); 
      } 
      else {
        // Initial page load, empty DB
        setCashSale(0); setCashTakenToAvailable(0); setOnlineSale(0); setParcelCounterCash(0); setParcelCounterOnline(0); setOnlineExpenses([]); setCashExpenses([]); setStaffPayments([]); setCreditSales([]); setCreditReceived([]); setNotes({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', coins: '' });
      }

      // Fetch yesterday's balances logically
      const { data: prevData } = await supabase.from('daily_logs').select('total_cash_in_hand, total_online_balance, available_cash_balance').lt('date', targetDate).order('date', { ascending: false }).limit(1);
      if (prevData && prevData.length > 0) {
        setYesterdayCash(prevData[0].total_cash_in_hand); setYesterdayOnline(prevData[0].total_online_balance); setYesterdayAvailableCash(Number(prevData[0].available_cash_balance || 0));
      } else {
        setYesterdayCash(0); setYesterdayOnline(0); setYesterdayAvailableCash(0);
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
      const draft = { cashSale, cashTakenToAvailable, onlineSale, parcelCounterCash, parcelCounterOnline, onlineExpenses, cashExpenses, staffPayments, creditSales, creditReceived, notes };
      localStorage.setItem(`vintage_draft_${date}`, JSON.stringify(draft));
    }
  }, [isDataLoaded, session, date, cashSale, cashTakenToAvailable, onlineSale, parcelCounterCash, parcelCounterOnline, onlineExpenses, cashExpenses, staffPayments, creditSales, creditReceived, notes]);

  // --- MATH LOGIC ---
  const totalOnlineExpenses = onlineExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalTillCashExpenses = cashExpenses.filter(exp => exp.type === 'Cash').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalAvailableCashExpenses = cashExpenses.filter(exp => exp.type === 'Available Cash' || exp.type === 'Cash in Hand').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalStaffAvailableCash = staffPayments.filter(s => s.method === 'Available Cash').reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const totalCashExpenses = totalTillCashExpenses + totalAvailableCashExpenses;
  const availableCashBalance = Number(yesterdayAvailableCash || 0) + Number(cashTakenToAvailable || 0) - totalAvailableCashExpenses - totalStaffAvailableCash;
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
  const totalCreditReceived = creditReceived.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const creditReceivedCash = creditReceived.filter(c => c.method === 'Cash').reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const creditReceivedOnline = creditReceived.filter(c => c.method === 'Online').reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const totalParcelCounterCash = Number(parcelCounterCash || 0);
  const totalParcelCounterOnline = Number(parcelCounterOnline || 0);
  const grossCashSale = Number(cashSale) + totalParcelCounterCash + totalCounterExpenses;
  const grossOnlineSale = Number(onlineSale) + totalParcelCounterOnline;
  const trueGrossSale = grossCashSale + grossOnlineSale + totalCreditSales;
  // Daily Snapshot Gross Sales = all sales entered in Today Sales, plus cash expenses that were already deducted from the till.
  // This restores the pre-expense gross sales figure without including credit sales or non-cash expense methods.
  const dailySnapshotGrossSale = trueGrossSale + totalTillCashExpenses;
  const totalOperatingExpenses = totalOnlineExpenses + totalCashExpenses + totalStaffCash + totalStaffAvailableCash + totalStaffCounter + totalStaffCredit + totalStaffTeja + totalStaffAnil;
  const estimatedProfit = trueGrossSale - totalOperatingExpenses;
  const formatINR = value => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  // Cash sales are entered after till expenses are already deducted, so till expenses are not subtracted again.
  // Available-cash expenses are different: they are paid from cash held/taken home, so they reduce Expected Cash In Hand.
  // Moving cash from till to Available Cash is only an internal transfer and does not reduce total physical cash.
  const totalCashInHand = Math.max(0, yesterdayCash + Number(cashSale) + totalParcelCounterCash + creditReceivedCash - totalAvailableCashExpenses - totalStaffAvailableCash);
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
  const addStaffPayment = () => addArrItem(setStaffPayments, staffPayments, {
    name: '',
    amount: 0,
    type: 'Full Wage',
    method: 'Cash',
    dueFor: date?.slice(0, 7) || new Date().toISOString().slice(0, 7)
  });

  const handleAddTask = () => { if (newTask.trim()) { setTasks([{ id: Date.now(), text: newTask, done: false }, ...tasks]); setNewTask(''); }};
  const toggleTask = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));
  useEffect(() => { localStorage.setItem('vintage_tasks', JSON.stringify(tasks)); }, [tasks]);

  const addCashierCreditSale = () => addArrItem(setCashierCreditSales, cashierCreditSales, { id: Date.now(), name: '', amount: 0 });
  const addCashierCreditReceived = () => addArrItem(setCashierCreditReceived, cashierCreditReceived, { id: Date.now(), name: '', amount: 0, method: 'Cash' });

  const loadCashierOwnEntries = async () => {
    if (!session || role !== 'cashier') return;
    const { data, error } = await supabase.rpc('get_cashier_daily_entries');
    if (error) console.error('Central accounting fetch error:', error);
    setCashierEntries(data || []);
  };

  const loadCashierDateEntry = async (targetDate) => {
    if (!session || role !== 'cashier') return;
    const { data, error } = await supabase.rpc('get_cashier_daily_entry', { p_entry_date: targetDate });
    if (error) {
      console.error('Central accounting date fetch error:', error);
      setCashierMessage('❌ Unable to fetch central accounting data: ' + error.message);
      return;
    }
    const row = data?.[0];
    if (row) {
      setCashierCashSale(row.cash_sale || 0);
      setCashierOnlineSale(row.online_sale || 0);
      setCashierParcelCash(row.parcel_counter_cash || 0);
      setCashierParcelOnline(row.parcel_counter_online || 0);
      setCashierCreditSales(row.credit_sales || []);
      setCashierCreditReceived(row.credit_received || []);
      setCashierOnlineExpenses(row.online_expenses || []);
      setCashierCashExpenses(row.cash_expenses || []);
      setCashierStaffPayments(row.staff_payments || []);
      setCashierMessage('✅ Central accounting data loaded.');
    } else {
      setCashierCashSale(0); setCashierOnlineSale(0); setCashierParcelCash(0); setCashierParcelOnline(0);
      setCashierCreditSales([]); setCashierCreditReceived([]);
      setCashierOnlineExpenses([]); setCashierCashExpenses([]); setCashierStaffPayments([]);
      setCashierMessage('ℹ️ No central accounting record exists for this date.');
    }
  };

  useEffect(() => {
    if (session && role === 'cashier') {
      loadCashierOwnEntries();
      loadCashierDateEntry(cashierDate);
    }
  }, [session, role]);

  useEffect(() => {
    if (session && role === 'cashier') {
      const saved = localStorage.getItem('vintage_cashier_actual_cash_' + cashierDate);
      setCashierActualCash(saved ? Number(saved) : 0);
    }
  }, [session, role, cashierDate]);


  useEffect(() => {
    if (session && role === 'cashier' && cashierActiveTab === 'khata') loadCashierOwnEntries();
  }, [session, role, cashierActiveTab]);

  useEffect(() => {
    if (session && role === 'cashier' && cashierActiveTab === 'attendance') loadAttendance(cashierAttendanceDate);
  }, [session, role, cashierActiveTab, cashierAttendanceDate]);

  const saveCashierEntry = async () => {
    if (!session || role !== 'cashier' || cashierSaving) return;
    setCashierSaving(true);
    setCashierMessage('');
    const { error } = await supabase.rpc('save_cashier_daily_entry', {
      p_entry_date: cashierDate,
      p_cash_sale: Number(cashierCashSale || 0),
      p_online_sale: Number(cashierOnlineSale || 0),
      p_parcel_counter_cash: Number(cashierParcelCash || 0),
      p_parcel_counter_online: Number(cashierParcelOnline || 0),
      p_credit_sales: cashierCreditSales,
      p_credit_received: cashierCreditReceived,
      p_online_expenses: cashierOnlineExpenses,
      p_cash_expenses: cashierCashExpenses,
      p_staff_payments: cashierStaffPayments
    });
    if (error) {
      setCashierMessage('❌ Unable to save central accounting data: ' + error.message);
    } else {
      setCashierMessage('✅ Saved to the central accounting ledger.');
      await loadCashierDateEntry(cashierDate);
      await loadCashierOwnEntries();
    }
    setCashierSaving(false);
  };

  const clearCashierForm = () => {
    setCashierCashSale(0);
    setCashierOnlineSale(0);
    setCashierParcelCash(0);
    setCashierParcelOnline(0);
    setCashierCreditSales([]);
    setCashierCreditReceived([]);
    setCashierOnlineExpenses([]);
    setCashierCashExpenses([]);
    setCashierStaffPayments([]);
    setCashierMessage('');
  };

  const clearUnsavedForm = () => {
    if (!window.confirm('Clear all unsaved entries for this date? Saved database records will not be deleted.')) return;
    setCashSale(0); setCashTakenToAvailable(0); setOnlineSale(0); setParcelCounterCash(0); setParcelCounterOnline(0); setOnlineExpenses([]); setCashExpenses([]); setStaffPayments([]); setCreditSales([]); setCreditReceived([]);
    setNotes({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', coins: '' });
    localStorage.removeItem(`vintage_draft_${date}`);
  };

  const saveDailyAccounts = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const { error } = await supabase.from('daily_logs').upsert({ 
        date: date, total_cash_in_hand: totalCashInHand, total_online_balance: totalOnlineBalance, available_cash_balance: availableCashBalance,
        expense_details: { online: onlineExpenses, cash: cashExpenses, staff: staffPayments, sales: { cash: cashSale, online: onlineSale, parcel_counter_cash: parcelCounterCash, parcel_counter_online: parcelCounterOnline, cash_taken_to_available: cashTakenToAvailable }, credit_sales: creditSales, credit_received: creditReceived }
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
          <p style={{color: '#6b7280', marginBottom: '20px'}}>Secure Admin / Manager Portal</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{...inputStyle, padding: '15px'}} required/>
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{...inputStyle, padding: '15px'}} required/>
            <button type="submit" style={{ ...btnStyle, width: '100%', fontSize: '18px', padding: '15px' }}>Secure Login</button>
          </form>
        </div>
      </div>
    );
  }

  if (roleLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f9fafb', padding: '20px' }}>
        <div style={{ ...cardStyle, textAlign: 'center', padding: '40px', maxWidth: '420px', width: '100%' }}>
          <h2 style={{ marginTop: 0 }}>Checking access…</h2>
          <p style={{ color: '#6b7280' }}>Verifying your Vintage Accounts role.</p>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f9fafb', padding: '20px' }}>
        <div style={{ ...cardStyle, textAlign: 'center', padding: '40px', maxWidth: '460px', width: '100%' }}>
          <h2 style={{ color: '#dc2626', marginTop: 0 }}>Access Not Assigned</h2>
          <p style={{ color: '#6b7280' }}>Your account is authenticated, but no Vintage Accounts role has been assigned.</p>
          <button onClick={handleLogout} style={{ ...btnStyle, backgroundColor: '#ef4444' }}>🚪 Log Out</button>
        </div>
      </div>
    );
  }

  if (role === 'cashier') {
    const cashierCashSaleAmount = Number(cashierCashSale || 0);
    const cashierCreditGiven = cashierCreditSales.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const cashierCreditPaid = cashierCreditReceived.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const cashierCashPayments = cashierCreditReceived
      .filter(item => (item.method || 'Cash') === 'Cash')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const cashierOnlineExpenseTotal = cashierOnlineExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const cashierCashExpenseTotal = cashierCashExpenses
      .filter(item => !item.type || item.type === 'Cash')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const cashierStaffCashTotal = cashierStaffPayments
      .filter(item => (item.method || 'Cash') === 'Cash')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const cashierStaffOnlineTotal = cashierStaffPayments
      .filter(item => item.method === 'Online')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const cashierStaffTotal = cashierStaffPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const cashierExpectedDailyCash = cashierCashSaleAmount + cashierCashPayments - cashierCashExpenseTotal - cashierStaffCashTotal;
    const cashierCashDifference = Number(cashierActualCash || 0) - cashierExpectedDailyCash;

    const cashierLedger = (() => {
      const balances = {};
      cashierEntries.forEach(log => {
        [
          ...(log.credit_sales || []).map(x => ({ ...x, kind: 'given' })),
          ...(log.credit_received || []).map(x => ({ ...x, kind: 'received' }))
        ].forEach(item => {
          const key = item.name?.trim().toUpperCase();
          if (!key) return;
          if (!balances[key]) balances[key] = { name: item.name.trim(), given: 0, received: 0 };
          if (item.kind === 'given') balances[key].given += Number(item.amount || 0);
          else balances[key].received += Number(item.amount || 0);
        });
      });
      return Object.values(balances)
        .map(x => ({ ...x, balance: x.given - x.received }))
        .filter(x => x.balance !== 0)
        .sort((a, b) => b.balance - a.balance);
    })();

    const cashierSaveAttendanceStatus = async (name, status) => {
      if (!status) return;
      const row = attendanceLogs.find(r => r.employee_name === name);
      if (row) {
        await updateAttendance(row.id, { status });
      } else {
        const { error } = await supabase.from('employee_attendance').insert({
          employee_name: name,
          attendance_date: cashierAttendanceDate,
          status
        });
        if (error) alert('Attendance save failed: ' + error.message);
        else await loadAttendance(cashierAttendanceDate);
      }
    };

    const saveCashierActualCash = (value) => {
      setCashierActualCash(value);
      localStorage.setItem('vintage_cashier_actual_cash_' + cashierDate, String(Number(value || 0)));
    };

    const cashierFormat = value => Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

    return (
      <div style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: '24px 16px', maxWidth: '1180px', margin: '0 auto', background: 'linear-gradient(180deg,#f8fafc 0%,#eef2ff 100%)', minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', background: 'rgba(255,255,255,.96)', padding: '18px 20px', borderRadius: '18px', border: '1px solid rgba(148,163,184,.18)', boxShadow: '0 12px 35px rgba(15,23,42,.08)', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ color: '#111827', margin: 0 }}>Vintage Restaurant</h1>
            <div style={{ color: '#2563eb', fontSize: '14px', fontWeight: '800', marginTop: '4px' }}>🧾 CASHIER PORTAL</div>
            <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '3px' }}>Daily sales • Customer credit • Cash expenses • Attendance</div>
          </div>
          <button onClick={handleLogout} style={{ ...btnStyle, backgroundColor: '#ef4444' }}>🚪 Log Out</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '8px', marginBottom: '16px' }}>
          {[
            ['sales', '🧾 Sales', '#2563eb'],
            ['khata', '📒 Khata', '#db2777'],
            ['expenses', '💸 Expenses', '#dc2626'],
            ['attendance', '👥 Attendance', '#0284c7']
          ].map(([tab, label, color]) => (
            <button
              key={tab}
              onClick={() => setCashierActiveTab(tab)}
              style={{ ...tabStyle, backgroundColor: cashierActiveTab === tab ? color : 'white', color: cashierActiveTab === tab ? 'white' : '#111827', border: cashierActiveTab === tab ? 'none' : '1px solid #d1d5db', minWidth: '0' }}
            >
              {label}
            </button>
          ))}
        </div>

        {cashierActiveTab === 'sales' && (
          <>
            <div style={{ ...cardStyle, borderTop: '4px solid #2563eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'end', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ margin: 0 }}>🧾 Daily Sales</h2>
                  <p style={{ color: '#6b7280', marginBottom: 0 }}>Enter the total cash sale for the day and manage credit transactions.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'end', flexWrap: 'wrap' }}>
                  <label style={{ minWidth: '190px' }}>Business Date<input type="date" value={cashierDate} onChange={e => setCashierDate(e.target.value)} style={inputStyle}/></label>
                  <button onClick={() => loadCashierDateEntry(cashierDate)} style={{ ...btnStyle, backgroundColor: '#2563eb' }}>📥 Fetch Data</button>
                </div>
              </div>

              <div style={{ marginTop: '18px', padding: '18px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                <label style={{ display: 'block', fontWeight: '800', color: '#1d4ed8' }}>
                  💵 Total Cash Sales
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={cashierCashSale}
                    onChange={e => setCashierCashSale(e.target.value)}
                    style={{ ...inputStyle, marginTop: '8px', fontSize: '24px', fontWeight: '800' }}
                  />
                </label>
                <p style={{ marginBottom: 0, color: '#6b7280', fontSize: '13px' }}>This is the total cash collected from today's sales before subtracting cash expenses.</p>
              </div>
            </div>

            <div style={{ ...cardStyle, borderTop: '4px solid #e11d48' }}>
              <h3 style={{ color: '#be123c', marginTop: 0 }}>🔴 Credit Sales — Pay Later</h3>
              <p style={{ color: '#6b7280' }}>Record every customer/app credit sale so the outstanding Khata stays accurate.</p>
              {cashierCreditSales.map(c => (
                <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 160px auto', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                  <input placeholder="Customer / App Name" value={c.name || ''} onChange={e => updateArrItem(setCashierCreditSales, cashierCreditSales, c.id, 'name', e.target.value)} style={inputStyle}/>
                  <input type="number" min="0" step="0.01" placeholder="Amount ₹" value={c.amount ?? ''} onChange={e => updateArrItem(setCashierCreditSales, cashierCreditSales, c.id, 'amount', e.target.value)} style={inputStyle}/>
                  <button onClick={() => removeArrItem(setCashierCreditSales, cashierCreditSales, c.id)} style={{ ...btnStyle, backgroundColor: '#ef4444' }}>✕</button>
                </div>
              ))}
              <button onClick={addCashierCreditSale} style={{ ...btnStyle, backgroundColor: '#e11d48' }}>+ Add Credit Sale</button>
              <div style={{ marginTop: '12px', fontWeight: '800', color: '#be123c' }}>Credit Given Today: ₹{cashierFormat(cashierCreditGiven)}</div>
            </div>

            <div style={{ ...cardStyle, borderTop: '4px solid #10b981' }}>
              <h3 style={{ color: '#059669', marginTop: 0 }}>🟢 Credit Payments Received</h3>
              <p style={{ color: '#6b7280' }}>Record payments from customers who previously bought on credit.</p>
              {cashierCreditReceived.map(c => (
                <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 150px 140px auto', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                  <input placeholder="Customer Name" value={c.name || ''} onChange={e => updateArrItem(setCashierCreditReceived, cashierCreditReceived, c.id, 'name', e.target.value)} style={inputStyle}/>
                  <input type="number" min="0" step="0.01" placeholder="Amount ₹" value={c.amount ?? ''} onChange={e => updateArrItem(setCashierCreditReceived, cashierCreditReceived, c.id, 'amount', e.target.value)} style={inputStyle}/>
                  <select value={c.method || 'Cash'} onChange={e => updateArrItem(setCashierCreditReceived, cashierCreditReceived, c.id, 'method', e.target.value)} style={inputStyle}>
                    <option value="Cash">Cash</option>
                    <option value="Online">Online</option>
                  </select>
                  <button onClick={() => removeArrItem(setCashierCreditReceived, cashierCreditReceived, c.id)} style={{ ...btnStyle, backgroundColor: '#ef4444' }}>✕</button>
                </div>
              ))}
              <button onClick={addCashierCreditReceived} style={{ ...btnStyle, backgroundColor: '#059669' }}>+ Record Payment</button>
              <div style={{ marginTop: '12px', fontWeight: '800', color: '#059669' }}>Payments Received Today: ₹{cashierFormat(cashierCreditPaid)}</div>
            </div>

            <div style={{ ...cardStyle, background: '#111827', color: 'white' }}>
              <h3 style={{ marginTop: 0 }}>🔐 Daily Cash Closing</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '12px' }}>
                <div><div style={{ color: '#9ca3af', fontSize: '13px' }}>Cash Sales</div><strong style={{ fontSize: '22px' }}>₹{cashierFormat(cashierCashSaleAmount)}</strong></div>
                <div><div style={{ color: '#9ca3af', fontSize: '13px' }}>Cash Credit Payments</div><strong style={{ fontSize: '22px' }}>₹{cashierFormat(cashierCashPayments)}</strong></div>
                <div><div style={{ color: '#9ca3af', fontSize: '13px' }}>Cash Expenses</div><strong style={{ fontSize: '22px' }}>₹{cashierFormat(cashierCashExpenseTotal)}</strong></div>
                <div><div style={{ color: '#9ca3af', fontSize: '13px' }}>Expected Daily Cash Movement</div><strong style={{ fontSize: '22px', color: '#86efac' }}>₹{cashierFormat(cashierExpectedDailyCash)}</strong></div>
              </div>

              <div style={{ marginTop: '18px', padding: '15px', background: '#374151', borderRadius: '10px' }}>
                <label style={{ display: 'block', fontWeight: '800' }}>
                  🪙 Actual Cash Counted
                  <input type="number" min="0" step="0.01" inputMode="decimal" value={cashierActualCash || ''} onChange={e => saveCashierActualCash(e.target.value)} placeholder="Enter physical cash counted" style={{ ...inputStyle, marginTop: '8px', fontSize: '22px' }}/>
                </label>
                <div style={{ marginTop: '12px', fontSize: '18px', fontWeight: '800', color: cashierCashDifference === 0 ? '#86efac' : cashierCashDifference > 0 ? '#60a5fa' : '#fca5a5' }}>
                  {Number(cashierActualCash || 0) === 0 ? 'Enter the physical cash count to check the difference.' :
                    cashierCashDifference === 0 ? '🟢 Cash matches the daily movement.' :
                    cashierCashDifference > 0 ? `🔵 Extra cash: ₹${cashierFormat(cashierCashDifference)}` :
                    `🔴 Cash short: ₹${cashierFormat(Math.abs(cashierCashDifference))}`}
                </div>
              </div>

              {cashierMessage && <p style={{ marginBottom: 0, fontWeight: '800' }}>{cashierMessage}</p>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
                <button onClick={clearCashierForm} style={{ ...btnStyle, backgroundColor: '#6b7280', flex: 1 }}>↺ Clear Form</button>
                <button onClick={saveCashierEntry} disabled={cashierSaving} style={{ ...btnStyle, backgroundColor: cashierSaving ? '#9ca3af' : '#10b981', flex: 2, fontSize: '17px' }}>
                  {cashierSaving ? '⏳ Saving...' : '💾 Save Daily Cash & Credit'}
                </button>
              </div>
            </div>
          </>
        )}

        {cashierActiveTab === 'expenses' && (
          <div>
            <div style={{ ...cardStyle, borderTop: '4px solid #dc2626' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ marginTop: 0, color: '#b91c1c', marginBottom: '4px' }}>💸 Daily Expenses & Staff Payments</h2>
                  <p style={{ color: '#6b7280', margin: 0 }}>Record online expenses, cash expenses, and staff payments for this business date.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'end', flexWrap: 'wrap' }}>
                  <label style={{ minWidth: '190px' }}>Date<input type="date" value={cashierDate} onChange={e => setCashierDate(e.target.value)} style={inputStyle}/></label>
                  <button onClick={() => loadCashierDateEntry(cashierDate)} style={{ ...btnStyle, backgroundColor: '#2563eb' }}>📥 Fetch Data</button>
                </div>
              </div>

              <div style={{ marginTop: '18px', padding: '16px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                <h3 style={{ color: '#1d4ed8', marginTop: 0 }}>💳 Online Expenses</h3>
                {cashierOnlineExpenses.map(exp => (
                  <div key={exp.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 150px auto', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                    <input list="common-expenses" placeholder="Category" value={exp.category || ''} onChange={e => updateArrItem(setCashierOnlineExpenses, cashierOnlineExpenses, exp.id, 'category', e.target.value)} style={inputStyle}/>
                    <input placeholder="Description" value={exp.description || ''} onChange={e => updateArrItem(setCashierOnlineExpenses, cashierOnlineExpenses, exp.id, 'description', e.target.value)} style={inputStyle}/>
                    <input type="number" min="0" step="0.01" placeholder="Amount ₹" value={exp.amount ?? ''} onChange={e => updateArrItem(setCashierOnlineExpenses, cashierOnlineExpenses, exp.id, 'amount', e.target.value)} style={inputStyle}/>
                    <button onClick={() => removeArrItem(setCashierOnlineExpenses, cashierOnlineExpenses, exp.id)} style={{ ...btnStyle, backgroundColor: '#ef4444' }}>✕</button>
                  </div>
                ))}
                <button onClick={() => addArrItem(setCashierOnlineExpenses, cashierOnlineExpenses, { category: '', description: '', amount: 0 })} style={{ ...btnStyle, backgroundColor: '#2563eb' }}>+ Add Online Expense</button>
                <strong style={{ display: 'block', marginTop: '12px', color: '#1d4ed8' }}>Online Expenses Total: ₹{cashierFormat(cashierOnlineExpenseTotal)}</strong>
              </div>

              <div style={{ marginTop: '18px', padding: '16px', background: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca' }}>
                <h3 style={{ color: '#b91c1c', marginTop: 0 }}>💵 Cash Expenses</h3>
                {cashierCashExpenses.map(exp => (
                  <div key={exp.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 150px auto', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                    <input list="common-expenses" placeholder="Category" value={exp.category || ''} onChange={e => updateArrItem(setCashierCashExpenses, cashierCashExpenses, exp.id, 'category', e.target.value)} style={inputStyle}/>
                    <input placeholder="Description" value={exp.description || ''} onChange={e => updateArrItem(setCashierCashExpenses, cashierCashExpenses, exp.id, 'description', e.target.value)} style={inputStyle}/>
                    <input type="number" min="0" step="0.01" placeholder="Amount ₹" value={exp.amount ?? ''} onChange={e => updateArrItem(setCashierCashExpenses, cashierCashExpenses, exp.id, 'amount', e.target.value)} style={inputStyle}/>
                    <button onClick={() => removeArrItem(setCashierCashExpenses, cashierCashExpenses, exp.id)} style={{ ...btnStyle, backgroundColor: '#ef4444' }}>✕</button>
                  </div>
                ))}
                <button onClick={() => addArrItem(setCashierCashExpenses, cashierCashExpenses, { category: '', description: '', amount: 0, type: 'Cash' })} style={{ ...btnStyle, backgroundColor: '#dc2626' }}>+ Add Cash Expense</button>
                <strong style={{ display: 'block', marginTop: '12px', color: '#b91c1c' }}>Cash Expenses Total: ₹{cashierFormat(cashierCashExpenseTotal)}</strong>
              </div>

              <div style={{ marginTop: '18px', padding: '16px', background: '#f5f3ff', borderRadius: '10px', border: '1px solid #ddd6fe' }}>
                <h3 style={{ color: '#6d28d9', marginTop: 0 }}>👨‍🍳 Staff Payments</h3>
                {cashierStaffPayments.map(payment => (
                  <div key={payment.id} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 140px 140px auto', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                    <select value={payment.name || ''} onChange={e => updateArrItem(setCashierStaffPayments, cashierStaffPayments, payment.id, 'name', e.target.value)} style={inputStyle}>
                      <option value="">Select Staff</option>
                      {employeeNames.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                    <select value={payment.type || 'Full Wage'} onChange={e => updateArrItem(setCashierStaffPayments, cashierStaffPayments, payment.id, 'type', e.target.value)} style={inputStyle}>
                      <option value="Full Wage">Full Wage</option>
                      <option value="Cash Advance">Cash Advance</option>
                    </select>
                    <input type="month" value={payment.dueFor || cashierDate.slice(0,7)} onChange={e => updateArrItem(setCashierStaffPayments, cashierStaffPayments, payment.id, 'dueFor', e.target.value)} title="Salary / dues month" style={inputStyle}/>
                    <input type="number" min="0" step="0.01" placeholder="Amount ₹" value={payment.amount ?? ''} onChange={e => updateArrItem(setCashierStaffPayments, cashierStaffPayments, payment.id, 'amount', e.target.value)} style={inputStyle}/>
                    <select value={payment.method || 'Cash'} onChange={e => updateArrItem(setCashierStaffPayments, cashierStaffPayments, payment.id, 'method', e.target.value)} style={inputStyle}>
                      <option value="Cash">Cash</option>
                      <option value="Online">Online</option>
                    </select>
                    <button onClick={() => removeArrItem(setCashierStaffPayments, cashierStaffPayments, payment.id)} style={{ ...btnStyle, backgroundColor: '#ef4444' }}>✕</button>
                  </div>
                ))}
                <button onClick={() => addArrItem(setCashierStaffPayments, cashierStaffPayments, { name: '', amount: 0, type: 'Full Wage', method: 'Cash', dueFor: cashierDate.slice(0,7) })} style={{ ...btnStyle, backgroundColor: '#7c3aed' }}>+ Add Staff Payment</button>
                <strong style={{ display: 'block', marginTop: '12px', color: '#6d28d9' }}>Staff Payments Total: ₹{cashierFormat(cashierStaffTotal)}</strong>
              </div>
            </div>

            <div style={{ ...cardStyle, background: '#111827', color: 'white' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '12px' }}>
                <div><div style={{ color: '#9ca3af' }}>Online Expenses</div><strong style={{ fontSize: '20px' }}>₹{cashierFormat(cashierOnlineExpenseTotal + cashierStaffOnlineTotal)}</strong></div>
                <div><div style={{ color: '#9ca3af' }}>Cash Expenses + Staff</div><strong style={{ fontSize: '20px' }}>₹{cashierFormat(cashierCashExpenseTotal + cashierStaffCashTotal)}</strong></div>
                <div><div style={{ color: '#9ca3af' }}>All Staff Payments</div><strong style={{ fontSize: '20px' }}>₹{cashierFormat(cashierStaffTotal)}</strong></div>
              </div>
              {cashierMessage && <p>{cashierMessage}</p>}
              <button onClick={saveCashierEntry} disabled={cashierSaving} style={{ ...btnStyle, backgroundColor: '#10b981', marginTop: '14px', width: '100%' }}>
                {cashierSaving ? '⏳ Saving...' : '💾 Save Expenses & Staff Payments'}
              </button>
            </div>
          </div>
        )}

        {cashierActiveTab === 'khata' && (
          <div style={{ ...cardStyle, borderTop: '4px solid #db2777' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ color: '#be185d', marginTop: 0, marginBottom: '4px' }}>📒 Customer Khata</h2>
                <p style={{ color: '#6b7280', margin: 0 }}>All outstanding customer credit is calculated from the central accounting ledger.</p>
              </div>
              <button onClick={loadCashierOwnEntries} disabled={isLoadingCashierEntries} style={{ ...btnStyle, backgroundColor: '#db2777' }}>
                {isLoadingCashierEntries ? '⏳ Fetching...' : '📥 Fetch Khata'}
              </button>
            </div>

            {cashierLedger.length === 0 ? <p style={{ marginTop: '20px' }}>No outstanding customer balances.</p> : (
              <div style={{ overflowX: 'auto', marginTop: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '650px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #fbcfe8', background: '#fdf2f8' }}>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Customer / App</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Credit Given</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Paid Back</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Balance Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashierLedger.map(row => (
                      <tr key={row.name} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{row.name}</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#e11d48' }}>₹{cashierFormat(row.given)}</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#059669' }}>₹{cashierFormat(row.received)}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: row.balance > 0 ? '#e11d48' : '#059669' }}>₹{cashierFormat(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {cashierActiveTab === 'attendance' && (
          <div>
            <div style={{ ...cardStyle, borderTop: '4px solid #0284c7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ color: '#0369a1', marginTop: 0, marginBottom: '4px' }}>👥 Employee Attendance</h2>
                  <p style={{ color: '#6b7280', margin: 0 }}>Mark daily attendance. Employee phone check-in/check-out remains available.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'end', flexWrap: 'wrap' }}>
                  <label style={{ minWidth: '190px' }}>Date<input type="date" value={cashierAttendanceDate} onChange={e => setCashierAttendanceDate(e.target.value)} style={inputStyle}/></label>
                  <button onClick={() => loadAttendance(cashierAttendanceDate)} disabled={isLoadingAttendance} style={{ ...btnStyle, backgroundColor: '#0284c7' }}>
                    {isLoadingAttendance ? '⏳ Fetching...' : '📥 Fetch Data'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                {Object.entries(attendanceSummary).map(([status, count]) => (
                  <div key={status} style={{ padding: '8px 12px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                    <strong>{status}:</strong> {count}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...cardStyle, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f8fafc' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Employee</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Check In</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Check Out</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Manual Clock</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Hours</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Manual Clock</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeNames.map(name => {
                    const row = attendanceLogs.find(r => r.employee_name === name);
                    return (
                      <tr key={name} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{name}</td>
                        <td style={{ padding: '10px' }}>
                          <select value={row?.status || ''} onChange={e => cashierSaveAttendanceStatus(name, e.target.value)} style={{ ...inputStyle, minWidth: '140px' }}>
                            <option value="">Not Marked</option>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Half Day">Half Day</option>
                            <option value="Leave">Leave</option>
                            <option value="Weekly Off">Weekly Off</option>
                          </select>
                        </td>
                        <td style={{ padding: '10px' }}>{row?.check_in ? new Date(row.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        <td style={{ padding: '10px' }}>{row?.check_out ? new Date(row.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        <td style={{ padding: '10px' }}>{row ? attendanceHours(row) : '—'}</td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button onClick={() => manualAttendanceAction(name, 'check_in')} disabled={Boolean(row?.check_in)} style={{ ...btnStyle, backgroundColor: row?.check_in ? '#cbd5e1' : '#16a34a', padding: '7px 9px' }}>🟢 Check In</button>
                            <button onClick={() => manualAttendanceAction(name, 'check_out')} disabled={!row?.check_in || Boolean(row?.check_out)} style={{ ...btnStyle, backgroundColor: !row?.check_in || row?.check_out ? '#cbd5e1' : '#dc2626', padding: '7px 9px' }}>🔴 Check Out</button>
                          </div>
                        </td>
                        <td style={{ padding: '10px' }}>
                          
                        </td>
                        <td style={{ padding: '10px' }}>
                          <button onClick={async () => {
                            const note = window.prompt('Attendance note (optional):', row?.notes || '');
                            if (note === null) return;
                            if (row) await updateAttendance(row.id, { notes: note });
                            else {
                              const { error } = await supabase.from('employee_attendance').insert({
                                employee_name: name,
                                attendance_date: cashierAttendanceDate,
                                status: 'Present',
                                notes: note
                              });
                              if (error) alert('Attendance save failed: ' + error.message);
                              else await loadAttendance(cashierAttendanceDate);
                            }
                          }} style={{ ...btnStyle, backgroundColor: '#64748b', padding: '7px 10px' }}>📝 Note</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- MAIN APP UI ---
  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #f5f7fb; }
        .va-shell { min-height: 100vh; display: flex; background: #f5f7fb; color: #172033; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        .va-sidebar { width: 245px; min-width: 245px; background: #111827; color: white; padding: 22px 14px; position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; }
        .va-brand { display:flex; align-items:center; gap:11px; padding: 8px 10px 24px; border-bottom:1px solid rgba(255,255,255,.1); margin-bottom:18px; }
        .va-brand img { width:40px; height:40px; border-radius:10px; background:white; padding:5px; }
        .va-brand-title { font-size:18px; font-weight:900; line-height:1.1; }
        .va-brand-sub { font-size:10px; color:#9ca3af; margin-top:4px; letter-spacing:.08em; text-transform:uppercase; }
        .va-nav { display:flex; flex-direction:column; gap:6px; }
        .va-nav button { width:100%; text-align:left; border:0; background:transparent; color:#cbd5e1; padding:12px 13px; border-radius:10px; cursor:pointer; font-weight:700; font-size:14px; transition:.18s; }
        .va-nav button:hover { background:#1f2937; color:white; }
        .va-nav button.active { background:#2563eb; color:white; box-shadow:0 7px 18px rgba(37,99,235,.28); }
        .va-logout { margin-top:auto; width:100%; border:0; border-radius:10px; padding:11px; background:#1f2937; color:#fca5a5; cursor:pointer; font-weight:800; }
        .va-main { flex:1; min-width:0; padding:24px; }
        .va-topbar { display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:20px; }
        .va-page-title { margin:0; font-size:25px; font-weight:900; color:#111827; }
        .va-page-subtitle { margin:5px 0 0; color:#64748b; font-size:13px; }
        .va-status { display:flex; align-items:center; gap:8px; background:white; border:1px solid #e5e7eb; padding:9px 12px; border-radius:10px; font-size:12px; color:#475569; box-shadow:0 4px 14px rgba(15,23,42,.04); }
        .va-dot { width:8px; height:8px; border-radius:50%; background:#22c55e; }
        .va-mobile-nav { display:none; }
        @media (max-width: 850px) {
          .va-shell { display:block; }
          .va-sidebar { width:100%; min-width:0; height:auto; position:relative; padding:12px; }
          .va-brand { padding:5px 8px 12px; margin-bottom:10px; }
          .va-nav { display:grid; grid-template-columns:repeat(4,1fr); }
          .va-nav button { text-align:center; padding:9px 5px; font-size:12px; }
          .va-logout { margin-top:10px; }
          .va-main { padding:14px; }
          .va-topbar { align-items:flex-start; }
          .va-page-title { font-size:21px; }
        }
        @media (max-width: 520px) {
          .va-nav { grid-template-columns:repeat(2,1fr); }
          .va-status { display:none; }
          .va-main { padding:10px; }
        }
      `}</style>
      <div className="va-shell">
        <aside className="va-sidebar">
          <div className="va-brand">
            <img src="https://cdn-icons-png.flaticon.com/512/3170/3170733.png" alt="Vintage Accounts"/>
            <div>
              <div className="va-brand-title">Vintage Accounts</div>
              <div className="va-brand-sub">Restaurant Finance</div>
            </div>
          </div>
          <div className="va-nav">
            {[
              ['daily','📝','Daily Entry'],
              ['ledger','📒','Customer Khata'],
              ['history','📋','History'],
              ['analytics','📈','Analytics'],
              ['attendance','👥','Attendance'],
              ['payroll','💰','Employee Payroll'],
              ['tasks','🔔','Reminders']
            ].map(([tab,icon,label]) => (
              <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
                {icon} &nbsp;{label}
              </button>
            ))}
          </div>
          <button className="va-logout" onClick={handleLogout}>🚪 Log Out</button>
        </aside>

        <main className="va-main">
          <div className="va-topbar">
            <div>
              <h1 className="va-page-title">
                {activeTab === 'daily' ? 'Daily Accounting' :
                 activeTab === 'ledger' ? 'Customer Khata' :
                 activeTab === 'history' ? 'Transaction History' :
                 activeTab === 'analytics' ? 'Business Analytics' :
                 activeTab === 'attendance' ? 'Employee Attendance' :
                 activeTab === 'payroll' ? 'Employee Payroll' : 'Reminders'}
              </h1>
              <p className="va-page-subtitle">Vintage Restaurant • Manage sales, cash, expenses and staff in one place</p>
            </div>
            <div className="va-status"><span className="va-dot"></span> System Online</div>
          </div>

      {activeTab === 'daily' && (
        <>
          <datalist id="common-expenses">
            {dynamicCategories.map((cat, i) => <option key={i} value={cat} />)}
          </datalist>

          <div className="va-daily-toolbar">
            <div className="va-date-card">
              <div>
                <span className="va-eyebrow">Accounting date</span>
                <h3>📅 {dateSelection}</h3>
                <p>{date === dateSelection ? 'Ready to edit today’s accounts.' : 'Select Fetch to load this date.'}</p>
              </div>
              <div className="va-date-actions">
                <input type="date" value={dateSelection} onChange={e => setDateSelection(e.target.value)} style={inputStyle}/>
                <button onClick={() => handleFetchData(dateSelection, true)} disabled={isFetching} style={{...btnStyle, backgroundColor: isFetching ? '#94a3b8' : '#2563eb'}}>
                  {isFetching ? '⏳ Fetching...' : '📥 Fetch'}
                </button>
              </div>
            </div>
            <div className="va-yesterday-card">
              <span className="va-eyebrow">Opening balances</span>
              <div className="va-opening-grid">
                <label>Cash<input type="number" value={yesterdayCash} onChange={e => setYesterdayCash(Number(e.target.value))} style={inputStyle}/></label>
                <label>Online<input type="number" value={yesterdayOnline} onChange={e => setYesterdayOnline(Number(e.target.value))} style={inputStyle}/></label>
                <label>Available Cash<input type="number" value={yesterdayAvailableCash} onChange={e => setYesterdayAvailableCash(Number(e.target.value))} style={inputStyle}/></label>
              </div>
            </div>
          </div>

          <div className="va-kpi-grid">
            <div className="va-kpi va-kpi-sales"><span>Today Sales</span><strong>{formatINR(trueGrossSale)}</strong><small>Cash + online + credit</small></div>
            <div className="va-kpi va-kpi-cash"><span>Cash In Hand</span><strong>{formatINR(totalCashInHand)}</strong><small>Expected physical cash</small></div>
            <div className="va-kpi va-kpi-online"><span>Online Balance</span><strong>{formatINR(totalOnlineBalance)}</strong><small>Online funds after payments</small></div>
            <div className="va-kpi va-kpi-expense"><span>Total Expenses</span><strong>{formatINR(totalOperatingExpenses)}</strong><small>Operating + staff costs</small></div>
            <div className="va-kpi va-kpi-available"><span>Available Cash</span><strong>{formatINR(availableCashBalance)}</strong><small>After available-cash expenses</small></div>
            <div className="va-kpi va-kpi-profit"><span>Est. Profit</span><strong>{formatINR(estimatedProfit)}</strong><small>Daily estimate</small></div>
          </div>

          <div className="va-sales-panel">
            <div className="va-section-heading">
              <div><span className="va-eyebrow">Step 1</span><h3>💰 Record Today’s Sales</h3><p>Enter the final amounts received by payment channel.</p></div>
              <div className="va-mini-total">Gross {formatINR(trueGrossSale)}</div>
            </div>
            <div className="va-sales-grid">
              <label>Cash — Net Box<input type="number" value={cashSale} onChange={e => setCashSale(Number(e.target.value))} style={inputStyle}/>{totalCounterExpenses > 0 && <small>True gross: {formatINR(grossCashSale)}</small>}</label>
              <label>Online<input type="number" value={onlineSale} onChange={e => setOnlineSale(Number(e.target.value))} style={inputStyle}/></label>
              <label>Parcel Counter — Cash<input type="number" value={parcelCounterCash} onChange={e => setParcelCounterCash(Number(e.target.value))} style={inputStyle}/></label>
              <label>Parcel Counter — Online<input type="number" value={parcelCounterOnline} onChange={e => setParcelCounterOnline(Number(e.target.value))} style={inputStyle}/></label>
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

          <div className="va-credit-grid">
            <div className="va-entry-card va-credit-card">
              <div className="va-entry-head"><div><span className="va-eyebrow">Receivables</span><h3>🔴 Give Credit</h3><p>Sale today, customer pays later.</p></div><span className="va-entry-total">{formatINR(totalCreditSales)}</span></div>
              {creditSales.map(c => (
                <div key={c.id} className="va-line-item">
                  <input placeholder="Customer / App" value={c.name} onChange={e => updateArrItem(setCreditSales, creditSales, c.id, 'name', e.target.value)} style={inputStyle}/>
                  <input type="number" placeholder="Amount ₹" value={c.amount} onChange={e => updateArrItem(setCreditSales, creditSales, c.id, 'amount', e.target.value)} style={inputStyle}/>
                  <button onClick={() => removeArrItem(setCreditSales, creditSales, c.id)} className="va-icon-delete">✕</button>
                </div>
              ))}
              <button onClick={addCreditSale} style={{...btnStyle, backgroundColor:'#e11d48'}}>+ Add Credit Sale</button>
            </div>
            <div className="va-entry-card va-receive-card">
              <div className="va-entry-head"><div><span className="va-eyebrow">Collections</span><h3>🟢 Receive Credit</h3><p>Record payments from existing credit customers.</p></div><span className="va-entry-total">{formatINR(totalCreditReceived)}</span></div>
              {creditReceived.map(c => (
                <div key={c.id} className="va-line-item va-receive-line">
                  <input placeholder="Customer" value={c.name} onChange={e => updateArrItem(setCreditReceived, creditReceived, c.id, 'name', e.target.value)} style={inputStyle}/>
                  <input type="number" placeholder="Amount ₹" value={c.amount} onChange={e => updateArrItem(setCreditReceived, creditReceived, c.id, 'amount', e.target.value)} style={inputStyle}/>
                  <select value={c.method} onChange={e => updateArrItem(setCreditReceived, creditReceived, c.id, 'method', e.target.value)} style={inputStyle}><option>Cash</option><option>Online</option></select>
                  <button onClick={() => removeArrItem(setCreditReceived, creditReceived, c.id)} className="va-icon-delete">✕</button>
                </div>
              ))}
              <button onClick={addCreditReceived} style={{...btnStyle, backgroundColor:'#059669'}}>+ Settle Payment</button>
            </div>
          </div>

          <div className="va-expense-grid">
            <div className="va-entry-card va-online-card">
              <div className="va-entry-head"><div><span className="va-eyebrow">Payments</span><h3>💳 Online Expenses</h3><p>Expenses paid from online balances.</p></div><span className="va-entry-total">{formatINR(totalOnlineExpenses)}</span></div>
              {onlineExpenses.map(exp => (
                <div key={exp.id} className="va-expense-row">
                  <input list="common-expenses" placeholder="Category" value={exp.category} onChange={e => updateArrItem(setOnlineExpenses, onlineExpenses, exp.id, 'category', e.target.value)} style={inputStyle}/>
                  <input placeholder="Details" value={exp.description} onChange={e => updateArrItem(setOnlineExpenses, onlineExpenses, exp.id, 'description', e.target.value)} style={inputStyle}/>
                  <input type="number" placeholder="Amount ₹" value={exp.amount} onChange={e => updateArrItem(setOnlineExpenses, onlineExpenses, exp.id, 'amount', e.target.value)} style={inputStyle}/>
                  <button onClick={() => removeArrItem(setOnlineExpenses, onlineExpenses, exp.id)} className="va-icon-delete">✕</button>
                </div>
              ))}
              <button onClick={addOnlineExpense} style={btnStyle}>+ Add Online Expense</button>
            </div>

            <div className="va-entry-card va-cash-card">
              <div className="va-entry-head"><div><span className="va-eyebrow">Payments</span><h3>💵 Offline & Owner Expenses</h3><p>Choose exactly where the money is deducted from.</p></div><span className="va-entry-total">{formatINR(totalCashExpenses)}</span></div>
              <div className="va-helper"><strong>💡 Available Cash</strong> reduces Available Cash, not the Net Sale/Till.</div>
              {cashExpenses.map(exp => (
                <div key={exp.id} className="va-expense-row va-cash-expense-row">
                  <input list="common-expenses" placeholder="Category" value={exp.category} onChange={e => updateArrItem(setCashExpenses, cashExpenses, exp.id, 'category', e.target.value)} style={inputStyle}/>
                  <input placeholder="Details" value={exp.description} onChange={e => updateArrItem(setCashExpenses, cashExpenses, exp.id, 'description', e.target.value)} style={inputStyle}/>
                  <input type="number" placeholder="Amount ₹" value={exp.amount} onChange={e => updateArrItem(setCashExpenses, cashExpenses, exp.id, 'amount', e.target.value)} style={inputStyle}/>
                  <select value={exp.type || 'Cash'} onChange={e => updateArrItem(setCashExpenses, cashExpenses, exp.id, 'type', e.target.value)} style={inputStyle}>
                    <option value="Cash">💰 Cash — Till</option>
                    <option value="Available Cash">💵 Cash — Available Cash</option>
                    <option value="Counter">Counter — Net Sale</option>
                    <option value="Credit">Credit — Owe Later</option>
                    <option value="Teja">Teja Paid</option>
                    <option value="Anil">Anil Paid</option>
                  </select>
                  <button onClick={() => removeArrItem(setCashExpenses, cashExpenses, exp.id)} className="va-icon-delete">✕</button>
                </div>
              ))}
              <button onClick={addCashExpense} style={btnStyle}>+ Add Offline Expense</button>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{color: '#8b5cf6'}}>👨‍🍳 Staff Wages & Advances</h3>
            <p style={{ color: '#6b7280', marginTop: 0 }}>“Salary / Dues For” is the month this payment belongs to. Example: if you pay September salary on October 5, select <strong>September</strong>.</p>
            {staffPayments.map(s => (
              <div key={s.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <select value={s.name || ''} onChange={e => updateArrItem(setStaffPayments, staffPayments, s.id, 'name', e.target.value)} style={{...inputStyle, flex: 1}}>
                  <option value="">Staff Name</option>
                  {employeeNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
                <select value={s.type} onChange={e => updateArrItem(setStaffPayments, staffPayments, s.id, 'type', e.target.value)} style={{...inputStyle, flex: 1}}><option>Full Wage</option><option>Cash Advance</option></select>
                <input type="month" value={s.dueFor || date?.slice(0, 7) || new Date().toISOString().slice(0, 7)} onChange={e => updateArrItem(setStaffPayments, staffPayments, s.id, 'dueFor', e.target.value)} title="Salary / dues this payment belongs to" style={{...inputStyle, flex: 1}}/>
                <input type="number" inputMode="decimal" min="0" step="0.01" placeholder="Amount (₹)" value={s.amount ?? ''} onChange={e => updateArrItem(setStaffPayments, staffPayments, s.id, 'amount', e.target.value)} style={{...inputStyle, flex: 1}}/>
                <select value={s.method} onChange={e => updateArrItem(setStaffPayments, staffPayments, s.id, 'method', e.target.value)} style={{...inputStyle, flex: 1}}>
                  <option value="Cash">Cash (Deduct from Till)</option>
                  <option value="Available Cash">Cash – Available Cash (Deduct from Available Cash)</option>
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
            <div style={{ marginTop: '18px', padding: '16px', borderRadius: '14px', background: attendanceLocationRequired ? 'linear-gradient(135deg,#fff7ed,#ffedd5)' : 'linear-gradient(135deg,#ecfdf5,#d1fae5)', border: `1px solid ${attendanceLocationRequired ? '#fed7aa' : '#a7f3d0'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div><strong>{attendanceLocationRequired ? '📍 Location verification ON' : '🟢 Location verification OFF'}</strong><div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>{attendanceLocationRequired ? 'Employees must be within the workplace geofence.' : 'Employees can check in/out without GPS.'}</div></div>
                <button onClick={() => setAttendanceLocation(!attendanceLocationRequired)} style={{ ...btnStyle, backgroundColor: attendanceLocationRequired ? '#dc2626' : '#059669' }}>{attendanceLocationRequired ? 'Turn Location Off' : 'Turn Location On'}</button>
              </div>
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
      <>
        <style>{dailyUiStyles}</style>
        <style>{expenseUiStyles}</style>
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
                        <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => manualAttendanceAction(name, 'check_in')}
                            disabled={Boolean(row?.check_in)}
                            style={{ ...btnStyle, backgroundColor: row?.check_in ? '#cbd5e1' : '#16a34a', padding: '7px 9px', marginRight: '6px' }}
                          >
                            🟢 Check In
                          </button>
                          <button
                            onClick={() => manualAttendanceAction(name, 'check_out')}
                            disabled={!row?.check_in || Boolean(row?.check_out)}
                            style={{ ...btnStyle, backgroundColor: !row?.check_in || row?.check_out ? '#cbd5e1' : '#dc2626', padding: '7px 9px' }}
                          >
                            🔴 Check Out
                          </button>
                        </td>
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
        </div>
      )}

      {activeTab === 'payroll' && (
        <>
          <div style={{ ...cardStyle, overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0 }}>💰 Monthly Attendance & Payroll</h3>
                <p style={{ color: '#6b7280', marginBottom: 0 }}>Assign each staff payment to the salary/dues month it belongs to. Payments made this month for last month's dues will reduce the previous month's balance, not this month's salary.</p>
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
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1350px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f8fafc' }}>
                      {['Employee','Monthly Salary','Present','Half Day','Leave','Absent','Weekly Off','Hours','Payable Days','Earned Salary','Paid For Month','Previous Due','Paid Toward Previous','Total Balance'].map(h => <th key={h} style={{ padding: '9px', textAlign: h === 'Employee' ? 'left' : 'right' }}>{h}</th>)}
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
                        <td style={{ padding: '9px', textAlign: 'right', color: r.previousDueAfterPayment > 0 ? '#dc2626' : '#059669', fontWeight: 'bold' }}>
                          {formatINR(r.previousDueAfterPayment)}
                        </td>
                        <td style={{ padding: '9px', textAlign: 'right', color: '#2563eb', fontWeight: 'bold' }}>
                          {formatINR(r.paidTowardPreviousDues)}
                        </td>
                        <td style={{ padding: '9px', textAlign: 'right', fontWeight: 'bold', color: r.totalBalanceToPay > 0 ? '#dc2626' : '#059669' }}>
                          {formatINR(r.totalBalanceToPay)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
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
        </main>
      </div>
    </>
  );
}


const cardStyle = { background: 'rgba(255,255,255,0.96)', padding: '22px', borderRadius: '18px', border: '1px solid rgba(148,163,184,.18)', boxShadow: '0 12px 35px rgba(15,23,42,.08)', marginBottom: '20px' };
const flexRow = { display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' };
const inputStyle = { padding: '11px 13px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', width: '100%', boxSizing: 'border-box', background: '#fff', outline: 'none' };
const btnStyle = { padding: '11px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', boxShadow: '0 6px 14px rgba(37,99,235,.18)' };
const tabStyle = { flex: 1, padding: '13px 14px', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', transition: '0.2s', minHeight: '48px' };
