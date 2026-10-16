/**
 * AI Lead Qualification & Intent Scoring Engine
 * Ashflow Automation Suite - ai-automation-lab
 *
 * Multi-dimensional lead scoring formula:
 * Total Score = (w_b * S_budget) + (w_u * S_urgency) + (w_c * S_clarity) + (w_f * S_fit) + (w_a * S_authority)
 *
 * Weights:
 * - Budget (w_b) = 0.30
 * - Urgency (w_u) = 0.25
 * - Project Clarity (w_c) = 0.20
 * - ICP / Industry Fit (w_f) = 0.15
 * - Authority / Decision Maker (w_a) = 0.10
 *
 * Spam / Bot Detection penalty: Disqualification (Score = 0, UNQUALIFIED)
 */

'use strict';

// Weighted scoring dimensions
const WEIGHTS = Object.freeze({
  budget: 0.30,
  urgency: 0.25,
  clarity: 0.20,
  fit: 0.15,
  authority: 0.10
});

// Category thresholds
const CATEGORIES = Object.freeze({
  HOT: 'HOT',
  WARM: 'WARM',
  COLD: 'COLD',
  UNQUALIFIED: 'UNQUALIFIED'
});

// Automated action recommendations
const ACTION_RECOMMENDATIONS = Object.freeze({
  HOT: {
    action: 'Instant calendar booking link + immediate SMS notification.',
    sla: '< 15 minutes',
    channel: 'SMS + Calendar Invite',
    priority: 'P1 - High Priority Sales Desk'
  },
  WARM: {
    action: 'Automated email nurture sequence + case study delivery.',
    sla: '2 - 4 hours',
    channel: 'Automated Email Drip',
    priority: 'P2 - Nurture Pipeline'
  },
  COLD: {
    action: 'Educational lead magnet download.',
    sla: '24 hours',
    channel: 'Automated Resource Delivery',
    priority: 'P3 - Self-Serve Resource'
  },
  UNQUALIFIED: {
    action: 'Courteous rejection / redirection.',
    sla: 'Immediate Automated Response',
    channel: 'Polite Auto-Responder',
    priority: 'P4 - Filtered / Closed'
  }
});

// Core target ICPs
const TARGET_ICPS = [
  'roofing',
  'hvac',
  'home services',
  'plumbing',
  'electrical',
  'contractor',
  'dental',
  'medical',
  'healthcare',
  'medspa',
  'clinic',
  'b2b saas',
  'saas',
  'software',
  'e-commerce',
  'legal',
  'real estate'
];

// Disposable email domains commonly used by bots and spam
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com',
  'guerrillamail.com',
  'mailinator.com',
  'throwawaymail.com',
  '10minutemail.com',
  'trashmail.com',
  'sharklasers.com',
  'dispostable.com',
  'yopmail.com'
];

// Spam content keywords
const SPAM_KEYWORDS = [
  'casino',
  'crypto giveaway',
  'free backlinks',
  'cheap seo backlinks',
  'viagra',
  'buy followers',
  'click here http',
  'telegram @',
  'whatsapp +'
];

/**
 * Detect spam or automated bot submissions
 * @param {Object} lead
 * @returns {{ isSpam: boolean, reason: string | null }}
 */
function detectSpam(lead) {
  if (!lead || typeof lead !== 'object') {
    return { isSpam: true, reason: 'Empty or invalid lead payload' };
  }

  // 1. Explicit spam flag
  if (lead.isSpam === true) {
    return { isSpam: true, reason: 'Explicitly flagged as spam' };
  }

  // 2. Honeypot check
  if (lead.honeypot || lead.botCheck || lead.bot_trap || lead.website_url_hp) {
    return { isSpam: true, reason: 'Honeypot trap triggered by automated submission' };
  }

  // 3. Email validation & disposable domain check
  if (lead.email) {
    const emailStr = String(lead.email).trim().toLowerCase();
    const emailParts = emailStr.split('@');
    if (emailParts.length !== 2 || !emailParts[1].includes('.')) {
      return { isSpam: true, reason: 'Malformed email address syntax' };
    }
    const domain = emailParts[1];
    if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
      return { isSpam: true, reason: `Disposable/temporary email address detected (${domain})` };
    }
  }

  // 4. Keyword heuristic on description or message
  const combinedText = `${lead.description || ''} ${lead.message || ''} ${lead.company || ''} ${lead.name || ''}`.toLowerCase();
  for (const keyword of SPAM_KEYWORDS) {
    if (combinedText.includes(keyword)) {
      return { isSpam: true, reason: `Spam keyword pattern detected: "${keyword}"` };
    }
  }

  // 5. Gibberish check (repeated characters or keyboard smashes)
  if (/([a-z0-9])\1{7,}/i.test(combinedText)) {
    return { isSpam: true, reason: 'Repetitive character gibberish pattern detected' };
  }

  return { isSpam: false, reason: null };
}

/**
 * Calculate raw Budget score (0 - 100)
 * @param {number|string} budget
 * @param {number} [budgetScore]
 * @returns {number}
 */
function evaluateBudgetScore(budget, budgetScore) {
  if (typeof budgetScore === 'number' && !isNaN(budgetScore)) {
    return Math.max(0, Math.min(100, budgetScore));
  }

  if (typeof budget === 'number') {
    if (budget >= 10000) return 100;
    if (budget >= 5000) return 80;
    if (budget >= 2500) return 60;
    if (budget >= 1000) return 40;
    if (budget >= 500) return 20;
    return 0;
  }

  if (typeof budget === 'string') {
    const clean = budget.trim().toLowerCase();
    if (clean.includes('enterprise') || clean.includes('10k+') || clean.includes('25k+') || clean.includes('50k')) {
      return 100;
    }
    // Parse numeric value if present
    const match = clean.match(/\$?\s*([\d,]+)\s*(k)?/i);
    if (match) {
      let num = parseFloat(match[1].replace(/,/g, ''));
      if (match[2]) num *= 1000;
      return evaluateBudgetScore(num);
    }
    if (clean.includes('high') || clean.includes('tier 3')) return 80;
    if (clean.includes('mid') || clean.includes('medium') || clean.includes('tier 2')) return 60;
    if (clean.includes('low') || clean.includes('tier 1')) return 20;
  }

  return 0;
}

/**
 * Calculate raw Urgency score (0 - 100)
 * @param {string|number} urgency
 * @param {number} [urgencyScore]
 * @returns {number}
 */
function evaluateUrgencyScore(urgency, urgencyScore) {
  if (typeof urgencyScore === 'number' && !isNaN(urgencyScore)) {
    return Math.max(0, Math.min(100, urgencyScore));
  }

  if (typeof urgency === 'number') {
    // If urgency is passed as days timeline
    if (urgency <= 3) return 100;
    if (urgency <= 14) return 75;
    if (urgency <= 30) return 50;
    if (urgency <= 90) return 25;
    return 0;
  }

  if (typeof urgency === 'string') {
    const clean = urgency.trim().toLowerCase();
    if (clean.includes('immediate') || clean.includes('emergency') || clean.includes('critical') ||
        clean.includes('24h') || clean.includes('48h') || clean.includes('asap') || clean === 'high') {
      return 100;
    }
    if (clean.includes('1-2 weeks') || clean.includes('2 weeks') || clean.includes('soon') ||
        clean.includes('medium-high') || clean.includes('this month')) {
      return 75;
    }
    if (clean.includes('month') || clean === 'medium' || clean === 'normal' || clean.includes('moderate')) {
      return 50;
    }
    if (clean.includes('quarter') || clean.includes('1-3 months') || clean === 'low' || clean.includes('flexible')) {
      return 25;
    }
    if (clean.includes('exploring') || clean.includes('just browsing') || clean.includes('none') || clean.includes('no rush')) {
      return 0;
    }
  }

  return 20;
}

/**
 * Calculate raw Project Clarity score (0 - 100)
 * @param {string} clarity
 * @param {string} [description]
 * @param {number} [clarityScore]
 * @returns {number}
 */
function evaluateClarityScore(clarity, description, clarityScore) {
  if (typeof clarityScore === 'number' && !isNaN(clarityScore)) {
    return Math.max(0, Math.min(100, clarityScore));
  }

  if (typeof clarity === 'string') {
    const clean = clarity.trim().toLowerCase();
    if (clean === 'clear' || clean === 'high' || clean === 'detailed' || clean === 'architected' || clean === 'comprehensive') {
      return 100;
    }
    if (clean === 'moderate' || clean === 'medium' || clean === 'scoped') {
      return 70;
    }
    if (clean === 'rough' || clean === 'basic' || clean === 'vague' || clean === 'low') {
      return 35;
    }
    if (clean === 'undefined' || clean === 'none' || clean === '') {
      return 0;
    }
  }

  // Fallback to evaluating description text depth
  if (typeof description === 'string' && description.trim().length > 0) {
    const text = description.trim();
    const words = text.split(/\s+/).length;
    const hasSpecKeywords = /(automate|workflow|crm|api|system|leads|integration|pipeline|scale|dispatch|booking)/i.test(text);

    if (words >= 25 && hasSpecKeywords) return 90;
    if (words >= 15) return 70;
    if (words >= 6) return 40;
    return 20;
  }

  return 10;
}

/**
 * Calculate raw ICP / Industry Fit score (0 - 100)
 * @param {string|boolean} industryFit
 * @param {string} [industry]
 * @param {number} [fitScore]
 * @returns {number}
 */
function evaluateFitScore(industryFit, industry, fitScore) {
  if (typeof fitScore === 'number' && !isNaN(fitScore)) {
    return Math.max(0, Math.min(100, fitScore));
  }

  if (typeof industryFit === 'boolean') {
    return industryFit ? 100 : 20;
  }

  const combined = `${industryFit || ''} ${industry || ''}`.trim().toLowerCase();
  if (!combined) return 30;

  for (const icp of TARGET_ICPS) {
    if (combined.includes(icp)) {
      return 100;
    }
  }

  if (combined.includes('consulting') || combined.includes('agency') || combined.includes('manufacturing') ||
      combined.includes('finance') || combined.includes('insurance') || combined.includes('logistics')) {
    return 65;
  }

  if (combined.includes('student') || combined.includes('personal') || combined.includes('academic') ||
      combined.includes('job seeker') || combined.includes('hobby')) {
    return 0;
  }

  return 40;
}

/**
 * Calculate raw Authority / Decision Maker score (0 - 100)
 * @param {string} role
 * @param {boolean} [isDecisionMaker]
 * @param {number} [authorityScore]
 * @returns {number}
 */
function evaluateAuthorityScore(role, isDecisionMaker, authorityScore) {
  if (typeof authorityScore === 'number' && !isNaN(authorityScore)) {
    return Math.max(0, Math.min(100, authorityScore));
  }

  if (typeof isDecisionMaker === 'boolean') {
    return isDecisionMaker ? 100 : 25;
  }

  if (typeof role === 'string') {
    const clean = role.trim().toLowerCase();
    if (clean.includes('owner') || clean.includes('founder') || clean.includes('ceo') ||
        clean.includes('president') || clean.includes('managing director') || clean.includes('partner') ||
        clean.includes('principal')) {
      return 100;
    }
    if (clean.includes('vp') || clean.includes('vice president') || clean.includes('director') ||
        clean.includes('head of') || clean.includes('chief') || clean.includes('practice manager') ||
        clean.includes('lead dentist') || clean.includes('executive')) {
      return 85;
    }
    if (clean.includes('manager') || clean.includes('lead') || clean.includes('supervisor') || clean.includes('pm')) {
      return 55;
    }
    if (clean.includes('associate') || clean.includes('engineer') || clean.includes('specialist') ||
        clean.includes('analyst') || clean.includes('coordinator')) {
      return 30;
    }
    if (clean.includes('intern') || clean.includes('student') || clean.includes('freelancer') || clean.includes('assistant')) {
      return 10;
    }
  }

  return 35;
}

/**
 * Categorize lead score into tier
 * Category assignments: HOT (>= 75), WARM (50-74), COLD (25-49), UNQUALIFIED (< 25)
 * @param {number|Object} score
 * @returns {'HOT'|'WARM'|'COLD'|'UNQUALIFIED'}
 */
function categorizeLead(score) {
  const numericScore = typeof score === 'object' && score !== null ? (score.score ?? 0) : Number(score || 0);

  if (numericScore >= 75) return CATEGORIES.HOT;
  if (numericScore >= 50) return CATEGORIES.WARM;
  if (numericScore >= 25) return CATEGORIES.COLD;
  return CATEGORIES.UNQUALIFIED;
}

/**
 * Comprehensive Multi-dimensional Lead Evaluation
 * @param {Object} leadData
 * @returns {Object} Full evaluation report
 */
function evaluateLead(leadData = {}) {
  // 1. Spam & Bot Detection Filter
  const spamCheck = detectSpam(leadData);
  if (spamCheck.isSpam) {
    const category = CATEGORIES.UNQUALIFIED;
    const recommendation = ACTION_RECOMMENDATIONS[category];

    const result = {
      score: 0,
      category,
      disqualified: true,
      disqualificationReason: spamCheck.reason,
      action: recommendation.action,
      sla: recommendation.sla,
      channel: recommendation.channel,
      priority: recommendation.priority,
      breakdown: {
        budget: { raw: 0, weighted: 0, weight: WEIGHTS.budget },
        urgency: { raw: 0, weighted: 0, weight: WEIGHTS.urgency },
        clarity: { raw: 0, weighted: 0, weight: WEIGHTS.clarity },
        fit: { raw: 0, weighted: 0, weight: WEIGHTS.fit },
        authority: { raw: 0, weighted: 0, weight: WEIGHTS.authority }
      },
      lead: {
        name: (leadData && leadData.name) || 'Anonymous',
        company: (leadData && leadData.company) || 'Unknown',
        email: (leadData && leadData.email) || 'N/A'
      },
      valueOf() { return this.score; },
      toString() { return String(this.score); }
    };
    return result;
  }

  // 2. Evaluate Individual Raw Dimensions (0 - 100)
  const rawBudget = evaluateBudgetScore(leadData.budget, leadData.budgetScore);
  const rawUrgency = evaluateUrgencyScore(leadData.urgency, leadData.urgencyScore);
  const rawClarity = evaluateClarityScore(leadData.projectClarity, leadData.description || leadData.message, leadData.clarityScore);
  const rawFit = evaluateFitScore(leadData.industryFit, leadData.industry, leadData.fitScore);
  const rawAuthority = evaluateAuthorityScore(leadData.role || leadData.title, leadData.isDecisionMaker, leadData.authorityScore);

  // 3. Compute Weighted Scores
  const weightedBudget = rawBudget * WEIGHTS.budget;
  const weightedUrgency = rawUrgency * WEIGHTS.urgency;
  const weightedClarity = rawClarity * WEIGHTS.clarity;
  const weightedFit = rawFit * WEIGHTS.fit;
  const weightedAuthority = rawAuthority * WEIGHTS.authority;

  const rawTotal = weightedBudget + weightedUrgency + weightedClarity + weightedFit + weightedAuthority;
  const finalScore = Math.min(100, Math.max(0, Math.round(rawTotal * 10) / 10));

  // 4. Assign Category & Actions
  const category = categorizeLead(finalScore);
  const recommendation = ACTION_RECOMMENDATIONS[category];

  const result = {
    score: finalScore,
    category,
    disqualified: false,
    disqualificationReason: null,
    action: recommendation.action,
    sla: recommendation.sla,
    channel: recommendation.channel,
    priority: recommendation.priority,
    breakdown: {
      budget: { raw: rawBudget, weighted: Math.round(weightedBudget * 10) / 10, weight: WEIGHTS.budget },
      urgency: { raw: rawUrgency, weighted: Math.round(weightedUrgency * 10) / 10, weight: WEIGHTS.urgency },
      clarity: { raw: rawClarity, weighted: Math.round(weightedClarity * 10) / 10, weight: WEIGHTS.clarity },
      fit: { raw: rawFit, weighted: Math.round(weightedFit * 10) / 10, weight: WEIGHTS.fit },
      authority: { raw: rawAuthority, weighted: Math.round(weightedAuthority * 10) / 10, weight: WEIGHTS.authority }
    },
    lead: {
      name: leadData.name || 'Anonymous',
      company: leadData.company || 'Unknown',
      email: leadData.email || 'N/A',
      role: leadData.role || leadData.title || 'N/A',
      industry: leadData.industry || 'N/A'
    },
    valueOf() { return this.score; },
    toString() { return String(this.score); }
  };

  return result;
}

/**
 * Backward compatible helper that computes lead score
 * Returns a result object whose valueOf() is the numerical score
 * @param {Object} leadData
 * @returns {number|Object}
 */
function calculateLeadScore(leadData) {
  const evaluation = evaluateLead(leadData);
  return evaluation;
}

// 5 Simulated Real-World Leads for CLI Demo
const DEMO_LEADS = [
  {
    name: 'Marcus Vance',
    company: 'Apex Peak Roofing LLC',
    email: 'marcus@apexpeakroofing.com',
    role: 'Owner & General Manager',
    industry: 'Roofing & Exterior Contracting',
    budget: 6500,
    urgency: 'high',
    projectClarity: 'clear',
    description: 'Scaling to 5 roofing crews. Need automated website lead qualification and instant SMS dispatch to estimators.',
    isDecisionMaker: true
  },
  {
    name: 'Dr. Sarah Jenkins',
    company: 'Lakeside Family Dental Practice',
    email: 'sjenkins@lakesidedentalcare.com',
    role: 'Practice Manager & Lead Dentist',
    industry: 'Dental & Healthcare',
    budget: 3500,
    urgency: 'medium',
    projectClarity: 'moderate',
    description: 'Looking to automate patient re-engagement and appointment recall via WhatsApp/SMS.',
    isDecisionMaker: true
  },
  {
    name: 'Elena Rostova',
    company: 'CloudScale Analytics Inc.',
    email: 'e.rostova@cloudscale-saas.io',
    role: 'VP of Revenue Operations',
    industry: 'B2B SaaS',
    budget: 28000,
    urgency: 'high',
    projectClarity: 'clear',
    description: 'Inbound sales qualification pipeline connected to HubSpot CRM and Slack sales room with custom enrichment.',
    isDecisionMaker: true
  },
  {
    name: 'Cheap SEO Bot',
    company: 'Crypto Backlink Booster 999',
    email: 'blast771@tempmail.com',
    role: 'Freelancer',
    industry: 'crypto casino backlinks',
    budget: 15,
    urgency: 'low',
    projectClarity: 'vague',
    description: 'make me viral crypto casino site for 15$ fast please bro free backlinks',
    honeypot: 'automated_fill_trap_triggered'
  },
  {
    name: 'Dave Kowalski',
    company: 'Metro Rapid Air & Heat',
    email: 'dave@metrorapidhvac.com',
    role: 'Founder & CEO',
    industry: 'HVAC & Climate Control',
    budget: 12000,
    urgency: 'immediate',
    projectClarity: 'clear',
    description: 'Summer heatwave overloading dispatch. Need 24/7 AI call qualification and direct calendar booking for technicians.',
    isDecisionMaker: true
  }
];

/**
 * Interactive colorized CLI terminal report
 */
function runCliDemo() {
  const reset = '\x1b[0m';
  const bold = '\x1b[1m';
  const dim = '\x1b[2m';
  const red = '\x1b[31m';
  const green = '\x1b[32m';
  const yellow = '\x1b[33m';
  const blue = '\x1b[34m';
  const magenta = '\x1b[35m';
  const cyan = '\x1b[36m';
  const white = '\x1b[37m';

  console.log(`\n${bold}${cyan}╔══════════════════════════════════════════════════════════════════════════════════╗${reset}`);
  console.log(`${bold}${cyan}║       ASHFLOW AI AUTOMATION LAB — PRODUCTION LEAD SCORING SUITE DEMO            ║${reset}`);
  console.log(`${bold}${cyan}╚══════════════════════════════════════════════════════════════════════════════════╝${reset}\n`);
  console.log(`${dim}Formula: Score = (0.30 * Budget) + (0.25 * Urgency) + (0.20 * Clarity) + (0.15 * ICP) + (0.10 * Authority)${reset}`);
  console.log(`${dim}Categories: HOT (>= 75) | WARM (50-74) | COLD (25-49) | UNQUALIFIED (< 25)${reset}\n`);

  DEMO_LEADS.forEach((lead, index) => {
    const result = evaluateLead(lead);

    let badgeColor;
    let categoryIcon;
    switch (result.category) {
      case CATEGORIES.HOT:
        badgeColor = `${bold}${green}`;
        categoryIcon = '🔥';
        break;
      case CATEGORIES.WARM:
        badgeColor = `${bold}${yellow}`;
        categoryIcon = '⚡';
        break;
      case CATEGORIES.COLD:
        badgeColor = `${bold}${blue}`;
        categoryIcon = '❄️';
        break;
      case CATEGORIES.UNQUALIFIED:
      default:
        badgeColor = `${bold}${red}`;
        categoryIcon = '🚫';
        break;
    }

    console.log(`${bold}${white}──────────────────────────────────────────────────────────────────────────────────${reset}`);
    console.log(`${bold}Lead #${index + 1}: ${lead.name} ${dim}(${lead.company})${reset}`);
    console.log(`Role: ${magenta}${lead.role}${reset} | Industry: ${cyan}${lead.industry}${reset}`);
    console.log(`Input Details: Budget: ${dim}$${lead.budget}${reset} | Urgency: ${dim}${lead.urgency}${reset} | Clarity: ${dim}${lead.projectClarity}${reset}`);

    if (result.disqualified) {
      console.log(`\n  ${badgeColor}${categoryIcon} STATUS: ${result.category} (DISQUALIFIED)${reset}`);
      console.log(`  ${red}Reason: ${result.disqualificationReason}${reset}`);
      console.log(`  ${dim}Final Score: 0/100 (Disqualification Penalty Applied)${reset}`);
    } else {
      console.log(`\n  ${badgeColor}${categoryIcon} STATUS: ${result.category}  |  FINAL SCORE: ${result.score}/100${reset}`);
      console.log(`  ${dim}Dimensions Breakdown:${reset}`);
      console.log(`    • Budget    (w=0.30): raw ${result.breakdown.budget.raw.toString().padStart(3)}/100 ➔  ${bold}${result.breakdown.budget.weighted} pts${reset}`);
      console.log(`    • Urgency   (w=0.25): raw ${result.breakdown.urgency.raw.toString().padStart(3)}/100 ➔  ${bold}${result.breakdown.urgency.weighted} pts${reset}`);
      console.log(`    • Clarity   (w=0.20): raw ${result.breakdown.clarity.raw.toString().padStart(3)}/100 ➔  ${bold}${result.breakdown.clarity.weighted} pts${reset}`);
      console.log(`    • ICP Fit   (w=0.15): raw ${result.breakdown.fit.raw.toString().padStart(3)}/100 ➔  ${bold}${result.breakdown.fit.weighted} pts${reset}`);
      console.log(`    • Authority (w=0.10): raw ${result.breakdown.authority.raw.toString().padStart(3)}/100 ➔  ${bold}${result.breakdown.authority.weighted} pts${reset}`);
    }

    console.log(`\n  ${bold}Recommended Action:${reset} ${result.action}`);
    console.log(`  ${dim}Execution SLA: ${result.sla} | Channel: ${result.channel} | Queue: ${result.priority}${reset}\n`);
  });

  console.log(`${bold}${cyan}══════════════════════════════════════════════════════════════════════════════════${reset}\n`);
}

// CLI execution trigger
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--demo') || args.length === 0) {
    runCliDemo();
  } else {
    console.log('Usage: node tools/lead-scoring-engine.js --demo');
  }
}

module.exports = {
  WEIGHTS,
  CATEGORIES,
  ACTION_RECOMMENDATIONS,
  TARGET_ICPS,
  DISPOSABLE_EMAIL_DOMAINS,
  SPAM_KEYWORDS,
  detectSpam,
  evaluateBudgetScore,
  evaluateUrgencyScore,
  evaluateClarityScore,
  evaluateFitScore,
  evaluateAuthorityScore,
  categorizeLead,
  evaluateLead,
  calculateLeadScore,
  runCliDemo,
  DEMO_LEADS
};
