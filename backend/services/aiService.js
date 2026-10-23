const Anthropic = require('@anthropic-ai/sdk');
const pool = require('../db/pool');

const client = new Anthropic({ apiKey: process.env.claude_api_key });

// Categories aur unke DB values
const CATEGORY_MAP = {
  'royalty':      'Royalty & Payments',
  'isbn':         'ISBN & Metadata Issues',
  'printing':     'Printing & Quality',
  'distribution': 'Distribution & Availability',
  'production':   'Book Status & Production Updates',
  'general':      'General Inquiry',
};

async function classifyTicket(ticketId) {
  try {
    // 1. DB se ticket data lo
    const result = await pool.query(`SELECT * FROM tickets WHERE id = $1`, [ticketId]);
    const ticket = result.rows[0];
    if (!ticket) return;

    // 2. Pehla message (description) lo
    const msgResult = await pool.query(
      `SELECT body FROM ticket_messages WHERE ticket_id = $1 ORDER BY created_at ASC LIMIT 1`,
      [ticketId]
    );
    const description = msgResult.rows[0]?.body || '';
    console.log('Description:', description);
    console.log('Ticket:', ticket);

    // 3. Short prompt — JSON only, low tokens
    const prompt = `You are a support ticket classifier for BookLeaf, a self-publishing company.

Classify this support ticket:
Subject: ${ticket.subject}
Description: ${description}

Categories (pick one): royalty, isbn, printing, distribution, production, general
Priorities (pick one): critical, high, medium, low

Rules:
- royalty = payment issues, missing royalty, wrong amount
- isbn = ISBN errors, metadata wrong
- printing = print quality, misprints, binding
- distribution = not available on Amazon/Flipkart
- production = book still in production stages
- general = anything else
- critical = data loss, ISBN error, financial dispute
- high = payment overdue, distribution down
- medium = general queries, status checks
- low = minor issues, suggestions

Respond ONLY with raw JSON. No markdown, no backticks, no explanation. Example:
{"category":"royalty","priority":"high"}`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0].text.trim().replace(/```json|```/g, '').trim();
    const { category, priority } = JSON.parse(raw);

    // 4. DB update
    await pool.query(
      `UPDATE tickets SET
        category    = $1,
        priority    = $2,
        ai_category = $1,
        ai_priority = $2,
        ai_status   = 'done',
        updated_at  = NOW()
       WHERE id = $3`,
      [category, priority, ticketId]
    );

    console.log(`[AI] Ticket #${ticketId} → ${category} / ${priority}`);

  } catch (err) {
    // fail safe — ticket already inserted, admin manually classify karega
    await pool.query(
      `UPDATE tickets SET ai_status = 'failed' WHERE id = $1`,
      [ticketId]
    );
    console.error(`[AI] Ticket #${ticketId} classification failed:`, err.message);
  }
}

// Category ke hisaab se sirf relevant KB section bhejo — cost bachao
const KB = {
  royalty: `ROYALTY POLICY:
- 80/20 split: 80% net profit to author, 20% to BookLeaf
- Paid quarterly, within 45 days of quarter end
- Minimum payout threshold ₹1,000 (below that rolls to next quarter)
- Paid via bank transfer linked in author dashboard
- Authors can view per-platform breakdown in dashboard`,

  isbn: `ISBN POLICY:
- Every book gets unique ISBN under BookLeaf's imprint
- Author wanting own imprint must obtain ISBN independently
- ISBN errors = high priority, escalated to production team immediately`,

  printing: `PRINTING & QUALITY:
- In-house printing; overflow to Repro India or Epitome Books
- Standard turnaround: 5–7 business days from order confirmation
- Quality issues → free reprint after photo verification`,

  distribution: `DISTRIBUTION:
- Listed on Amazon India, Flipkart, Amazon US, Amazon UK, BookLeaf Store
- New listings live within 7–10 business days after publication
- "Unavailable" = stock sync issue; re-sync within 24–48 hours`,

  production: `PRODUCTION STAGES:
Manuscript → Editing → Cover Design → Typesetting → Proofreading → ISBN → Printing → Distribution → Published
- Authors updated by email at each stage
- Common delays: Cover Design (author approval), Proofreading (revision rounds)`,

  general: `BOOKLEAF OVERVIEW:
- Self-publishing company in India and US
- Packages: Standard Free and Bestseller Breakthrough (premium)
- Handles cover design, typesetting, ISBN, printing, distribution, royalties`,
};

const TONE = `  GUIDELINES:
- Empathetic and professional. Authors are partners, not customers.
- Acknowledge the concern FIRST, then give solution.
- Be specific: use actual numbers, dates, statuses from the data.
- If BookLeaf's fault, own it directly. No corporate deflection.
- Escalations: give clear timeline ("within 48 hours"), not open-ended.
- Always end with a clear next step.`;

async function generateDraft(ticketId, forceNew = false) {
  // 1. Ticket fetch karo
  const ticketRes = await pool.query(`SELECT * FROM tickets WHERE id = $1`, [ticketId]);
  const ticket = ticketRes.rows[0];
  if (!ticket) throw new Error('Ticket not found');

  // 2. Cached draft return karo (jab tak forceNew nahi)
  if (ticket.ai_draft && !forceNew) return ticket.ai_draft;

  // 3. Last 5 messages fetch karo
  const msgRes = await pool.query(
    `SELECT sender_role, body FROM ticket_messages
     WHERE ticket_id = $1 AND is_internal = false
     ORDER BY created_at DESC LIMIT 5`,
    [ticketId]
  );
  const messages = msgRes.rows.reverse();
  const thread = messages.map(m => `${m.sender_role.toUpperCase()}: ${m.body}`).join('\n');

  // 4. Relevant KB section
  const kb = KB[ticket.category] || KB.general;

  // 5. Prompt
  const prompt = `You are a BookLeaf support representative. Write a professional reply to this author's ticket.

TICKET:
Subject: ${ticket.subject}
Category: ${ticket.category}
Priority: ${ticket.priority}

CONVERSATION (last 5 messages):
${thread}

KNOWLEDGE BASE (relevant section):
${kb}

${TONE}

Write ONLY the reply text. No subject line, no "Dear author", no signature. Start directly with empathy and solution. Keep it under 150 words.`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });

  const draft = response.content[0].text.trim();

  // 6. DB mein cache karo
  await pool.query(`UPDATE tickets SET ai_draft = $1 WHERE id = $2`, [draft, ticketId]);

  return draft;
}

module.exports = { classifyTicket, generateDraft };
