import { createClient } from '@supabase/supabase-js';
import { generateText } from 'ai';

export const maxDuration = 30;

const supabaseUrl = process.env.SUPABASE_URL || 'https://gsscocpxmsmtevjadxjd.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzc2NvY3B4bXNtdGV2amFkeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MDMxODMsImV4cCI6MjA5NDA3OTE4M30._HUjYhFo34US81UiA6hCoxv_emo9K0sOa_oq8TjxKpk';
const supabase = createClient(supabaseUrl, supabaseKey);

const cleanText = (value, max = 5000) => String(value || '').slice(0, max);

export default async function handler(req, res) {
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

    if (!process.env.AI_GATEWAY_API_KEY) {
      res.status(503).json({
        error: 'AI is not connected yet. Add AI_GATEWAY_API_KEY to the Vintage Accounts Vercel project environment variables, then redeploy.'
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

    const { text } = await generateText({
      model: process.env.AI_GATEWAY_MODEL || 'openai/gpt-5.6-luna',
      system: 'You are Vintage Accounts AI, a read-only business intelligence assistant for a restaurant. Be accurate, transparent, and management-focused.',
      prompt
    });

    res.status(200).json({ text: text || 'I could not generate an answer from the available data.' });
  } catch (error) {
    console.error('Vintage Accounts AI error:', error);
    res.status(500).json({ error: 'The AI assistant could not complete that request. Please try again.' });
  }
}
