import { createClient } from '@supabase/supabase-js';
import { generateText } from 'ai';

export const maxDuration = 30;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const cleanText = (value, max = 5000) => String(value || '').slice(0, max);

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

    if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
      res.status(503).json({
        error: 'AI Gateway authentication is not configured for this deployment.'
      });
      return;
    }

    const safeContext = context && typeof context === 'object' ? context : {};
    const prompt = [
      'USER QUESTION:',
      userQuestion,
      '',
      'READ-ONLY VINTAGE ACCOUNTS DATA:',
      JSON.stringify(safeContext),
      '',
      'Answer using only the supplied accounting data for factual business numbers.',
      'If the data is insufficient, say exactly what is missing instead of inventing a number.',
      'Use Indian Rupees (₹) for monetary values.',
      'Keep the answer practical and concise for a restaurant owner or manager.',
      'You may identify trends, comparisons, anomalies, and operational suggestions, but clearly label estimates or interpretations.',
      'Do not change, approve, delete, or instruct the user to alter accounting records.',
      'Do not provide definitive tax, legal, or accounting compliance advice; recommend a qualified professional for those matters.'
    ].join('\n');

    const model = process.env.AI_GATEWAY_MODEL || 'inclusionai/ling-3.1-flash-free';

    const { text } = await generateText({
      model,
      system: 'You are Vintage Accounts AI, a read-only business intelligence assistant for a restaurant. Be accurate, transparent, and management-focused.',
      prompt,
      maxOutputTokens: 900,
      reasoning: 'low'
    });

    res.status(200).json({ text: text || 'I could not generate an answer from the available data.' });
  } catch (error) {
    console.error('Vintage Accounts AI error:', {
      name: error?.name,
      message: error?.message,
      statusCode: error?.statusCode,
      model: process.env.AI_GATEWAY_MODEL || 'inclusionai/ling-3.1-flash-free'
    });

    const message = cleanText(error?.message, 500);
    res.status(502).json({
      error: message
        ? 'AI Gateway request failed: ' + message
        : 'AI Gateway request failed. Please try again.'
    });
  }
}
