const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gsscocpxmsmtevjadxjd.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body, status = 200) => ({
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(204).set(corsHeaders).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).set(corsHeaders).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    if (!OPENAI_API_KEY) {
      res.status(503).set(corsHeaders).json({
        error: 'AI Assistant is not configured yet. Add OPENAI_API_KEY to the Vercel project environment variables.',
      });
      return;
    }

    const authorization = req.headers.authorization || '';
    if (!authorization.startsWith('Bearer ')) {
      res.status(401).set(corsHeaders).json({ error: 'Authentication required.' });
      return;
    }

    const accessToken = authorization.slice(7).trim();
    if (!accessToken) {
      res.status(401).set(corsHeaders).json({ error: 'Authentication required.' });
      return;
    }

    if (!SUPABASE_ANON_KEY) {
      res.status(500).set(corsHeaders).json({ error: 'Supabase authentication configuration is missing.' });
      return;
    }

    const userResponse = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + accessToken,
      },
    });

    if (!userResponse.ok) {
      res.status(401).set(corsHeaders).json({ error: 'Your session is invalid or expired. Please log in again.' });
      return;
    }

    const { question, context } = req.body || {};
    if (typeof question !== 'string' || !question.trim()) {
      res.status(400).set(corsHeaders).json({ error: 'Please enter a question.' });
      return;
    }

    const cleanQuestion = question.trim().slice(0, 2000);
    const safeContext = context && typeof context === 'object' ? context : {};

    const instructions = [
      'You are Vintage Accounts AI, a read-only financial assistant for a restaurant accounting dashboard.',
      'Use ONLY the business data supplied in the context. Do not invent transactions, balances, customers, suppliers, or dates.',
      'Never claim to have changed, deleted, paid, posted, or reconciled anything.',
      'If the supplied data is insufficient, say exactly what is missing.',
      'Treat credit sales as receivables rather than cash collected.',
      'Treat credit purchases as supplier payables rather than cash outflow until settled.',
      'Treat internal cash/online transfers as movements between accounts, not revenue or expense.',
      'Keep financial conclusions practical and concise. Highlight the numbers that support the conclusion.',
      'When giving recommendations, label them as recommendations, not confirmed facts.',
      'Do not provide legal, tax, investment, or accounting compliance advice as certainty; suggest a qualified professional where appropriate.',
      'Format answers with short headings or bullets when useful.',
    ].join(' ');

    const input = [
      {
        role: 'user',
        content:
          'Business context (JSON):\\n' +
          JSON.stringify(safeContext).slice(0, 45000) +
          '\\n\\nQuestion: ' +
          cleanQuestion,
      },
    ];

    const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + OPENAI_API_KEY,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-6-luna',
        instructions,
        input,
        max_output_tokens: 900,
      }),
    });

    const result = await openaiResponse.json();

    if (!openaiResponse.ok) {
      console.error('OpenAI request failed:', result?.error?.message || openaiResponse.status);
      res.status(502).set(corsHeaders).json({
        error: 'The AI service could not answer right now. Please try again.',
      });
      return;
    }

    const text =
      result.output_text ||
      (Array.isArray(result.output)
        ? result.output
            .flatMap(item => Array.isArray(item.content) ? item.content : [])
            .map(item => item.text || '')
            .filter(Boolean)
            .join('\n')
        : '');

    if (!text) {
      res.status(502).set(corsHeaders).json({ error: 'The AI service returned an empty answer.' });
      return;
    }

    res.status(200).set(corsHeaders).json({
      text: text.trim(),
      model: process.env.OPENAI_MODEL || 'gpt-6-luna',
    });
  } catch (error) {
    console.error('AI Assistant error:', error);
    res.status(500).set(corsHeaders).json({
      error: 'Unable to process the AI request right now.',
    });
  }
};
