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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vintage_collapsed_sections') || '{}'); } catch { return {}; }
  });
  const toggleSection = (key) => setCollapsedSections(prev => {
    const next = { ...prev, [key]: !prev[key] };
    localStorage.setItem('vintage_collapsed_sections', JSON.stringify(next));
    return next;
  });


  const [isDataLoaded, setIsDataLoaded] = useState(false); 
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [dateSelection, setDateSelection] = useState(new Date().toISOString().split('T')[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [yesterdayCash, setYesterdayCash] = useState(0);
  const [yesterdayOnline, setYesterdayOnline] = useState(0);
  // Cash In Hand is the single physical cash balance used by the system.
  const [cashSale, setCashSale] = useState(0);
  const [onlineSale, setOnlineSale] = useState(0);
  const [parcelCounterCash, setParcelCounterCash] = useState(0);
  const [parcelCounterOnline, setParcelCounterOnline] = useState(0);
  
  const [onlineExpenses, setOnlineExpenses] = useState([]);
  const [cashExpenses, setCashExpenses] = useState([]);
  const [staffPayments, setStaffPayments] = useState([]);
  
  const [creditSales, setCreditSales] = useState([]);
  const [creditReceived, setCreditReceived] = useState([]);
  const [accountTransfers, setAccountTransfers] = useState([]);
  const [externalFunds, setExternalFunds] = useState([]);
  const [fundRepayments, setFundRepayments] = useState([]);
  const [notes, setNotes] = useState({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', coins: '' });

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('vintage_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTask, setNewTask] = useState('');

  const [historyLogs, setHistoryLogs] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyType, setHistoryType] = useState('all');
  const [historyStart, setHistoryStart] = useState('');
  const [historyEnd, setHistoryEnd] = useState('');
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);

  const [analyticsStart, setAnalyticsStart] = useState(() => {
    let d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0];
  });
  const [analyticsEnd, setAnalyticsEnd] = useState(new Date().toISOString().split('T')[0]);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiMessages, setAiMessages] = useState([{ role: 'assistant', text: 'Hi! I’m your read-only Vintage Accounts assistant. Ask me about sales, expenses, profit, customer credit, staff costs, or trends.' }]);
  const [aiLoading, setAiLoading] = useState(false);
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
  const [selectedStaffMember, setSelectedStaffMember] = useState(null);
  const [khataSearch, setKhataSearch] = useState('');
  const [selectedKhataCustomer, setSelectedKhataCustomer] = useState(null);
  const [khataStartDate, setKhataStartDate] = useState('');
  const [khataEndDate, setKhataEndDate] = useState('');
  const [inventoryItems, setInventoryItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [inventoryTransactions, setInventoryTransactions] = useState([]);
  const [inventorySearch, setInventorySearch] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseSupplierId, setPurchaseSupplierId] = useState('');
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState('Cash');
  const [purchaseInvoice, setPurchaseInvoice] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([{ id:Date.now(), itemId:'', name:'', quantity:1, unitCost:0, unit:'unit' }]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryView, setInventoryView] = useState('overview');
  const [supplierPayments, setSupplierPayments] = useState([]);
  const [supplierPaymentDate, setSupplierPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierPaymentSupplierId, setSupplierPaymentSupplierId] = useState('');
  const [supplierPaymentAmount, setSupplierPaymentAmount] = useState('');
  const [supplierPaymentMethod, setSupplierPaymentMethod] = useState('Cash');
  const [supplierPaymentReference, setSupplierPaymentReference] = useState('');
  const [supplierPaymentNotes, setSupplierPaymentNotes] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);

  


  const loadInventoryModule = async () => {
    setInventoryLoading(true);
    const [itemsRes, suppliersRes, purchasesRes, txRes, supplierPaymentsRes] = await Promise.all([
      supabase.from('inventory_items').select('*').order('name'),
      supabase.from('suppliers').select('*').order('name'),
      supabase.from('purchases').select('*').order('purchase_date', { ascending:false }),
      supabase.from('inventory_transactions').select('*').order('transaction_date', { ascending:false }),
      supabase.from('supplier_payments').select('*').order('payment_date', { ascending:false })
    ]);
    if (itemsRes.error) console.error('Inventory items:', itemsRes.error);
    if (suppliersRes.error) console.error('Suppliers:', suppliersRes.error);
    if (purchasesRes.error) console.error('Purchases:', purchasesRes.error);
    if (txRes.error) console.error('Inventory transactions:', txRes.error);
    if (supplierPaymentsRes.error) console.error('Supplier payments:', supplierPaymentsRes.error);
    setInventoryItems(itemsRes.data || []);
    setSuppliers(suppliersRes.data || []);
    setPurchases(purchasesRes.data || []);
    setInventoryTransactions(txRes.data || []);
    setSupplierPayments(supplierPaymentsRes.data || []);
    setInventoryLoading(false);
  };

  useEffect(() => {
    if (session && activeTab === 'inventory') loadInventoryModule();
  }, [session, activeTab]);

  useEffect(() => {
    if (!session || !['admin','manager'].includes(role)) return;
    const loadPurchaseLedger = async () => {
      const { data, error } = await supabase.from('purchases').select('*').order('purchase_date', { ascending: false });
      if (error) console.error('Purchase ledger fetch:', error);
      setPurchases(data || []);
    };
    loadPurchaseLedger();
  }, [session, role]);

  const addInventoryItem = async () => {
    const name = window.prompt('Item name (e.g. Rice, Chicken, Oil):');
    if (!name?.trim()) return;
    const category = window.prompt('Category (e.g. Raw Material, Beverage, Packaging):') || '';
    const unit = window.prompt('Unit (kg, litre, packet, piece):', 'kg') || 'unit';
    const reorder = Number(window.prompt('Reorder level:', '0') || 0);
    const cost = Number(window.prompt('Current unit cost:', '0') || 0);
    const { error } = await supabase.from('inventory_items').insert({ name:name.trim(), category, unit, reorder_level:reorder, unit_cost:cost, created_by:session?.user?.id });
    if (error) return alert('Unable to add item: ' + error.message);
    await loadInventoryModule();
  };

  const addSupplier = async () => {
    const name = window.prompt('Supplier name:');
    if (!name?.trim()) return;
    const phone = window.prompt('Phone number:') || '';
    const category = window.prompt('Supply category:') || '';
    const { error } = await supabase.from('suppliers').insert({ name:name.trim(), phone, category, created_by:session?.user?.id });
    if (error) return alert('Unable to add supplier: ' + error.message);
    await loadInventoryModule();
  };

  const updatePurchaseItem = (id, changes) => setPurchaseItems(prev => prev.map(x => x.id === id ? {...x, ...changes} : x));
  const removePurchaseItem = id => setPurchaseItems(prev => prev.filter(x => x.id !== id));
  const purchaseTotal = purchaseItems.reduce((sum,x)=>sum + Number(x.quantity||0)*Number(x.unitCost||0),0);

  const savePurchase = async () => {
    const validItems = purchaseItems.filter(x => x.itemId && Number(x.quantity) > 0);
    if (!validItems.length) return alert('Add at least one inventory item to the purchase.');
    const supplier = suppliers.find(s => String(s.id) === String(purchaseSupplierId));
    const paid = purchasePaymentMethod === 'Credit' ? 0 : purchaseTotal;
    const due = purchaseTotal - paid;
    const status = due > 0 ? 'Due' : 'Paid';
    const payloadItems = validItems.map(x => ({
      itemId:Number(x.itemId), name:x.name, quantity:Number(x.quantity), unitCost:Number(x.unitCost), unit:x.unit
    }));
    const { data: purchase, error } = await supabase.from('purchases').insert({
      purchase_date:purchaseDate, supplier_id:supplier?.id || null, supplier_name:supplier?.name || '',
      invoice_no:purchaseInvoice, payment_method:purchasePaymentMethod, payment_status:status,
      subtotal:purchaseTotal, paid_amount:paid, due_amount:due, notes:purchaseNotes, items:payloadItems, created_by:session?.user?.id
    }).select().single();
    if (error) return alert('Purchase save failed: ' + error.message);

    for (const item of validItems) {
      const existing = inventoryItems.find(i => String(i.id) === String(item.itemId));
      const newStock = Number(existing?.current_stock || 0) + Number(item.quantity);
      await supabase.from('inventory_items').update({ current_stock:newStock, unit_cost:Number(item.unitCost||0), updated_at:new Date().toISOString() }).eq('id', item.itemId);
      await supabase.from('inventory_transactions').insert({
        item_id:Number(item.itemId), transaction_date:purchaseDate, transaction_type:'Purchase',
        quantity:Number(item.quantity), unit_cost:Number(item.unitCost||0), reference_type:'purchase',
        reference_id:purchase.id, notes:purchaseInvoice || 'Purchase', created_by:session?.user?.id
      });
    }
    setPurchaseItems([{ id:Date.now(), itemId:'', name:'', quantity:1, unitCost:0, unit:'unit' }]);
    setPurchaseInvoice(''); setPurchaseNotes(''); setPurchaseSupplierId(''); setPurchasePaymentMethod('Cash');
    await loadInventoryModule();
    alert('Purchase recorded and stock updated.');
  };

  const adjustInventory = async (item, type) => {
    const qty = Number(window.prompt(type === 'Usage' ? 'Quantity used:' : type === 'Waste' ? 'Quantity wasted:' : 'Adjustment quantity (+/-):', '0') || 0);
    if (!qty) return;
    const signed = type === 'Adjustment' ? qty : -Math.abs(qty);
    const newStock = Math.max(0, Number(item.current_stock||0) + signed);
    const { error } = await supabase.from('inventory_items').update({ current_stock:newStock, updated_at:new Date().toISOString() }).eq('id', item.id);
    if (error) return alert('Stock update failed: ' + error.message);
    await supabase.from('inventory_transactions').insert({
      item_id:item.id, transaction_date:new Date().toISOString().split('T')[0], transaction_type:type,
      quantity:Math.abs(qty), unit_cost:Number(item.unit_cost||0), notes:type, created_by:session?.user?.id
    });
    await loadInventoryModule();
  };

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
  const askAiAssistant = async (questionOverride) => {
    const question = String(questionOverride ?? aiQuestion).trim();
    if (!question || aiLoading) return;
    setAiQuestion('');
    setAiMessages(prev => [...prev, { role: 'user', text: question }]);
    setAiLoading(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.access_token) throw new Error('Your session has expired. Please log in again.');

      const context = {
        generatedAt: new Date().toISOString(),
        period: { start: analyticsStart, end: analyticsEnd },
        today: dashboardData ? {
          sales: dashboardData.todaySales,
          expenses: dashboardData.todayExpenses,
          cashInHand: dashboardData.todayCash,
          onlineBalance: dashboardData.todayOnline,
          estimatedProfit: dashboardData.todaySales - dashboardData.todayExpenses
        } : null,
        analytics: {
          totalSales: analyticsData.totalSales,
          totalExpenses: analyticsData.totalExpenses,
          estimatedProfit: analyticsData.estimatedProfit,
          cashSales: analyticsData.cashSales,
          onlineSales: analyticsData.onlineSales,
          creditSales: analyticsData.creditSales,
          creditReceived: analyticsData.creditReceived,
          creditOutstanding: analyticsData.creditOutstanding,
          staffCost: analyticsData.staffCost,
          cashExpenses: analyticsData.cashExpenses,
          onlineExpenses: analyticsData.onlineExpensesTotal,
          averageDailySales: analyticsData.averageDailySales,
          averageDailyExpenses: analyticsData.averageDailyExpenses,
          operatingDays: analyticsData.operatingDays,
          topExpenseCategories: analyticsData.sortedCategories.slice(0, 10),
          monthlyPerformance: analyticsData.monthlyRows
        },
        khata: {
          totalGiven: khataSummary.totalGiven,
          totalReceived: khataSummary.totalReceived,
          outstanding: khataSummary.outstanding,
          customersWithDue: khataSummary.customersWithDue,
          topOutstandingCustomers: khataCustomers.filter(c => c.balance > 0).slice(0, 15).map(c => ({ name: c.name, given: c.given, received: c.received, balance: c.balance }))
        },
        funds: fundLedgerSummary,
        payroll: payrollRows.slice(0, 20).map(r => ({
          name: r.name,
          monthlySalary: r.monthlySalary,
          payableDays: r.payableDays,
          earnedPay: r.earnedPay,
          totalTaken: r.totalTaken,
          previousDue: r.previousDueAfterPayment,
          totalBalanceToPay: r.totalBalanceToPay
        })),
        recentDailyLogs: historyLogs.slice(0, 14).map(log => ({
          date: log.date,
          sales: log.expense_details?.sales || {},
          cashExpenses: (log.expense_details?.cash || []).map(e => ({ type: e.type, category: e.category, amount: Number(e.amount || 0), description: e.description })),
          onlineExpenses: (log.expense_details?.online || []).map(e => ({ category: e.category, amount: Number(e.amount || 0), description: e.description })),
          staffPayments: (log.expense_details?.staff || []).map(e => ({ name: e.name, type: e.type, amount: Number(e.amount || 0), dueFor: e.dueFor, method: e.method })),
          creditSales: (log.expense_details?.credit_sales || []).map(e => ({ name: e.name, amount: Number(e.amount || 0) })),
          creditReceived: (log.expense_details?.credit_received || []).map(e => ({ name: e.name, amount: Number(e.amount || 0), method: e.method })),
          closingCash: Number(log.total_cash_in_hand || 0),
          closingOnline: Number(log.total_online_balance || 0)
        }))
      };

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + currentSession.access_token },
        body: JSON.stringify({ question, context })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'AI request failed.');
      setAiMessages(prev => [...prev, { role: 'assistant', text: result.text }]);
    } catch (error) {
      setAiMessages(prev => [...prev, { role: 'assistant', text: '⚠️ ' + error.message }]);
    } finally {
      setAiLoading(false);
    }
  };



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
  // Payroll employee detail also needs the selected day's attendance snapshot.
  useEffect(() => {
    if (session && activeTab === 'payroll') loadAttendance(attendanceDate);
  }, [session, activeTab, attendanceDate]);

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

    // Payments are allocated to the month they belong to via dueFor.
    // A payment allocated to the previous month is already included in previousTotalPaid,
    // so it must NOT be subtracted a second time from the previous balance.
    const paidTowardPreviousDues = previousPayments
      .filter(payment => payment.paymentDate?.slice(0, 7) === payrollMonth)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const previousTotalPaid = previousPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const previousDue = Math.max(0, previousEarnedPay - previousTotalPaid);
    const previousDueAfterPayment = previousDue;
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

  const staffManagement = useMemo(() => {
    const totalEarned = payrollRows.reduce((s, r) => s + r.earnedPay, 0);
    const totalPaid = payrollRows.reduce((s, r) => s + r.totalTaken, 0);
    const totalDue = payrollRows.reduce((s, r) => s + r.totalBalanceToPay, 0);
    const configured = payrollRows.filter(r => r.monthlySalary > 0).length;
    const attendancePresent = payrollRows.reduce((s, r) => s + r.present, 0);
    const attendancePayable = payrollRows.reduce((s, r) => s + r.payableDays, 0);
    const advances = payrollRows.reduce((s, r) => s + r.cashAdvance, 0);
    const priority = payrollRows
      .filter(r => r.totalBalanceToPay > 0 || r.monthlySalary === 0)
      .sort((a, b) => (b.totalBalanceToPay - a.totalBalanceToPay) || (a.monthlySalary - b.monthlySalary));
    return { totalEarned, totalPaid, totalDue, configured, attendancePresent, attendancePayable, advances, priority };
  }, [payrollRows]);

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
      'Previous Month Closing Due (₹)':Number(r.previousDueAfterPayment.toFixed(2)),
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
        setCashSale(currentData.expense_details?.sales?.cash || 0); setOnlineSale(currentData.expense_details?.sales?.online || 0); setParcelCounterCash(currentData.expense_details?.sales?.parcel_counter_cash || 0); setParcelCounterOnline(currentData.expense_details?.sales?.parcel_counter_online || 0);
        setOnlineExpenses(currentData.expense_details?.online || []); setCashExpenses(currentData.expense_details?.cash || []);
        setStaffPayments(currentData.expense_details?.staff || []); setCreditSales(currentData.expense_details?.credit_sales || []);
        setCreditReceived(currentData.expense_details?.credit_received || []);
        setAccountTransfers(currentData.expense_details?.account_transfers || []); setExternalFunds(currentData.expense_details?.external_funds || []); setFundRepayments(currentData.expense_details?.fund_repayments || []);
        setNotes({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', coins: '' }); 
        alert(`✅ System loaded database records for ${targetDate}`);
      } 
      else if (isManualClick && !currentData) {
        // User explicitly clicked fetch, but DB is empty
        setCashSale(0); setOnlineSale(0); setParcelCounterCash(0); setParcelCounterOnline(0); setOnlineExpenses([]); setCashExpenses([]); setStaffPayments([]); setCreditSales([]); setCreditReceived([]); setAccountTransfers([]); setExternalFunds([]); setFundRepayments([]); setNotes({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', coins: '' });
        alert(`ℹ️ No database records found for ${targetDate}. The page is clear.`);
      }
      else if (!isManualClick && draft) {
        // Initial page load, restore an unsaved draft if it exists
        setCashSale(draft.cashSale || 0); setOnlineSale(draft.onlineSale || 0); setParcelCounterCash(draft.parcelCounterCash || 0); setParcelCounterOnline(draft.parcelCounterOnline || 0); setOnlineExpenses(draft.onlineExpenses || []); setCashExpenses(draft.cashExpenses || []); setStaffPayments(draft.staffPayments || []); setCreditSales(draft.creditSales || []); setCreditReceived(draft.creditReceived || []); setAccountTransfers(draft.accountTransfers || []); setExternalFunds(draft.externalFunds || []); setFundRepayments(draft.fundRepayments || []); setNotes(draft.notes || { 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', coins: '' });
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
        setYesterdayCash(Number(prevData[0].total_cash_in_hand || 0)); setYesterdayOnline(Number(prevData[0].total_online_balance || 0));
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
      const draft = { cashSale, onlineSale, parcelCounterCash, parcelCounterOnline, onlineExpenses, cashExpenses, staffPayments, creditSales, creditReceived, accountTransfers, externalFunds, fundRepayments, notes };
      localStorage.setItem(`vintage_draft_${date}`, JSON.stringify(draft));
    }
  }, [isDataLoaded, session, date, cashSale, onlineSale, parcelCounterCash, parcelCounterOnline, onlineExpenses, cashExpenses, staffPayments, creditSales, creditReceived, accountTransfers, externalFunds, fundRepayments, notes]);

  // --- MATH LOGIC ---
  const totalOnlineExpenses = onlineExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  // "Till" expenses were already deducted before the user enters the final daily Cash/Parcel Counter amount, so never deduct them again from Cash In Hand.
  const totalTillCashExpenses = cashExpenses.filter(exp => exp.type === 'Cash' || exp.type === 'Available Cash' || exp.type === 'Cash in Hand').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalCashFromTillExpenses = cashExpenses.filter(exp => exp.type === 'Till').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalAvailableCashExpenses = 0;
  const totalStaffAvailableCash = 0;
  // Both normal Cash expenses and Cash From Till are daily expenses. Till expenses are reporting-only for the cash balance.
  const totalCashExpenses = totalTillCashExpenses + totalCashFromTillExpenses;
  const availableCashBalance = 0;
  const totalCounterExpenses = cashExpenses.filter(exp => exp.type === 'Counter').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalCreditExpenses = cashExpenses.filter(exp => exp.type === 'Credit').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalTejaExpenses = cashExpenses.filter(exp => exp.type === 'Teja').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalAnilExpenses = cashExpenses.filter(exp => exp.type === 'Anil').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalStaffCash = staffPayments.filter(s => s.method === 'Cash').reduce((sum, s) => sum + Number(s.amount || 0), 0);
  // Till-paid wages are already included in the net cash entered for the day, so count them as expenses but do not deduct them again from Cash In Hand.
  const totalStaffTill = staffPayments.filter(s => s.method === 'Till').reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const totalStaffCounter = staffPayments.filter(s => s.method === 'Counter').reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const totalStaffCredit = staffPayments.filter(s => s.method === 'Credit').reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const totalStaffTeja = staffPayments.filter(s => s.method === 'Teja').reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const totalStaffAnil = staffPayments.filter(s => s.method === 'Anil').reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const totalStaffOnline = staffPayments.filter(s => s.method === 'Online').reduce((sum, s) => sum + Number(s.amount || 0), 0);

  const totalCreditSales = creditSales.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const transferCashOut = accountTransfers.filter(t => t.from === 'Cash').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const transferCashIn = accountTransfers.filter(t => t.to === 'Cash').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const transferOnlineOut = accountTransfers.filter(t => t.from === 'Online').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const transferOnlineIn = accountTransfers.filter(t => t.to === 'Online').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const externalCashIn = externalFunds.filter(f => f.account === 'Cash').reduce((sum, f) => sum + Number(f.amount || 0), 0);
  const externalOnlineIn = externalFunds.filter(f => f.account === 'Online').reduce((sum, f) => sum + Number(f.amount || 0), 0);
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
  const dailySnapshotGrossSale = trueGrossSale + totalTillCashExpenses + totalCashFromTillExpenses;
  const totalOperatingExpenses = totalOnlineExpenses + totalCashExpenses + totalStaffCash + totalStaffTill + totalStaffOnline + totalStaffCounter + totalStaffCredit + totalStaffTeja + totalStaffAnil;
  const estimatedProfit = trueGrossSale - totalOperatingExpenses;
  const formatINR = value => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  // Cash In Hand is the single physical cash pool. Every expense or staff payment paid in cash reduces it.
  const totalPhysicalStaffCash = staffPayments.filter(s => s.method === 'Cash' || s.method === 'Available Cash').reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const totalFundRepaymentsCash = fundRepayments.filter(r => r.account === 'Cash').reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const totalFundRepaymentsOnline = fundRepayments.filter(r => r.account === 'Online').reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const totalCashInHand = Math.max(0, Number(yesterdayCash || 0) + Number(cashSale || 0) + totalParcelCounterCash + creditReceivedCash + transferCashIn - transferCashOut + externalCashIn - totalTillCashExpenses - totalPhysicalStaffCash - totalFundRepaymentsCash);
  // Online expenses and online-paid staff wages are paid from the online balance, so deduct them from the available online amount.
  const totalOnlineBalance = yesterdayOnline + Number(onlineSale) + totalParcelCounterOnline + creditReceivedOnline + transferOnlineIn - transferOnlineOut + externalOnlineIn - totalOnlineExpenses - totalStaffOnline - totalFundRepaymentsOnline;
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
  const addAccountTransfer = () => addArrItem(setAccountTransfers, accountTransfers, { from: 'Cash', to: 'Online', amount: 0, note: '' });
  const addExternalFund = () => addArrItem(setExternalFunds, externalFunds, { source: '', mode: 'Borrowed', account: 'Cash', amount: 0, dueDate: '', note: '' });
  const addFundRepayment = () => addArrItem(setFundRepayments, fundRepayments, { source: '', mode: 'Loan', account: 'Cash', amount: 0, note: '' });

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
    setCashSale(0); setOnlineSale(0); setParcelCounterCash(0); setParcelCounterOnline(0); setOnlineExpenses([]); setCashExpenses([]); setStaffPayments([]); setCreditSales([]); setCreditReceived([]);
    setNotes({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', coins: '' });
    localStorage.removeItem(`vintage_draft_${date}`);
  };

  const saveDailyAccounts = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const { error } = await supabase.from('daily_logs').upsert({ 
        date: date, total_cash_in_hand: totalCashInHand, total_online_balance: totalOnlineBalance, available_cash_balance: totalCashInHand,
        expense_details: { online: onlineExpenses, cash: cashExpenses, staff: staffPayments, sales: { cash: cashSale, online: onlineSale, parcel_counter_cash: parcelCounterCash, parcel_counter_online: parcelCounterOnline }, credit_sales: creditSales, credit_received: creditReceived, account_transfers: accountTransfers, external_funds: externalFunds, fund_repayments: fundRepayments }
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

  const khataCustomers = useMemo(() => {
    const map = {};
    const ensure = (name) => {
      const clean = String(name || 'Unknown').trim() || 'Unknown';
      const key = clean.toUpperCase();
      if (!map[key]) map[key] = { key, name: clean, given: 0, received: 0, transactions: [] };
      return map[key];
    };
    historyLogs.forEach(log => {
      (log.expense_details?.credit_sales || []).forEach(c => {
        const customer = ensure(c.name);
        const amount = Number(c.amount || 0);
        customer.given += amount;
        customer.transactions.push({ date: log.date, kind: 'Credit Given', amount, method: 'Credit', note: c.note || c.description || '' });
      });
      (log.expense_details?.credit_received || []).forEach(c => {
        const customer = ensure(c.name);
        const amount = Number(c.amount || 0);
        customer.received += amount;
        customer.transactions.push({ date: log.date, kind: 'Payment Received', amount, method: c.method || 'Cash', note: c.note || c.description || '' });
      });
    });
    return Object.values(map).map(c => ({ ...c, balance: c.given - c.received, transactions: c.transactions.sort((a,b) => b.date.localeCompare(a.date)) }))
      .sort((a,b) => b.balance - a.balance || a.name.localeCompare(b.name));
  }, [historyLogs]);

  const filteredKhataCustomers = useMemo(() => {
    const q = khataSearch.trim().toUpperCase();
    return khataCustomers.filter(c => !q || c.name.toUpperCase().includes(q));
  }, [khataCustomers, khataSearch]);

  const selectedKhata = useMemo(() => khataCustomers.find(c => c.key === selectedKhataCustomer) || null, [khataCustomers, selectedKhataCustomer]);

  const khataSummary = useMemo(() => {
    const totalGiven = khataCustomers.reduce((s,c) => s + Math.max(0,c.given), 0);
    const totalReceived = khataCustomers.reduce((s,c) => s + Math.max(0,c.received), 0);
    const outstanding = khataCustomers.reduce((s,c) => s + Math.max(0,c.balance), 0);
    const customersWithDue = khataCustomers.filter(c => c.balance > 0).length;
    return { totalGiven, totalReceived, outstanding, customersWithDue };
  }, [khataCustomers]);

  const selectedKhataTransactions = useMemo(() => {
    if (!selectedKhata) return [];
    return selectedKhata.transactions.filter(t => (!khataStartDate || t.date >= khataStartDate) && (!khataEndDate || t.date <= khataEndDate));
  }, [selectedKhata, khataStartDate, khataEndDate]);

  const khataCollectionInsights = useMemo(() => {
    const today = new Date();
    const dayMs = 86400000;
    return khataCustomers
      .filter(c => c.balance > 0)
      .map(c => {
        const lastPayment = c.transactions.find(t => t.kind === 'Payment Received');
        const creditTransactions = c.transactions.filter(t => t.kind === 'Credit Given').slice().sort((a,b) => a.date.localeCompare(b.date));
        const oldestDue = creditTransactions[0];
        const lastActivity = c.transactions[0]?.date || '';
        const daysSincePayment = lastPayment?.date ? Math.max(0, Math.floor((today - new Date(lastPayment.date + 'T00:00:00')) / dayMs)) : null;
        const daysSinceActivity = lastActivity ? Math.max(0, Math.floor((today - new Date(lastActivity + 'T00:00:00')) / dayMs)) : null;
        const oldestDueDays = oldestDue?.date ? Math.max(0, Math.floor((today - new Date(oldestDue.date + 'T00:00:00')) / dayMs)) : 0;
        const collectionScore = c.balance >= 10000 || oldestDueDays >= 30 || daysSincePayment === null || daysSincePayment >= 21 ? 3 : c.balance >= 5000 || oldestDueDays >= 14 || daysSincePayment >= 14 ? 2 : 1;
        return { ...c, lastPaymentDate: lastPayment?.date || '', lastActivity, daysSincePayment, daysSinceActivity, oldestDueDays, collectionScore };
      })
      .sort((a,b) => b.collectionScore - a.collectionScore || b.balance - a.balance || b.oldestDueDays - a.oldestDueDays);
  }, [khataCustomers]);

  const khataCollectionSummary = useMemo(() => {
    const due = khataCollectionInsights;
    return {
      priority: due.filter(c => c.collectionScore === 3).length,
      overdue30: due.filter(c => c.oldestDueDays >= 30).length,
      neverPaid: due.filter(c => !c.lastPaymentDate).length,
      oldestDays: due.length ? Math.max(...due.map(c => c.oldestDueDays)) : 0
    };
  }, [khataCollectionInsights]);

  const exportKhataStatement = () => {
    if (!selectedKhata) return;
    const rows = selectedKhataTransactions.slice().reverse().map(t => ({
      Date: t.date,
      Transaction: t.kind,
      Method: t.method,
      'Credit Given (₹)': t.kind === 'Credit Given' ? Number(t.amount.toFixed(2)) : 0,
      'Payment Received (₹)': t.kind === 'Payment Received' ? Number(t.amount.toFixed(2)) : 0,
      Note: t.note || ''
    }));
    rows.push({ Date: '', Transaction: 'Closing Balance', Method: '', 'Credit Given (₹)': Number(selectedKhata.given.toFixed(2)), 'Payment Received (₹)': Number(selectedKhata.received.toFixed(2)), Note: 'Outstanding: ' + formatINR(selectedKhata.balance) });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customer Statement');
    XLSX.writeFile(wb, 'Khata-' + selectedKhata.name.replace(/[^a-z0-9]+/gi,'-') + '.xlsx');
  };

  const fundLedger = useMemo(() => {
    const map = {};
    const keyFor = (source, mode) => String(source || 'Unknown').trim().toUpperCase() + '|' + String(mode || 'Other');
    historyLogs.forEach(log => {
      (log.expense_details?.external_funds || []).forEach(f => {
        const key = keyFor(f.source, f.mode);
        if (!map[key]) map[key] = { key, source: String(f.source || 'Unknown').trim() || 'Unknown', mode: f.mode || 'Other', original: 0, repaid: 0, account: f.account || 'Cash', dueDate: f.dueDate || '' };
        map[key].original += Number(f.amount || 0); if (f.dueDate && (!map[key].dueDate || f.dueDate < map[key].dueDate)) map[key].dueDate = f.dueDate;
      });
      (log.expense_details?.fund_repayments || []).forEach(r => {
        const key = keyFor(r.source, r.mode);
        if (!map[key]) map[key] = { key, source: String(r.source || 'Unknown').trim() || 'Unknown', mode: r.mode || 'Other', original: 0, repaid: 0, account: r.account || 'Cash', dueDate: '' };
        map[key].repaid += Number(r.amount || 0);
      });
    });
    return Object.values(map).map(f => ({...f, outstanding: Math.max(0, f.original - f.repaid), status: f.original - f.repaid <= 0 && f.original > 0 ? 'Closed' : f.dueDate && f.dueDate < new Date().toISOString().split('T')[0] && f.original > f.repaid ? 'Overdue' : 'Open'})).sort((a,b)=>b.outstanding-a.outstanding || a.source.localeCompare(b.source));
  }, [historyLogs]);
  const fundLedgerSummary = useMemo(() => ({ original: fundLedger.reduce((s,f)=>s+f.original,0), repaid: fundLedger.reduce((s,f)=>s+f.repaid,0), outstanding: fundLedger.reduce((s,f)=>s+f.outstanding,0), open: fundLedger.filter(f=>f.outstanding>0).length }), [fundLedger]);

  const purchaseSummary = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const byDate = {};
    purchases.forEach(p => {
      if (!p.purchase_date) return;
      if (!byDate[p.purchase_date]) byDate[p.purchase_date] = { total:0, cash:0, online:0, credit:0, paid:0, due:0, count:0 };
      const total = Number(p.subtotal || 0), paid = Number(p.paid_amount || 0), due = Number(p.due_amount || 0);
      byDate[p.purchase_date].total += total; byDate[p.purchase_date].paid += paid; byDate[p.purchase_date].due += due; byDate[p.purchase_date].count += 1;
      if (p.payment_method === 'Cash') byDate[p.purchase_date].cash += paid;
      else if (p.payment_method === 'Online') byDate[p.purchase_date].online += paid;
      else if (p.payment_method === 'Credit') byDate[p.purchase_date].credit += total;
    });
    const selected = purchases.filter(p => p.purchase_date >= analyticsStart && p.purchase_date <= analyticsEnd);
    return {
      byDate,
      selectedTotal: selected.reduce((s,p)=>s+Number(p.subtotal||0),0),
      selectedPaid: selected.reduce((s,p)=>s+Number(p.paid_amount||0),0),
      selectedDue: selected.reduce((s,p)=>s+Number(p.due_amount||0),0),
      totalDue: purchases.reduce((s,p)=>s+Number(p.due_amount||0),0),
      today: byDate[today] || {total:0,cash:0,online:0,credit:0,paid:0,due:0,count:0}
    };
  }, [purchases, analyticsStart, analyticsEnd]);

  const supplierPaymentSummary = useMemo(() => {
    const bySupplier = {};
    const byDate = {};
    supplierPayments.forEach(p => {
      const sid = p.supplier_id ? String(p.supplier_id) : 'name:' + String(p.supplier_name || '').trim().toLowerCase();
      if (!bySupplier[sid]) bySupplier[sid] = { total:0, cash:0, online:0, count:0, lastPayment:'' };
      const amount = Number(p.amount || 0);
      bySupplier[sid].total += amount;
      bySupplier[sid].count += 1;
      if (p.payment_method === 'Cash') bySupplier[sid].cash += amount;
      if (p.payment_method === 'Online') bySupplier[sid].online += amount;
      if (p.payment_date && (!bySupplier[sid].lastPayment || p.payment_date > bySupplier[sid].lastPayment)) bySupplier[sid].lastPayment = p.payment_date;
      if (p.payment_date) byDate[p.payment_date] = (byDate[p.payment_date] || 0) + amount;
    });
    const paymentsInPeriod = supplierPayments.filter(p => p.payment_date >= analyticsStart && p.payment_date <= analyticsEnd);
    return {
      bySupplier,
      byDate,
      totalPaid: supplierPayments.reduce((s,p)=>s+Number(p.amount||0),0),
      periodPaid: paymentsInPeriod.reduce((s,p)=>s+Number(p.amount||0),0),
      todayPaid: byDate[new Date().toISOString().split('T')[0]] || 0
    };
  }, [supplierPayments, analyticsStart, analyticsEnd]);

  const supplierPayables = useMemo(() => {
    const rows = suppliers.map(s => {
      const purchasesForSupplier = purchases.filter(p => Number(p.supplier_id) === Number(s.id));
      const purchaseDue = purchasesForSupplier.reduce((sum,p)=>sum + Number(p.due_amount || 0),0);
      const payments = supplierPaymentSummary.bySupplier[String(s.id)] || {total:0,cash:0,online:0,count:0,lastPayment:''};
      const opening = Number(s.opening_balance || 0);
      const outstanding = Math.max(0, opening + purchaseDue - payments.total);
      const oldestPurchase = purchasesForSupplier.filter(p=>Number(p.due_amount||0)>0).sort((a,b)=>String(a.purchase_date).localeCompare(String(b.purchase_date)))[0];
      const oldestDate = oldestPurchase?.purchase_date || (opening > 0 ? String(s.created_at || '').slice(0,10) : '');
      const days = oldestDate ? Math.max(0, Math.floor((new Date(new Date().toISOString().split('T')[0]) - new Date(oldestDate)) / 86400000)) : 0;
      return {
        ...s, purchaseDue, openingBalance:opening, payments:payments.total, paymentCount:payments.count,
        cashPaid:payments.cash, onlinePaid:payments.online, lastPayment:payments.lastPayment,
        outstanding, oldestDate, oldestDays:days,
        status: outstanding <= 0 ? 'Clear' : days >= 30 ? 'Overdue' : 'Due'
      };
    }).sort((a,b)=>b.outstanding-a.outstanding || b.oldestDays-a.oldestDays || a.name.localeCompare(b.name));
    return rows;
  }, [suppliers, purchases, supplierPaymentSummary]);

  const supplierPayableSummary = useMemo(() => ({
    totalOutstanding: supplierPayables.reduce((s,r)=>s+r.outstanding,0),
    suppliersDue: supplierPayables.filter(r=>r.outstanding>0).length,
    due30: supplierPayables.filter(r=>r.outstanding>0 && r.oldestDays>=30).length,
    neverPaid: supplierPayables.filter(r=>r.outstanding>0 && !r.lastPayment).length,
    periodPaid: supplierPaymentSummary.periodPaid
  }), [supplierPayables, supplierPaymentSummary]);

  const selectedSupplier = useMemo(() => supplierPayables.find(s => String(s.id) === String(selectedSupplierId)) || null, [supplierPayables, selectedSupplierId]);

  const saveSupplierPayment = async () => {
    const amount = Number(supplierPaymentAmount || 0);
    const supplier = suppliers.find(s => String(s.id) === String(supplierPaymentSupplierId));
    if (!supplier) return alert('Select a supplier.');
    if (amount <= 0) return alert('Enter a payment amount greater than zero.');
    const payable = supplierPayables.find(s => String(s.id) === String(supplier.id));
    if (!payable || payable.outstanding <= 0) return alert('This supplier has no outstanding payable balance.');
    if (amount > payable.outstanding + 0.01) return alert('Payment cannot exceed the supplier’s current outstanding balance.');
    const { error } = await supabase.from('supplier_payments').insert({
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      payment_date: supplierPaymentDate,
      amount,
      payment_method: supplierPaymentMethod,
      reference_no: supplierPaymentReference.trim(),
      notes: supplierPaymentNotes.trim(),
      created_by: session?.user?.id
    });
    if (error) return alert('Supplier payment failed: ' + error.message);
    setSupplierPaymentAmount('');
    setSupplierPaymentReference('');
    setSupplierPaymentNotes('');
    setSelectedSupplierId(supplier.id);
    await loadInventoryModule();
    alert('✅ Supplier payment recorded. Payable balance updated.');
  };

  const supplierStatement = useMemo(() => {
    if (!selectedSupplier) return [];
    const purchaseRows = purchases.filter(p => Number(p.supplier_id) === Number(selectedSupplier.id)).map(p => ({
      date:p.purchase_date, type:'Purchase', reference:p.invoice_no || 'Purchase #' + p.id,
      amount:Number(p.subtotal||0), due:Number(p.due_amount||0), method:p.payment_method || 'Credit'
    }));
    const paymentRows = supplierPayments.filter(p => Number(p.supplier_id) === Number(selectedSupplier.id)).map(p => ({
      date:p.payment_date, type:'Payment', reference:p.reference_no || 'Supplier Payment #' + p.id,
      amount:Number(p.amount||0), due:0, method:p.payment_method || 'Cash', notes:p.notes || ''
    }));
    return [...purchaseRows, ...paymentRows].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  }, [selectedSupplier, purchases, supplierPayments]);


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
      monthlyTotals[monthKey].purchases = purchases.filter(p => p.purchase_date?.slice(0, 7) === monthKey).reduce((s,p)=>s+Number(p.subtotal||0),0);
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

    const purchaseCosts = purchases.filter(p => p.purchase_date >= analyticsStart && p.purchase_date <= analyticsEnd).reduce((s,p)=>s+Number(p.subtotal||0),0);
    const totalSales = cashSales + onlineSales + creditSales + counterAdjustments;
    const estimatedProfit = totalSales - operatingExpenses;
    const operatingProfitAfterPurchases = totalSales - operatingExpenses - purchaseCosts;
    const operatingDays = filtered.length;
    const averageDailySales = operatingDays ? totalSales / operatingDays : 0;
    const averageDailyExpenses = operatingDays ? operatingExpenses / operatingDays : 0;
    const creditOutstanding = Math.max(0, creditSales - creditReceived);
    const maxCatVal = Math.max(...Object.values(categoryTotals), 1);
    const sortedCategories = Object.entries(categoryTotals).sort((a,b) => b[1] - a[1]);
    const monthlyRows = Object.entries(monthlyTotals).sort((a,b) => b[0].localeCompare(a[0]));

    return {
      totalSales, totalExpenses: operatingExpenses, estimatedProfit, purchaseCosts, operatingProfitAfterPurchases,
      cashSales, onlineSales, creditSales, creditReceived,
      cashExpenses, onlineExpensesTotal, staffCost, creditOutstanding,
      operatingDays, averageDailySales, averageDailyExpenses,
      sortedCategories, maxCatVal, monthlyRows
    };
  }, [historyLogs, analyticsStart, analyticsEnd, purchases]);


  const historyRows = useMemo(() => historyLogs.map(log => {
    const s = log.expense_details?.sales || {};
    const cash = Number(s.cash || 0) + Number(s.parcel_counter_cash || 0);
    const online = Number(s.online || 0) + Number(s.parcel_counter_online || 0);
    const credit = (log.expense_details?.credit_sales || []).reduce((a,x)=>a+Number(x.amount||0),0);
    const received = (log.expense_details?.credit_received || []).reduce((a,x)=>a+Number(x.amount||0),0);
    const onlineExpense = (log.expense_details?.online || []).reduce((a,x)=>a+Number(x.amount||0),0);
    const cashExpense = (log.expense_details?.cash || []).filter(x=>!['Counter','Credit','Teja','Anil'].includes(x.type)).reduce((a,x)=>a+Number(x.amount||0),0);
    const staff = (log.expense_details?.staff || []).reduce((a,x)=>a+Number(x.amount||0),0);
    const transfers = (log.expense_details?.account_transfers || []).reduce((a,x)=>a+Number(x.amount||0),0);
    const fundsIn = (log.expense_details?.external_funds || []).reduce((a,x)=>a+Number(x.amount||0),0);
    const repayments = (log.expense_details?.fund_repayments || []).reduce((a,x)=>a+Number(x.amount||0),0);
    const totalSales = cash + online + credit;
    const totalExpenses = onlineExpense + cashExpense + staff;
    const purchase = purchaseSummary.byDate[log.date] || {total:0,paid:0,due:0,count:0};
    const supplierPayment = Number(supplierPaymentSummary.byDate[log.date] || 0);
    return { ...log, cash, online, credit, received, totalSales, totalExpenses, purchaseTotal:purchase.total, purchasePaid:purchase.paid, purchaseDue:purchase.due, purchaseCount:purchase.count, supplierPayment, staff, transfers, fundsIn, repayments,
      counts: {
        credit: (log.expense_details?.credit_sales || []).length,
        received: (log.expense_details?.credit_received || []).length,
        expenses: (log.expense_details?.online || []).length + (log.expense_details?.cash || []).length,
        staff: (log.expense_details?.staff || []).length,
        transfers: (log.expense_details?.account_transfers || []).length,
        funds: (log.expense_details?.external_funds || []).length,
        repayments: (log.expense_details?.fund_repayments || []).length,
        supplierPayments: supplierPayments.filter(p=>p.payment_date===log.date).length
      }
    };
  }), [historyLogs, purchaseSummary, supplierPaymentSummary, supplierPayments]);

  const filteredHistoryRows = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    return historyRows.filter(row => {
      if (historyStart && row.date < historyStart) return false;
      if (historyEnd && row.date > historyEnd) return false;
      if (historyType !== 'all') {
        const map = {
          sales: row.totalSales > 0,
          expenses: row.totalExpenses > 0 || row.purchaseTotal > 0,
          purchases: row.purchaseTotal > 0,
          supplierPayments: row.supplierPayment > 0,
          credit: row.credit > 0 || row.received > 0,
          staff: row.staff > 0,
          transfers: row.transfers > 0,
          funds: row.fundsIn > 0 || row.repayments > 0
        };
        if (!map[historyType]) return false;
      }
      if (q && ![
        row.date, row.id, JSON.stringify(row.expense_details || {})
      ].join(' ').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [historyRows, historySearch, historyType, historyStart, historyEnd]);

  const historySummary = useMemo(() => ({
    days: filteredHistoryRows.length,
    sales: filteredHistoryRows.reduce((s,r)=>s+r.totalSales,0),
    expenses: filteredHistoryRows.reduce((s,r)=>s+r.totalExpenses,0),
    purchases: filteredHistoryRows.reduce((s,r)=>s+r.purchaseTotal,0),
    cash: filteredHistoryRows.reduce((s,r)=>s+Number(r.total_cash_in_hand||0),0),
    online: filteredHistoryRows.reduce((s,r)=>s+Number(r.total_online_balance||0),0)
  }), [filteredHistoryRows]);

  // --- EXECUTIVE DASHBOARD ---
  const dashboardData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const recent = historyLogs.filter(log => log.date >= analyticsStart && log.date <= analyticsEnd);
    const getSales = (log) => {
      const s = log.expense_details?.sales || {};
      return Number(s.cash || 0) + Number(s.online || 0) + Number(s.parcel_counter_cash || 0) + Number(s.parcel_counter_online || 0) +
        (log.expense_details?.credit_sales || []).reduce((sum, x) => sum + Number(x.amount || 0), 0);
    };
    const getExpenses = (log) => {
      let total = 0;
      (log.expense_details?.online || []).forEach(x => total += Number(x.amount || 0));
      (log.expense_details?.cash || []).forEach(x => {
        if (x.type !== 'Counter' && x.type !== 'Credit' && x.type !== 'Teja' && x.type !== 'Anil') total += Number(x.amount || 0);
      });
      (log.expense_details?.staff || []).forEach(x => total += Number(x.amount || 0));
      return total;
    };
    const todayLog = historyLogs.find(log => log.date === today);
    const periodSales = recent.reduce((sum, log) => sum + getSales(log), 0);
    const periodExpenses = recent.reduce((sum, log) => sum + getExpenses(log), 0);
    const salesByDay = recent.slice().sort((a,b) => a.date.localeCompare(b.date)).slice(-7).map(log => ({
      date: log.date, sales: getSales(log), expenses: getExpenses(log)
    }));
    const creditGiven = recent.reduce((sum, log) => sum + (log.expense_details?.credit_sales || []).reduce((s,x)=>s+Number(x.amount||0),0), 0);
    const creditReceived = recent.reduce((sum, log) => sum + (log.expense_details?.credit_received || []).reduce((s,x)=>s+Number(x.amount||0),0), 0);
    const staffCost = recent.reduce((sum, log) => sum + (log.expense_details?.staff || []).reduce((s,x)=>s+Number(x.amount||0),0), 0);
    const periodPurchases = recent.reduce((sum, log) => sum + Number((purchaseSummary.byDate[log.date] || {}).total || 0), 0);
    const todayPurchases = Number((purchaseSummary.byDate[today] || {}).total || 0);
    return {
      todaySales: todayLog ? getSales(todayLog) : 0,
      todayExpenses: todayLog ? getExpenses(todayLog) : 0,
      todayPurchases,
      todayCash: todayLog ? Number(todayLog.total_cash_in_hand || 0) : 0,
      todayOnline: todayLog ? Number(todayLog.total_online_balance || 0) : 0,
      periodSales, periodExpenses, periodPurchases,
      periodProfit: periodSales - periodExpenses,
      periodProfitAfterPurchases: periodSales - periodExpenses - periodPurchases,
      creditOutstanding: Math.max(0, creditGiven - creditReceived),
      staffCost,
      salesByDay,
      recentTransactions: historyLogs.slice(0, 6), supplierDue: supplierPayableSummary.totalOutstanding
    };
  }, [historyLogs, analyticsStart, analyticsEnd, purchaseSummary, supplierPayableSummary]);

  const cashFlowData = useMemo(() => {
    const rows = {};
    const ensure = date => rows[date] || (rows[date] = {
      date, salesCash:0, salesOnline:0, creditReceived:0, externalFunds:0,
      operatingCash:0, operatingOnline:0, staffCash:0, staffOnline:0,
      purchaseCash:0, purchaseOnline:0, supplierCash:0, supplierOnline:0,
      fundRepayments:0, transfersIn:0, transfersOut:0, net:0
    });
    const addDaily = (date, field, amount) => { if (!date) return; ensure(date)[field] += Number(amount || 0); };

    historyLogs.filter(l => l.date >= analyticsStart && l.date <= analyticsEnd).forEach(log => {
      const d=log.date, sales=log.expense_details?.sales||{};
      addDaily(d,'salesCash',Number(sales.cash||0)+Number(sales.parcel_counter_cash||0));
      addDaily(d,'salesOnline',Number(sales.online||0)+Number(sales.parcel_counter_online||0));
      (log.expense_details?.credit_received||[]).forEach(x=>addDaily(d,'creditReceived',x.amount));
      (log.expense_details?.external_funds||[]).forEach(x=>addDaily(d,'externalFunds',x.amount));
      (log.expense_details?.online||[]).forEach(x=>addDaily(d,'operatingOnline',x.amount));
      (log.expense_details?.cash||[]).forEach(x=>{
        if (!['Counter','Credit','Teja','Anil'].includes(x.type)) addDaily(d,'operatingCash',x.amount);
      });
      (log.expense_details?.staff||[]).forEach(x=>{
        if ((x.method||'Cash')==='Online') addDaily(d,'staffOnline',x.amount);
        else addDaily(d,'staffCash',x.amount);
      });
      (log.expense_details?.fund_repayments||[]).forEach(x=>addDaily(d,'fundRepayments',x.amount));
      (log.expense_details?.account_transfers||[]).forEach(x=>{
        const amount=Number(x.amount||0);
        const from=String(x.from||x.fromAccount||x.source||'').toLowerCase();
        const to=String(x.to||x.toAccount||x.destination||'').toLowerCase();
        if (from.includes('cash') && to.includes('online')) addDaily(d,'transfersOut',amount);
        else if (from.includes('online') && to.includes('cash')) addDaily(d,'transfersIn',amount);
      });
    });

    purchases.filter(p=>p.purchase_date>=analyticsStart && p.purchase_date<=analyticsEnd).forEach(p=>{
      const paid=Number(p.paid_amount||0);
      if(p.payment_method==='Cash') addDaily(p.purchase_date,'purchaseCash',paid);
      if(p.payment_method==='Online') addDaily(p.purchase_date,'purchaseOnline',paid);
    });
    supplierPayments.filter(p=>p.payment_date>=analyticsStart && p.payment_date<=analyticsEnd).forEach(p=>{
      if(p.payment_method==='Cash') addDaily(p.payment_date,'supplierCash',p.amount);
      if(p.payment_method==='Online') addDaily(p.payment_date,'supplierOnline',p.amount);
    });

    const list=Object.values(rows).sort((a,b)=>b.date.localeCompare(a.date)).map(r=>{
      const inflow=r.salesCash+r.salesOnline+r.creditReceived+r.externalFunds;
      const outflow=r.operatingCash+r.operatingOnline+r.staffCash+r.staffOnline+r.purchaseCash+r.purchaseOnline+r.supplierCash+r.supplierOnline+r.fundRepayments;
      return {...r,inflow,outflow,net:inflow-outflow};
    });
    const sum=(key)=>list.reduce((s,r)=>s+r[key],0);
    return {
      rows:list, inflow:sum('inflow'), outflow:sum('outflow'), net:sum('net'),
      salesCash:sum('salesCash'), salesOnline:sum('salesOnline'), creditReceived:sum('creditReceived'),
      externalFunds:sum('externalFunds'), operatingCash:sum('operatingCash'), operatingOnline:sum('operatingOnline'),
      staffCash:sum('staffCash'), staffOnline:sum('staffOnline'), purchaseCash:sum('purchaseCash'), purchaseOnline:sum('purchaseOnline'),
      supplierCash:sum('supplierCash'), supplierOnline:sum('supplierOnline'), fundRepayments:sum('fundRepayments'),
      transfers:sum('transfersIn')-sum('transfersOut')
    };
  }, [historyLogs, purchases, supplierPayments, analyticsStart, analyticsEnd]);
  
  const smartInsights = useMemo(() => {
    const insights = [];
    const sales = Number(analyticsData.totalSales || 0);
    const expenses = Number(analyticsData.totalExpenses || 0);
    const staff = Number(analyticsData.staffCost || 0);
    const purchasesCost = Number(analyticsData.purchaseCosts || 0);
    const profit = sales - expenses - purchasesCost;
    const expenseRatio = sales ? (expenses / sales) * 100 : 0;
    const purchaseRatio = sales ? (purchasesCost / sales) * 100 : 0;
    const receivables = Number(khataSummary.outstanding || 0);
    const payables = Number(supplierPayableSummary.totalOutstanding || 0);
    const cashConversion = sales ? ((Number(cashFlowData.salesCash || 0) + Number(cashFlowData.salesOnline || 0) + Number(cashFlowData.creditReceived || 0)) / sales) * 100 : 0;
    const trend = historyLogs.filter(log => log.date >= analyticsStart && log.date <= analyticsEnd).slice().sort((a,b)=>a.date.localeCompare(b.date)).slice(-10).map(log => { const s=log.expense_details?.sales||{}; return { sales:Number(s.cash||0)+Number(s.online||0)+Number(s.parcel_counter_cash||0)+Number(s.parcel_counter_online||0)+(log.expense_details?.credit_sales||[]).reduce((sum,x)=>sum+Number(x.amount||0),0) }; }).filter(x => x.sales > 0);
    const firstSales = trend.length ? Number(trend[0].sales || 0) : 0;
    const lastSales = trend.length ? Number(trend[trend.length - 1].sales || 0) : 0;
    const salesTrend = firstSales ? ((lastSales - firstSales) / firstSales) * 100 : 0;

    if (!sales) insights.push({type:'info', icon:'📊', title:'No sales recorded', text:'There is no sales activity in the selected period. Record daily sales to unlock meaningful performance insights.', action:'daily'});
    if (sales && profit < 0) insights.push({type:'danger', icon:'🔴', title:'Profit is negative', text:`The selected period is showing a loss of ${formatINR(Math.abs(profit))}. Review operating expenses and purchase costs before adding new commitments.`, action:'analytics'});
    else if (sales && profit > 0) insights.push({type:'success', icon:'🟢', title:'Business is profitable', text:`Estimated profit after purchases is ${formatINR(profit)}, a ${((profit / sales) * 100).toFixed(1)}% margin on sales.`, action:'analytics'});

    if (sales && expenseRatio > 35) insights.push({type:'warning', icon:'⚠️', title:'Operating expenses are elevated', text:`Operating expenses are ${expenseRatio.toFixed(1)}% of sales. Review recurring and discretionary expenses for savings opportunities.`, action:'analytics'});
    if (sales && purchaseRatio > 25) insights.push({type:'warning', icon:'🛒', title:'Purchase costs are high', text:`Purchases represent ${purchaseRatio.toFixed(1)}% of sales. Check supplier pricing, wastage and stock usage.`, action:'inventory'});
    if (receivables > 0 && sales && receivables / sales > 0.5) insights.push({type:'warning', icon:'📒', title:'Receivables need attention', text:`Customer credit outstanding is ${formatINR(receivables)}, above half of the selected-period sales. Prioritize collections.`, action:'ledger'});
    if (payables > 0 && purchasesCost > 0 && payables / purchasesCost > 0.35) insights.push({type:'warning', icon:'📦', title:'Supplier exposure is building', text:`Supplier payables are ${formatINR(payables)}, more than 35% of selected-period purchases. Plan settlements around cash availability.`, action:'inventory'});
    if (sales && cashConversion < 70) insights.push({type:'warning', icon:'💵', title:'Cash conversion is weak', text:`Only ${cashConversion.toFixed(1)}% of recorded sales have converted to collected cash/online receipts in the selected period.`, action:'cashflow'});
    if (Math.abs(salesTrend) >= 10) insights.push({type:salesTrend > 0 ? 'success' : 'warning', icon:salesTrend > 0 ? '📈' : '📉', title:salesTrend > 0 ? 'Sales momentum is improving' : 'Sales momentum is declining', text:`The recent sales trend has moved ${Math.abs(salesTrend).toFixed(1)}% ${salesTrend > 0 ? 'up' : 'down'} from the start to the latest available day in the dashboard trend.`, action:'analytics'});
    if (supplierPayableSummary.due30 > 0) insights.push({type:'danger', icon:'⏰', title:'Aged supplier balances', text:`${supplierPayableSummary.due30} supplier balance${supplierPayableSummary.due30 === 1 ? '' : 's'} are 30+ days old. Review the supplier statement and settle priority accounts.`, action:'inventory'});
    if (staff > 0 && sales && staff / sales > 0.2) insights.push({type:'info', icon:'👥', title:'Staff cost is material', text:`Staff cost is ${((staff / sales) * 100).toFixed(1)}% of sales for the selected period. Track staffing against sales volume.`, action:'payroll'});

    const priority = {danger:0, warning:1, info:2, success:3};
    return insights.sort((a,b) => priority[a.type] - priority[b.type]).slice(0, 6);
  }, [analyticsData, khataSummary, supplierPayableSummary, cashFlowData, historyLogs, analyticsStart, analyticsEnd]);

  const financialDashboardData = useMemo(() => {
    const sales = Number(analyticsData.totalSales || 0);
    const operatingExpenses = Number(analyticsData.totalExpenses || 0);
    const staffCost = Number(analyticsData.staffCost || 0);
    const purchaseCosts = Number(analyticsData.purchaseCosts || 0);
    const totalCosts = operatingExpenses + purchaseCosts;
    const profitAfterPurchases = sales - totalCosts;
    const receivables = Number(khataSummary.outstanding || 0);
    const payables = Number(supplierPayableSummary.totalOutstanding || 0);
    const trend = historyLogs
      .filter(log => log.date >= analyticsStart && log.date <= analyticsEnd)
      .slice()
      .sort((a,b)=>a.date.localeCompare(b.date))
      .slice(-10)
      .map(log => {
        const s=log.expense_details?.sales||{};
        const daySales=Number(s.cash||0)+Number(s.online||0)+Number(s.parcel_counter_cash||0)+Number(s.parcel_counter_online||0)+
          (log.expense_details?.credit_sales||[]).reduce((sum,x)=>sum+Number(x.amount||0),0);
        const dayOperating=(log.expense_details?.online||[]).reduce((sum,x)=>sum+Number(x.amount||0),0)+
          (log.expense_details?.cash||[]).reduce((sum,x)=>['Counter','Credit','Teja','Anil'].includes(x.type)?sum:sum+Number(x.amount||0),0)+
          (log.expense_details?.staff||[]).reduce((sum,x)=>sum+Number(x.amount||0),0);
        const dayPurchases=Number((purchaseSummary.byDate[log.date]||{}).total||0);
        return {date:log.date,sales:daySales,totalCosts:dayOperating+dayPurchases};
      });
    const cashCollected = Number(cashFlowData.salesCash||0)+Number(cashFlowData.salesOnline||0)+Number(cashFlowData.creditReceived||0);
    return {
      sales, operatingExpenses, staffCost, purchaseCosts, totalCosts, profitAfterPurchases,
      profitMargin: sales ? ((profitAfterPurchases/sales)*100).toFixed(1) : '0.0',
      expenseRatio: sales ? ((operatingExpenses/sales)*100).toFixed(1) : '0.0',
      purchaseRatio: sales ? ((purchaseCosts/sales)*100).toFixed(1) : '0.0',
      staffShare: operatingExpenses ? ((staffCost/operatingExpenses)*100).toFixed(1) : '0.0',
      cashConversion: sales ? Math.min(999,((cashCollected/sales)*100)).toFixed(1) : '0.0',
      receivables, payables,
      customersDue:Number(khataSummary.customersWithDue||0),
      suppliersDue:Number(supplierPayableSummary.suppliersDue||0),
      workingCapitalExposure: receivables-payables,
      todayLiquidFunds:Number(dashboardData.todayCash||0)+Number(dashboardData.todayOnline||0),
      netCashMovement:Number(cashFlowData.net||0),
      daysWithSales:trend.filter(x=>x.sales>0).length,
      trend
    };
  }, [analyticsData, khataSummary, supplierPayableSummary, historyLogs, analyticsStart, analyticsEnd, purchaseSummary, cashFlowData, dashboardData]);

  const businessAlerts = useMemo(() => {
    const alerts = [];
    const today = new Date().toISOString().split('T')[0];

    const overdueFunds = fundLedger.filter(f => f.status === 'Overdue');
    overdueFunds.slice(0, 3).forEach(f => alerts.push({
      type: 'danger', icon: '🏦', title: 'Fund repayment overdue',
      text: `${f.source} has ${formatINR(f.outstanding)} outstanding and is past its due date.`,
      action: 'sources'
    }));

    if (khataSummary.outstanding > 0) {
      const topCustomer = khataCustomers.find(c => c.balance > 0);
      alerts.push({
        type: 'warning', icon: '📒', title: 'Customer credit outstanding',
        text: `${formatINR(khataSummary.outstanding)} is currently outstanding across ${khataSummary.customersWithDue} customer${khataSummary.customersWithDue === 1 ? '' : 's'}.${topCustomer ? ` ${topCustomer.name} is highest at ${formatINR(topCustomer.balance)}.` : ''}`,
        action: 'ledger'
      });
    }

    if (supplierPayableSummary.totalOutstanding > 0) alerts.push({type:'warning', icon:'📦', title:'Supplier payments pending', text:`${formatINR(supplierPayableSummary.totalOutstanding)} is currently payable across ${supplierPayableSummary.suppliersDue} supplier${supplierPayableSummary.suppliersDue===1?'':'s'}.`, action:'inventory'});
    if (supplierPayableSummary.due30 > 0) alerts.push({type:'danger', icon:'⏰', title:'Supplier dues are aging', text:`${supplierPayableSummary.due30} supplier${supplierPayableSummary.due30===1?' has':'s have'} balances that are 30+ days old.`, action:'inventory'});

    const payrollDue = payrollRows.reduce((sum, r) => sum + Number(r.totalBalanceToPay || 0), 0);
    if (payrollDue > 0) {
      alerts.push({
        type: 'warning', icon: '💰', title: 'Payroll balance pending',
        text: `${formatINR(payrollDue)} is currently due across employee payroll for ${payrollMonth}.`,
        action: 'payroll'
      });
    }

    if (analyticsData.totalSales > 0 && (analyticsData.totalExpenses + analyticsData.purchaseCosts) > analyticsData.totalSales * 0.75) {
      alerts.push({
        type: 'warning', icon: '📉', title: 'Expense pressure is high',
        text: `Recorded expenses plus purchases are ${Math.round(((analyticsData.totalExpenses + analyticsData.purchaseCosts) / analyticsData.totalSales) * 100)}% of sales for the selected analytics period.`,
        action: 'analytics'
      });
    }

    const todaySaved = historyLogs.some(log => log.date === today);
    if (!todaySaved) {
      alerts.push({
        type: 'info', icon: '📝', title: 'Today’s accounts are not saved',
        text: `No daily accounting record was found for ${today}. Enter today’s sales and expenses when the day is ready.`,
        action: 'daily'
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        type: 'success', icon: '✅', title: 'No priority alerts',
        text: 'Your current accounting data does not show any immediate items requiring attention.',
        action: 'analytics'
      });
    }

    return alerts.slice(0, 6);
  }, [fundLedger, khataSummary, khataCustomers, payrollRows, payrollMonth, analyticsData, historyLogs, purchaseSummary, supplierPayableSummary]);

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
        <style>{dashboardCommandStyles}</style>
        <style>{collapsibleStyles}</style>
        <style>{smartInsightsStyles}</style>
        <style>{dailyUiStyles}</style>
        <style>{historyUiStyles}</style>
        <style>{alertUiStyles}</style>
        <style>{expenseUiStyles}</style>
        <style>{khataUiStyles}</style>
        <style>{fundUiStyles}</style>
        <style>{payrollUiStyles}</style>\n        <style>{staffManagementStyles}</style>
      <style>{payablesUiStyles}</style><style>{cashflowUiStyles}</style>{}<style>{inventoryUiStyles}</style>\n        <style>{analyticsUiStyles}</style>
        <style>{aiUiStyles}</style>
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
        .va-daily-command-bar{display:flex;align-items:center;gap:16px;background:#0f172a;color:#fff;border-radius:16px;padding:13px 16px;margin-bottom:18px;box-shadow:0 10px 28px rgba(15,23,42,.12);flex-wrap:wrap}.va-command-item{display:flex;align-items:center;gap:9px}.va-command-icon{width:34px;height:34px;border-radius:10px;background:#1e293b;display:flex;align-items:center;justify-content:center}.va-command-item small{display:block;color:#94a3b8;font-size:9px;font-weight:900;letter-spacing:.08em}.va-command-item strong{display:block;font-size:14px;margin-top:2px}.va-command-divider{width:1px;height:28px;background:#334155}.va-command-actions{margin-left:auto;display:flex;gap:7px}.va-command-actions button{border:1px solid #475569;background:#1e293b;color:#fff;border-radius:9px;padding:8px 11px;font-weight:800;cursor:pointer}.va-command-actions button:hover{background:#334155}
        .va-dashboard{display:flex;flex-direction:column;gap:18px}
        .va-dashboard-hero{background:linear-gradient(135deg,#0f172a,#1e3a5f 65%,#0f766e);color:#fff;border-radius:22px;padding:28px;display:flex;justify-content:space-between;align-items:center;gap:20px;box-shadow:0 18px 45px rgba(15,23,42,.16)}
        .va-dashboard-hero h2{font-size:30px;margin:6px 0}.va-dashboard-hero p{margin:0;color:#cbd5e1;font-size:14px}
        .va-dashboard-filter{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:14px 18px;display:flex;justify-content:space-between;gap:16px;align-items:center}.va-dashboard-filter strong{display:block}.va-dashboard-filter span{display:block;color:#64748b;font-size:12px;margin-top:3px}.va-dashboard-dates{display:flex;align-items:center;gap:8px;min-width:430px}.va-dashboard-dates input{max-width:145px}
        .va-dashboard-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.va-dash-kpi{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:17px;box-shadow:0 7px 22px rgba(15,23,42,.05);border-top:4px solid #64748b}.va-dash-kpi span{font-size:12px;color:#64748b;font-weight:800}.va-dash-kpi strong{display:block;font-size:22px;margin-top:8px;color:#0f172a}.va-dash-kpi small{display:block;color:#94a3b8;margin-top:5px}.va-dash-kpi.sales{border-top-color:#2563eb}.va-dash-kpi.cash{border-top-color:#16a34a}.va-dash-kpi.online{border-top-color:#0ea5e9}.va-dash-kpi.expense{border-top-color:#ef4444}.va-dash-kpi.profit{border-top-color:#f59e0b}
        .va-dashboard-grid{display:grid;grid-template-columns:1.35fr .85fr;gap:18px}.va-dashboard-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:20px;box-shadow:0 8px 25px rgba(15,23,42,.055)}.va-dashboard-card-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px}.va-dashboard-card-head h3{margin:4px 0;font-size:18px}.va-dashboard-badge{background:#eff6ff;color:#1d4ed8;padding:8px 10px;border-radius:10px;font-weight:800;font-size:12px}.va-bars{height:190px;display:flex;align-items:flex-end;justify-content:space-around;gap:12px;border-bottom:1px solid #e2e8f0;padding:10px 8px 0}.va-bar-day{height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:7px;font-size:10px;color:#64748b}.va-bar-stack{height:160px;display:flex;align-items:flex-end;gap:3px}.va-bar{width:13px;border-radius:5px 5px 2px 2px;min-height:5px}.sales-bar{background:#2563eb}.expense-bar{background:#f97316}.va-chart-legend{display:flex;gap:18px;margin-top:12px;font-size:11px;color:#64748b}.va-chart-legend i{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:5px}.legend-sales{background:#2563eb}.legend-expense{background:#f97316}
        .va-dashboard-list{display:flex;flex-direction:column;gap:10px}.va-dashboard-list>div{display:flex;justify-content:space-between;gap:12px;padding:12px;background:#f8fafc;border-radius:11px}.va-dashboard-list span{color:#475569;font-size:13px}.va-dashboard-list strong{font-size:14px}.success-text{color:#059669!important}.danger-text{color:#dc2626!important}.va-dashboard-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}.va-dashboard-actions button,.va-link-btn{border:1px solid #e2e8f0;background:#fff;padding:9px 10px;border-radius:9px;color:#334155;font-weight:800;cursor:pointer}.va-dashboard-actions button:hover,.va-link-btn:hover{background:#f8fafc}.va-link-btn{color:#2563eb;border:0}.va-empty-state{padding:35px;text-align:center;color:#94a3b8;background:#f8fafc;border-radius:12px}.va-recent-table{overflow:auto}.va-recent-row{display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr 80px;gap:10px;align-items:center;padding:12px 8px;border-bottom:1px solid #eef2f7;font-size:12px}.va-recent-row.head{font-weight:800;color:#64748b;background:#f8fafc;border-radius:8px}.va-recent-row strong{color:#0f172a}
        .va-feature-card { background:#fff; border:1px solid #e5e7eb; border-radius:16px; padding:22px; box-shadow:0 8px 24px rgba(15,23,42,.06); margin-bottom:20px; }
        .va-feature-grid { display:flex; flex-direction:column; gap:10px; margin:16px 0; }
        .va-feature-row { display:grid; grid-template-columns:1fr 30px 1fr 1fr 1.4fr 38px; gap:10px; align-items:center; padding:10px; background:#f8fafc; border:1px solid #e5e7eb; border-radius:12px; }
        .va-fund-row { grid-template-columns:1.2fr 1fr 1fr 1fr 1fr 1.2fr 38px; }
        .va-transfer-arrow { text-align:center; font-size:20px; font-weight:900; color:#2563eb; }
        .va-feature-note { margin-top:14px; padding:12px 14px; border-radius:10px; background:#eff6ff; color:#1e40af; font-size:13px; line-height:1.5; }
        .va-main { flex:1; min-width:0; padding:24px; }
        .va-topbar { display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:20px; }
        .va-page-title { margin:0; font-size:25px; font-weight:900; color:#111827; }
        .va-page-subtitle { margin:5px 0 0; color:#64748b; font-size:13px; }
        .va-status { display:flex; align-items:center; gap:8px; background:white; border:1px solid #e5e7eb; padding:9px 12px; border-radius:10px; font-size:12px; color:#475569; box-shadow:0 4px 14px rgba(15,23,42,.04); }
        .va-dot { width:8px; height:8px; border-radius:50%; background:#22c55e; }
        .va-mobile-nav { display:none; }
        .va-menu-toggle{position:fixed;top:18px;left:18px;z-index:1100;width:44px;height:44px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;color:#0f172a;box-shadow:0 8px 22px rgba(15,23,42,.12);cursor:pointer;font-size:21px;font-weight:900;display:flex;align-items:center;justify-content:center}.va-sidebar-close{display:none;margin-left:auto;border:0;background:transparent;color:#cbd5e1;font-size:28px;line-height:1;cursor:pointer}.sidebar-collapsed .va-sidebar{transform:translateX(-100%);width:0;min-width:0;padding:0;overflow:hidden}.va-sidebar{transition:width .25s ease, min-width .25s ease, transform .25s ease, padding .25s ease}.va-main{transition:padding-left .25s ease}.sidebar-open .va-main{padding-left:78px}.sidebar-collapsed .va-main{padding-left:78px}.va-sidebar-overlay{display:none}.va-menu-toggle:hover{background:#f8fafc;transform:translateY(-1px)}
        @media (max-width: 1100px){.va-dashboard-kpis{grid-template-columns:repeat(3,1fr)}.va-dashboard-grid{grid-template-columns:1fr}}
        @media (max-width: 650px){.va-dashboard-hero{display:block}.va-dashboard-hero button{margin-top:16px;width:100%}.va-dashboard-filter{display:block}.va-dashboard-dates{min-width:0;margin-top:12px;flex-wrap:wrap}.va-dashboard-dates input{max-width:none;flex:1}.va-dashboard-kpis{grid-template-columns:repeat(2,1fr)}.va-dashboard-actions{grid-template-columns:1fr}.va-recent-row{min-width:700px}}
        @media (max-width: 850px){.va-menu-toggle{top:10px;left:10px}.va-sidebar{position:fixed!important;z-index:1050;left:0;top:0;width:280px!important;min-width:280px!important;height:100vh!important;padding:18px 14px!important;transform:translateX(-100%);box-shadow:16px 0 40px rgba(15,23,42,.2)}.sidebar-open .va-sidebar{transform:translateX(0)}.sidebar-collapsed .va-sidebar{width:280px!important;min-width:280px!important;padding:18px 14px!important;transform:translateX(-100%)}.sidebar-open .va-sidebar-overlay{display:block;position:fixed;inset:0;background:rgba(15,23,42,.42);z-index:1040}.va-sidebar-close{display:block}.va-brand{padding:5px 8px 18px!important;margin-bottom:16px!important}.va-nav{display:flex!important;flex-direction:column!important}.va-nav button{text-align:left!important;padding:12px 13px!important;font-size:14px!important}.va-logout{margin-top:auto!important}.va-main,.sidebar-open .va-main,.sidebar-collapsed .va-main{padding:64px 14px 14px!important}.va-topbar{align-items:flex-start}.va-page-title{font-size:21px}}

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
      <div className={`va-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
        <button className="va-menu-toggle" onClick={() => setSidebarOpen(v => !v)} aria-label={sidebarOpen ? 'Hide menu' : 'Open menu'}>
          {sidebarOpen ? '☰' : '☰'}
        </button>
        <div className="va-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        <aside className="va-sidebar">
          <div className="va-brand">
            <img src="https://cdn-icons-png.flaticon.com/512/3170/3170733.png" alt="Vintage Accounts"/>
            <div>
              <div className="va-brand-title">Vintage Accounts</div>
              <div className="va-brand-sub">Restaurant Finance</div>
            </div>
            <button className="va-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Hide menu">×</button>
          </div>
          <div className="va-nav">
            {[
              ['dashboard','🏠','Dashboard'],
              ['daily','📝','Daily Accounting'],
              ['funds','🔄','Money Transfers'],
              ['sources','🏦','Fund Sources'],
              ['inventory','📦','Purchases & Inventory'],
              ['ledger','📒','Customer Khata'],
              ['history','📋','History'],
              ['analytics','📈','Analytics'],
              ['cashflow','💵','Cash Flow'],
              ['ai','✨','AI Assistant'],
              ['attendance','👥','Attendance'],
              ['payroll','💰','Employee Payroll'],
              ['tasks','🔔','Reminders']
            ].map(([tab,icon,label]) => (
              <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => { setActiveTab(tab); if (window.innerWidth <= 850) setSidebarOpen(false); }}>
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
                {activeTab === 'dashboard' ? 'Dashboard' :
                 activeTab === 'daily' ? 'Daily Accounting' :
                 activeTab === 'funds' ? 'Money Transfers' :
                 activeTab === 'sources' ? 'Fund Sources' :
                 activeTab === 'inventory' ? 'Purchases & Inventory' :
                 activeTab === 'ledger' ? 'Customer Khata' :
                 activeTab === 'history' ? 'Transaction History' :
                 activeTab === 'analytics' ? 'Business Analytics' :
                 activeTab === 'cashflow' ? 'Cash Flow Management' :
                 activeTab === 'ai' ? 'AI Business Assistant' :
                 activeTab === 'attendance' ? 'Employee Attendance' :
                 activeTab === 'payroll' ? 'Employee Payroll' : 'Reminders'}
              </h1>
              <p className="va-page-subtitle">Vintage Restaurant • Manage sales, cash, expenses and staff in one place</p>
            </div>
            <div className="va-status"><span className="va-dot"></span> System Online</div>
          </div>

      {activeTab === 'dashboard' && (
        <div className="va-dashboard va-financial-dashboard">
          <div className="va-financial-hero">
            <div>
              <span className="va-eyebrow">FINANCIAL CONTROL CENTER</span>
              <h2>Restaurant Financial Dashboard</h2>
              <p>One view of sales, operating costs, purchases, payroll, receivables, payables and real cash movement.</p>
            </div>
            <div className="va-financial-hero-actions">
              <button onClick={() => setActiveTab('daily')}>＋ Daily Accounts</button>
              <button onClick={() => setActiveTab('cashflow')}>💵 Cash Flow</button>
              <button onClick={() => setActiveTab('analytics')}>📈 Full Analytics</button>
            </div>
          </div>

          <div className="va-dashboard-filter va-financial-filter">
            <div><strong>Management period</strong><span>All performance metrics below follow this date range. Outstanding balances are current balances.</span></div>
            <div className="va-dashboard-dates">
              <input type="date" value={analyticsStart} onChange={e=>setAnalyticsStart(e.target.value)} style={inputStyle}/>
              <span>to</span>
              <input type="date" value={analyticsEnd} onChange={e=>setAnalyticsEnd(e.target.value)} style={inputStyle}/>
            </div>
          </div>

          <div className="va-financial-kpis">
            <div className="primary"><span>Total Sales</span><strong>{formatINR(financialDashboardData.sales)}</strong><small>Including credit sales</small></div>
            <div><span>Operating Expenses</span><strong>{formatINR(financialDashboardData.operatingExpenses)}</strong><small>Operating + staff</small></div>
            <div><span>Purchase Costs</span><strong>{formatINR(financialDashboardData.purchaseCosts)}</strong><small>Inventory acquired</small></div>
            <div className={financialDashboardData.profitAfterPurchases >= 0 ? 'positive' : 'negative'}><span>Profit After Purchases</span><strong>{formatINR(financialDashboardData.profitAfterPurchases)}</strong><small>{financialDashboardData.profitMargin}% margin</small></div>
            <div><span>Net Cash Movement</span><strong>{formatINR(financialDashboardData.netCashMovement)}</strong><small>Actual inflows − outflows</small></div>
            <div className={financialDashboardData.receivables > 0 ? 'warning' : 'positive'}><span>Customer Receivables</span><strong>{formatINR(financialDashboardData.receivables)}</strong><small>{financialDashboardData.customersDue} customers due</small></div>
            <div className={financialDashboardData.payables > 0 ? 'warning' : 'positive'}><span>Supplier Payables</span><strong>{formatINR(financialDashboardData.payables)}</strong><small>{financialDashboardData.suppliersDue} suppliers due</small></div>
            <div><span>Working Capital Exposure</span><strong>{formatINR(financialDashboardData.workingCapitalExposure)}</strong><small>Receivables − payables</small></div>
          </div>

          <div className="va-financial-grid va-financial-top-grid">
            <section className={`va-dashboard-card va-financial-card va-collapsible-section ${collapsedSections.profitBridge?'collapsed':''}`}>
              <div className="va-dashboard-card-head va-collapsible-head">
                <div><span className="va-eyebrow">PROFIT BRIDGE</span><h3>💰 Where the Money Went</h3><button className="va-collapse-btn" onClick={()=>toggleSection('profitBridge')} aria-label={collapsedSections.profitBridge?'Expand section':'Collapse section'}>{collapsedSections.profitBridge?'⌄':'⌃'}</button></div>
                <span className={'va-financial-pill '+(financialDashboardData.profitAfterPurchases>=0?'good':'bad')}>{financialDashboardData.profitAfterPurchases>=0?'Profitable':'Loss period'}</span>
              </div>
              {!collapsedSections.profitBridge && <div className="va-collapsible-body"><div className="va-profit-bridge">
                <div><span>Sales</span><strong>{formatINR(financialDashboardData.sales)}</strong></div>
                <i>−</i>
                <div><span>Operating + Staff</span><strong>{formatINR(financialDashboardData.operatingExpenses)}</strong></div>
                <i>−</i>
                <div><span>Purchases</span><strong>{formatINR(financialDashboardData.purchaseCosts)}</strong></div>
                <i>=</i>
                <div className={financialDashboardData.profitAfterPurchases>=0?'result-good':'result-bad'}><span>Profit</span><strong>{formatINR(financialDashboardData.profitAfterPurchases)}</strong></div>
              </div>
              <div className="va-financial-ratios">
                <div><span>Expense ratio</span><strong>{financialDashboardData.expenseRatio}%</strong></div>
                <div><span>Purchase ratio</span><strong>{financialDashboardData.purchaseRatio}%</strong></div>
                <div><span>Staff share of costs</span><strong>{financialDashboardData.staffShare}%</strong></div>
                <div><span>Cash conversion</span><strong>{financialDashboardData.cashConversion}%</strong></div>
              </div>              </div>}
            </section>

            <section className={`va-dashboard-card va-financial-card va-collapsible-section ${collapsedSections.liquidity?'collapsed':''}`}>
              <div className="va-dashboard-card-head va-collapsible-head"><div><span className="va-eyebrow">LIQUIDITY</span><h3>🏦 Current Money Position</h3><button className="va-collapse-btn" onClick={()=>toggleSection('liquidity')} aria-label={collapsedSections.liquidity?'Expand section':'Collapse section'}>{collapsedSections.liquidity?'⌄':'⌃'}</button></div></div>
              {!collapsedSections.liquidity && <div className="va-collapsible-body"><div className="va-liquidity-main"><span>Today's available balances</span><strong>{formatINR(financialDashboardData.todayLiquidFunds)}</strong></div>
              <div className="va-liquidity-row"><span>💵 Cash in hand</span><strong>{formatINR(dashboardData.todayCash)}</strong></div>
              <div className="va-liquidity-row"><span>💳 Online balance</span><strong>{formatINR(dashboardData.todayOnline)}</strong></div>
              <div className="va-liquidity-row"><span>📒 Customer receivables</span><strong className="warning-text">{formatINR(financialDashboardData.receivables)}</strong></div>
              <div className="va-liquidity-row"><span>📦 Supplier payables</span><strong className="danger-text">{formatINR(financialDashboardData.payables)}</strong></div>
              <div className="va-liquidity-note">Receivables are money expected from customers; payables are money still owed to suppliers. Neither is treated as today's cash.</div>              </div>}
            </section>
          </div>

                    <div className={`va-smart-insights va-collapsible-section ${collapsedSections.smartInsights?'collapsed':''}`}>
            <div className="va-smart-insights-head">
              <div><span className="va-eyebrow">SMART BUSINESS INTELLIGENCE</span><h3>What needs your attention?</h3><p>Automatic recommendations based on the selected financial period.</p></div><button className="va-collapse-btn" onClick={()=>toggleSection('smartInsights')} aria-label={collapsedSections.smartInsights?'Expand Smart Business Intelligence':'Collapse Smart Business Intelligence'}>{collapsedSections.smartInsights?'⌄':'⌃'}</button>
              <span className="va-smart-insights-badge">LIVE</span>
            </div>
            {!collapsedSections.smartInsights && <>{smartInsights.length === 0 ? <div className="va-smart-empty">No immediate issues detected. Your current indicators are within the dashboard thresholds.</div> : (
              <div className="va-smart-grid">
                {smartInsights.map((item,i) => (
                  <div key={i} className={`va-smart-card ${item.type}`}>
                    <div className="va-smart-icon">{item.icon}</div>
                    <div className="va-smart-body"><strong>{item.title}</strong><p>{item.text}</p><button onClick={() => setActiveTab(item.action)}>Review →</button></div>
                  </div>
                ))}
              </div>
            )}          </>}
          </div>

<div className="va-financial-grid">
            <section className={`va-dashboard-card va-financial-card va-collapsible-section ${collapsedSections.cashflow?'collapsed':''}`}>
              <div className="va-dashboard-card-head va-collapsible-head"><div><span className="va-eyebrow">CASH FLOW</span><h3>💵 Actual Cash Movement</h3><button className="va-collapse-btn" onClick={()=>toggleSection('cashflow')} aria-label={collapsedSections.cashflow?'Expand section':'Collapse section'}>{collapsedSections.cashflow?'⌄':'⌃'}</button></div><button className="va-link-btn" onClick={()=>setActiveTab('cashflow')}>Open Cash Flow →</button></div>
              {!collapsedSections.cashflow && <div className="va-collapsible-body"><div className="va-cashflow-summary">
                <div className="in"><span>Total inflow</span><strong>{formatINR(cashFlowData.inflow)}</strong></div>
                <div className="out"><span>Total outflow</span><strong>{formatINR(cashFlowData.outflow)}</strong></div>
                <div className={cashFlowData.net>=0?'net-good':'net-bad'}><span>Net movement</span><strong>{formatINR(cashFlowData.net)}</strong></div>
              </div>
              <div className="va-flow-bars">
                <div><span>Sales collected</span><b>{formatINR(cashFlowData.salesCash+cashFlowData.salesOnline+cashFlowData.creditReceived)}</b><i style={{width:Math.min(100,financialDashboardData.sales ? ((cashFlowData.salesCash+cashFlowData.salesOnline+cashFlowData.creditReceived)/financialDashboardData.sales)*100:0)+'%'}}></i></div>
                <div><span>Operating + staff</span><b>{formatINR(cashFlowData.operatingCash+cashFlowData.operatingOnline+cashFlowData.staffCash+cashFlowData.staffOnline)}</b><i style={{width:Math.min(100,cashFlowData.inflow ? ((cashFlowData.operatingCash+cashFlowData.operatingOnline+cashFlowData.staffCash+cashFlowData.staffOnline)/cashFlowData.inflow)*100:0)+'%'}}></i></div>
                <div><span>Purchase + supplier settlement</span><b>{formatINR(cashFlowData.purchaseCash+cashFlowData.purchaseOnline+cashFlowData.supplierCash+cashFlowData.supplierOnline)}</b><i style={{width:Math.min(100,cashFlowData.inflow ? ((cashFlowData.purchaseCash+cashFlowData.purchaseOnline+cashFlowData.supplierCash+cashFlowData.supplierOnline)/cashFlowData.inflow)*100:0)+'%'}}></i></div>
              </div>
              <div className="va-financial-footnote">Internal Cash ↔ Online transfers are excluded from net cash movement because they move money between your own accounts.</div>              </div>}
            </section>

            <section className={`va-dashboard-card va-financial-card va-collapsible-section ${collapsedSections.workingCapital?'collapsed':''}`}>
              <div className="va-dashboard-card-head va-collapsible-head"><div><span className="va-eyebrow">WORKING CAPITAL</span><h3>📊 Receivables vs Payables</h3><button className="va-collapse-btn" onClick={()=>toggleSection('workingCapital')} aria-label={collapsedSections.workingCapital?'Expand section':'Collapse section'}>{collapsedSections.workingCapital?'⌄':'⌃'}</button></div></div>
              {!collapsedSections.workingCapital && <div className="va-collapsible-body"><div className="va-balance-compare">
                <div><span>Customer money to collect</span><strong className="warning-text">{formatINR(financialDashboardData.receivables)}</strong><small>{financialDashboardData.customersDue} customers with outstanding credit</small></div>
                <div><span>Supplier money to pay</span><strong className="danger-text">{formatINR(financialDashboardData.payables)}</strong><small>{financialDashboardData.suppliersDue} suppliers with outstanding balances</small></div>
              </div>
              <div className="va-working-capital-result"><span>Net working-capital exposure</span><strong className={financialDashboardData.workingCapitalExposure>=0?'success-text':'danger-text'}>{formatINR(financialDashboardData.workingCapitalExposure)}</strong></div>
              <div className="va-financial-actions"><button onClick={()=>setActiveTab('ledger')}>📒 Collect Customer Dues</button><button onClick={()=>{setActiveTab('inventory');setInventoryView('suppliers')}}>📦 Settle Supplier Dues</button></div>              </div>}
            </section>
          </div>

          <div className="va-financial-grid">
            <section className={`va-dashboard-card va-financial-card va-collapsible-section ${collapsedSections.periodTrend?'collapsed':''}`}>
              <div className="va-dashboard-card-head va-collapsible-head"><div><span className="va-eyebrow">PERIOD TREND</span><h3>📈 Sales vs Total Costs</h3><button className="va-collapse-btn" onClick={()=>toggleSection('periodTrend')} aria-label={collapsedSections.periodTrend?'Expand section':'Collapse section'}>{collapsedSections.periodTrend?'⌄':'⌃'}</button></div><span className="va-dashboard-badge">{financialDashboardData.daysWithSales} selling days</span></div>
              {!collapsedSections.periodTrend && <div className="va-collapsible-body"><div className="va-financial-trend">
                {financialDashboardData.trend.length===0 ? <div className="va-empty-state">No saved daily accounts in this period yet.</div> : financialDashboardData.trend.map(row => {
                  const max=Math.max(...financialDashboardData.trend.map(x=>Math.max(x.sales,x.totalCosts)),1);
                  return <div className="va-financial-trend-day" key={row.date}>
                    <div className="va-financial-trend-bars"><i className="sales" style={{height:Math.max(7,row.sales/max*145)}}></i><i className="costs" style={{height:Math.max(5,row.totalCosts/max*145)}}></i></div>
                    <small>{row.date.slice(5)}</small>
                    <span>{formatINR(row.sales)}</span>
                  </div>;
                })}
              </div>
              <div className="va-chart-legend"><span><i className="legend-sales"></i> Sales</span><span><i className="legend-expense"></i> Total costs</span></div>              </div>}
            </section>

            <section className="va-dashboard-card va-financial-card">
              <div className="va-dashboard-card-head"><div><span className="va-eyebrow">PEOPLE & INVENTORY</span><h3>👥 Cost Control</h3></div></div>
              <div className="va-control-row"><span>Staff cost</span><strong>{formatINR(financialDashboardData.staffCost)}</strong></div>
              <div className="va-control-row"><span>Purchase costs</span><strong>{formatINR(financialDashboardData.purchaseCosts)}</strong></div>
              <div className="va-control-row"><span>Operating expenses</span><strong>{formatINR(financialDashboardData.operatingExpenses)}</strong></div>
              <div className="va-control-row"><span>Total tracked costs</span><strong>{formatINR(financialDashboardData.totalCosts)}</strong></div>
              <div className="va-control-note">{financialDashboardData.sales ? (financialDashboardData.profitAfterPurchases>=0 ? '✅ Costs are currently below sales for the selected period.' : '⚠️ Total tracked costs are above sales. Review expenses and purchasing.') : '📝 Save daily accounts to activate cost analysis.'}</div>
              <div className="va-financial-actions"><button onClick={()=>setActiveTab('payroll')}>💰 Review Payroll</button><button onClick={()=>setActiveTab('inventory')}>📦 Review Purchases</button></div>
            </section>
          </div>

          <div className="va-dashboard-card va-financial-card va-financial-alert-card">
            <div className="va-dashboard-card-head"><div><span className="va-eyebrow">ACTION QUEUE</span><h3>🔔 What Needs Attention</h3></div><span className="va-dashboard-badge">{businessAlerts.length} active</span></div>
            <div className="va-alert-list">{businessAlerts.map((alert,index)=><button key={index} className={'va-alert-item '+alert.type} onClick={()=>setActiveTab(alert.action)}><span className="va-alert-icon">{alert.icon}</span><span className="va-alert-copy"><strong>{alert.title}</strong><small>{alert.text}</small></span><span className="va-alert-arrow">→</span></button>)}</div>
          </div>
        </div>
      )}

      {activeTab === 'funds' && (
        <div className="va-feature-card">
          <div className="va-entry-head"><div><span className="va-eyebrow">Internal movement</span><h3>🔄 Transfer Money Between Accounts</h3><p>Move money between Cash In Hand and Online Balance without treating it as sales or expenses.</p></div></div>
          <div className="va-feature-grid">
            {accountTransfers.map(t => <div key={t.id} className="va-feature-row">
              <select value={t.from} onChange={e=>updateArrItem(setAccountTransfers,accountTransfers,t.id,'from',e.target.value)} style={inputStyle}><option value="Cash">💵 Cash In Hand</option><option value="Online">💳 Online Balance</option></select>
              <span className="va-transfer-arrow">→</span>
              <select value={t.to} onChange={e=>updateArrItem(setAccountTransfers,accountTransfers,t.id,'to',e.target.value)} style={inputStyle}><option value="Online">💳 Online Balance</option><option value="Cash">💵 Cash In Hand</option></select>
              <input type="number" min="0" placeholder="Amount ₹" value={t.amount} onChange={e=>updateArrItem(setAccountTransfers,accountTransfers,t.id,'amount',e.target.value)} style={inputStyle}/>
              <input placeholder="Purpose / Note" value={t.note} onChange={e=>updateArrItem(setAccountTransfers,accountTransfers,t.id,'note',e.target.value)} style={inputStyle}/>
              <button onClick={()=>removeArrItem(setAccountTransfers,accountTransfers,t.id)} className="va-icon-delete">✕</button>
            </div>)}
          </div>
          <button onClick={addAccountTransfer} style={btnStyle}>+ Add Transfer</button>
          <div className="va-feature-note">Example: If Online Balance is empty, transfer ₹10,000 from Cash In Hand to Online. Cash decreases ₹10,000 and Online increases ₹10,000. Total money stays the same.</div>
        </div>
      )}

      {activeTab === 'sources' && (
        <div className="va-funds-page">
          <div className="va-funds-hero"><div><span className="va-eyebrow">Funding & liabilities</span><h2>🏦 Fund & Loan Ledger</h2><p>Track outside funding separately from sales and record repayments against each source.</p></div><button onClick={()=>setActiveTab('daily')} style={{...btnStyle,background:'#2563eb'}}>＋ Open Daily Accounts</button></div>
          <div className="va-fund-kpis"><div><span>Original Funding</span><strong>{formatINR(fundLedgerSummary.original)}</strong></div><div><span>Repaid</span><strong>{formatINR(fundLedgerSummary.repaid)}</strong></div><div className="due"><span>Outstanding</span><strong>{formatINR(fundLedgerSummary.outstanding)}</strong></div><div><span>Open Accounts</span><strong>{fundLedgerSummary.open}</strong></div></div>
          <div className="va-fund-workspace">
            <section className="va-fund-entry-card"><div className="va-entry-head"><div><span className="va-eyebrow">1 • Money received</span><h3>🏦 Add Fund Source</h3><p>Borrowed money, loans, credit, owner or partner funds.</p></div></div>
              {externalFunds.map(f=><div key={f.id} className="va-fund-entry-row"><input placeholder="Source / Person / Bank" value={f.source} onChange={e=>updateArrItem(setExternalFunds,externalFunds,f.id,'source',e.target.value)} style={inputStyle}/><select value={f.mode} onChange={e=>updateArrItem(setExternalFunds,externalFunds,f.id,'mode',e.target.value)} style={inputStyle}><option>Borrowed</option><option>Loan</option><option>Credit</option><option>Owner Funds</option><option>Partner Funds</option><option>Other</option></select><select value={f.account} onChange={e=>updateArrItem(setExternalFunds,externalFunds,f.id,'account',e.target.value)} style={inputStyle}><option value="Cash">💵 Cash In Hand</option><option value="Online">💳 Online Balance</option></select><input type="number" min="0" placeholder="Amount ₹" value={f.amount} onChange={e=>updateArrItem(setExternalFunds,externalFunds,f.id,'amount',e.target.value)} style={inputStyle}/><input type="date" value={f.dueDate || ''} onChange={e=>updateArrItem(setExternalFunds,externalFunds,f.id,'dueDate',e.target.value)} style={inputStyle}/><input placeholder="Notes" value={f.note} onChange={e=>updateArrItem(setExternalFunds,externalFunds,f.id,'note',e.target.value)} style={inputStyle}/><button onClick={()=>removeArrItem(setExternalFunds,externalFunds,f.id)} className="va-icon-delete">✕</button></div>)}
              <button onClick={addExternalFund} style={btnStyle}>+ Add Fund Source</button>
            </section>
            <section className="va-fund-entry-card"><div className="va-entry-head"><div><span className="va-eyebrow">2 • Repayment</span><h3>💸 Record Repayment</h3><p>Repayments reduce the funding balance and the selected money account. They are <strong>not operating expenses</strong>.</p></div></div>
              {fundRepayments.map(r=><div key={r.id} className="va-fund-entry-row"><input placeholder="Source / Person / Bank" value={r.source} onChange={e=>updateArrItem(setFundRepayments,fundRepayments,r.id,'source',e.target.value)} style={inputStyle}/><select value={r.mode} onChange={e=>updateArrItem(setFundRepayments,fundRepayments,r.id,'mode',e.target.value)} style={inputStyle}><option>Loan</option><option>Borrowed</option><option>Credit</option><option>Owner Funds</option><option>Partner Funds</option><option>Other</option></select><select value={r.account} onChange={e=>updateArrItem(setFundRepayments,fundRepayments,r.id,'account',e.target.value)} style={inputStyle}><option value="Cash">💵 Cash In Hand</option><option value="Online">💳 Online Balance</option></select><input type="number" min="0" placeholder="Repayment ₹" value={r.amount} onChange={e=>updateArrItem(setFundRepayments,fundRepayments,r.id,'amount',e.target.value)} style={inputStyle}/><input placeholder="Note" value={r.note || ''} onChange={e=>updateArrItem(setFundRepayments,fundRepayments,r.id,'note',e.target.value)} style={inputStyle}/><button onClick={()=>removeArrItem(setFundRepayments,fundRepayments,r.id)} className="va-icon-delete">✕</button></div>)}
              <button onClick={addFundRepayment} style={{...btnStyle,background:'#dc2626'}}>+ Add Repayment</button>
            </section>
          </div>
          <section className="va-fund-ledger-card"><div className="va-entry-head"><div><span className="va-eyebrow">3 • Outstanding balances</span><h3>📋 Fund & Loan Ledger</h3><p>Outstanding = original funding minus repayments.</p></div></div><div className="va-fund-table-wrap"><table className="va-fund-table"><thead><tr><th>Source</th><th>Type</th><th>Account</th><th>Original</th><th>Repaid</th><th>Outstanding</th><th>Due Date</th><th>Status</th></tr></thead><tbody>{fundLedger.length===0?<tr><td colSpan="8" className="va-khata-empty">No fund or loan records yet.</td></tr>:fundLedger.map(f=><tr key={f.key}><td><strong>{f.source}</strong></td><td>{f.mode}</td><td>{f.account==='Cash'?'💵 Cash':'💳 Online'}</td><td>{formatINR(f.original)}</td><td className="payment-text">{formatINR(f.repaid)}</td><td className={f.outstanding>0?'debit-text':'payment-text'}><strong>{formatINR(f.outstanding)}</strong></td><td>{f.dueDate || '—'}</td><td><span className={'va-fund-status '+(f.status==='Overdue'?'overdue':f.status==='Closed'?'closed':'open')}>{f.status}</span></td></tr>)}</tbody></table></div></section>
          <div className="va-khata-tip"><strong>💡 Accounting rule:</strong> Fund receipts are not sales. Repayments are not operating expenses; they reduce the outstanding funding balance and the account used for repayment.</div>
        </div>
      )}


      {activeTab === 'inventory' && (
        <div className="va-inventory-page">
          <div className="va-inventory-hero">
            <div><span className="va-eyebrow">PROCUREMENT • STOCK • SUPPLIERS</span><h2>📦 Purchases & Inventory</h2><p>Track restaurant purchases, supplier balances and stock levels in one place.</p></div>
            <div className="va-inventory-hero-actions"><button onClick={addInventoryItem}>＋ Add Item</button><button onClick={addSupplier}>＋ Add Supplier</button></div>
          </div>

          <div className="va-inventory-kpis">
            <div><span>Inventory Items</span><strong>{inventoryItems.length}</strong><small>Active stock records</small></div>
            <div><span>Stock Value</span><strong>{formatINR(inventoryItems.reduce((s,i)=>s+Number(i.current_stock||0)*Number(i.unit_cost||0),0))}</strong><small>Estimated current value</small></div>
            <div className="warning"><span>Reorder Alerts</span><strong>{inventoryItems.filter(i=>Number(i.current_stock||0)<=Number(i.reorder_level||0)).length}</strong><small>At or below reorder level</small></div>
            <div className="danger"><span>Supplier Payables</span><strong>{formatINR(supplierPayableSummary.totalOutstanding)}</strong><small>After recorded settlements</small></div>
          </div>

          <div className="va-inventory-tabs">
            {['overview','purchase','suppliers'].map(v=><button key={v} className={inventoryView===v?'active':''} onClick={()=>setInventoryView(v)}>{v==='overview'?'📊 Stock Overview':v==='purchase'?'🧾 Record Purchase':'🤝 Suppliers'}</button>)}
          </div>

          {inventoryView === 'overview' && <div className="va-inventory-grid">
            <div className="va-inventory-card">
              <div className="va-inventory-card-head"><div><h3>Stock Position</h3><p>Low-stock items are highlighted for reorder.</p></div><input value={inventorySearch} onChange={e=>setInventorySearch(e.target.value)} placeholder="🔎 Search item or category" /></div>
              {inventoryLoading ? <div className="va-inventory-empty">Loading inventory...</div> :
                <div className="va-stock-table-wrap"><table className="va-stock-table"><thead><tr><th>Item</th><th>Category</th><th>Stock</th><th>Unit Cost</th><th>Value</th><th>Status</th><th>Action</th></tr></thead><tbody>
                {inventoryItems.filter(i=>(i.name+' '+(i.category||'')).toLowerCase().includes(inventorySearch.toLowerCase())).map(i=>{
                  const low=Number(i.current_stock||0)<=Number(i.reorder_level||0);
                  return <tr key={i.id}><td><strong>{i.name}</strong><small>{i.unit}</small></td><td>{i.category||'—'}</td><td className={low?'low-stock':''}>{Number(i.current_stock||0).toFixed(2)}</td><td>{formatINR(i.unit_cost)}</td><td>{formatINR(Number(i.current_stock||0)*Number(i.unit_cost||0))}</td><td><span className={'va-stock-status '+(low?'low':'ok')}>{low?'Reorder':'Healthy'}</span></td><td><button className="va-mini-btn" onClick={()=>adjustInventory(i,'Usage')}>Use</button><button className="va-mini-btn danger" onClick={()=>adjustInventory(i,'Waste')}>Waste</button></td></tr>
                })}</tbody></table></div>}
            </div>
            <div className="va-inventory-card">
              <div className="va-inventory-card-head"><div><h3>Recent Purchases</h3><p>Latest procurement activity.</p></div><button className="va-mini-btn" onClick={()=>setInventoryView('purchase')}>Record Purchase</button></div>
              <div className="va-purchase-list">{purchases.slice(0,8).map(p=><div className="va-purchase-row" key={p.id}><div><strong>{p.supplier_name||'Direct Purchase'}</strong><small>{p.purchase_date} {p.invoice_no?'• '+p.invoice_no:''}</small></div><div><strong>{formatINR(p.subtotal)}</strong><small className={p.due_amount>0?'due':''}>{p.due_amount>0?'Due '+formatINR(p.due_amount):p.payment_method}</small></div></div>)}{!purchases.length&&<div className="va-inventory-empty">No purchases recorded yet.</div>}</div>
            </div>
          </div>}

          {inventoryView === 'purchase' && <div className="va-inventory-card">
            <div className="va-inventory-card-head"><div><h3>Record Purchase</h3><p>Purchase entries update stock automatically.</p></div></div>
            <div className="va-purchase-form-grid">
              <label>Date<input type="date" value={purchaseDate} onChange={e=>setPurchaseDate(e.target.value)}/></label>
              <label>Supplier<select value={purchaseSupplierId} onChange={e=>setPurchaseSupplierId(e.target.value)}><option value="">Select supplier</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
              <label>Payment<select value={purchasePaymentMethod} onChange={e=>setPurchasePaymentMethod(e.target.value)}><option>Cash</option><option>Online</option><option>Credit</option></select></label>
              <label>Invoice No.<input value={purchaseInvoice} onChange={e=>setPurchaseInvoice(e.target.value)} placeholder="Optional"/></label>
            </div>
            <div className="va-purchase-lines">{purchaseItems.map((x,idx)=><div className="va-purchase-line" key={x.id||idx}>
              <select value={x.itemId} onChange={e=>{const i=inventoryItems.find(v=>String(v.id)===e.target.value);updatePurchaseItem(x.id,{itemId:e.target.value,name:i?.name||'',unit:i?.unit||'unit',unitCost:i?.unit_cost||0})}}><option value="">Select item</option>{inventoryItems.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select>
              <input type="number" min="0" step="0.01" value={x.quantity} onChange={e=>updatePurchaseItem(x.id,{quantity:e.target.value})} placeholder="Qty"/>
              <input type="number" min="0" step="0.01" value={x.unitCost} onChange={e=>updatePurchaseItem(x.id,{unitCost:e.target.value})} placeholder="Unit cost"/>
              <span>{x.unit}</span><strong>{formatINR(Number(x.quantity||0)*Number(x.unitCost||0))}</strong>
              <button className="va-mini-btn danger" onClick={()=>removePurchaseItem(x.id)}>×</button>
            </div>)}</div>
            <button className="va-add-line" onClick={()=>setPurchaseItems(prev=>[...prev,{id:Date.now()+Math.random(),itemId:'',name:'',quantity:1,unitCost:0,unit:'unit'}])}>＋ Add Item Line</button>
            <div className="va-purchase-total"><span>Total Purchase</span><strong>{formatINR(purchaseTotal)}</strong></div>
            <textarea value={purchaseNotes} onChange={e=>setPurchaseNotes(e.target.value)} placeholder="Purchase notes..." />
            <button className="va-save-purchase" onClick={savePurchase}>💾 Save Purchase & Update Stock</button>
          </div>}

          {inventoryView === 'suppliers' && <div className="va-payables-page">
            <div className="va-payables-hero">
              <div><span className="va-eyebrow">SUPPLIER FINANCE • PAYABLES CONTROL</span><h2>🤝 Supplier Payables</h2><p>Track what each supplier is owed, record settlements, and keep purchase history separate from actual settlement cash flow.</p></div>
              <button className="va-payables-primary" onClick={()=>document.getElementById('supplier-payment-form')?.scrollIntoView({behavior:'smooth'})}>＋ Pay Supplier</button>
            </div>

            <div className="va-payables-kpis">
              <div><span>Total Payable</span><strong>{formatINR(supplierPayableSummary.totalOutstanding)}</strong><small>Current supplier balance</small></div>
              <div><span>Suppliers With Due</span><strong>{supplierPayableSummary.suppliersDue}</strong><small>Open payable accounts</small></div>
              <div className="danger"><span>30+ Day Due</span><strong>{supplierPayableSummary.due30}</strong><small>Aging needs attention</small></div>
              <div className="success"><span>Payments This Period</span><strong>{formatINR(supplierPayableSummary.periodPaid)}</strong><small>Settlement cash/online outflow</small></div>
            </div>

            <div className="va-payables-grid">
              <section className="va-payables-card">
                <div className="va-payables-head"><div><h3>Supplier Ledger</h3><p>Opening balance + credit purchases − supplier settlements.</p></div><span>{supplierPayables.length} suppliers</span></div>
                <div className="va-payables-table-wrap"><table className="va-payables-table"><thead><tr><th>Supplier</th><th>Purchases Due</th><th>Payments</th><th>Outstanding</th><th>Last Payment</th><th>Age</th><th>Status</th></tr></thead><tbody>
                  {supplierPayables.length===0 ? <tr><td colSpan="7" className="va-inventory-empty">No suppliers yet.</td></tr> : supplierPayables.map(s=><tr key={s.id} className={String(selectedSupplierId)===String(s.id)?'selected':''} onClick={()=>setSelectedSupplierId(s.id)}>
                    <td><strong>{s.name}</strong><small>{s.phone || s.category || 'Supplier'}</small></td>
                    <td>{formatINR(s.purchaseDue)}</td><td>{formatINR(s.payments)}</td><td className={s.outstanding>0?'danger-text':'success-text'}><strong>{formatINR(s.outstanding)}</strong></td><td>{s.lastPayment || 'Never'}</td><td>{s.outstanding>0 ? s.oldestDays+'d' : '—'}</td><td><span className={'va-payable-status '+(s.status==='Overdue'?'overdue':s.status==='Clear'?'clear':'due')}>{s.status}</span></td>
                  </tr>)}
                </tbody></table></div>
              </section>

              <section className="va-payables-card" id="supplier-payment-form">
                <div className="va-payables-head"><div><h3>💸 Pay Supplier</h3><p>Record a partial or full settlement against the current payable.</p></div></div>
                <div className="va-pay-form-grid">
                  <label>Supplier<select value={supplierPaymentSupplierId} onChange={e=>setSupplierPaymentSupplierId(e.target.value)}><option value="">Select supplier</option>{supplierPayables.filter(s=>s.outstanding>0).map(s=><option key={s.id} value={s.id}>{s.name} — {formatINR(s.outstanding)} due</option>)}</select></label>
                  <label>Date<input type="date" value={supplierPaymentDate} onChange={e=>setSupplierPaymentDate(e.target.value)}/></label>
                  <label>Amount<input type="number" min="0.01" step="0.01" value={supplierPaymentAmount} onChange={e=>setSupplierPaymentAmount(e.target.value)} placeholder="Amount ₹"/></label>
                  <label>Method<select value={supplierPaymentMethod} onChange={e=>setSupplierPaymentMethod(e.target.value)}><option>Cash</option><option>Online</option></select></label>
                  <label>Reference<input value={supplierPaymentReference} onChange={e=>setSupplierPaymentReference(e.target.value)} placeholder="UTR / receipt no."/></label>
                </div>
                {supplierPaymentSupplierId && <div className="va-payable-preview"><span>Current outstanding</span><strong>{formatINR((supplierPayables.find(s=>String(s.id)===String(supplierPaymentSupplierId))||{}).outstanding||0)}</strong></div>}
                <textarea value={supplierPaymentNotes} onChange={e=>setSupplierPaymentNotes(e.target.value)} placeholder="Payment notes..." />
                <button className="va-payables-save" onClick={saveSupplierPayment}>💾 Record Supplier Payment</button>
                <div className="va-payables-note">Payments are stored separately from the original purchase payment method. This preserves accurate purchase-channel reporting while updating the supplier’s payable balance.</div>
              </section>
            </div>

            {selectedSupplier && <section className="va-payables-card">
              <div className="va-payables-head"><div><span className="va-eyebrow">Supplier statement</span><h3>{selectedSupplier.name}</h3><p>Opening {formatINR(selectedSupplier.openingBalance)} • Outstanding {formatINR(selectedSupplier.outstanding)} • Last payment {selectedSupplier.lastPayment || 'Never'}</p></div><div className="va-payable-actions"><button onClick={()=>{setSupplierPaymentSupplierId(selectedSupplier.id);document.getElementById('supplier-payment-form')?.scrollIntoView({behavior:'smooth'})}} className="va-payables-secondary">Pay This Supplier</button><button onClick={()=>setSelectedSupplierId(null)} className="va-payables-secondary">Close</button></div></div>
              <div className="va-payables-table-wrap"><table className="va-payables-table"><thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Method</th><th>Amount</th><th>Balance Impact</th></tr></thead><tbody>
                {supplierStatement.length===0 ? <tr><td colSpan="6" className="va-inventory-empty">No supplier activity yet.</td></tr> : supplierStatement.map((r,i)=><tr key={i}><td>{r.date}</td><td><span className={'va-payable-status '+(r.type==='Payment'?'clear':'due')}>{r.type}</span></td><td>{r.reference}</td><td>{r.method}</td><td>{formatINR(r.amount)}</td><td className={r.type==='Payment'?'success-text':'danger-text'}>{r.type==='Payment'?'− ':'+ '}{formatINR(r.type==='Payment'?r.amount:r.due)}</td></tr>)}
              </tbody></table></div>
            </section>}

            <div className="va-payables-note">💡 <strong>Settlement rule:</strong> Credit purchases create supplier payables. Cash/Online purchases are already settled at purchase time. A supplier payment never gets reclassified as a new purchase or operating expense.</div>
          </div>}

        </div>
      )}

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
                <label>Cash In Hand<input type="number" value={yesterdayCash} onChange={e => setYesterdayCash(Number(e.target.value))} style={inputStyle}/></label>
                <label>Online Balance<input type="number" value={yesterdayOnline} onChange={e => setYesterdayOnline(Number(e.target.value))} style={inputStyle}/></label>
              </div>
            </div>
          </div>

          <div className="va-kpi-grid">
            <div className="va-kpi va-kpi-sales"><span>Today Sales</span><strong>{formatINR(trueGrossSale)}</strong><small>Cash + online + credit</small></div>
            <div className="va-kpi va-kpi-cash"><span>Cash In Hand</span><strong>{formatINR(totalCashInHand)}</strong><small>Expected physical cash</small></div>
            <div className="va-kpi va-kpi-online"><span>Online Balance</span><strong>{formatINR(totalOnlineBalance)}</strong><small>Online funds after payments</small></div>
            <div className="va-kpi va-kpi-expense"><span>Total Expenses</span><strong>{formatINR(totalOperatingExpenses)}</strong><small>Operating + staff costs</small></div>
            <div className="va-kpi va-kpi-available"><span>Cash Available</span><strong>{formatINR(totalCashInHand)}</strong><small>Same as Cash In Hand</small></div>
            <div className="va-kpi va-kpi-profit"><span>Est. Profit</span><strong>{formatINR(estimatedProfit)}</strong><small>Daily estimate</small></div>
          </div>

          <div className="va-daily-command-bar">
            <div className="va-command-item"><span className="va-command-icon">📅</span><div><small>ACCOUNT DATE</small><strong>{date}</strong></div></div>
            <div className="va-command-divider"></div>
            <div className="va-command-item"><span className="va-command-icon">💰</span><div><small>SALES</small><strong>{formatINR(trueGrossSale)}</strong></div></div>
            <div className="va-command-divider"></div>
            <div className="va-command-item"><span className="va-command-icon">💸</span><div><small>EXPENSES</small><strong>{formatINR(totalOperatingExpenses)}</strong></div></div>
            <div className="va-command-divider"></div>
            <div className="va-command-item"><span className="va-command-icon">💼</span><div><small>MONEY LEFT</small><strong>{formatINR(totalAmountLeft)}</strong></div></div>
            <div className="va-command-actions">
              <button onClick={() => setActiveTab('dashboard')}>🏠 Dashboard</button>
              <button onClick={clearUnsavedForm}>↺ Reset</button>
            </div>
          </div>

          <div className="va-sales-panel">
            <div className="va-section-heading">
              <div><span className="va-eyebrow">STEP 1 • SALES</span><h3>💰 Record Today’s Sales</h3><p>Enter the final amounts received by payment channel. Cash and parcel cash should be the net amount after any till deductions.</p></div>
              <div className="va-mini-total"><span>Gross Sales</span><strong>{formatINR(trueGrossSale)}</strong></div>
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
              <div className="va-entry-head"><div><span className="va-eyebrow">STEP 3 • PAYMENTS</span><h3>💳 Online Expenses</h3><p>Expenses paid from the online balance. These reduce Online Balance.</p></div><span className="va-entry-total">{formatINR(totalOnlineExpenses)}</span></div>
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
              <div className="va-entry-head"><div><span className="va-eyebrow">STEP 3 • PAYMENTS</span><h3>💵 Offline & Owner Expenses</h3><p>Choose exactly where the money is accounted for.</p></div><span className="va-entry-total">{formatINR(totalCashExpenses)}</span></div>
              <div className="va-helper"><strong>💡 Cash In Hand</strong> expenses reduce the physical cash balance. <strong>Cash From Till</strong> expenses are already deducted from the daily cash/parcel amount you enter, so they are recorded for reference but are not deducted again.</div>
              {cashExpenses.map(exp => (
                <div key={exp.id} className="va-expense-row va-cash-expense-row">
                  <input list="common-expenses" placeholder="Category" value={exp.category} onChange={e => updateArrItem(setCashExpenses, cashExpenses, exp.id, 'category', e.target.value)} style={inputStyle}/>
                  <input placeholder="Details" value={exp.description} onChange={e => updateArrItem(setCashExpenses, cashExpenses, exp.id, 'description', e.target.value)} style={inputStyle}/>
                  <input type="number" placeholder="Amount ₹" value={exp.amount} onChange={e => updateArrItem(setCashExpenses, cashExpenses, exp.id, 'amount', e.target.value)} style={inputStyle}/>
                  <select value={exp.type || 'Cash'} onChange={e => updateArrItem(setCashExpenses, cashExpenses, exp.id, 'type', e.target.value)} style={inputStyle}>
                    <option value="Cash">💰 Cash — Cash In Hand</option>
                    <option value="Till">🧾 Cash From Till — Already Deducted</option>
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

          <div className="va-staff-card"><div className="va-entry-head"><div><span className="va-eyebrow">STEP 4 • STAFF</span><h3>👨‍🍳 Staff Wages & Advances</h3><p>Record wages, advances, salary month, and payment source.</p></div><span className="va-entry-total">{formatINR(totalStaffCash + totalStaffTill + totalStaffOnline + totalStaffCounter + totalStaffCredit + totalStaffTeja + totalStaffAnil)}</span></div><div className="va-staff-help">💡 <strong>Cash</strong> payments reduce Cash In Hand. <strong>Cash From Till</strong> wages are already deducted from the daily cash you enter, so they count as expenses but are not deducted again.</div>{staffPayments.map(s => (<div key={s.id} className="va-staff-row"><select value={s.name || ''} onChange={e => updateArrItem(setStaffPayments,staffPayments,s.id,'name',e.target.value)} style={inputStyle}><option value="">Staff Name</option>{employeeNames.map(name=><option key={name} value={name}>{name}</option>)}</select><select value={s.type} onChange={e=>updateArrItem(setStaffPayments,staffPayments,s.id,'type',e.target.value)} style={inputStyle}><option>Full Wage</option><option>Cash Advance</option></select><input type="month" value={s.dueFor || date?.slice(0,7) || new Date().toISOString().slice(0,7)} onChange={e=>updateArrItem(setStaffPayments,staffPayments,s.id,'dueFor',e.target.value)} style={inputStyle}/><input type="number" min="0" step="0.01" value={s.amount ?? ''} placeholder="Amount ₹" onChange={e=>updateArrItem(setStaffPayments,staffPayments,s.id,'amount',e.target.value)} style={inputStyle}/><select value={s.method} onChange={e=>updateArrItem(setStaffPayments,staffPayments,s.id,'method',e.target.value)} style={inputStyle}><option value="Cash">💰 Cash — Cash In Hand</option><option value="Till">🧾 Cash From Till — Already Deducted</option><option value="Counter">Counter — Net Sale</option><option value="Credit">Credit — Owe Later</option><option value="Teja">Teja Paid</option><option value="Anil">Anil Paid</option><option value="Online">💳 Online</option></select><button onClick={()=>removeArrItem(setStaffPayments,staffPayments,s.id)} className="va-icon-delete">✕</button></div>))}<button onClick={addStaffPayment} style={{...btnStyle,backgroundColor:'#8b5cf6'}}>+ Log Staff Payment</button></div>
          <div className="va-drawer-card"><div className="va-entry-head"><div><span className="va-eyebrow">Physical verification</span><h3>🧮 Cash Drawer Count</h3><p>Count notes and coins without changing accounting balances.</p></div><div className="va-drawer-total"><span>Physical Cash</span><strong>{formatINR(actualDrawerTotal)}</strong></div></div><div className="va-drawer-grid">{[500,200,100,50,20,10].map(note=><label key={note} className="va-note-box"><span>₹{note}</span><input type="number" min="0" value={notes[note]} onChange={e=>setNotes({...notes,[note]:e.target.value})} placeholder="0"/><small>{formatINR(note*Number(notes[note]||0))}</small></label>)}<label className="va-note-box va-coin-box"><span>🪙 Coins</span><input type="number" min="0" value={notes.coins} onChange={e=>setNotes({...notes,coins:e.target.value})} placeholder="Total ₹"/><small>{formatINR(Number(notes.coins||0))}</small></label></div><div className="va-drawer-summary"><div><span>Expected Cash</span><strong>{formatINR(totalCashInHand)}</strong></div><div><span>Physical Count</span><strong>{formatINR(actualDrawerTotal)}</strong></div><div className={actualDrawerTotal-totalCashInHand>=0?'positive':'negative'}><span>Difference</span><strong>{formatINR(actualDrawerTotal-totalCashInHand)}</strong></div></div><div className="va-drawer-note">📌 Counting only — this does not automatically change accounting balances.</div></div>
          <div className="va-entry-card" style={{marginBottom:'18px',borderTop:'4px solid #059669'}}>
            <div className="va-entry-head"><div><span className="va-eyebrow">STEP 5 • INVENTORY COST</span><h3>📦 Purchases Recorded for {date}</h3><p>Purchases are tracked separately from Daily Accounting expenses so the same cost is never counted twice.</p></div><span className="va-entry-total">{formatINR((purchaseSummary.byDate[date]||{}).total||0)}</span></div>
            {(() => { const p = purchaseSummary.byDate[date] || {total:0,paid:0,due:0,cash:0,online:0}; return <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px'}}><div style={{padding:'12px',background:'#f0fdf4',borderRadius:'10px'}}><small>Paid</small><strong style={{display:'block',marginTop:'4px'}}>{formatINR(p.paid)}</strong></div><div style={{padding:'12px',background:'#eff6ff',borderRadius:'10px'}}><small>Cash Paid</small><strong style={{display:'block',marginTop:'4px'}}>{formatINR(p.cash)}</strong></div><div style={{padding:'12px',background:'#eef2ff',borderRadius:'10px'}}><small>Online Paid</small><strong style={{display:'block',marginTop:'4px'}}>{formatINR(p.online)}</strong></div><div style={{padding:'12px',background:'#fff7ed',borderRadius:'10px'}}><small>Supplier Due</small><strong style={{display:'block',marginTop:'4px'}}>{formatINR(p.due)}</strong></div></div>; })()}
            <div className="va-helper" style={{marginTop:'10px'}}>💡 Cash/Online purchase payments are shown here as inventory outflows. Do not enter the same purchase again as a cash or online expense, or it will be double-counted.</div>
          </div>
          <div className="va-final-card">
            <div className="va-final-head">
              <div>
                <span className="va-eyebrow va-final-eyebrow">End-of-day close</span>
                <h3>Final System Balances</h3>
                <p>Review the system totals for <strong>{date}</strong> before saving the daily account.</p>
              </div>
              <div className="va-save-status">{isSaving ? '⏳ Saving…' : '● Ready to save'}</div>
            </div>

            <div className="va-final-highlight">
              <div>
                <span>True Gross Sales</span>
                <small>Includes app & credit sales</small>
              </div>
              <strong>{formatINR(trueGrossSale)}</strong>
            </div>

            <div className="va-final-grid">
              <div className="va-final-metric cash">
                <span>Expected Cash In Hand</span>
                <strong>{formatINR(totalCashInHand)}</strong>
                <small>System expected till cash</small>
              </div>
              <div className="va-final-metric online">
                <span>Online Balance</span>
                <strong>{formatINR(totalOnlineBalance)}</strong>
                <small>Bank / online collections</small>
              </div>
              <div className="va-final-metric total">
                <span>Total Money Left</span>
                <strong>{formatINR(totalAmountLeft)}</strong>
                <small>Cash + online balance</small>
              </div>
            </div>

            <div className="va-final-check">
              <div className="va-final-check-icon">✓</div>
              <div>
                <strong>System balance is ready for closing</strong>
                <p>Compare Expected Cash In Hand with the physical drawer count above. The drawer difference does not change these system balances.</p>
              </div>
            </div>

            <div className="va-final-actions">
              <button onClick={clearUnsavedForm} className="va-clear-btn">↺ Clear Unsaved Form</button>
              <button onClick={saveDailyAccounts} disabled={isSaving} className="va-save-btn">
                {isSaving ? '⏳ Saving Daily Account…' : `💾 Save Daily Account — ${date}`}
              </button>
            </div>
            <p className="va-save-note">Saved data can be reviewed later from History. Clearing the form only removes unsaved entries for this date.</p>
          </div>
        </>
      )}

      {activeTab === 'ledger' && (
        <div className="va-khata-page">
          <div className="va-khata-hero"><div><span className="va-eyebrow">CUSTOMER RELATIONSHIP • COLLECTIONS</span><h2>📒 Customer Khata</h2><p>Track receivables, understand collection risk and quickly identify customers who need follow-up.</p></div><button onClick={() => setActiveTab('daily')} style={{...btnStyle, background:'#2563eb'}}>＋ Record Today's Credit</button></div>
          <div className="va-khata-kpis">
            <div className="va-khata-kpi due"><span>Total Outstanding</span><strong>{formatINR(khataSummary.outstanding)}</strong><small>Customers currently owe</small></div>
            <div className="va-khata-kpi given"><span>Credit Given</span><strong>{formatINR(khataSummary.totalGiven)}</strong><small>All recorded credit sales</small></div>
            <div className="va-khata-kpi received"><span>Payments Received</span><strong>{formatINR(khataSummary.totalReceived)}</strong><small>All recorded collections</small></div>
            <div className="va-khata-kpi customers"><span>Customers With Due</span><strong>{khataSummary.customersWithDue}</strong><small>Open balances</small></div>
          </div>
          <div className="va-khata-collection">
            <section className="va-khata-collection-card">
              <div className="va-khata-collection-head"><div><span className="va-eyebrow">Collection control</span><h3>🎯 Follow-up Priority</h3><p>Automatically ranked using outstanding amount and age of the oldest credit.</p></div></div>
              <div className="va-khata-collection-summary">
                <div><span>Priority Accounts</span><strong>{khataCollectionSummary.priority}</strong></div><div><span>30+ Day Due</span><strong>{khataCollectionSummary.overdue30}</strong></div><div><span>Never Paid</span><strong>{khataCollectionSummary.neverPaid}</strong></div><div><span>Oldest Due</span><strong>{khataCollectionSummary.oldestDays}d</strong></div>
              </div>
              <div className="va-khata-priority-list">
                {khataCollectionInsights.length === 0 ? <div className="va-khata-empty">No customers currently have an outstanding balance.</div> : khataCollectionInsights.slice(0,8).map(customer => (
                  <button key={customer.key} className="va-khata-priority" onClick={()=>setSelectedKhataCustomer(customer.key)}>
                    <span className="va-khata-priority-icon">{customer.collectionScore === 3 ? '!' : '•'}</span>
                    <span className="va-khata-priority-main"><strong>{customer.name}</strong><small>{customer.oldestDueDays} days since oldest credit{customer.lastPaymentDate ? ' • Last payment ' + customer.lastPaymentDate : ' • No payment recorded'}</small></span>
                    <span className="va-khata-priority-amount">{formatINR(customer.balance)}<small>{customer.collectionScore === 3 ? 'High priority' : customer.collectionScore === 2 ? 'Follow up' : 'Monitor'}</small></span>
                  </button>
                ))}
              </div>
            </section>
            <section className="va-khata-collection-card">
              <div className="va-khata-collection-head"><div><span className="va-eyebrow">Receivables health</span><h3>📈 Collection Snapshot</h3><p>Focus the team on the customers most likely to need attention.</p></div></div>
              <div className="va-khata-status-grid"><div><span>Outstanding</span><strong>{formatINR(khataSummary.outstanding)}</strong></div><div><span>Customers Due</span><strong>{khataSummary.customersWithDue}</strong></div><div><span>Avg. Due / Customer</span><strong>{formatINR(khataSummary.customersWithDue ? khataSummary.outstanding / khataSummary.customersWithDue : 0)}</strong></div></div>
              <div className="va-khata-tip"><strong>Collection rule:</strong> accounts are prioritized when the balance is significant, the oldest credit is 30+ days old, or there has been no recorded payment / a long gap since the last payment.</div>
              <div style={{marginTop:'12px',padding:'12px',background:'#f8fafc',borderRadius:'11px',border:'1px solid #e2e8f0',fontSize:'12px',color:'#475569',lineHeight:1.5}}><strong style={{color:'#0f172a'}}>Recommended workflow:</strong> open a priority customer → review the statement → contact the customer → record the collection in Daily Accounting.</div>
            </section>
          </div>
          <div className="va-khata-grid">
            <section className="va-khata-list-card">
              <div className="va-khata-card-head"><div><span className="va-eyebrow">Accounts receivable</span><h3>Customer balances</h3></div><span className="va-khata-count">{filteredKhataCustomers.length} customers</span></div>
              <input value={khataSearch} onChange={e=>setKhataSearch(e.target.value)} placeholder="🔎 Search customer or delivery app..." style={{...inputStyle, marginBottom:'12px'}} />
              <div className="va-khata-customer-list">{filteredKhataCustomers.length === 0 ? <div className="va-khata-empty">No customer accounts found.</div> : filteredKhataCustomers.map(customer => (
                <button key={customer.key} className={selectedKhataCustomer === customer.key ? 'va-khata-customer active' : 'va-khata-customer'} onClick={()=>setSelectedKhataCustomer(customer.key)}>
                  <span className="va-khata-avatar">{customer.name.charAt(0).toUpperCase()}</span><span className="va-khata-customer-main"><strong>{customer.name}</strong><small>{customer.transactions.length} transactions • Given {formatINR(customer.given)}</small></span><span className={customer.balance > 0 ? 'va-khata-balance danger' : customer.balance < 0 ? 'va-khata-balance credit' : 'va-khata-balance clear'}>{formatINR(Math.abs(customer.balance))}<small>{customer.balance > 0 ? 'Due' : customer.balance < 0 ? 'Advance' : 'Settled'}</small></span>
                </button>
              ))}</div>
            </section>
            <section className="va-khata-detail-card">
              {!selectedKhata ? <div className="va-khata-detail-empty"><div>📒</div><h3>Select a customer</h3><p>Choose a customer to view the complete statement.</p></div> : <>
                <div className="va-khata-detail-head"><div><span className="va-eyebrow">Customer statement</span><h3>{selectedKhata.name}</h3><p>{selectedKhata.transactions.length} recorded transactions</p></div><div className="va-khata-detail-actions"><button onClick={exportKhataStatement} style={{...btnStyle, background:'#10b981'}}>📊 Export Statement</button><button onClick={()=>setSelectedKhataCustomer(null)} style={{...btnStyle, background:'#64748b'}}>Close</button></div></div>
                {(() => { const insight = khataCollectionInsights.find(c => c.key === selectedKhata.key); return insight ? <div className="va-khata-detail-insight"><strong>Collection status:</strong> {insight.collectionScore === 3 ? 'High priority follow-up.' : insight.collectionScore === 2 ? 'Follow up soon.' : 'Monitor this account.'} Oldest credit is {insight.oldestDueDays} days old{insight.lastPaymentDate ? '; last payment was ' + insight.daysSincePayment + ' days ago.' : '; no payment is recorded yet.'}</div> : null; })()}
                <div className="va-khata-balance-banner"><div><span>Outstanding Balance</span><strong>{formatINR(selectedKhata.balance)}</strong></div><div><span>Total Credit</span><b>{formatINR(selectedKhata.given)}</b></div><div><span>Total Received</span><b>{formatINR(selectedKhata.received)}</b></div></div>
                <div className="va-khata-filters"><label>From<input type="date" value={khataStartDate} onChange={e=>setKhataStartDate(e.target.value)} style={inputStyle}/></label><label>To<input type="date" value={khataEndDate} onChange={e=>setKhataEndDate(e.target.value)} style={inputStyle}/></label><button onClick={()=>{setKhataStartDate('');setKhataEndDate('')}} style={{...btnStyle,background:'#334155'}}>Clear Dates</button></div>
                <div className="va-khata-table-wrap"><table className="va-khata-table"><thead><tr><th>Date</th><th>Transaction</th><th>Method</th><th>Credit</th><th>Received</th><th>Note</th></tr></thead><tbody>{selectedKhataTransactions.length === 0 ? <tr><td colSpan="6" className="va-khata-empty">No transactions in this date range.</td></tr> : selectedKhataTransactions.map((t,i)=><tr key={i}><td>{t.date}</td><td><span className={t.kind==='Credit Given'?'va-khata-pill debit':'va-khata-pill payment'}>{t.kind}</span></td><td>{t.method}</td><td className="debit-text">{t.kind==='Credit Given'?formatINR(t.amount):'—'}</td><td className="payment-text">{t.kind==='Payment Received'?formatINR(t.amount):'—'}</td><td>{t.note || '—'}</td></tr>)}</tbody></table></div>
              </>}
            </section>
          </div>
          <div className="va-khata-tip"><strong>💡 Accounting note:</strong> Credit sales increase the customer's receivable. Payments reduce it. Collections are still recorded through Daily Accounting so balances remain consistent.</div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="va-history-page">
          <div className="va-history-hero">
            <div><span className="va-eyebrow">AUDIT • TRANSACTIONS • CONTROL</span><h2>📋 Transaction History</h2><p>Search, filter and inspect saved daily accounts without changing the original records.</p></div>
            <button onClick={exportToExcel} className="va-history-export">📊 Export Excel</button>
          </div>

          <div className="va-history-summary">
            <div><span>Recorded Days</span><strong>{historySummary.days}</strong></div>
            <div><span>Sales in View</span><strong>{formatINR(historySummary.sales)}</strong></div>
            <div><span>Expenses in View</span><strong>{formatINR(historySummary.expenses)}</strong></div>
            <div><span>Purchases in View</span><strong>{formatINR(historySummary.purchases)}</strong></div>
            <div><span>Closing Cash Total</span><strong>{formatINR(historySummary.cash)}</strong></div>
          </div>

          <div className="va-history-filter-card">
            <div className="va-history-filter-grid">
              <label>Search<input value={historySearch} onChange={e=>setHistorySearch(e.target.value)} placeholder="Date, customer, employee, category..." /></label>
              <label>From<input type="date" value={historyStart} onChange={e=>setHistoryStart(e.target.value)} /></label>
              <label>To<input type="date" value={historyEnd} onChange={e=>setHistoryEnd(e.target.value)} /></label>
              <label>Transaction Type<select value={historyType} onChange={e=>setHistoryType(e.target.value)}>
                <option value="all">All records</option><option value="sales">Sales</option><option value="expenses">Expenses</option><option value="purchases">Purchases</option><option value="supplierPayments">Supplier Payments</option><option value="credit">Credit / Collections</option><option value="staff">Staff payments</option><option value="transfers">Transfers</option><option value="funds">Funds / Repayments</option>
              </select></label>
              <button onClick={()=>{setHistorySearch('');setHistoryStart('');setHistoryEnd('');setHistoryType('all');setSelectedHistoryId(null)}} className="va-history-clear">Clear Filters</button>
            </div>
          </div>

          <div className="va-history-table-card">
            <div className="va-history-table-head"><div><h3>Saved Daily Accounts</h3><p>Click any row to inspect its accounting components.</p></div><span>{filteredHistoryRows.length} record{filteredHistoryRows.length===1?'':'s'}</span></div>
            {isLoadingHistory ? <p>Loading history...</p> : filteredHistoryRows.length === 0 ? <div className="va-empty-state">No records match your filters.</div> : (
              <div className="va-history-table-wrap">
                <table className="va-history-table"><thead><tr><th>Date</th><th>Sales</th><th>Expenses</th><th>Purchases</th><th>Cash</th><th>Online</th><th>Credit</th><th>Staff</th><th></th></tr></thead>
                  <tbody>{filteredHistoryRows.map(row => <React.Fragment key={row.id}>
                    <tr className={selectedHistoryId===row.id?'selected':''} onClick={()=>setSelectedHistoryId(selectedHistoryId===row.id?null:row.id)}>
                      <td><strong>{row.date}</strong><small>{row.id ? 'Saved record' : 'Record'}</small></td>
                      <td className="history-sales">{formatINR(row.totalSales)}</td><td className="history-expense">{formatINR(row.totalExpenses)}</td>
                      <td>{formatINR(row.purchaseTotal)}</td><td>{formatINR(row.supplierPayment)}</td><td>{formatINR(row.total_cash_in_hand)}</td><td>{formatINR(row.total_online_balance)}</td><td>{formatINR(row.credit)}</td><td>{formatINR(row.staff)}</td><td>⌄</td>
                    </tr>
                    {selectedHistoryId===row.id && <tr className="va-history-detail-row"><td colSpan="10">
                      <div className="va-history-detail">
                        <div><span>Sales</span><strong>{formatINR(row.totalSales)}</strong><small>Cash {formatINR(row.cash)} • Online {formatINR(row.online)} • Credit {formatINR(row.credit)}</small></div>
                        <div><span>Expenses</span><strong>{formatINR(row.totalExpenses)}</strong><small>Operating + staff entries</small></div>
                        <div><span>Purchases</span><strong>{formatINR(row.purchaseTotal)}</strong><small>{row.purchaseCount} purchase record{row.purchaseCount===1?'':'s'} • Paid {formatINR(row.purchasePaid)} • Supplier due {formatINR(row.purchaseDue)}</small></div>
                        <div><span>Supplier Payments</span><strong>{formatINR(row.supplierPayment)}</strong><small>{row.counts.supplierPayments} settlement payment{row.counts.supplierPayments===1?'':'s'}</small></div>
                        <div><span>Credit Activity</span><strong>{formatINR(row.received)} received</strong><small>{row.counts.credit} credit sales • {row.counts.received} collections</small></div>
                        <div><span>Staff</span><strong>{formatINR(row.staff)}</strong><small>{row.counts.staff} payment entries</small></div>
                        <div><span>Money Movement</span><strong>{formatINR(row.transfers)}</strong><small>{row.counts.transfers} transfers • Funds in {formatINR(row.fundsIn)} • Repayments {formatINR(row.repayments)}</small></div>
                        <div><span>Closing Position</span><strong>{formatINR(Number(row.total_cash_in_hand||0)+Number(row.total_online_balance||0))}</strong><small>Cash + Online balance</small></div>
                      </div>
                      <div className="va-history-detail-actions"><button onClick={(e)=>{e.stopPropagation();setDateSelection(row.date);setActiveTab('daily');handleFetchData(row.date,true)}}>✏️ Open in Daily Accounting</button><span>Inspection is read-only until you explicitly open the date for editing.</span></div>
                    </td></tr>}
                  </React.Fragment>)}</tbody>
                </table>
              </div>
            )}
          </div>
          <div className="va-history-note"><strong>🔒 Audit control:</strong> History is an inspection layer. Opening a record in Daily Accounting is a separate action, so reviewing transactions does not accidentally modify saved financial data.</div>
        </div>
      )}


      {activeTab === 'analytics' && (
        <div className="va-analytics-page">
          <div className="va-analytics-hero">
            <div>
              <span className="va-eyebrow">MANAGEMENT • PERFORMANCE • REPORTING</span>
              <h2>📊 Business Analytics</h2>
              <p>Understand sales, expenses, staff cost, credit exposure and estimated profit from the same accounting records used throughout Vintage Accounts.</p>
            </div>
            <div className="va-analytics-actions">
              <label>Start Date<input type="date" value={analyticsStart} onChange={e => setAnalyticsStart(e.target.value)} /></label>
              <label>End Date<input type="date" value={analyticsEnd} onChange={e => setAnalyticsEnd(e.target.value)} /></label>
              <button onClick={() => {
                const rows = [
                  {Metric:'Sales',Value:analyticsData.totalSales},
                  {Metric:'Operating Expenses',Value:analyticsData.totalExpenses},
                  {Metric:'Purchase Costs',Value:analyticsData.purchaseCosts},
                  {Metric:'Estimated Profit',Value:analyticsData.estimatedProfit},
                  {Metric:'Profit After Purchases',Value:analyticsData.operatingProfitAfterPurchases},
                  {Metric:'Credit Outstanding',Value:analyticsData.creditOutstanding},
                  {Metric:'Cash Sales',Value:analyticsData.cashSales},
                  {Metric:'Online Sales',Value:analyticsData.onlineSales},
                  {Metric:'Credit Sales',Value:analyticsData.creditSales},
                  {Metric:'Credit Received',Value:analyticsData.creditReceived},
                  {Metric:'Staff Cost',Value:analyticsData.staffCost},
                  {Metric:'Operating Days',Value:analyticsData.operatingDays},
                  {Metric:'Average Daily Sales',Value:analyticsData.averageDailySales},
                  {Metric:'Average Daily Expenses',Value:analyticsData.averageDailyExpenses}
                ];
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Summary');
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(analyticsData.monthlyRows.map(([month,row]) => ({Month:month,Sales:row.sales,Expenses:row.expenses,Purchases:row.purchases||0,EstimatedProfit:row.sales-row.expenses,ProfitAfterPurchases:row.sales-row.expenses-(row.purchases||0),Days:row.days}))), 'Monthly');
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(analyticsData.sortedCategories.map(([category,amount]) => ({Category:category,Amount:amount}))), 'Expenses');
                XLSX.writeFile(wb, `Vintage-Analytics-${analyticsStart}-to-${analyticsEnd}.xlsx`);
              }} className="va-analytics-btn">📥 Export Report</button>
            </div>
          </div>

          <div className="va-analytics-kpis">
            <div className="sales"><span>💰 Total Sales</span><strong>{formatINR(analyticsData.totalSales)}</strong><small>{analyticsData.operatingDays} recorded operating days</small></div>
            <div className="expense"><span>💸 Total Expenses</span><strong>{formatINR(analyticsData.totalExpenses)}</strong><small>Operating + staff entries</small></div>
            <div className={analyticsData.estimatedProfit >= 0 ? 'profit' : 'loss'}><span>{analyticsData.estimatedProfit >= 0 ? '📈 Estimated Profit' : '📉 Estimated Loss'}</span><strong>{formatINR(analyticsData.estimatedProfit)}</strong><small>Sales less recorded expenses</small></div>
            <div className="credit"><span>📒 Credit Outstanding</span><strong>{formatINR(analyticsData.creditOutstanding)}</strong><small>Credit sales less collections</small></div>
            <div className="expense"><span>📦 Purchase Costs</span><strong>{formatINR(analyticsData.purchaseCosts)}</strong><small>Inventory purchase value</small></div>
          </div>

          <div className="va-analytics-grid va-analytics-grid-top">
            <div className="va-analytics-card">
              <div className="va-analytics-card-head"><div><span className="va-eyebrow">Revenue mix</span><h3>Sales Channels</h3></div></div>
              {[
                ['Cash Sales', analyticsData.cashSales, 'cash'],
                ['Online Sales', analyticsData.onlineSales, 'online'],
                ['Credit Sales', analyticsData.creditSales, 'credit']
              ].map(([label,value,type]) => {
                const pct = analyticsData.totalSales ? (value / analyticsData.totalSales) * 100 : 0;
                return <div key={label} className="va-analytics-mix-row">
                  <div><strong>{label}</strong><span>{formatINR(value)} • {pct.toFixed(1)}%</span></div>
                  <div className="va-analytics-progress"><i className={type} style={{width:`${Math.min(100,pct)}%`}}></i></div>
                </div>;
              })}
              <div className="va-analytics-mini-grid">
                <div><span>Credit Received</span><strong>{formatINR(analyticsData.creditReceived)}</strong></div>
                <div><span>Staff Cost</span><strong>{formatINR(analyticsData.staffCost)}</strong></div>
                <div><span>Avg. Daily Sales</span><strong>{formatINR(analyticsData.averageDailySales)}</strong></div>
                <div><span>Avg. Daily Expense</span><strong>{formatINR(analyticsData.averageDailyExpenses)}</strong></div>
                <div><span>Purchase Costs</span><strong>{formatINR(analyticsData.purchaseCosts)}</strong></div>
                <div><span>Profit After Purchases</span><strong className={analyticsData.operatingProfitAfterPurchases >= 0 ? 'success-text' : 'danger-text'}>{formatINR(analyticsData.operatingProfitAfterPurchases)}</strong></div>
              </div>
            </div>

            <div className="va-analytics-card">
              <div className="va-analytics-card-head"><div><span className="va-eyebrow">Expense intelligence</span><h3>Top Expense Categories</h3></div></div>
              {analyticsData.sortedCategories.length === 0 ? <div className="va-empty-state">No expenses found in this period.</div> : analyticsData.sortedCategories.slice(0,6).map(([category,amount]) => {
                const pct = analyticsData.totalExpenses ? (amount / analyticsData.totalExpenses) * 100 : 0;
                return <div key={category} className="va-analytics-expense-row">
                  <div><strong>{category}</strong><span>{formatINR(amount)}</span></div>
                  <div className="va-analytics-progress"><i style={{width:`${Math.min(100,pct)}%`}}></i></div>
                </div>;
              })}
            </div>
          </div>

          <div className="va-analytics-card">
            <div className="va-analytics-card-head">
              <div><span className="va-eyebrow">Trend</span><h3>📅 Monthly Performance</h3><p>Sales, expenses and estimated profit by month within the selected range.</p></div>
            </div>
            {analyticsData.monthlyRows.length === 0 ? <div className="va-empty-state">No records found in this date range.</div> : (
              <div className="va-analytics-table-wrap">
                <table className="va-analytics-table">
                  <thead><tr><th>Month</th><th>Sales</th><th>Expenses</th><th>Purchases</th><th>Profit After Purchases</th><th>Days</th><th>Daily Avg. Sales</th></tr></thead>
                  <tbody>
                    {analyticsData.monthlyRows.map(([month,row]) => {
                      const profit = row.sales - row.expenses;
                      return <tr key={month}>
                        <td><strong>{month}</strong></td>
                        <td>{formatINR(row.sales)}</td>
                        <td>{formatINR(row.expenses)}</td>
                        <td>{formatINR(row.purchases || 0)}</td>
                        <td className={(profit-(row.purchases||0)) >= 0 ? 'success-text' : 'danger-text'}><strong>{formatINR(profit-(row.purchases||0))}</strong></td>
                        <td>{row.days}</td>
                        <td>{formatINR(row.days ? row.sales / row.days : 0)}</td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="va-analytics-insight">
            <div className="va-analytics-insight-icon">💡</div>
            <div>
              <strong>Management insight</strong>
              <p>{analyticsData.sortedCategories.length
                ? `Your largest recorded expense category is "${analyticsData.sortedCategories[0][0]}" at ${formatINR(analyticsData.sortedCategories[0][1])}. Use this report to identify recurring cost drivers and compare them against sales growth.`
                : 'Once expenses are recorded, this section will highlight the largest cost category automatically.'}</p>
            </div>
          </div>

          <div className="va-analytics-note">
            <strong>Accounting note:</strong> Sales and recorded operating expenses come from saved daily accounting records. Purchases come from the Purchases & Inventory ledger and are shown separately to prevent double-counting. Profit After Purchases is an internal management estimate, not a statutory accounting or tax statement.
          </div>
        </div>
      )}

      {activeTab === 'cashflow' && (
        <div className="va-cashflow-page">
          <div className="va-cashflow-hero">
            <div><span className="va-eyebrow">CASH • ONLINE • SETTLEMENTS</span><h2>💵 Cash Flow Management</h2><p>See where money came from, where it went, and the net movement for any period. Internal transfers are shown separately so they never inflate income or expenses.</p></div>
            <div className="va-cashflow-period"><label>From<input type="date" value={analyticsStart} onChange={e=>setAnalyticsStart(e.target.value)}/></label><label>To<input type="date" value={analyticsEnd} onChange={e=>setAnalyticsEnd(e.target.value)}/></label></div>
          </div>
          <div className="va-cashflow-kpis">
            <div className="in"><span>Total Inflow</span><strong>{formatINR(cashFlowData.inflow)}</strong><small>Sales + collections + funds</small></div>
            <div className="out"><span>Total Outflow</span><strong>{formatINR(cashFlowData.outflow)}</strong><small>Expenses + purchases + settlements</small></div>
            <div className={cashFlowData.net>=0?'positive':'negative'}><span>Net Cash Movement</span><strong>{formatINR(cashFlowData.net)}</strong><small>Inflow minus outflow</small></div>
            <div><span>Supplier Settlements</span><strong>{formatINR(cashFlowData.supplierCash+cashFlowData.supplierOnline)}</strong><small>Payments made to suppliers</small></div>
          </div>

          <div className="va-cashflow-grid">
            <section className="va-cashflow-card"><div className="va-cashflow-head"><div><h3>Money In</h3><p>Actual cash/online inflows during the selected period.</p></div><strong>{formatINR(cashFlowData.inflow)}</strong></div>
              <div className="va-cashflow-lines">
                <div><span>Cash Sales</span><b>{formatINR(cashFlowData.salesCash)}</b></div>
                <div><span>Online Sales</span><b>{formatINR(cashFlowData.salesOnline)}</b></div>
                <div><span>Customer Credit Received</span><b>{formatINR(cashFlowData.creditReceived)}</b></div>
                <div><span>External Funds Received</span><b>{formatINR(cashFlowData.externalFunds)}</b></div>
              </div>
            </section>
            <section className="va-cashflow-card"><div className="va-cashflow-head"><div><h3>Money Out</h3><p>Actual cash/online outflows, including settlements.</p></div><strong>{formatINR(cashFlowData.outflow)}</strong></div>
              <div className="va-cashflow-lines">
                <div><span>Operating Expenses</span><b>{formatINR(cashFlowData.operatingCash+cashFlowData.operatingOnline)}</b></div>
                <div><span>Staff Payments</span><b>{formatINR(cashFlowData.staffCash+cashFlowData.staffOnline)}</b></div>
                <div><span>Purchase Payments</span><b>{formatINR(cashFlowData.purchaseCash+cashFlowData.purchaseOnline)}</b></div>
                <div><span>Supplier Settlements</span><b>{formatINR(cashFlowData.supplierCash+cashFlowData.supplierOnline)}</b></div>
                <div><span>Fund Repayments</span><b>{formatINR(cashFlowData.fundRepayments)}</b></div>
              </div>
            </section>
          </div>

          <section className="va-cashflow-card">
            <div className="va-cashflow-head"><div><h3>Cash vs Online Movement</h3><p>Channel-level visibility for management.</p></div><span className="va-cashflow-badge">Transfers: {formatINR(cashFlowData.transfers)} net</span></div>
            <div className="va-cashflow-channel-grid">
              <div><span>Cash Inflow</span><strong>{formatINR(cashFlowData.salesCash+cashFlowData.creditReceived+cashFlowData.externalFunds)}</strong></div>
              <div><span>Cash Outflow</span><strong>{formatINR(cashFlowData.operatingCash+cashFlowData.staffCash+cashFlowData.purchaseCash+cashFlowData.supplierCash+cashFlowData.fundRepayments)}</strong></div>
              <div><span>Online Inflow</span><strong>{formatINR(cashFlowData.salesOnline)}</strong></div>
              <div><span>Online Outflow</span><strong>{formatINR(cashFlowData.operatingOnline+cashFlowData.staffOnline+cashFlowData.purchaseOnline+cashFlowData.supplierOnline)}</strong></div>
            </div>
            <div className="va-cashflow-note">ℹ️ Credit sales are not treated as cash inflow until collected. Credit purchases are not treated as cash outflow until actually paid. Internal cash ↔ online transfers are shown separately and do not change total business cash flow.</div>
          </section>

          <section className="va-cashflow-card">
            <div className="va-cashflow-head"><div><h3>Daily Cash Flow Ledger</h3><p>Click-free management view of every day in the selected period.</p></div><span className="va-cashflow-badge">{cashFlowData.rows.length} day(s)</span></div>
            <div className="va-cashflow-table-wrap"><table className="va-cashflow-table"><thead><tr><th>Date</th><th>Inflow</th><th>Outflow</th><th>Net</th><th>Cash Sales</th><th>Online Sales</th><th>Supplier Paid</th><th>Purchase Paid</th></tr></thead><tbody>
              {cashFlowData.rows.length===0?<tr><td colSpan="8" className="va-cashflow-empty">No cash-flow activity in this period.</td></tr>:cashFlowData.rows.map(r=><tr key={r.date}><td><strong>{r.date}</strong></td><td className="in-text">{formatINR(r.inflow)}</td><td className="out-text">{formatINR(r.outflow)}</td><td className={r.net>=0?'in-text':'out-text'}><strong>{formatINR(r.net)}</strong></td><td>{formatINR(r.salesCash)}</td><td>{formatINR(r.salesOnline)}</td><td>{formatINR(r.supplierCash+r.supplierOnline)}</td><td>{formatINR(r.purchaseCash+r.purchaseOnline)}</td></tr>)}
            </tbody></table></div>
          </section>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="va-ai-page">
          <div className="va-ai-hero">
            <div>
              <span className="va-eyebrow">READ-ONLY BUSINESS INTELLIGENCE</span>
              <h2>✨ Vintage Accounts AI</h2>
              <p>Ask questions about your restaurant's sales, expenses, profit, customer credit, staff costs and financial trends. The assistant can analyze your records but cannot change them.</p>
            </div>
            <span className="va-ai-status">🔒 Read-only • Current data</span>
          </div>

          <div className="va-ai-layout">
            <div className="va-ai-chat">
              <div className="va-ai-messages">
                {aiMessages.map((message, index) => (
                  <div key={index} className={'va-ai-message ' + message.role}>
                    <small>{message.role === 'user' ? 'YOU' : 'VINTAGE AI'}</small>
                    {message.text}
                  </div>
                ))}
                {aiLoading && <div className="va-ai-message assistant"><small>VINTAGE AI</small>Thinking through your accounting data…</div>}
              </div>
              <div className="va-ai-composer">
                <form onSubmit={e => { e.preventDefault(); askAiAssistant(); }}>
                  <textarea value={aiQuestion} onChange={e => setAiQuestion(e.target.value)} placeholder="Ask something like: What was my profit this week?" disabled={aiLoading} />
                  <button className="va-ai-send" type="submit" disabled={aiLoading || !aiQuestion.trim()}>{aiLoading ? 'Thinking…' : 'Ask AI →'}</button>
                </form>
                <div style={{ marginTop: 8, color: '#94a3b8', fontSize: 10 }}>AI answers are based on the accounting data available in this session. Verify important financial decisions before acting.</div>
              </div>
            </div>

            <div className="va-ai-sidebar">
              <div className="va-ai-side-card">
                <h3>⚡ Quick questions</h3>
                {[
                  'What were my sales and expenses this period?',
                  'Which expense category is highest?',
                  'Who has the highest customer balance?',
                  'How is my profit trending?',
                  'How much did I spend on staff?',
                  'Give me 3 practical ways to improve this period.'
                ].map(question => (
                  <button key={question} className="va-ai-chip" onClick={() => askAiAssistant(question)} disabled={aiLoading}>{question}</button>
                ))}
              </div>

              <div className="va-ai-side-card">
                <h3>📊 Current snapshot</h3>
                <div className="va-ai-metric"><span>Sales</span><strong>{formatINR(analyticsData.totalSales)}</strong></div>
                <div className="va-ai-metric"><span>Expenses</span><strong>{formatINR(analyticsData.totalExpenses)}</strong></div>
                <div className="va-ai-metric"><span>Est. Profit/Loss</span><strong>{formatINR(analyticsData.estimatedProfit)}</strong></div>
                <div className="va-ai-metric"><span>Credit Outstanding</span><strong>{formatINR(khataSummary.outstanding)}</strong></div>
                <div className="va-ai-metric"><span>Staff Cost</span><strong>{formatINR(analyticsData.staffCost)}</strong></div>
              </div>

              <div className="va-ai-note"><strong>Safety:</strong> AI is intentionally read-only. It will not edit balances, approve payments, delete records, or change payroll.</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="va-staff-page">
          <div className="va-staff-hero">
            <div>
              <span className="va-staff-eyebrow">STAFF OPERATIONS • DAILY CONTROL</span>
              <h2>👥 Attendance Command Center</h2>
              <p>Track who is working, who is absent, and who still needs a clock-out — without leaving the staff workspace.</p>
            </div>
            <div className="va-staff-hero-actions">
              <label>Date<input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} /></label>
              <button onClick={() => loadAttendance(attendanceDate)} disabled={isLoadingAttendance} className="va-staff-btn primary">{isLoadingAttendance ? '⏳ Loading...' : '🔄 Refresh'}</button>
              <button onClick={() => setActiveTab('payroll')} className="va-staff-btn secondary">💰 Open Payroll</button>
            </div>
          </div>

          <div className="va-staff-kpis">
            <div><span>🟢 Present</span><strong>{attendanceSummary.Present}</strong><small>Working today</small></div>
            <div><span>🕐 Clocked In</span><strong>{attendanceLogs.filter(r => r.check_in && !r.check_out).length}</strong><small>Needs checkout</small></div>
            <div><span>🔴 Absent</span><strong>{attendanceSummary.Absent}</strong><small>Not working</small></div>
            <div><span>🌴 Leave / Off</span><strong>{attendanceSummary.Leave + attendanceSummary['Weekly Off']}</strong><small>Planned non-working</small></div>
            <div><span>⚠️ Not Marked</span><strong>{Math.max(0, employeeNames.length - attendanceLogs.length)}</strong><small>Needs attention</small></div>
          </div>

          <div className="va-staff-grid">
            <div className="va-staff-card">
              <div className="va-staff-card-head">
                <div><h3>Today’s Team</h3><p>Update status or use the manual clock controls.</p></div>
                <a href="/attendance.html" target="_blank" rel="noreferrer" className="va-staff-link">📱 Employee Phone Page</a>
              </div>
              {isLoadingAttendance ? <div className="va-staff-loading">Loading attendance...</div> : (
                <div className="va-staff-list">
                  {employeeNames.map(name => {
                    const row = attendanceLogs.find(r => r.employee_name === name);
                    const status = row?.status || 'Not Marked';
                    const openShift = Boolean(row?.check_in && !row?.check_out);
                    const statusClass = status === 'Present' ? 'present' : status === 'Absent' ? 'absent' : status === 'Leave' ? 'leave' : status === 'Weekly Off' ? 'off' : status === 'Half Day' ? 'half' : 'unmarked';
                    const saveStatus = async (nextStatus) => {
                      if (row) await updateAttendance(row.id, { status: nextStatus });
                      else {
                        const { error } = await supabase.from('employee_attendance').insert({ employee_name: name, attendance_date: attendanceDate, status: nextStatus });
                        if (error) alert('Attendance save failed: ' + error.message);
                        else await loadAttendance(attendanceDate);
                      }
                    };
                    return (
                      <div className="va-staff-row" key={name}>
                        <button className="va-staff-person" onClick={() => setSelectedStaffMember(name)}>
                          <span className="va-staff-avatar">{name.split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase()}</span>
                          <span><strong>{name}</strong><small>{openShift ? 'Currently clocked in' : row?.check_out ? 'Shift completed' : 'No active shift'}</small></span>
                        </button>
                        <select className={`va-status-select ${statusClass}`} value={row?.status || ''} onChange={e => saveStatus(e.target.value)}>
                          <option value="">Not Marked</option><option value="Present">Present</option><option value="Absent">Absent</option><option value="Half Day">Half Day</option><option value="Leave">Leave</option><option value="Weekly Off">Weekly Off</option>
                        </select>
                        <div className="va-staff-time"><span>{row?.check_in ? new Date(row.check_in).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '—'}</span><small>IN</small></div>
                        <div className="va-staff-time"><span>{row?.check_out ? new Date(row.check_out).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '—'}</span><small>OUT</small></div>
                        <div className="va-staff-hours">{row ? attendanceHours(row) : '—'}</div>
                        <div className="va-staff-actions">
                          <button onClick={() => manualAttendanceAction(name, 'check_in')} disabled={Boolean(row?.check_in)} className="va-staff-icon-btn in">IN</button>
                          <button onClick={() => manualAttendanceAction(name, 'check_out')} disabled={!row?.check_in || Boolean(row?.check_out)} className="va-staff-icon-btn out">OUT</button>
                          <button onClick={async () => {
                            const note = window.prompt('Attendance note (optional):', row?.notes || '');
                            if (note === null) return;
                            if (row) await updateAttendance(row.id, { notes: note });
                            else {
                              const { error } = await supabase.from('employee_attendance').insert({ employee_name: name, attendance_date: attendanceDate, status: 'Present', notes: note });
                              if (error) alert('Attendance save failed: ' + error.message);
                              else await loadAttendance(attendanceDate);
                            }
                          }} className="va-staff-icon-btn note">NOTE</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="va-staff-side">
              <div className="va-staff-card">
                <div className="va-staff-card-head"><div><h3>Operating Status</h3><p>Daily workforce snapshot.</p></div></div>
                <div className="va-staff-status-list">
                  {Object.entries(attendanceSummary).map(([status, count]) => <div key={status}><span>{status}</span><strong>{count}</strong></div>)}
                </div>
                <div className="va-staff-note"><strong>Location verification:</strong> {attendanceLocationRequired ? 'ON — employees must meet the workplace geofence.' : 'OFF — employees can check in/out without GPS.'}</div>
                <button onClick={() => setAttendanceLocation(!attendanceLocationRequired)} className={`va-staff-wide-btn ${attendanceLocationRequired ? 'danger' : 'success'}`}>{attendanceLocationRequired ? 'Turn Location Off' : 'Turn Location On'}</button>
              </div>

              <div className="va-staff-card">
                <div className="va-staff-card-head"><div><h3>Payroll Handoff</h3><p>Attendance feeds directly into payroll calculations.</p></div></div>
                <div className="va-staff-handoff"><span>Selected payroll month</span><strong>{payrollMonth}</strong></div>
                <button onClick={() => setActiveTab('payroll')} className="va-staff-wide-btn primary">Review Salary & Due →</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payroll' && (
        <div className="va-staff-page">
          <div className="va-staff-hero payroll">
            <div>
              <span className="va-staff-eyebrow">STAFF FINANCE • PAYROLL CONTROL</span>
              <h2>💰 Payroll & Employee Management</h2>
              <p>One place to review salary setup, attendance-driven earnings, advances, previous dues, and the amount still payable.</p>
            </div>
            <div className="va-staff-hero-actions">
              <label>Payroll Month<input type="month" value={payrollMonth} onChange={e => setPayrollMonth(e.target.value)} /></label>
              <button onClick={() => loadPayroll(payrollMonth)} disabled={isLoadingPayroll} className="va-staff-btn primary">{isLoadingPayroll ? '⏳ Loading...' : '🔄 Refresh'}</button>
              <button onClick={exportPayroll} className="va-staff-btn success">📊 Export Excel</button>
            </div>
          </div>

          <div className="va-staff-kpis payroll-kpis">
            <div><span>👥 Staff</span><strong>{payrollRows.length}</strong><small>{staffManagement.configured} salaries configured</small></div>
            <div><span>💵 Earned</span><strong>{formatINR(staffManagement.totalEarned)}</strong><small>Attendance-based</small></div>
            <div><span>💳 Paid / Taken</span><strong>{formatINR(staffManagement.totalPaid)}</strong><small>Allocated to {payrollMonth}</small></div>
            <div><span>📌 Previous Due</span><strong>{formatINR(payrollRows.reduce((s,r) => s + r.previousDueAfterPayment, 0))}</strong><small>Carry-forward</small></div>
            <div><span>⚠️ Total To Pay</span><strong>{formatINR(staffManagement.totalDue)}</strong><small>Current + previous due</small></div>
          </div>

          <div className="va-staff-grid payroll-grid">
            <div className="va-staff-card">
              <div className="va-staff-card-head">
                <div><h3>Employee Salary Control</h3><p>Click an employee to inspect their payroll position. Salary values are saved locally as before.</p></div>
                <button onClick={() => setActiveTab('attendance')} className="va-staff-link-btn">👥 Open Attendance</button>
              </div>
              <div className="va-payroll-employee-list">
                {payrollRows.map(r => (
                  <button key={r.name} onClick={() => setSelectedStaffMember(r.name)} className={`va-payroll-person ${selectedStaffMember === r.name ? 'active' : ''}`}>
                    <span className="va-staff-avatar">{r.name.split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase()}</span>
                    <span className="va-payroll-person-main"><strong>{r.name}</strong><small>{r.monthlySalary > 0 ? `Salary ₹${Number(r.monthlySalary).toLocaleString('en-IN')}` : 'Salary not configured'}</small></span>
                    <span className={`va-payroll-person-due ${r.totalBalanceToPay > 0 ? 'due' : 'clear'}`}>{r.totalBalanceToPay > 0 ? formatINR(r.totalBalanceToPay) : 'Clear'}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="va-staff-side">
              <div className="va-staff-card">
                <div className="va-staff-card-head"><div><h3>Payroll Health</h3><p>Management snapshot for {payrollMonth}.</p></div></div>
                <div className="va-staff-status-list">
                  <div><span>Payable attendance days</span><strong>{staffManagement.attendancePayable.toFixed(1)}</strong></div>
                  <div><span>Cash advances</span><strong>{formatINR(staffManagement.advances)}</strong></div>
                  <div><span>Employees with due</span><strong>{payrollRows.filter(r => r.totalBalanceToPay > 0).length}</strong></div>
                  <div><span>Employees without salary</span><strong>{payrollRows.filter(r => r.monthlySalary <= 0).length}</strong></div>
                </div>
                <div className="va-staff-note"><strong>Accounting control:</strong> Old salary payments should use the old month in <b>Due For</b>. This preserves the existing carry-forward calculation.</div>
              </div>
              <div className="va-staff-card">
                <div className="va-staff-card-head"><div><h3>Priority Payroll</h3><p>People requiring a manager review.</p></div></div>
                <div className="va-payroll-priority-list">
                  {staffManagement.priority.slice(0,5).map(r => <button key={r.name} onClick={() => setSelectedStaffMember(r.name)}><span>{r.monthlySalary <= 0 ? '⚙️' : '💸'}</span><strong>{r.name}</strong><small>{r.monthlySalary <= 0 ? 'Salary not configured' : `Due ${formatINR(r.totalBalanceToPay)}`}</small></button>)}
                  {staffManagement.priority.length === 0 && <div className="va-staff-empty">No payroll exceptions.</div>}
                </div>
              </div>
            </div>
          </div>

          {selectedStaffMember && (() => {
            const r = payrollRows.find(x => x.name === selectedStaffMember);
            if (!r) return null;
            const attendanceRow = attendanceLogs.find(x => x.employee_name === r.name);
            return (
              <div className="va-staff-detail">
                <div className="va-staff-detail-head">
                  <div><span className="va-staff-eyebrow">EMPLOYEE DETAIL</span><h3>{r.name}</h3><p>Payroll and attendance position for {payrollMonth}.</p></div>
                  <div className="va-staff-detail-actions"><button onClick={() => setActiveTab('attendance')} className="va-staff-btn secondary">View Attendance</button><button onClick={() => setSelectedStaffMember(null)} className="va-staff-btn ghost">Close</button></div>
                </div>
                <div className="va-staff-detail-grid">
                  <div><span>Monthly Salary</span><strong>{r.monthlySalary > 0 ? formatINR(r.monthlySalary) : 'Not set'}</strong></div>
                  <div><span>Present</span><strong>{r.present}</strong></div>
                  <div><span>Payable Days</span><strong>{r.payableDays}</strong></div>
                  <div><span>Earned Salary</span><strong>{formatINR(r.earnedPay)}</strong></div>
                  <div><span>Paid / Taken</span><strong>{formatINR(r.totalTaken)}</strong></div>
                  <div><span>Cash Advance</span><strong>{formatINR(r.cashAdvance)}</strong></div>
                  <div><span>Previous Due</span><strong>{formatINR(r.previousDueAfterPayment)}</strong></div>
                  <div><span>Total Balance</span><strong className={r.totalBalanceToPay > 0 ? 'due' : 'clear'}>{formatINR(r.totalBalanceToPay)}</strong></div>
                </div>
                <div className="va-staff-detail-note">
                  <strong>Quick salary setup:</strong>
                  <input type="number" min="0" value={r.monthlySalary || ''} placeholder="Monthly salary" onChange={e => saveSalary(r.name, e.target.value)} />
                  {attendanceRow ? <span>{`Today: ${attendanceRow.status || "Not marked"}${attendanceRow.check_in ? " • Checked in" : ""}`}</span> : <span>Today: No attendance record</span>}
                </div>
              </div>
            );
          })()}

          <div className="va-staff-card va-payroll-table-card">
            <div className="va-staff-card-head"><div><h3>Payroll Detail</h3><p>Full calculation table remains available for audit and export.</p></div></div>
            {isLoadingPayroll ? <p>Loading payroll...</p> : (
              <div className="va-payroll-table-wrap">
                <table className="va-payroll-table">
                  <thead><tr>
                    {['Employee','Monthly Salary','Present','Half Day','Leave','Absent','Weekly Off','Hours','Payable Days','Earned Salary','Paid For Month','Previous Due','Paid Toward Previous','Total Balance'].map(h => <th key={h} className={h === 'Employee' ? 'left' : ''}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {payrollRows.map(r => (
                      <tr key={r.name}>
                        <td className="employee-cell"><strong>{r.name}</strong><small>{r.monthlySalary > 0 ? 'Salary configured' : 'Salary not set'}</small></td>
                        <td><input type="number" min="0" value={r.monthlySalary || ''} placeholder="₹ Salary" onChange={e => saveSalary(r.name, e.target.value)} /></td>
                        <td>{r.present}</td><td>{r.half}</td><td>{r.leave}</td><td>{r.absent}</td><td>{r.weeklyOff}</td>
                        <td>{r.hours.toFixed(2)}</td><td>{r.payableDays}</td><td className="money strong">{formatINR(r.earnedPay)}</td>
                        <td className="money paid">{formatINR(r.totalTaken)}{r.cashAdvance > 0 && <small>Advance {formatINR(r.cashAdvance)}</small>}</td>
                        <td className={r.previousDueAfterPayment > 0 ? 'money due' : 'money clear'}>{formatINR(r.previousDueAfterPayment)}</td>
                        <td className="money carry">{formatINR(r.paidTowardPreviousDues)}</td>
                        <td className={r.totalBalanceToPay > 0 ? 'money due' : 'money clear'}>{formatINR(r.totalBalanceToPay)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
        </main>
      </div>
    </>
  );
}

const alertUiStyles = `
.va-dashboard-alerts{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:20px;box-shadow:0 8px 25px rgba(15,23,42,.055);margin-bottom:18px}.va-alert-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.va-alert-item{display:flex;align-items:center;gap:11px;width:100%;text-align:left;border:1px solid #e2e8f0;background:#fff;border-radius:13px;padding:12px;cursor:pointer;transition:.15s}.va-alert-item:hover{transform:translateY(-1px);box-shadow:0 6px 15px rgba(15,23,42,.06)}.va-alert-item.danger{border-left:4px solid #dc2626;background:#fffafa}.va-alert-item.warning{border-left:4px solid #f59e0b;background:#fffdf7}.va-alert-item.info{border-left:4px solid #2563eb;background:#f8fbff}.va-alert-item.success{border-left:4px solid #10b981;background:#f7fffb}.va-alert-icon{width:34px;height:34px;border-radius:10px;background:#f1f5f9;display:grid;place-items:center;flex:none}.va-alert-copy{flex:1;min-width:0}.va-alert-copy strong{display:block;color:#0f172a;font-size:12px}.va-alert-copy small{display:block;color:#64748b;font-size:11px;line-height:1.45;margin-top:3px}.va-alert-arrow{color:#94a3b8;font-weight:900}@media(max-width:800px){.va-alert-list{grid-template-columns:1fr}}@media(max-width:500px){.va-dashboard-alerts{padding:14px}.va-alert-item{padding:10px}}
`;

const historyUiStyles = `
.va-history-page{max-width:1500px;margin:0 auto}.va-history-hero{display:flex;justify-content:space-between;align-items:center;gap:20px;background:linear-gradient(135deg,#0f172a,#334155);color:#fff;border-radius:22px;padding:26px;margin-bottom:18px;box-shadow:0 15px 35px rgba(15,23,42,.12)}.va-history-hero h2{margin:6px 0;font-size:28px}.va-history-hero p{margin:0;color:#cbd5e1;font-size:13px}.va-history-export{border:0;border-radius:10px;padding:11px 15px;background:#10b981;color:#fff;font-weight:900;cursor:pointer}.va-history-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.va-history-summary>div{background:#fff;border:1px solid #e2e8f0;border-top:4px solid #64748b;border-radius:16px;padding:17px;box-shadow:0 7px 22px rgba(15,23,42,.05)}.va-history-summary>div:nth-child(2){border-top-color:#2563eb}.va-history-summary>div:nth-child(3){border-top-color:#ef4444}.va-history-summary>div:nth-child(4){border-top-color:#10b981}.va-history-summary span{display:block;color:#64748b;font-size:11px;font-weight:800}.va-history-summary strong{display:block;margin-top:6px;font-size:21px;color:#0f172a}.va-history-filter-card,.va-history-table-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:20px;box-shadow:0 8px 25px rgba(15,23,42,.055);margin-bottom:18px}.va-history-filter-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1.2fr auto;gap:10px;align-items:end}.va-history-filter-grid label{font-size:11px;font-weight:900;color:#475569}.va-history-filter-grid input,.va-history-filter-grid select{display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:11px;border:1px solid #cbd5e1;border-radius:10px;background:#fff}.va-history-clear{border:0;border-radius:10px;padding:11px 14px;background:#334155;color:#fff;font-weight:900;cursor:pointer}.va-history-table-head{display:flex;justify-content:space-between;gap:15px;align-items:center;margin-bottom:14px}.va-history-table-head h3{margin:0;font-size:19px}.va-history-table-head p{margin:4px 0 0;color:#64748b;font-size:12px}.va-history-table-head>span{background:#f1f5f9;padding:7px 10px;border-radius:999px;font-size:11px;font-weight:900;color:#475569}.va-history-table-wrap{overflow:auto;border:1px solid #e2e8f0;border-radius:12px}.va-history-table{width:100%;border-collapse:collapse;min-width:850px}.va-history-table th,.va-history-table td{padding:12px 11px;border-bottom:1px solid #eef2f7;text-align:right;font-size:12px;white-space:nowrap}.va-history-table th{background:#f8fafc;color:#475569;font-size:10px;text-transform:uppercase;letter-spacing:.04em}.va-history-table th:first-child,.va-history-table td:first-child{text-align:left}.va-history-table tbody tr:not(.va-history-detail-row){cursor:pointer}.va-history-table tbody tr:not(.va-history-detail-row):hover,.va-history-table tr.selected{background:#f8fafc}.va-history-table td small{display:block;color:#94a3b8;font-size:10px;margin-top:3px}.history-sales{color:#047857;font-weight:900}.history-expense{color:#b91c1c;font-weight:900}.va-history-detail-row td{background:#f8fafc;padding:0}.va-history-detail{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:15px}.va-history-detail>div{background:#fff;border:1px solid #e2e8f0;border-radius:11px;padding:12px}.va-history-detail span{display:block;color:#64748b;font-size:10px;font-weight:900;text-transform:uppercase}.va-history-detail strong{display:block;margin-top:5px;font-size:15px;color:#0f172a}.va-history-detail small{display:block;color:#64748b;font-size:10px;line-height:1.4;margin-top:4px}.va-history-detail-actions{display:flex;align-items:center;gap:10px;padding:0 15px 15px}.va-history-detail-actions button{border:0;border-radius:10px;padding:10px 13px;background:#2563eb;color:#fff;font-weight:900;cursor:pointer}.va-history-detail-actions span{font-size:10px;color:#64748b}.va-history-note{padding:13px 15px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;color:#1e40af;font-size:12px;line-height:1.5;margin-bottom:20px}@media(max-width:1000px){.va-history-filter-grid{grid-template-columns:1fr 1fr}.va-history-clear{width:100%}.va-history-summary{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.va-history-hero{display:block}.va-history-export{margin-top:14px;width:100%}.va-history-summary{grid-template-columns:1fr 1fr}.va-history-filter-grid{grid-template-columns:1fr}.va-history-table-card,.va-history-filter-card{padding:14px}.va-history-detail{grid-template-columns:1fr}.va-history-detail-actions{display:block}.va-history-detail-actions button{width:100%}.va-history-detail-actions span{display:block;margin-top:8px}}
`;

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
.va-final-card{background:linear-gradient(145deg,#0f172a,#172554);color:#fff;border-radius:22px;padding:24px;margin-bottom:20px;box-shadow:0 18px 45px rgba(15,23,42,.18);overflow:hidden;position:relative}.va-final-card:before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 90% 0%,rgba(59,130,246,.2),transparent 35%);pointer-events:none}.va-final-head,.va-final-highlight,.va-final-grid,.va-final-check,.va-final-actions,.va-save-note{position:relative;z-index:1}.va-final-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:18px}.va-final-head h3{font-size:24px;margin:5px 0}.va-final-head p{margin:0;color:#cbd5e1;font-size:13px}.va-final-eyebrow{color:#93c5fd}.va-save-status{background:rgba(16,185,129,.14);border:1px solid rgba(52,211,153,.25);color:#6ee7b7;padding:8px 12px;border-radius:999px;font-size:12px;font-weight:800;white-space:nowrap}.va-final-highlight{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:18px 20px;border:1px solid rgba(251,191,36,.28);background:rgba(251,191,36,.1);border-radius:16px;margin-bottom:14px}.va-final-highlight span{display:block;font-weight:900;font-size:14px}.va-final-highlight small{display:block;color:#cbd5e1;margin-top:4px}.va-final-highlight strong{font-size:30px;color:#fcd34d}.va-final-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.va-final-metric{padding:18px;border-radius:15px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.09)}.va-final-metric span{display:block;color:#cbd5e1;font-size:12px;font-weight:800}.va-final-metric strong{display:block;font-size:24px;margin-top:8px}.va-final-metric small{display:block;color:#94a3b8;margin-top:5px}.va-final-metric.cash{border-top:3px solid #34d399}.va-final-metric.cash strong{color:#6ee7b7}.va-final-metric.online{border-top:3px solid #60a5fa}.va-final-metric.online strong{color:#93c5fd}.va-final-metric.total{border-top:3px solid #a78bfa}.va-final-metric.total strong{color:#c4b5fd}.va-final-check{display:flex;gap:12px;align-items:flex-start;margin:14px 0;padding:13px 15px;border-radius:13px;background:rgba(15,23,42,.45);border:1px solid rgba(148,163,184,.15)}.va-final-check-icon{width:27px;height:27px;border-radius:50%;display:grid;place-items:center;background:#10b981;color:#fff;font-weight:900;flex:none}.va-final-check strong{font-size:13px}.va-final-check p{margin:3px 0 0;color:#94a3b8;font-size:12px;line-height:1.45}.va-final-actions{display:grid;grid-template-columns:.8fr 2fr;gap:10px}.va-clear-btn,.va-save-btn{border:0;border-radius:12px;padding:14px 16px;font-weight:900;cursor:pointer;font-size:14px}.va-clear-btn{background:rgba(255,255,255,.1);color:#e2e8f0;border:1px solid rgba(255,255,255,.14)}.va-save-btn{background:#10b981;color:#fff;font-size:16px;box-shadow:0 8px 20px rgba(16,185,129,.22)}.va-save-btn:disabled{background:#64748b;cursor:not-allowed;box-shadow:none}.va-save-note{margin:10px 0 0;color:#94a3b8;text-align:center;font-size:11px}@media(max-width:750px){.va-final-head{display:block}.va-save-status{display:inline-block;margin-top:12px}.va-final-grid{grid-template-columns:1fr}.va-final-highlight{align-items:flex-start;flex-direction:column}.va-final-highlight strong{font-size:26px}.va-final-actions{grid-template-columns:1fr}.va-save-btn{order:-1}}

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
.va-staff-card{background:#fff;border:1px solid #ddd6fe;border-top:4px solid #8b5cf6;border-radius:18px;padding:20px;margin-bottom:18px}.va-staff-help{background:#f5f3ff;color:#5b21b6;border:1px solid #ddd6fe;border-radius:10px;padding:10px 12px;font-size:12px;margin-bottom:14px}.va-staff-row{display:grid;grid-template-columns:1.05fr .9fr .85fr .75fr 1.3fr 38px;gap:8px;margin-bottom:9px}.va-drawer-card{background:#fff;border:1px solid #fde68a;border-top:4px solid #f59e0b;border-radius:18px;padding:20px;margin-bottom:18px}.va-drawer-total{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:10px 16px;text-align:right;min-width:145px}.va-drawer-total span{display:block;color:#92400e;font-size:11px;font-weight:800}.va-drawer-total strong{font-size:20px;color:#78350f}.va-drawer-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px;margin:16px 0}.va-note-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px;text-align:center}.va-note-box span{display:block;font-weight:900;color:#334155}.va-note-box input{width:100%;box-sizing:border-box;margin:8px 0;padding:10px;border:1px solid #cbd5e1;border-radius:8px;text-align:center}.va-note-box small{color:#64748b;font-weight:700}.va-coin-box{background:#fffbeb}.va-drawer-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.va-drawer-summary>div{background:#f8fafc;border-radius:12px;padding:13px;text-align:center}.va-drawer-summary span{display:block;color:#64748b;font-size:11px;font-weight:800}.va-drawer-summary strong{display:block;font-size:20px;margin-top:5px}.va-drawer-summary .positive{background:#ecfdf5}.va-drawer-summary .negative{background:#fef2f2}.va-drawer-note{margin-top:12px;padding:10px;border-radius:10px;background:#f8fafc;color:#64748b;font-size:12px}@media(max-width:1100px){.va-staff-row{grid-template-columns:1fr 1fr 1fr}.va-drawer-grid{grid-template-columns:repeat(4,1fr)}}@media(max-width:650px){.va-staff-row{grid-template-columns:1fr}.va-drawer-grid{grid-template-columns:repeat(2,1fr)}.va-drawer-summary{grid-template-columns:1fr}.va-drawer-total{text-align:left;margin-top:10px}.va-staff-row .va-icon-delete{width:100%}}
`;
const payrollUiStyles = `
.va-payroll-page{max-width:1500px;margin:0 auto}
.va-payroll-hero{display:flex;justify-content:space-between;gap:22px;align-items:center;background:linear-gradient(135deg,#111827,#4c1d95);color:#fff;border-radius:22px;padding:26px;margin-bottom:18px;box-shadow:0 15px 35px rgba(15,23,42,.12)}
.va-payroll-eyebrow{font-size:11px;font-weight:900;letter-spacing:.1em;color:#c4b5fd}
.va-payroll-hero h2{margin:6px 0;font-size:27px}.va-payroll-hero p{margin:0;color:#ddd6fe;font-size:13px;max-width:720px}
.va-payroll-actions{display:flex;gap:8px;align-items:end;flex-wrap:wrap}.va-payroll-actions label{font-size:11px;font-weight:900;color:#ddd6fe}.va-payroll-actions input{display:block;margin-top:5px;padding:11px;border:0;border-radius:10px;background:#fff;color:#111827}
.va-payroll-btn{border:0;border-radius:10px;padding:11px 14px;font-weight:900;cursor:pointer}.va-payroll-btn.secondary{background:#ede9fe;color:#5b21b6}.va-payroll-btn.success{background:#10b981;color:#fff}.va-payroll-btn:disabled{opacity:.6;cursor:not-allowed}
.va-payroll-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:18px}.va-payroll-kpis>div{background:#fff;border:1px solid #e2e8f0;border-top:4px solid #8b5cf6;border-radius:16px;padding:17px;box-shadow:0 7px 22px rgba(15,23,42,.05)}.va-payroll-kpis>div:nth-child(2){border-top-color:#2563eb}.va-payroll-kpis>div:nth-child(3){border-top-color:#f59e0b}.va-payroll-kpis>div:nth-child(4){border-top-color:#ef4444}.va-payroll-kpis>div:nth-child(5){border-top-color:#10b981}.va-payroll-kpis span{display:block;color:#64748b;font-size:12px;font-weight:800}.va-payroll-kpis strong{display:block;font-size:21px;margin-top:7px;color:#0f172a}.va-payroll-kpis small{display:block;color:#94a3b8;margin-top:4px;font-size:11px}
.va-payroll-note{padding:13px 15px;background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;border-radius:12px;margin-bottom:18px;font-size:12px;line-height:1.5}.va-payroll-note strong{color:#1d4ed8}
.va-payroll-table-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:20px;box-shadow:0 8px 25px rgba(15,23,42,.055)}.va-payroll-table-head{display:flex;justify-content:space-between;gap:15px;align-items:flex-start;margin-bottom:14px}.va-payroll-table-head h3{margin:3px 0;font-size:19px}.va-payroll-table-head p{margin:0;color:#64748b;font-size:12px}.va-payroll-legend{display:flex;gap:10px;flex-wrap:wrap;font-size:11px;font-weight:800;color:#64748b}
.va-payroll-table-wrap{overflow:auto;border:1px solid #e2e8f0;border-radius:12px}.va-payroll-table{width:100%;border-collapse:collapse;min-width:1420px}.va-payroll-table th,.va-payroll-table td{padding:11px 10px;border-bottom:1px solid #eef2f7;text-align:right;white-space:nowrap;font-size:12px}.va-payroll-table th{background:#f8fafc;color:#475569;font-size:10px;text-transform:uppercase;letter-spacing:.04em}.va-payroll-table th.left,.va-payroll-table td:first-child{text-align:left}.va-payroll-table tbody tr:hover{background:#fafaff}.va-payroll-table input{width:120px;padding:9px;border:1px solid #cbd5e1;border-radius:8px}.employee-cell small{display:block;color:#94a3b8;font-size:10px;margin-top:3px}.money{font-weight:900}.money strong{font-weight:900}.money.paid{color:#b45309}.money.due{color:#dc2626}.money.clear{color:#059669}.money.carry{color:#2563eb}.money.paid small{display:block;color:#6b7280;font-size:10px;font-weight:700;margin-top:2px}
@media(max-width:1100px){.va-payroll-kpis{grid-template-columns:repeat(3,1fr)}.va-payroll-hero{display:block}.va-payroll-actions{margin-top:15px}.va-payroll-actions>*{flex:1}}
@media(max-width:650px){.va-payroll-kpis{grid-template-columns:repeat(2,1fr)}.va-payroll-hero,.va-payroll-table-card{padding:15px}.va-payroll-hero h2{font-size:22px}.va-payroll-kpis strong{font-size:18px}.va-payroll-table-head{display:block}.va-payroll-legend{margin-top:10px}.va-payroll-actions{display:grid;grid-template-columns:1fr 1fr}.va-payroll-actions label{grid-column:1/-1}.va-payroll-actions>*{width:100%}}
`;



const cashflowUiStyles = `
.va-cashflow-page{max-width:1500px;margin:0 auto}.va-cashflow-hero{display:flex;justify-content:space-between;align-items:center;gap:24px;background:linear-gradient(135deg,#052e16,#0f766e 70%,#164e63);color:#fff;border-radius:22px;padding:26px;margin-bottom:18px;box-shadow:0 15px 35px rgba(15,23,42,.12)}.va-cashflow-hero h2{margin:6px 0;font-size:28px}.va-cashflow-hero p{margin:0;color:#ccfbf1;max-width:760px;font-size:13px;line-height:1.5}.va-cashflow-period{display:flex;gap:9px;flex-wrap:wrap}.va-cashflow-period label{font-size:10px;font-weight:900;color:#ccfbf1}.va-cashflow-period input{display:block;margin-top:5px;padding:10px;border:0;border-radius:9px}.va-cashflow-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.va-cashflow-kpis>div{background:#fff;border:1px solid #e2e8f0;border-top:4px solid #64748b;border-radius:16px;padding:18px;box-shadow:0 7px 22px rgba(15,23,42,.05)}.va-cashflow-kpis .in{border-top-color:#10b981}.va-cashflow-kpis .out{border-top-color:#ef4444}.va-cashflow-kpis .positive{border-top-color:#2563eb}.va-cashflow-kpis .negative{border-top-color:#dc2626}.va-cashflow-kpis span{display:block;color:#64748b;font-size:11px;font-weight:900}.va-cashflow-kpis strong{display:block;color:#0f172a;font-size:23px;margin-top:7px}.va-cashflow-kpis small{display:block;color:#94a3b8;margin-top:4px}.va-cashflow-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px}.va-cashflow-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:20px;box-shadow:0 8px 25px rgba(15,23,42,.055);margin-bottom:18px}.va-cashflow-head{display:flex;justify-content:space-between;align-items:flex-start;gap:15px;margin-bottom:14px}.va-cashflow-head h3{margin:4px 0;font-size:19px}.va-cashflow-head p{margin:0;color:#64748b;font-size:12px}.va-cashflow-head>strong{font-size:18px;color:#0f172a}.va-cashflow-lines{display:flex;flex-direction:column;gap:7px}.va-cashflow-lines div{display:flex;justify-content:space-between;padding:11px 12px;background:#f8fafc;border-radius:10px;border:1px solid #eef2f7}.va-cashflow-lines span{color:#64748b;font-size:12px}.va-cashflow-lines b{font-size:12px;color:#0f172a}.va-cashflow-channel-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.va-cashflow-channel-grid>div{padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px}.va-cashflow-channel-grid span{display:block;color:#64748b;font-size:10px;font-weight:900}.va-cashflow-channel-grid strong{display:block;margin-top:6px;font-size:18px}.va-cashflow-badge{padding:7px 10px;border-radius:999px;background:#f0fdfa;color:#0f766e;font-size:10px;font-weight:900}.va-cashflow-note{margin-top:14px;padding:12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:11px;color:#1e40af;font-size:11px;line-height:1.5}.va-cashflow-table-wrap{overflow:auto;border:1px solid #e2e8f0;border-radius:12px}.va-cashflow-table{width:100%;border-collapse:collapse;min-width:850px}.va-cashflow-table th,.va-cashflow-table td{padding:11px;border-bottom:1px solid #eef2f7;text-align:right;font-size:11px;white-space:nowrap}.va-cashflow-table th{background:#f8fafc;color:#475569;font-size:9px;text-transform:uppercase}.va-cashflow-table th:first-child,.va-cashflow-table td:first-child{text-align:left}.in-text{color:#047857;font-weight:800}.out-text{color:#b91c1c;font-weight:800}.va-cashflow-empty{text-align:center!important;padding:30px!important;color:#64748b}@media(max-width:1050px){.va-cashflow-hero{display:block}.va-cashflow-period{margin-top:15px}.va-cashflow-kpis{grid-template-columns:repeat(2,1fr)}.va-cashflow-grid{grid-template-columns:1fr}.va-cashflow-channel-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.va-cashflow-hero,.va-cashflow-card{padding:15px}.va-cashflow-kpis{grid-template-columns:1fr 1fr}.va-cashflow-channel-grid{grid-template-columns:1fr 1fr}.va-cashflow-period label{flex:1}.va-cashflow-period input{width:100%;box-sizing:border-box}}@media(max-width:430px){.va-cashflow-kpis{grid-template-columns:1fr}.va-cashflow-channel-grid{grid-template-columns:1fr}}
`;
const analyticsUiStyles = `\n.va-analytics-page{max-width:1500px;margin:0 auto}.va-analytics-hero{display:flex;justify-content:space-between;gap:24px;align-items:center;background:linear-gradient(135deg,#0f172a,#1e3a8a);color:#fff;border-radius:22px;padding:26px;margin-bottom:18px;box-shadow:0 15px 35px rgba(15,23,42,.12)}.va-analytics-hero h2{margin:6px 0;font-size:28px}.va-analytics-hero p{margin:0;color:#cbd5e1;max-width:760px;line-height:1.5;font-size:13px}.va-analytics-actions{display:flex;gap:9px;align-items:end;flex-wrap:wrap}.va-analytics-actions label{font-size:11px;font-weight:900;color:#cbd5e1}.va-analytics-actions input{display:block;margin-top:5px;padding:10px;border:0;border-radius:9px;background:#fff;color:#111827}.va-analytics-btn{border:0;border-radius:10px;padding:11px 14px;background:#10b981;color:#fff;font-weight:900;cursor:pointer;white-space:nowrap}.va-analytics-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.va-analytics-kpis>div{background:#fff;border:1px solid #e2e8f0;border-top:4px solid #2563eb;border-radius:16px;padding:18px;box-shadow:0 7px 22px rgba(15,23,42,.05)}.va-analytics-kpis .expense{border-top-color:#ef4444}.va-analytics-kpis .profit{border-top-color:#10b981}.va-analytics-kpis .loss{border-top-color:#dc2626}.va-analytics-kpis .credit{border-top-color:#f59e0b}.va-analytics-kpis span{display:block;color:#64748b;font-size:12px;font-weight:800}.va-analytics-kpis strong{display:block;font-size:23px;margin-top:7px;color:#0f172a}.va-analytics-kpis small{display:block;color:#94a3b8;margin-top:4px}.va-analytics-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px}.va-analytics-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:20px;box-shadow:0 8px 25px rgba(15,23,42,.055);margin-bottom:18px}.va-analytics-card-head{display:flex;justify-content:space-between;gap:15px;align-items:flex-start;margin-bottom:16px}.va-analytics-card-head h3{margin:4px 0;font-size:19px}.va-analytics-card-head p{margin:0;color:#64748b;font-size:12px}.va-analytics-mix-row,.va-analytics-expense-row{margin-bottom:15px}.va-analytics-mix-row>div:first-child,.va-analytics-expense-row>div:first-child{display:flex;justify-content:space-between;gap:15px;margin-bottom:6px;font-size:12px}.va-analytics-mix-row span,.va-analytics-expense-row span{color:#64748b}.va-analytics-progress{height:9px;background:#e2e8f0;border-radius:999px;overflow:hidden}.va-analytics-progress i{display:block;height:100%;background:#2563eb;border-radius:999px}.va-analytics-progress i.cash{background:#10b981}.va-analytics-progress i.online{background:#3b82f6}.va-analytics-progress i.credit{background:#f59e0b}.va-analytics-mini-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:18px}.va-analytics-mini-grid>div{padding:12px;background:#f8fafc;border-radius:11px}.va-analytics-mini-grid span{display:block;color:#64748b;font-size:11px;font-weight:800}.va-analytics-mini-grid strong{display:block;margin-top:5px}.va-analytics-table-wrap{overflow:auto;border:1px solid #e2e8f0;border-radius:12px}.va-analytics-table{width:100%;border-collapse:collapse;min-width:780px}.va-analytics-table th,.va-analytics-table td{padding:12px 11px;border-bottom:1px solid #eef2f7;text-align:right;font-size:12px;white-space:nowrap}.va-analytics-table th{background:#f8fafc;color:#475569;font-size:10px;text-transform:uppercase}.va-analytics-table th:first-child,.va-analytics-table td:first-child{text-align:left}.va-analytics-insight{display:flex;gap:13px;align-items:flex-start;background:#eff6ff;border:1px solid #bfdbfe;border-radius:16px;padding:16px 18px;margin-bottom:18px}.va-analytics-insight-icon{width:34px;height:34px;display:grid;place-items:center;background:#dbeafe;border-radius:10px;flex:none}.va-analytics-insight strong{color:#1e40af}.va-analytics-insight p{margin:4px 0 0;color:#475569;font-size:12px;line-height:1.5}.va-analytics-note{padding:13px 15px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;color:#64748b;font-size:12px;line-height:1.5;margin-bottom:20px}.va-analytics-note strong{color:#334155}@media(max-width:1050px){.va-analytics-hero{display:block}.va-analytics-actions{margin-top:16px}.va-analytics-kpis{grid-template-columns:repeat(2,1fr)}.va-analytics-grid{grid-template-columns:1fr}}@media(max-width:650px){.va-analytics-hero,.va-analytics-card{padding:15px}.va-analytics-kpis{grid-template-columns:1fr 1fr}.va-analytics-actions{display:grid;grid-template-columns:1fr 1fr}.va-analytics-actions label{width:100%}.va-analytics-actions label input{width:100%;box-sizing:border-box}.va-analytics-btn{grid-column:1/-1}.va-analytics-mini-grid{grid-template-columns:1fr 1fr}}@media(max-width:430px){.va-analytics-kpis{grid-template-columns:1fr}.va-analytics-actions{grid-template-columns:1fr}.va-analytics-btn{grid-column:auto}}\n`;

const aiUiStyles = `
.va-ai-page{max-width:1180px;margin:0 auto}.va-ai-hero{display:flex;justify-content:space-between;gap:20px;align-items:center;background:linear-gradient(135deg,#0f172a,#312e81 65%,#0f766e);color:#fff;border-radius:22px;padding:26px;margin-bottom:18px;box-shadow:0 15px 35px rgba(15,23,42,.14)}.va-ai-hero h2{margin:6px 0;font-size:28px}.va-ai-hero p{margin:0;color:#cbd5e1;max-width:700px;line-height:1.5;font-size:13px}.va-ai-status{padding:9px 12px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);font-size:11px;font-weight:900;white-space:nowrap}.va-ai-layout{display:grid;grid-template-columns:1fr 300px;gap:18px}.va-ai-chat{background:#fff;border:1px solid #e2e8f0;border-radius:18px;box-shadow:0 8px 25px rgba(15,23,42,.055);overflow:hidden;display:flex;flex-direction:column;min-height:620px}.va-ai-messages{padding:20px;display:flex;flex-direction:column;gap:12px;flex:1;min-height:430px;max-height:560px;overflow:auto;background:linear-gradient(180deg,#f8fafc,#fff)}.va-ai-message{max-width:84%;padding:12px 14px;border-radius:15px;font-size:13px;line-height:1.55;white-space:pre-wrap}.va-ai-message.user{align-self:flex-end;background:#2563eb;color:#fff;border-bottom-right-radius:5px}.va-ai-message.assistant{align-self:flex-start;background:#fff;color:#1e293b;border:1px solid #e2e8f0;border-bottom-left-radius:5px}.va-ai-message small{display:block;font-size:10px;font-weight:900;opacity:.7;margin-bottom:4px}.va-ai-composer{padding:14px;border-top:1px solid #e2e8f0;background:#fff}.va-ai-composer form{display:flex;gap:9px}.va-ai-composer textarea{flex:1;min-height:54px;resize:vertical;padding:12px;border:1px solid #cbd5e1;border-radius:12px;font:inherit;outline:none}.va-ai-composer textarea:focus{border-color:#818cf8;box-shadow:0 0 0 3px rgba(99,102,241,.1)}.va-ai-send{border:0;border-radius:12px;padding:0 18px;background:#2563eb;color:#fff;font-weight:900;cursor:pointer}.va-ai-send:disabled{opacity:.55;cursor:not-allowed}.va-ai-sidebar{display:flex;flex-direction:column;gap:12px}.va-ai-side-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:16px;box-shadow:0 7px 22px rgba(15,23,42,.05)}.va-ai-side-card h3{margin:0 0 10px;font-size:15px}.va-ai-chip{width:100%;text-align:left;border:1px solid #e2e8f0;background:#f8fafc;color:#334155;border-radius:10px;padding:10px 11px;margin-bottom:7px;font-weight:700;font-size:12px;cursor:pointer}.va-ai-chip:hover{background:#eef2ff;border-color:#c7d2fe;color:#4338ca}.va-ai-metric{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid #eef2f7;font-size:12px}.va-ai-metric:last-child{border-bottom:0}.va-ai-metric span{color:#64748b}.va-ai-metric strong{color:#0f172a}.va-ai-note{padding:12px;border-radius:11px;background:#fffbeb;border:1px solid #fde68a;color:#92400e;font-size:11px;line-height:1.5}@media(max-width:900px){.va-ai-layout{grid-template-columns:1fr}.va-ai-sidebar{display:grid;grid-template-columns:1fr 1fr}.va-ai-note{grid-column:1/-1}}@media(max-width:600px){.va-ai-hero{display:block}.va-ai-status{display:inline-block;margin-top:14px}.va-ai-sidebar{display:block}.va-ai-chat{min-height:560px}.va-ai-messages{min-height:380px}.va-ai-message{max-width:94%}.va-ai-composer form{display:grid}.va-ai-send{padding:12px}}
`;

const khataUiStyles = `
.va-khata-page{max-width:1500px;margin:0 auto}.va-khata-hero{display:flex;justify-content:space-between;align-items:center;gap:20px;background:linear-gradient(135deg,#111827,#312e81);color:#fff;border-radius:22px;padding:26px;margin-bottom:18px;box-shadow:0 15px 35px rgba(15,23,42,.12)}.va-khata-hero h2{margin:5px 0;font-size:27px}.va-khata-hero p{margin:0;color:#cbd5e1}.va-khata-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.va-khata-kpi{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:18px;box-shadow:0 7px 22px rgba(15,23,42,.05);border-top:4px solid #64748b}.va-khata-kpi span{font-size:12px;color:#64748b;font-weight:800}.va-khata-kpi strong{display:block;font-size:24px;margin-top:7px;color:#0f172a}.va-khata-kpi small{display:block;color:#94a3b8;margin-top:4px}.va-khata-kpi.due{border-top-color:#e11d48}.va-khata-kpi.given{border-top-color:#f59e0b}.va-khata-kpi.received{border-top-color:#10b981}.va-khata-kpi.customers{border-top-color:#6366f1}.va-khata-grid{display:grid;grid-template-columns:minmax(330px,.8fr) minmax(0,1.8fr);gap:18px}.va-khata-list-card,.va-khata-detail-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:20px;box-shadow:0 8px 25px rgba(15,23,42,.055);min-width:0}.va-khata-card-head,.va-khata-detail-head{display:flex;justify-content:space-between;align-items:flex-start;gap:15px;margin-bottom:15px}.va-khata-card-head h3,.va-khata-detail-head h3{margin:4px 0;font-size:20px}.va-khata-count{background:#f1f5f9;color:#475569;padding:7px 10px;border-radius:999px;font-size:12px;font-weight:800}.va-khata-customer-list{display:flex;flex-direction:column;gap:7px;max-height:590px;overflow:auto}.va-khata-customer{width:100%;display:flex;align-items:center;gap:10px;text-align:left;border:1px solid #e2e8f0;background:#fff;border-radius:12px;padding:11px;cursor:pointer}.va-khata-customer:hover,.va-khata-customer.active{border-color:#818cf8;background:#eef2ff}.va-khata-avatar{width:38px;height:38px;display:grid;place-items:center;border-radius:50%;background:#e0e7ff;color:#4338ca;font-weight:900;flex:none}.va-khata-customer-main{flex:1;min-width:0}.va-khata-customer-main strong{display:block;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.va-khata-customer-main small{display:block;color:#94a3b8;margin-top:3px;font-size:11px}.va-khata-balance{font-weight:900;text-align:right;white-space:nowrap}.va-khata-balance small{display:block;font-size:10px;font-weight:800}.va-khata-balance.danger{color:#e11d48}.va-khata-balance.credit{color:#2563eb}.va-khata-balance.clear{color:#059669}.va-khata-detail-empty{min-height:420px;display:grid;place-items:center;text-align:center;align-content:center;color:#64748b}.va-khata-detail-empty div{font-size:46px}.va-khata-detail-empty h3{margin:8px 0 4px;color:#334155}.va-khata-detail-empty p{margin:0}.va-khata-detail-head p{margin:0;color:#64748b;font-size:12px}.va-khata-detail-actions{display:flex;gap:8px;flex-wrap:wrap}.va-khata-balance-banner{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:10px;padding:15px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;margin-bottom:14px}.va-khata-balance-banner div{padding:8px 10px}.va-khata-balance-banner div:first-child{background:#fff1f2;border-radius:10px}.va-khata-balance-banner span{display:block;color:#64748b;font-size:11px;font-weight:800}.va-khata-balance-banner strong{display:block;color:#be123c;font-size:25px;margin-top:5px}.va-khata-balance-banner b{display:block;color:#0f172a;font-size:17px;margin-top:6px}.va-khata-filters{display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:end;margin-bottom:14px}.va-khata-filters label{font-size:12px;font-weight:800;color:#475569}.va-khata-filters input{margin-top:5px}.va-khata-table-wrap{overflow:auto;border:1px solid #e2e8f0;border-radius:12px}.va-khata-table{width:100%;border-collapse:collapse;min-width:700px}.va-khata-table th{background:#f8fafc;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:.04em;text-align:left}.va-khata-table th,.va-khata-table td{padding:11px;border-bottom:1px solid #eef2f7}.va-khata-table tbody tr:last-child td{border-bottom:0}.va-khata-pill{display:inline-block;padding:5px 8px;border-radius:999px;font-size:11px;font-weight:800}.va-khata-pill.debit{background:#fff1f2;color:#be123c}.va-khata-pill.payment{background:#ecfdf5;color:#047857}.debit-text{color:#be123c;font-weight:800}.payment-text{color:#047857;font-weight:800}.va-khata-empty{padding:30px!important;text-align:center;color:#64748b}.va-khata-tip{margin-top:15px;padding:12px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;color:#1e40af;font-size:12px}.va-khata-tip strong{color:#1d4ed8}@media(max-width:1000px){.va-khata-grid{grid-template-columns:1fr}.va-khata-customer-list{max-height:420px}}@media(max-width:700px){.va-khata-kpis{grid-template-columns:repeat(2,1fr)}.va-khata-hero{display:block}.va-khata-hero button{margin-top:15px;width:100%}.va-khata-balance-banner{grid-template-columns:1fr}.va-khata-filters{grid-template-columns:1fr}.va-khata-detail-head{display:block}.va-khata-detail-actions{margin-top:12px}.va-khata-detail-actions button{flex:1}.va-khata-kpi strong{font-size:19px}}@media(max-width:430px){.va-khata-kpis{grid-template-columns:1fr}.va-khata-list-card,.va-khata-detail-card{padding:14px}.va-khata-customer{padding:9px}}
.va-khata-collection{display:grid;grid-template-columns:1.15fr .85fr;gap:18px;margin-top:18px}.va-khata-collection-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:20px;box-shadow:0 8px 25px rgba(15,23,42,.055)}.va-khata-collection-head{display:flex;justify-content:space-between;gap:15px;align-items:flex-start;margin-bottom:14px}.va-khata-collection-head h3{margin:4px 0;font-size:19px}.va-khata-collection-head p{margin:0;color:#64748b;font-size:12px}.va-khata-collection-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:12px}.va-khata-collection-summary div{padding:12px;background:#f8fafc;border-radius:11px;border:1px solid #eef2f7}.va-khata-collection-summary span{display:block;color:#64748b;font-size:10px;font-weight:900;text-transform:uppercase}.va-khata-collection-summary strong{display:block;margin-top:5px;font-size:18px;color:#0f172a}.va-khata-priority-list{display:flex;flex-direction:column;gap:7px;max-height:320px;overflow:auto}.va-khata-priority{display:grid;grid-template-columns:34px 1fr auto;gap:10px;align-items:center;border:1px solid #e2e8f0;border-radius:11px;padding:10px;background:#fff;cursor:pointer;text-align:left}.va-khata-priority:hover{background:#f8fafc;border-color:#c7d2fe}.va-khata-priority-icon{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:#fff1f2;color:#be123c;font-size:13px}.va-khata-priority-main strong{display:block;font-size:12px;color:#0f172a}.va-khata-priority-main small{display:block;color:#64748b;font-size:10px;margin-top:3px}.va-khata-priority-amount{text-align:right;font-weight:900;color:#be123c;font-size:12px}.va-khata-priority-amount small{display:block;color:#94a3b8;font-size:9px;margin-top:3px}.va-khata-detail-insight{display:flex;gap:9px;align-items:flex-start;padding:11px 12px;background:#fffbeb;border:1px solid #fde68a;border-radius:11px;margin-bottom:14px;color:#92400e;font-size:11px;line-height:1.5}.va-khata-detail-insight strong{color:#92400e}.va-khata-status-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}.va-khata-status-grid div{padding:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px}.va-khata-status-grid span{display:block;color:#64748b;font-size:10px}.va-khata-status-grid strong{display:block;margin-top:4px;font-size:14px}@media(max-width:1050px){.va-khata-collection{grid-template-columns:1fr}}@media(max-width:650px){.va-khata-collection-summary{grid-template-columns:1fr 1fr}.va-khata-status-grid{grid-template-columns:1fr}.va-khata-collection-card{padding:14px}}`;

const fundUiStyles = `
.va-funds-page{max-width:1500px;margin:0 auto}.va-funds-hero{display:flex;justify-content:space-between;align-items:center;gap:20px;background:linear-gradient(135deg,#0f172a,#164e63);color:#fff;border-radius:22px;padding:26px;margin-bottom:18px;box-shadow:0 15px 35px rgba(15,23,42,.12)}.va-funds-hero h2{margin:5px 0;font-size:27px}.va-funds-hero p{margin:0;color:#cbd5e1}.va-fund-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.va-fund-kpis>div{background:#fff;border:1px solid #e2e8f0;border-top:4px solid #0ea5e9;border-radius:16px;padding:18px;box-shadow:0 7px 22px rgba(15,23,42,.05)}.va-fund-kpis .due{border-top-color:#dc2626}.va-fund-kpis span{font-size:12px;color:#64748b;font-weight:800}.va-fund-kpis strong{display:block;font-size:23px;margin-top:7px;color:#0f172a}.va-fund-workspace{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px}.va-fund-entry-card,.va-fund-ledger-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:20px;box-shadow:0 8px 25px rgba(15,23,42,.055)}.va-fund-entry-card:first-child{border-top:4px solid #0ea5e9}.va-fund-entry-card:nth-child(2){border-top:4px solid #dc2626}.va-fund-entry-row{display:grid;grid-template-columns:1.3fr .8fr .9fr .7fr .9fr 1fr 38px;gap:7px;margin-bottom:9px;align-items:center}.va-fund-entry-row .va-icon-delete{min-height:42px}.va-fund-ledger-card{margin-bottom:18px}.va-fund-table-wrap{overflow:auto;border:1px solid #e2e8f0;border-radius:12px}.va-fund-table{width:100%;border-collapse:collapse;min-width:850px}.va-fund-table th,.va-fund-table td{padding:11px;border-bottom:1px solid #eef2f7;text-align:left}.va-fund-table th{background:#f8fafc;color:#475569;font-size:11px;text-transform:uppercase}.va-fund-table tbody tr:last-child td{border-bottom:0}.va-fund-status{display:inline-block;padding:5px 8px;border-radius:999px;font-size:10px;font-weight:900}.va-fund-status.open{background:#fff7ed;color:#c2410c}.va-fund-status.overdue{background:#fef2f2;color:#b91c1c}.va-fund-status.closed{background:#ecfdf5;color:#047857}@media(max-width:1050px){.va-fund-workspace{grid-template-columns:1fr}.va-fund-entry-row{grid-template-columns:1fr 1fr 1fr}.va-fund-entry-row .va-icon-delete{width:100%}}@media(max-width:650px){.va-fund-kpis{grid-template-columns:repeat(2,1fr)}.va-funds-hero{display:block}.va-funds-hero button{margin-top:15px;width:100%}.va-fund-entry-row{grid-template-columns:1fr}.va-fund-entry-card,.va-fund-ledger-card{padding:14px}.va-fund-kpis strong{font-size:19px}}
`;

const staffManagementStyles = `
.va-staff-page{max-width:1500px;margin:0 auto}.va-staff-hero{display:flex;justify-content:space-between;align-items:center;gap:20px;background:linear-gradient(135deg,#0f172a,#075985 62%,#0f766e);color:#fff;border-radius:22px;padding:26px;margin-bottom:18px;box-shadow:0 18px 45px rgba(15,23,42,.14)}.va-staff-hero.payroll{background:linear-gradient(135deg,#111827,#312e81 65%,#0f766e)}.va-staff-eyebrow{font-size:10px;font-weight:900;letter-spacing:.1em;color:#93c5fd}.va-staff-hero h2{margin:6px 0;font-size:28px}.va-staff-hero p{margin:0;color:#cbd5e1;font-size:13px;line-height:1.5;max-width:720px}.va-staff-hero-actions{display:flex;align-items:end;gap:8px;flex-wrap:wrap}.va-staff-hero-actions label{font-size:10px;font-weight:900;color:#cbd5e1}.va-staff-hero-actions input{display:block;margin-top:5px;padding:10px;border:1px solid #475569;background:#fff;color:#0f172a;border-radius:9px}.va-staff-btn{border:0;border-radius:9px;padding:10px 13px;font-weight:900;cursor:pointer}.va-staff-btn.primary{background:#2563eb;color:#fff}.va-staff-btn.secondary{background:#fff;color:#1e40af}.va-staff-btn.success{background:#10b981;color:#fff}.va-staff-btn.ghost{background:#f1f5f9;color:#334155}.va-staff-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:11px;margin-bottom:18px}.va-staff-kpis>div{background:#fff;border:1px solid #e2e8f0;border-top:4px solid #2563eb;border-radius:15px;padding:16px;box-shadow:0 7px 22px rgba(15,23,42,.05)}.va-staff-kpis>div:nth-child(2){border-top-color:#10b981}.va-staff-kpis>div:nth-child(3){border-top-color:#ef4444}.va-staff-kpis>div:nth-child(4){border-top-color:#8b5cf6}.va-staff-kpis>div:nth-child(5){border-top-color:#f59e0b}.va-staff-kpis span{display:block;color:#64748b;font-size:11px;font-weight:800}.va-staff-kpis strong{display:block;color:#0f172a;font-size:23px;margin-top:6px}.va-staff-kpis small{display:block;color:#94a3b8;font-size:10px;margin-top:3px}.va-staff-grid{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(300px,.7fr);gap:18px;margin-bottom:18px}.va-staff-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:20px;box-shadow:0 8px 25px rgba(15,23,42,.055)}.va-staff-card-head{display:flex;justify-content:space-between;gap:15px;align-items:flex-start;margin-bottom:15px}.va-staff-card-head h3{margin:2px 0;font-size:19px;color:#0f172a}.va-staff-card-head p{margin:3px 0 0;color:#64748b;font-size:12px}.va-staff-link{color:#2563eb;font-size:12px;font-weight:900;text-decoration:none}.va-staff-link-btn{border:1px solid #c7d2fe;background:#eef2ff;color:#4338ca;border-radius:9px;padding:9px 11px;font-weight:900;cursor:pointer}.va-staff-list{display:flex;flex-direction:column;gap:7px}.va-staff-row{display:grid;grid-template-columns:minmax(180px,1.4fr) 135px 65px 65px 55px minmax(160px,.8fr);gap:8px;align-items:center;border:1px solid #e2e8f0;border-radius:12px;padding:9px;background:#fff}.va-staff-row:hover{background:#f8fafc}.va-staff-person{display:flex;gap:9px;align-items:center;border:0;background:none;text-align:left;padding:0;cursor:pointer}.va-staff-avatar{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;background:#e0e7ff;color:#4338ca;font-weight:900;font-size:11px;flex:none}.va-staff-person strong{display:block;font-size:12px;color:#0f172a}.va-staff-person small{display:block;color:#94a3b8;font-size:10px;margin-top:3px}.va-status-select{width:100%;padding:8px;border-radius:9px;border:1px solid #cbd5e1;font-size:11px;font-weight:800}.va-status-select.present{background:#ecfdf5;color:#047857}.va-status-select.absent{background:#fff1f2;color:#be123c}.va-status-select.leave{background:#f5f3ff;color:#6d28d9}.va-status-select.off{background:#f1f5f9;color:#475569}.va-status-select.half{background:#fffbeb;color:#92400e}.va-status-select.unmarked{background:#fff}.va-staff-time{padding:7px;background:#f8fafc;border-radius:8px;text-align:center}.va-staff-time span{display:block;font-size:11px;font-weight:900;color:#0f172a}.va-staff-time small{display:block;color:#94a3b8;font-size:8px;margin-top:2px}.va-staff-hours{text-align:center;font-size:11px;font-weight:900;color:#475569}.va-staff-actions{display:flex;gap:5px;flex-wrap:wrap}.va-staff-icon-btn{border:0;border-radius:7px;padding:7px 8px;font-size:9px;font-weight:900;cursor:pointer}.va-staff-icon-btn.in{background:#dcfce7;color:#166534}.va-staff-icon-btn.out{background:#fee2e2;color:#991b1b}.va-staff-icon-btn.note{background:#e2e8f0;color:#334155}.va-staff-icon-btn:disabled{opacity:.45;cursor:not-allowed}.va-staff-side{display:flex;flex-direction:column;gap:18px}.va-staff-status-list{display:flex;flex-direction:column;gap:2px}.va-staff-status-list>div{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #eef2f7;font-size:12px}.va-staff-status-list span{color:#64748b}.va-staff-status-list strong{color:#0f172a}.va-staff-note{margin-top:13px;padding:11px 12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;color:#1e40af;font-size:11px;line-height:1.5}.va-staff-wide-btn{width:100%;border:0;border-radius:9px;padding:10px;margin-top:10px;font-weight:900;cursor:pointer}.va-staff-wide-btn.success{background:#dcfce7;color:#166534}.va-staff-wide-btn.danger{background:#fee2e2;color:#991b1b}.va-staff-wide-btn.primary{background:#2563eb;color:#fff}.va-staff-loading,.va-staff-empty{padding:30px;text-align:center;color:#64748b}.va-payroll-employee-list{display:flex;flex-direction:column;gap:7px;max-height:520px;overflow:auto}.va-payroll-person{display:flex;align-items:center;gap:9px;width:100%;border:1px solid #e2e8f0;background:#fff;border-radius:12px;padding:10px;text-align:left;cursor:pointer}.va-payroll-person:hover,.va-payroll-person.active{background:#eef2ff;border-color:#818cf8}.va-payroll-person-main{flex:1;min-width:0}.va-payroll-person-main strong{display:block;color:#0f172a;font-size:12px}.va-payroll-person-main small{display:block;color:#94a3b8;font-size:10px;margin-top:3px}.va-payroll-person-due{font-size:11px;font-weight:900}.va-payroll-person-due.due{color:#be123c}.va-payroll-person-due.clear{color:#059669}.va-payroll-priority-list{display:flex;flex-direction:column;gap:6px}.va-payroll-priority-list button{display:grid;grid-template-columns:25px 1fr auto;gap:7px;align-items:center;text-align:left;border:1px solid #e2e8f0;background:#fff;border-radius:9px;padding:9px;cursor:pointer}.va-payroll-priority-list button:hover{background:#f8fafc}.va-payroll-priority-list strong{font-size:11px;color:#0f172a}.va-payroll-priority-list small{font-size:10px;color:#64748b}.va-payroll-priority-list span{font-size:13px}.va-staff-detail{background:#0f172a;color:#fff;border-radius:18px;padding:20px;margin-bottom:18px;box-shadow:0 12px 30px rgba(15,23,42,.12)}.va-staff-detail-head{display:flex;justify-content:space-between;gap:15px;align-items:flex-start}.va-staff-detail h3{margin:5px 0;font-size:23px}.va-staff-detail p{margin:0;color:#94a3b8;font-size:12px}.va-staff-detail-actions{display:flex;gap:7px;flex-wrap:wrap}.va-staff-detail-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:16px}.va-staff-detail-grid>div{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:11px}.va-staff-detail-grid span{display:block;color:#94a3b8;font-size:9px;text-transform:uppercase;font-weight:900}.va-staff-detail-grid strong{display:block;margin-top:5px;font-size:14px}.va-staff-detail-grid strong.due{color:#fda4af}.va-staff-detail-grid strong.clear{color:#6ee7b7}.va-staff-detail-note{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:12px;padding:10px 12px;background:#1e293b;border-radius:10px;color:#cbd5e1;font-size:11px}.va-staff-detail-note input{padding:8px 10px;border-radius:8px;border:1px solid #475569;min-width:160px}.va-payroll-table-card{margin-top:18px}.va-payroll-table-wrap{overflow:auto;border:1px solid #e2e8f0;border-radius:12px}.va-payroll-table{width:100%;border-collapse:collapse;min-width:1050px}.va-payroll-table th,.va-payroll-table td{padding:10px;border-bottom:1px solid #eef2f7;text-align:right;font-size:11px;white-space:nowrap}.va-payroll-table th{background:#f8fafc;color:#475569;font-size:9px;text-transform:uppercase}.va-payroll-table th.left,.va-payroll-table td:first-child{text-align:left}.va-payroll-table td input{width:105px;padding:7px;border:1px solid #cbd5e1;border-radius:7px}.va-payroll-table .employee-cell small{display:block;color:#94a3b8;font-size:9px;margin-top:3px}.va-payroll-table .money{font-weight:900}.va-payroll-table .money.paid{color:#047857}.va-payroll-table .money.due{color:#be123c}.va-payroll-table .money.clear{color:#059669}.va-payroll-table .money.carry{color:#2563eb}.va-payroll-table .money small{display:block;font-size:8px;color:#d97706;margin-top:3px}@media(max-width:1150px){.va-staff-kpis{grid-template-columns:repeat(3,1fr)}.va-staff-row{grid-template-columns:1.5fr 125px 60px 60px 55px}.va-staff-actions{grid-column:1/-1}.va-staff-grid{grid-template-columns:1fr}.va-staff-side{display:grid;grid-template-columns:1fr 1fr}}@media(max-width:750px){.va-staff-hero{display:block}.va-staff-hero-actions{margin-top:15px}.va-staff-hero-actions>*{flex:1}.va-staff-kpis{grid-template-columns:1fr 1fr}.va-staff-row{grid-template-columns:1fr 1fr}.va-staff-person{grid-column:1/-1}.va-staff-actions{grid-column:1/-1}.va-staff-side{display:block}.va-staff-detail-grid{grid-template-columns:1fr 1fr}.va-staff-detail-head{display:block}.va-staff-detail-actions{margin-top:12px}.payroll-kpis{grid-template-columns:1fr 1fr}}@media(max-width:450px){.va-staff-kpis{grid-template-columns:1fr}.va-staff-detail-grid{grid-template-columns:1fr}.va-staff-card{padding:14px}.va-staff-row{padding:8px}.va-staff-hero{padding:18px}.va-staff-hero-actions{display:grid;grid-template-columns:1fr 1fr}.va-staff-hero-actions label{grid-column:1/-1}.va-staff-hero-actions>*{width:100%}}`;
const dashboardCommandStyles = `
.va-command-actions{display:flex;gap:8px;flex-wrap:wrap}.va-command-actions button{white-space:nowrap}.va-dashboard-command-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:18px;margin-bottom:18px}.va-money-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.va-money-grid>div{padding:13px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:11px}.va-money-grid span{display:block;color:#64748b;font-size:11px}.va-money-grid strong{display:block;margin-top:5px;font-size:18px;color:#0f172a}.va-command-links{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:14px}.va-command-links button{border:1px solid #e2e8f0;background:#fff;border-radius:9px;padding:10px 6px;font-weight:800;color:#334155;cursor:pointer}.va-command-links button:hover{background:#eef2ff;border-color:#c7d2fe}.va-health-row{display:flex;justify-content:space-between;gap:10px;padding:9px 0;font-size:12px;border-bottom:1px solid #eef2f7}.va-health-row span{color:#64748b}.va-health-row strong{color:#0f172a}.va-health-track{height:9px;background:#e2e8f0;border-radius:99px;overflow:hidden;margin:9px 0}.va-health-track i{display:block;height:100%;background:#f59e0b;border-radius:99px}.va-health-note{margin-top:13px;padding:11px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;color:#475569;font-size:11px;line-height:1.5}@media(max-width:1000px){.va-dashboard-command-grid{grid-template-columns:1fr}}@media(max-width:700px){.va-command-actions{margin-top:14px}.va-command-actions button{flex:1}.va-money-grid{grid-template-columns:1fr 1fr}.va-command-links{grid-template-columns:1fr 1fr}}@media(max-width:430px){.va-money-grid{grid-template-columns:1fr}.va-command-links{grid-template-columns:1fr 1fr}}
.va-financial-hero{display:flex;justify-content:space-between;align-items:center;gap:22px;background:linear-gradient(135deg,#07111f,#12304a 55%,#075e54);color:#fff;border-radius:24px;padding:28px;box-shadow:0 18px 45px rgba(15,23,42,.16)}
.va-financial-hero h2{font-size:30px;margin:7px 0}.va-financial-hero p{margin:0;color:#cbd5e1;font-size:13px;max-width:720px}.va-financial-hero-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.va-financial-hero-actions button{border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.1);color:#fff;border-radius:10px;padding:10px 12px;font-weight:900;cursor:pointer}.va-financial-hero-actions button:first-child{background:#10b981;border-color:#10b981}
.va-financial-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:11px}.va-financial-kpis>div{background:#fff;border:1px solid #e2e8f0;border-top:4px solid #64748b;border-radius:15px;padding:15px;box-shadow:0 7px 22px rgba(15,23,42,.05)}.va-financial-kpis>div.primary{border-top-color:#2563eb}.va-financial-kpis>div.positive{border-top-color:#10b981}.va-financial-kpis>div.negative{border-top-color:#ef4444}.va-financial-kpis>div.warning{border-top-color:#f59e0b}.va-financial-kpis span{display:block;color:#64748b;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}.va-financial-kpis strong{display:block;margin-top:6px;font-size:20px;color:#0f172a}.va-financial-kpis small{display:block;color:#94a3b8;font-size:9px;margin-top:4px}
.va-financial-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:18px}.va-financial-card{min-width:0}.va-financial-pill{padding:7px 10px;border-radius:999px;font-size:10px;font-weight:900}.va-financial-pill.good{background:#dcfce7;color:#166534}.va-financial-pill.bad{background:#fee2e2;color:#991b1b}
.va-profit-bridge{display:grid;grid-template-columns:1fr 20px 1fr 20px 1fr 20px 1.1fr;gap:7px;align-items:center}.va-profit-bridge>div{padding:13px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:11px}.va-profit-bridge span{display:block;color:#64748b;font-size:10px}.va-profit-bridge strong{display:block;margin-top:5px;font-size:16px}.va-profit-bridge i{text-align:center;color:#94a3b8;font-style:normal;font-weight:900}.va-profit-bridge .result-good{background:#ecfdf5;border-color:#bbf7d0}.va-profit-bridge .result-good strong{color:#047857}.va-profit-bridge .result-bad{background:#fef2f2;border-color:#fecaca}.va-profit-bridge .result-bad strong{color:#b91c1c}
.va-financial-ratios{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:10px}.va-financial-ratios>div{padding:9px;background:#fff;border:1px solid #eef2f7;border-radius:9px}.va-financial-ratios span{display:block;color:#94a3b8;font-size:9px}.va-financial-ratios strong{display:block;margin-top:3px;font-size:12px}
.va-liquidity-main{padding:16px;background:#0f172a;color:#fff;border-radius:12px;margin-bottom:10px}.va-liquidity-main span{display:block;color:#94a3b8;font-size:10px}.va-liquidity-main strong{display:block;font-size:25px;margin-top:5px}.va-liquidity-row{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid #eef2f7;font-size:11px}.va-liquidity-row span{color:#64748b}.va-liquidity-note,.va-financial-footnote,.va-control-note{margin-top:11px;padding:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;color:#64748b;font-size:10px;line-height:1.5}
.warning-text{color:#d97706!important}
.va-cashflow-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.va-cashflow-summary>div{padding:12px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0}.va-cashflow-summary span{display:block;color:#64748b;font-size:10px}.va-cashflow-summary strong{display:block;margin-top:5px;font-size:17px}.va-cashflow-summary .in{border-left:4px solid #10b981}.va-cashflow-summary .out{border-left:4px solid #ef4444}.va-cashflow-summary .net-good{border-left:4px solid #2563eb}.va-cashflow-summary .net-bad{border-left:4px solid #dc2626}
.va-flow-bars{display:flex;flex-direction:column;gap:12px;margin-top:15px}.va-flow-bars>div{display:grid;grid-template-columns:1fr auto;gap:7px}.va-flow-bars span{font-size:10px;color:#64748b}.va-flow-bars b{font-size:10px}.va-flow-bars i{grid-column:1/-1;height:7px;background:#e2e8f0;border-radius:99px;overflow:hidden;position:relative}.va-flow-bars i:after{content:"";display:block;height:100%;width:100%;background:#2563eb;border-radius:99px}
.va-balance-compare{display:grid;grid-template-columns:1fr 1fr;gap:9px}.va-balance-compare>div{padding:13px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:11px}.va-balance-compare span{display:block;color:#64748b;font-size:10px}.va-balance-compare strong{display:block;font-size:19px;margin-top:5px}.va-balance-compare small{display:block;color:#94a3b8;margin-top:4px;font-size:9px;line-height:1.4}.va-working-capital-result{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding:11px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;font-size:11px}.va-working-capital-result strong{font-size:16px}.va-financial-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:11px}.va-financial-actions button{border:1px solid #c7d2fe;background:#eef2ff;color:#4338ca;border-radius:9px;padding:9px;font-weight:900;cursor:pointer}
.va-financial-trend{height:190px;display:flex;align-items:flex-end;gap:12px;border-bottom:1px solid #e2e8f0;padding:8px 5px 0;overflow:hidden}.va-financial-trend-day{height:100%;min-width:42px;display:flex;flex:1;max-width:80px;flex-direction:column;justify-content:flex-end;align-items:center;gap:5px}.va-financial-trend-bars{height:150px;display:flex;align-items:flex-end;gap:3px}.va-financial-trend-bars i{display:block;width:13px;border-radius:4px 4px 1px 1px;min-height:5px}.va-financial-trend-bars .sales{background:#2563eb}.va-financial-trend-bars .costs{background:#f97316}.va-financial-trend-day small{font-size:8px;color:#64748b}.va-financial-trend-day span{font-size:8px;font-weight:800;color:#334155}
.va-control-row{display:flex;justify-content:space-between;padding:11px 0;border-bottom:1px solid #eef2f7;font-size:11px}.va-control-row span{color:#64748b}.va-control-row strong{color:#0f172a}.va-financial-alert-card{margin-bottom:0}
@media(max-width:1100px){.va-financial-kpis{grid-template-columns:repeat(2,1fr)}.va-financial-grid{grid-template-columns:1fr}.va-financial-top-grid{grid-template-columns:1fr}.va-profit-bridge{grid-template-columns:1fr}.va-profit-bridge i{display:none}}
@media(max-width:700px){.va-financial-hero{display:block;padding:20px}.va-financial-hero h2{font-size:24px}.va-financial-hero-actions{margin-top:15px;justify-content:stretch}.va-financial-hero-actions button{flex:1}.va-financial-filter{display:block}.va-dashboard-dates{min-width:0;margin-top:10px;flex-wrap:wrap}.va-dashboard-dates input{max-width:none;flex:1}.va-financial-kpis{grid-template-columns:1fr 1fr}.va-financial-ratios{grid-template-columns:1fr 1fr}.va-cashflow-summary{grid-template-columns:1fr}.va-balance-compare{grid-template-columns:1fr}.va-financial-card{padding:15px}}
@media(max-width:430px){.va-financial-kpis{grid-template-columns:1fr}.va-financial-hero-actions{display:grid;grid-template-columns:1fr}.va-financial-actions{grid-template-columns:1fr}}
`;


const collapsibleStyles = `
.va-collapsible-head{display:flex;justify-content:space-between;align-items:center;gap:12px}
.va-collapsible-head>div:first-child{min-width:0}
.va-section-head-actions{display:flex;align-items:center;gap:8px}
.va-collapse-btn{width:30px;height:30px;border:1px solid #cbd5e1;background:#fff;color:#475569;border-radius:8px;font-size:16px;font-weight:900;line-height:1;cursor:pointer;display:inline-grid;place-items:center;transition:.15s}
.va-collapse-btn:hover{background:#eef2ff;border-color:#a5b4fc;color:#3730a3}
.va-collapsible-section.collapsed{min-height:0}
.va-collapsible-section.collapsed .va-dashboard-card-head{margin-bottom:0}
.va-collapsible-body{animation:vaCollapseIn .16s ease-out}
@keyframes vaCollapseIn{from{opacity:.35;transform:translateY(-3px)}to{opacity:1;transform:translateY(0)}}
.va-smart-insights .va-smart-insights-head{margin-bottom:0}
.va-smart-insights:not(.collapsed) .va-smart-insights-head{margin-bottom:14px}
.va-smart-insights-head{display:flex;justify-content:space-between;align-items:center;gap:14px}
.va-smart-insights-head>div:first-child{min-width:0}
@media(max-width:600px){.va-collapsible-head{align-items:flex-start}.va-collapse-btn{flex:0 0 30px}.va-smart-insights-head{align-items:flex-start}.va-smart-insights-head .va-collapse-btn{margin-left:auto}}
`;

const smartInsightsStyles = `
.va-smart-insights{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:20px;margin:18px 0;box-shadow:0 8px 25px rgba(15,23,42,.055)}
.va-smart-insights-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:14px}
.va-smart-insights-head h3{margin:5px 0 3px;font-size:19px;color:#0f172a}.va-smart-insights-head p{margin:0;color:#64748b;font-size:11px}
.va-smart-insights-badge{padding:6px 9px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:9px;font-weight:900;letter-spacing:.06em}
.va-smart-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}
.va-smart-card{display:flex;gap:10px;padding:12px;border:1px solid #e2e8f0;border-left:4px solid #64748b;border-radius:11px;background:#f8fafc}
.va-smart-card.danger{border-left-color:#dc2626;background:#fff7f7}.va-smart-card.warning{border-left-color:#f59e0b;background:#fffbeb}.va-smart-card.success{border-left-color:#10b981;background:#f0fdf4}.va-smart-card.info{border-left-color:#3b82f6;background:#eff6ff}
.va-smart-icon{font-size:19px;line-height:1}.va-smart-body{min-width:0}.va-smart-body strong{display:block;font-size:12px;color:#0f172a}.va-smart-body p{margin:4px 0 7px;color:#475569;font-size:10px;line-height:1.5}.va-smart-body button{border:0;background:transparent;padding:0;color:#4338ca;font-size:10px;font-weight:900;cursor:pointer}
.va-smart-empty{padding:14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;color:#166534;font-size:11px}
@media(max-width:700px){.va-smart-grid{grid-template-columns:1fr}.va-smart-insights{padding:15px}.va-smart-insights-head{display:block}.va-smart-insights-badge{display:inline-block;margin-top:9px}}
`;

const payablesUiStyles = `
.va-payables-page{max-width:1500px;margin:0 auto}.va-payables-hero{display:flex;justify-content:space-between;align-items:center;gap:20px;background:linear-gradient(135deg,#0f172a,#14532d 70%,#0f766e);color:#fff;border-radius:22px;padding:26px;margin-bottom:18px;box-shadow:0 16px 38px rgba(15,23,42,.12)}.va-payables-hero h2{margin:6px 0;font-size:28px}.va-payables-hero p{margin:0;color:#cbd5e1;max-width:760px;font-size:13px}.va-payables-primary,.va-payables-save,.va-payables-secondary{border:0;border-radius:10px;padding:11px 14px;font-weight:900;cursor:pointer}.va-payables-primary{background:#10b981;color:#fff}.va-payables-save{width:100%;margin-top:10px;background:#059669;color:#fff}.va-payables-secondary{background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe}.va-payables-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.va-payables-kpis>div{background:#fff;border:1px solid #e2e8f0;border-top:4px solid #2563eb;border-radius:16px;padding:17px;box-shadow:0 7px 22px rgba(15,23,42,.05)}.va-payables-kpis>div:nth-child(2){border-top-color:#6366f1}.va-payables-kpis>div.danger{border-top-color:#ef4444}.va-payables-kpis>div.success{border-top-color:#10b981}.va-payables-kpis span{display:block;color:#64748b;font-size:11px;font-weight:800}.va-payables-kpis strong{display:block;color:#0f172a;font-size:22px;margin-top:6px}.va-payables-kpis small{display:block;color:#94a3b8;margin-top:3px;font-size:10px}.va-payables-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:18px;margin-bottom:18px}.va-payables-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:20px;box-shadow:0 8px 25px rgba(15,23,42,.055);margin-bottom:18px}.va-payables-head{display:flex;justify-content:space-between;align-items:flex-start;gap:15px;margin-bottom:14px}.va-payables-head h3{margin:3px 0;font-size:19px}.va-payables-head p{margin:0;color:#64748b;font-size:12px}.va-payables-head>span{padding:7px 10px;background:#f1f5f9;border-radius:999px;font-size:11px;font-weight:900;color:#475569}.va-payables-table-wrap{overflow:auto;border:1px solid #e2e8f0;border-radius:12px}.va-payables-table{width:100%;border-collapse:collapse;min-width:850px}.va-payables-table th,.va-payables-table td{padding:11px;border-bottom:1px solid #eef2f7;text-align:left;font-size:11px}.va-payables-table th{background:#f8fafc;color:#475569;font-size:9px;text-transform:uppercase}.va-payables-table tbody tr{cursor:pointer}.va-payables-table tbody tr:hover,.va-payables-table tbody tr.selected{background:#f0fdf4}.va-payables-table td small{display:block;color:#94a3b8;margin-top:3px;font-size:9px}.va-payable-status{display:inline-block;padding:5px 8px;border-radius:999px;font-size:9px;font-weight:900}.va-payable-status.due{background:#fff7ed;color:#c2410c}.va-payable-status.overdue{background:#fef2f2;color:#b91c1c}.va-payable-status.clear{background:#ecfdf5;color:#047857}.va-pay-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.va-pay-form-grid label{font-size:11px;font-weight:900;color:#475569}.va-pay-form-grid input,.va-pay-form-grid select{display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:10px;border:1px solid #cbd5e1;border-radius:9px;background:#fff}.va-payables-card textarea{width:100%;box-sizing:border-box;margin-top:12px;min-height:70px;padding:10px;border:1px solid #cbd5e1;border-radius:9px}.va-payable-preview{display:flex;justify-content:space-between;align-items:center;padding:12px;margin-top:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px}.va-payable-preview strong{font-size:20px;color:#047857}.va-payable-actions{display:flex;gap:7px;flex-wrap:wrap}.va-payables-note{padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:11px;color:#64748b;font-size:11px;line-height:1.5;margin-top:12px}@media(max-width:1100px){.va-payables-grid{grid-template-columns:1fr}.va-payables-kpis{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.va-payables-hero{display:block;padding:18px}.va-payables-primary{margin-top:14px;width:100%}.va-payables-kpis{grid-template-columns:1fr 1fr}.va-payables-card{padding:14px}.va-pay-form-grid{grid-template-columns:1fr}.va-payables-actions{margin-top:12px}}@media(max-width:430px){.va-payables-kpis{grid-template-columns:1fr}}
`;
const inventoryUiStyles = `
.va-inventory-page{max-width:1500px;margin:0 auto}.va-inventory-hero{display:flex;justify-content:space-between;gap:20px;align-items:center;background:linear-gradient(135deg,#0f172a,#14532d);color:#fff;border-radius:22px;padding:26px;margin-bottom:18px;box-shadow:0 16px 38px rgba(15,23,42,.12)}.va-inventory-hero h2{margin:6px 0;font-size:28px}.va-inventory-hero p{margin:0;color:#cbd5e1;font-size:13px}.va-inventory-hero-actions{display:flex;gap:8px}.va-inventory-hero-actions button{border:0;border-radius:10px;padding:11px 14px;font-weight:900;cursor:pointer;background:#10b981;color:#fff}.va-inventory-hero-actions button+button{background:#fff;color:#14532d}.va-inventory-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.va-inventory-kpis>div{background:#fff;border:1px solid #e2e8f0;border-top:4px solid #10b981;border-radius:16px;padding:17px;box-shadow:0 7px 22px rgba(15,23,42,.05)}.va-inventory-kpis .warning{border-top-color:#f59e0b}.va-inventory-kpis .danger{border-top-color:#ef4444}.va-inventory-kpis span{display:block;color:#64748b;font-size:11px;font-weight:800}.va-inventory-kpis strong{display:block;color:#0f172a;font-size:22px;margin-top:6px}.va-inventory-kpis small{display:block;color:#94a3b8;font-size:10px;margin-top:3px}.va-inventory-tabs{display:flex;gap:7px;margin-bottom:18px}.va-inventory-tabs button{border:1px solid #e2e8f0;background:#fff;border-radius:10px;padding:10px 13px;font-weight:900;color:#475569;cursor:pointer}.va-inventory-tabs button.active{background:#0f766e;color:#fff;border-color:#0f766e}.va-inventory-grid{display:grid;grid-template-columns:1.35fr .65fr;gap:18px}.va-inventory-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:20px;box-shadow:0 8px 25px rgba(15,23,42,.055);margin-bottom:18px}.va-inventory-card-head{display:flex;justify-content:space-between;gap:15px;align-items:center;margin-bottom:14px}.va-inventory-card-head h3{margin:0;font-size:19px}.va-inventory-card-head p{margin:4px 0 0;color:#64748b;font-size:12px}.va-inventory-card-head input{max-width:260px;padding:10px;border:1px solid #cbd5e1;border-radius:9px}.va-stock-table-wrap{overflow:auto;border:1px solid #e2e8f0;border-radius:12px}.va-stock-table{width:100%;border-collapse:collapse;min-width:780px}.va-stock-table th,.va-stock-table td{padding:10px;border-bottom:1px solid #eef2f7;text-align:left;font-size:11px}.va-stock-table th{background:#f8fafc;color:#475569;text-transform:uppercase;font-size:9px}.va-stock-table td small{display:block;color:#94a3b8;margin-top:3px}.va-stock-table .low-stock{color:#b91c1c;font-weight:900}.va-stock-status{display:inline-block;padding:5px 8px;border-radius:999px;font-size:9px;font-weight:900}.va-stock-status.low{background:#fef2f2;color:#b91c1c}.va-stock-status.ok{background:#ecfdf5;color:#047857}.va-mini-btn{border:1px solid #c7d2fe;background:#eef2ff;color:#4338ca;border-radius:7px;padding:6px 8px;font-size:9px;font-weight:900;cursor:pointer;margin-right:4px}.va-mini-btn.danger{background:#fff1f2;color:#be123c;border-color:#fecdd3}.va-purchase-list{display:flex;flex-direction:column;gap:7px}.va-purchase-row{display:flex;justify-content:space-between;gap:10px;padding:11px;border:1px solid #e2e8f0;border-radius:10px}.va-purchase-row strong{font-size:11px}.va-purchase-row small{display:block;color:#94a3b8;font-size:9px;margin-top:3px}.va-purchase-row small.due{color:#be123c;font-weight:900}.va-purchase-form-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.va-purchase-form-grid label{font-size:11px;font-weight:900;color:#475569}.va-purchase-form-grid input,.va-purchase-form-grid select,.va-purchase-lines input,.va-purchase-lines select{display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:10px;border:1px solid #cbd5e1;border-radius:9px;background:#fff}.va-purchase-lines{margin-top:16px}.va-purchase-line{display:grid;grid-template-columns:2fr .8fr 1fr .6fr 1fr 36px;gap:8px;align-items:center;margin-bottom:8px}.va-purchase-line span{font-size:11px;color:#64748b}.va-purchase-line strong{text-align:right}.va-add-line{border:1px dashed #94a3b8;background:#f8fafc;border-radius:9px;padding:9px 12px;font-weight:900;color:#475569;cursor:pointer}.va-purchase-total{display:flex;justify-content:space-between;align-items:center;padding:15px;margin-top:14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px}.va-purchase-total strong{font-size:22px;color:#047857}.va-inventory-card textarea{width:100%;box-sizing:border-box;margin-top:12px;min-height:70px;padding:10px;border:1px solid #cbd5e1;border-radius:9px}.va-save-purchase{width:100%;margin-top:10px;border:0;border-radius:10px;padding:12px;background:#059669;color:#fff;font-weight:900;cursor:pointer}.va-supplier-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.va-supplier-card{display:grid;grid-template-columns:38px 1fr auto;gap:10px;align-items:center;padding:12px;border:1px solid #e2e8f0;border-radius:11px}.va-supplier-avatar{width:36px;height:36px;border-radius:10px;background:#dcfce7;color:#166534;display:grid;place-items:center;font-weight:900;font-size:10px}.va-supplier-card strong{display:block;font-size:12px}.va-supplier-card small{display:block;color:#64748b;font-size:9px;margin-top:3px}.va-supplier-card b{font-size:11px;color:#059669}.va-supplier-card b.due{color:#be123c}.va-inventory-empty{padding:30px;text-align:center;color:#64748b}@media(max-width:1100px){.va-inventory-grid{grid-template-columns:1fr}.va-inventory-kpis{grid-template-columns:repeat(2,1fr)}.va-purchase-form-grid{grid-template-columns:1fr 1fr}}@media(max-width:700px){.va-inventory-hero{display:block}.va-inventory-hero-actions{margin-top:15px}.va-inventory-hero-actions button{flex:1}.va-inventory-tabs{overflow:auto}.va-inventory-card{padding:14px}.va-inventory-card-head{display:block}.va-inventory-card-head input{max-width:none;width:100%;margin-top:10px;box-sizing:border-box}.va-purchase-form-grid{grid-template-columns:1fr}.va-purchase-line{grid-template-columns:1fr 1fr}.va-purchase-line span,.va-purchase-line strong{display:none}.va-supplier-grid{grid-template-columns:1fr}}@media(max-width:450px){.va-inventory-kpis{grid-template-columns:1fr}.va-inventory-hero{padding:18px}}
`;

const cardStyle = { background: 'rgba(255,255,255,0.96)', padding: '22px', borderRadius: '18px', border: '1px solid rgba(148,163,184,.18)', boxShadow: '0 12px 35px rgba(15,23,42,.08)', marginBottom: '20px' };
const flexRow = { display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' };
const inputStyle = { padding: '11px 13px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', width: '100%', boxSizing: 'border-box', background: '#fff', outline: 'none' };
const btnStyle = { padding: '11px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', boxShadow: '0 6px 14px rgba(37,99,235,.18)' };
const tabStyle = { flex: 1, padding: '13px 14px', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', transition: '0.2s', minHeight: '48px' };
