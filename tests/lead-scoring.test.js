/**
 * Automated Test Suite for AI Lead Scoring Engine
 * Uses Node.js native test runner (node:test & node:assert)
 */

'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const {
  WEIGHTS,
  CATEGORIES,
  ACTION_RECOMMENDATIONS,
  detectSpam,
  categorizeLead,
  evaluateLead,
  calculateLeadScore,
  DEMO_LEADS
} = require('../tools/lead-scoring-engine.js');

describe('AI Lead Scoring Engine - Unit Tests', () => {

  describe('1. Dimension Weights Integrity', () => {
    it('should have exact weights matching specification totaling 1.0 (100%)', () => {
      assert.equal(WEIGHTS.budget, 0.30, 'Budget weight must be 0.30');
      assert.equal(WEIGHTS.urgency, 0.25, 'Urgency weight must be 0.25');
      assert.equal(WEIGHTS.clarity, 0.20, 'Clarity weight must be 0.20');
      assert.equal(WEIGHTS.fit, 0.15, 'ICP Fit weight must be 0.15');
      assert.equal(WEIGHTS.authority, 0.10, 'Authority weight must be 0.10');

      const totalWeight = Math.round((WEIGHTS.budget + WEIGHTS.urgency + WEIGHTS.clarity + WEIGHTS.fit + WEIGHTS.authority) * 100) / 100;
      assert.equal(totalWeight, 1.00, 'Sum of weights must strictly equal 1.00');
    });

    it('should isolate budget weighting to exactly 30 points at 100% score', () => {
      const lead = {
        budgetScore: 100,
        urgencyScore: 0,
        clarityScore: 0,
        fitScore: 0,
        authorityScore: 0
      };
      const result = evaluateLead(lead);
      assert.equal(result.score, 30);
      assert.equal(result.breakdown.budget.weighted, 30);
    });

    it('should isolate urgency weighting to exactly 25 points at 100% score', () => {
      const lead = {
        budgetScore: 0,
        urgencyScore: 100,
        clarityScore: 0,
        fitScore: 0,
        authorityScore: 0
      };
      const result = evaluateLead(lead);
      assert.equal(result.score, 25);
      assert.equal(result.breakdown.urgency.weighted, 25);
    });

    it('should isolate clarity weighting to exactly 20 points at 100% score', () => {
      const lead = {
        budgetScore: 0,
        urgencyScore: 0,
        clarityScore: 100,
        fitScore: 0,
        authorityScore: 0
      };
      const result = evaluateLead(lead);
      assert.equal(result.score, 20);
      assert.equal(result.breakdown.clarity.weighted, 20);
    });

    it('should isolate ICP fit weighting to exactly 15 points at 100% score', () => {
      const lead = {
        budgetScore: 0,
        urgencyScore: 0,
        clarityScore: 0,
        fitScore: 100,
        authorityScore: 0
      };
      const result = evaluateLead(lead);
      assert.equal(result.score, 15);
      assert.equal(result.breakdown.fit.weighted, 15);
    });

    it('should isolate authority weighting to exactly 10 points at 100% score', () => {
      const lead = {
        budgetScore: 0,
        urgencyScore: 0,
        clarityScore: 0,
        fitScore: 0,
        authorityScore: 100
      };
      const result = evaluateLead(lead);
      assert.equal(result.score, 10);
      assert.equal(result.breakdown.authority.weighted, 10);
    });

    it('should produce 100 points when all dimensions are 100%', () => {
      const lead = {
        budgetScore: 100,
        urgencyScore: 100,
        clarityScore: 100,
        fitScore: 100,
        authorityScore: 100
      };
      const result = evaluateLead(lead);
      assert.equal(result.score, 100);
      assert.equal(result.category, CATEGORIES.HOT);
    });
  });

  describe('2. Category Thresholds and Boundary Scoring', () => {
    it('should assign HOT to scores >= 75', () => {
      assert.equal(categorizeLead(75), CATEGORIES.HOT);
      assert.equal(categorizeLead(75.0), CATEGORIES.HOT);
      assert.equal(categorizeLead(88), CATEGORIES.HOT);
      assert.equal(categorizeLead(100), CATEGORIES.HOT);
    });

    it('should assign WARM to scores between 50 and 74.9', () => {
      assert.equal(categorizeLead(74.9), CATEGORIES.WARM);
      assert.equal(categorizeLead(74), CATEGORIES.WARM);
      assert.equal(categorizeLead(60), CATEGORIES.WARM);
      assert.equal(categorizeLead(50.0), CATEGORIES.WARM);
      assert.equal(categorizeLead(50), CATEGORIES.WARM);
    });

    it('should assign COLD to scores between 25 and 49.9', () => {
      assert.equal(categorizeLead(49.9), CATEGORIES.COLD);
      assert.equal(categorizeLead(40), CATEGORIES.COLD);
      assert.equal(categorizeLead(25.0), CATEGORIES.COLD);
      assert.equal(categorizeLead(25), CATEGORIES.COLD);
    });

    it('should assign UNQUALIFIED to scores < 25', () => {
      assert.equal(categorizeLead(24.9), CATEGORIES.UNQUALIFIED);
      assert.equal(categorizeLead(20), CATEGORIES.UNQUALIFIED);
      assert.equal(categorizeLead(10), CATEGORIES.UNQUALIFIED);
      assert.equal(categorizeLead(0), CATEGORIES.UNQUALIFIED);
    });

    it('should correctly support object argument in categorizeLead', () => {
      assert.equal(categorizeLead({ score: 85 }), CATEGORIES.HOT);
      assert.equal(categorizeLead({ score: 55 }), CATEGORIES.WARM);
      assert.equal(categorizeLead({ score: 30 }), CATEGORIES.COLD);
      assert.equal(categorizeLead({ score: 15 }), CATEGORIES.UNQUALIFIED);
    });
  });

  describe('3. Automated Action Recommendations & Routing', () => {
    it('should map HOT leads to instant calendar booking + SMS', () => {
      const rec = ACTION_RECOMMENDATIONS[CATEGORIES.HOT];
      assert.equal(rec.action, 'Instant calendar booking link + immediate SMS notification.');
      assert.ok(rec.channel.includes('SMS'));
    });

    it('should map WARM leads to email nurture sequence + case study', () => {
      const rec = ACTION_RECOMMENDATIONS[CATEGORIES.WARM];
      assert.equal(rec.action, 'Automated email nurture sequence + case study delivery.');
      assert.ok(rec.channel.includes('Email'));
    });

    it('should map COLD leads to educational lead magnet download', () => {
      const rec = ACTION_RECOMMENDATIONS[CATEGORIES.COLD];
      assert.equal(rec.action, 'Educational lead magnet download.');
    });

    it('should map UNQUALIFIED leads to courteous rejection / redirection', () => {
      const rec = ACTION_RECOMMENDATIONS[CATEGORIES.UNQUALIFIED];
      assert.equal(rec.action, 'Courteous rejection / redirection.');
    });

    it('should route evaluated leads directly to the appropriate action string', () => {
      const hotLead = evaluateLead({ budgetScore: 90, urgencyScore: 90, clarityScore: 90, fitScore: 90, authorityScore: 90 });
      assert.equal(hotLead.action, 'Instant calendar booking link + immediate SMS notification.');

      const warmLead = evaluateLead({ budgetScore: 60, urgencyScore: 60, clarityScore: 60, fitScore: 60, authorityScore: 60 });
      assert.equal(warmLead.action, 'Automated email nurture sequence + case study delivery.');

      const coldLead = evaluateLead({ budgetScore: 35, urgencyScore: 35, clarityScore: 35, fitScore: 35, authorityScore: 35 });
      assert.equal(coldLead.action, 'Educational lead magnet download.');

      const unqualLead = evaluateLead({ budgetScore: 10, urgencyScore: 10, clarityScore: 10, fitScore: 10, authorityScore: 10 });
      assert.equal(unqualLead.action, 'Courteous rejection / redirection.');
    });
  });

  describe('4. Spam & Bot Disqualification Penalties', () => {
    it('should detect honeypot trap submissions and disqualify', () => {
      const botSubmission = {
        name: 'Auto Bot',
        honeypot: 'hidden_form_field_value',
        budget: 10000,
        urgency: 'high'
      };
      const check = detectSpam(botSubmission);
      assert.equal(check.isSpam, true);

      const evaluation = evaluateLead(botSubmission);
      assert.equal(evaluation.disqualified, true);
      assert.equal(evaluation.score, 0);
      assert.equal(evaluation.category, CATEGORIES.UNQUALIFIED);
      assert.equal(evaluation.action, 'Courteous rejection / redirection.');
    });

    it('should detect disposable email domains and disqualify', () => {
      const spamLead = {
        email: 'user123@tempmail.com',
        budget: 50000,
        role: 'CEO'
      };
      const check = detectSpam(spamLead);
      assert.equal(check.isSpam, true);

      const evaluation = evaluateLead(spamLead);
      assert.equal(evaluation.disqualified, true);
      assert.equal(evaluation.score, 0);
    });

    it('should detect spam keyword patterns (e.g. crypto casino backlinks)', () => {
      const spamLead = {
        name: 'Spammer',
        email: 'spammer@normaldomain.com',
        description: 'We offer cheap seo backlinks and free casino traffic!'
      };
      const check = detectSpam(spamLead);
      assert.equal(check.isSpam, true);

      const evaluation = evaluateLead(spamLead);
      assert.equal(evaluation.disqualified, true);
      assert.equal(evaluation.score, 0);
      assert.equal(evaluation.category, CATEGORIES.UNQUALIFIED);
    });

    it('should disqualify explicit isSpam flag', () => {
      const flaggedLead = {
        isSpam: true,
        budget: 20000
      };
      const evaluation = evaluateLead(flaggedLead);
      assert.equal(evaluation.disqualified, true);
      assert.equal(evaluation.score, 0);
    });

    it('should disqualify null or empty lead payload', () => {
      const evaluation = evaluateLead(null);
      assert.equal(evaluation.disqualified, true);
      assert.equal(evaluation.score, 0);
    });
  });

  describe('5. Real-World Simulated Leads Evaluation', () => {
    it('should evaluate Roofing Contractor as HOT lead with proper action routing', () => {
      const roofingLead = DEMO_LEADS[0]; // Marcus Vance
      const result = evaluateLead(roofingLead);
      assert.ok(result.score >= 75, `Expected HOT score >= 75, got ${result.score}`);
      assert.equal(result.category, CATEGORIES.HOT);
      assert.equal(result.action, 'Instant calendar booking link + immediate SMS notification.');
    });

    it('should evaluate Dental Clinic as WARM lead with email nurture routing', () => {
      const dentalLead = DEMO_LEADS[1]; // Dr. Sarah Jenkins
      const result = evaluateLead(dentalLead);
      assert.ok(result.score >= 50 && result.score < 75, `Expected WARM score between 50-74, got ${result.score}`);
      assert.equal(result.category, CATEGORIES.WARM);
      assert.equal(result.action, 'Automated email nurture sequence + case study delivery.');
    });

    it('should evaluate Enterprise SaaS as HOT lead with maximum score', () => {
      const saasLead = DEMO_LEADS[2]; // Elena Rostova
      const result = evaluateLead(saasLead);
      assert.ok(result.score >= 90, `Expected Enterprise score >= 90, got ${result.score}`);
      assert.equal(result.category, CATEGORIES.HOT);
      assert.equal(result.action, 'Instant calendar booking link + immediate SMS notification.');
    });

    it('should evaluate Low-budget spammer as DISQUALIFIED / UNQUALIFIED with 0 score', () => {
      const spamLead = DEMO_LEADS[3]; // Cheap SEO Bot
      const result = evaluateLead(spamLead);
      assert.equal(result.disqualified, true);
      assert.equal(result.score, 0);
      assert.equal(result.category, CATEGORIES.UNQUALIFIED);
      assert.equal(result.action, 'Courteous rejection / redirection.');
    });

    it('should evaluate Urgent HVAC Lead as HOT lead with maximum urgency & score', () => {
      const hvacLead = DEMO_LEADS[4]; // Dave Kowalski
      const result = evaluateLead(hvacLead);
      assert.ok(result.score >= 95, `Expected HVAC score >= 95, got ${result.score}`);
      assert.equal(result.category, CATEGORIES.HOT);
      assert.equal(result.action, 'Instant calendar booking link + immediate SMS notification.');
    });
  });

  describe('6. Backward Compatibility & Helper Functions', () => {
    it('should allow calculateLeadScore to evaluate numeric comparison cleanly', () => {
      const result = calculateLeadScore({ budget: 15000, urgency: 'high', projectClarity: 'clear', industryFit: true, isDecisionMaker: true });
      assert.ok(result >= 75, 'valueOf() coercion should allow >= comparison');
      assert.equal(typeof result.score, 'number');
      assert.equal(result.category, CATEGORIES.HOT);
    });
  });

  describe('7. CRM Webhook Handler Integration', () => {
    const { createServer } = require('../workflows/crm-webhook-handler.js');
    let server;
    let baseUrl;

    beforeEach(async () => {
      server = createServer();
      await new Promise(resolve => server.listen(0, resolve));
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
    });

    afterEach(async () => {
      if (server) {
        await new Promise(resolve => server.close(resolve));
      }
    });

    it('should respond with healthy status on GET /health', async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'healthy');
      assert.ok(data.service.includes('Ashflow'));
    });

    it('should process inbound lead on POST /webhook/lead and return scored evaluation', async () => {
      const payload = {
        name: 'Enterprise Client',
        company: 'Apex Cloud Solutions',
        role: 'Founder',
        industry: 'B2B SaaS',
        budget: 15000,
        urgency: 'high',
        projectClarity: 'clear'
      };

      const res = await fetch(`${baseUrl}/webhook/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.evaluation.category, 'HOT');
      assert.ok(data.evaluation.score >= 75);
      assert.equal(data.evaluation.action, 'Instant calendar booking link + immediate SMS notification.');
    });

    it('should reject invalid JSON with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/webhook/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ malformed json: missing quotes }'
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error, 'Bad Request');
    });

    it('should return 405 for GET on /webhook/lead', async () => {
      const res = await fetch(`${baseUrl}/webhook/lead`, {
        method: 'GET'
      });
      assert.equal(res.status, 405);
    });
  });
});

