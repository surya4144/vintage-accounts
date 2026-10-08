import { createClient } from '@supabase/supabase-js';
import { generateText } from 'ai';

export const maxDuration = 30;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const cleanText = (value, max = 5000) => String(value || '').slice(0, max);
const money = value => '₹' + Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const lower = value => String(value || '').toLowerCase();

function localBusinessAnswer(question, context) {
  const q = lower(question);
  const analytics = context.analytics || {};
  const khata = context.khata || {};
  const payroll = Array.isArray(context.payroll) ? context.payroll : [];
  const topCategories = Array.isArray(analytics.topExpenseCategories) ? analytics.topExpenseCategories : [];
  const monthly = Array.isArray(analytics.monthlyPerformance) ? analytics.monthlyPerformance : [];

  const sales = Number(analytics.totalSales || 0);
  const expenses = Number(analytics.totalExpenses || 0);
  const profit = Number(analytics.estimatedProfit ?? sales - expenses);
  const staff = Number(analytics.staffCost || 0);
  const credit = Number(analytics.creditOutstanding || khata.outstanding || 0);

  if (q.includes('staff') || q.includes('salary') || q.includes('employee') || q.includes('payroll')) {
    const paid = payroll.reduce((sum, row) => sum + Number(row.totalTaken || 0), 0);
    const earned = payroll.reduce((sum, row) => sum + Number(row.earnedPay || 0), 0);
    return [
      `Your recorded staff cost for the selected period is **${money(staff)}**.`,
      paid || earned ? `Payroll snapshot: ${money(paid)} recorded as taken/paid and ${money(earned)} earned across the loaded employee records.` : 'No detailed payroll payment records are available in the current snapshot.',
      staff > sales * 0.2 && sales > 0 ? 'Staff cost is above 20% of sales, so payroll efficiency is worth reviewing.' : 'Staff cost is not unusually high relative to the selected-period sales.'
    ].join('\n');
  }

  if ((q.includes('expense') && (q.includes('highest') || q.includes('largest' ) || q.includes('category'))) || q.includes('cost category')) {
    if (!topCategories.length) return 'No expense categories are available for the selected period.';
    const [name, amount] = topCategories[0];
    const pct = expenses ? Number(amount || 0) / expenses * 100 : 0;
    return `Your highest recorded expense category is **${name}** at **${money(amount)}**, representing about **${pct.toFixed(1)}%** of recorded expenses.`;
  }

  if (q.includes('customer') && (q.includes('balance') || q.includes('due') || q.includes('owe'))) {
    const customers = Array.isArray(khata.topOutstandingCustomers) ? khata.topOutstandingCustomers : [];
    if (!customers.length) return 'There are no outstanding customer balances in the current Khata snapshot.';
    const c = customers[0];
    return `The customer with the highest outstanding balance in the current snapshot is **${c.name}** at **${money(c.balance)}**. Total customer credit outstanding is **${money(credit)}** across ${Number(khata.customersWithDue || customers.length)} customer(s) with dues.`;
  }

  if (q.includes('trend') || q.includes('trending') || q.includes('monthly') || q.includes('week')) {
    if (monthly.length >= 2) {
      const previous = monthly[monthly.length - 2]?.[1] || {};
      const latest = monthly[monthly.length - 1]?.[1] || {};
      const previousSales = Number(previous.sales || 0);
      const latestSales = Number(latest.sales || 0);
      const change = previousSales ? ((latestSales - previousSales) / previousSales) * 100 : null;
      const direction = change === null ? 'There is not enough prior sales data for a percentage comparison.' : `Sales are ${change >= 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(1)}% versus the previous loaded month.`;
      return `For the selected period, sales are **${money(sales)}**, expenses are **${money(expenses)}**, and estimated profit/loss is **${money(profit)}**. ${direction}`;
    }
    return `For the selected period, sales are **${money(sales)}**, expenses are **${money(expenses)}**, and estimated profit/loss is **${money(profit)}**.`;
  }

  if (q.includes('sales') && (q.includes('expense') || q.includes('profit'))) {
    return `For the selected period, recorded sales are **${money(sales)}** and recorded expenses are **${money(expenses)}**. The estimated profit/loss before separate purchase-cost treatment is **${money(profit)}**.`;
  }

  if (q.includes('profit') || q.includes('loss')) {
    return profit >= 0
      ? `The selected period shows an estimated profit of **${money(profit)}** on sales of **${money(sales)}** after recorded expenses of **${money(expenses)}**.`
      : `The selected period shows an estimated loss of **${money(Math.abs(profit))}**: sales are **${money(sales)}** versus recorded expenses of **${money(expenses)}**.`;
  }

  if (q.includes('improve') || q.includes('recommend') || q.includes('suggest')) {
    const suggestions = [];
    if (sales > 0 && expenses / sales > 0.35) suggestions.push('Review the largest operating-expense categories and set weekly spending limits.');
    if (sales > 0 && staff / sales > 0.20) suggestions.push('Review staffing hours and payroll against sales by day.');
    if (credit > 0) suggestions.push(`Prioritize customer collections; current outstanding credit is ${money(credit)}.`);
    if (!suggestions.length) {
      suggestions.push('Track daily sales and expenses against a weekly target.');
      suggestions.push('Review your largest expense categories every week.');
      suggestions.push('Keep customer credit collection dates and balances current.');
    }
    return 'Three practical actions:\n1. ' + suggestions.slice(0, 3).join('\n2. ');
  }

  return `I can analyze the current accounting snapshot. The selected period has sales of **${money(sales)}**, expenses of **${money(expenses)}**, estimated profit/loss of **${money(profit)}**, staff cost of **${money(staff)}**, and customer credit outstanding of **${money(credit)}**. Try asking about your highest expense, staff cost, customer balances, profit trend, or ways to improve performance.`;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const authHeader = req.headers.authorization || '';
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!accessToken) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!supabase) {
      res.status(503).json({ error: 'Supabase server authentication is not configured.' });
      return;
    }

    const { data: userData, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !userData?.user) {
      res.status(401).json({ error: 'Your session is no longer valid. Please log in again.' });
      return;
    }

    const { question, context } = req.body || {};
    const userQuestion = cleanText(question, 1200).trim();
    if (!userQuestion) {
      res.status(400).json({ error: 'Please enter a question.' });
      return;
    }

    const safeContext = context && typeof context === 'object' ? context : {};
    const fallback = localBusinessAnswer(userQuestion, safeContext);

    // AI Gateway remains an optional enhancement. If it is unavailable, the
    // assistant still answers from the supplied accounting data at no model cost.
    if (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN) {
      try {
        const prompt = [
          'USER QUESTION:', userQuestion, '',
          'READ-ONLY VINTAGE ACCOUNTS DATA:', JSON.stringify(safeContext), '',
          'Answer using only the supplied accounting data for factual business numbers.',
          'If data is insufficient, say what is missing instead of inventing a number.',
          'Use Indian Rupees (₹). Keep the answer practical and concise.',
          'Do not change, approve, delete, or instruct the user to alter accounting records.'
        ].join('\n');

        const model = process.env.AI_GATEWAY_MODEL || 'inclusionai/ling-3.1-flash-free';
        const result = await generateText({
          model,
          system: 'You are Vintage Accounts AI, a read-only business intelligence assistant for a restaurant.',
          prompt,
          maxOutputTokens: 900,
          reasoning: 'low'
        });

        if (result?.text?.trim()) {
          res.status(200).json({ text: result.text.trim(), mode: 'ai' });
          return;
        }
      } catch (aiError) {
        console.warn('AI Gateway unavailable; using local accounting assistant:', {
          name: aiError?.name,
          message: aiError?.message,
          statusCode: aiError?.statusCode
        });
      }
    }

    res.status(200).json({
      text: fallback,
      mode: 'accounting-fallback'
    });
  } catch (error) {
    console.error('Vintage Accounts AI error:', {
      name: error?.name,
      message: error?.message,
      statusCode: error?.statusCode
    });
    res.status(500).json({ error: 'The assistant could not process this request. Please try again.' });
  }
}
