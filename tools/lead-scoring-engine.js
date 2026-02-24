// Lead Scoring Engine - Architecture Draft

function calculateLeadScore(leadData) {
    let score = 0;

    if (leadData.budget > 1000) score += 30;
    if (leadData.urgency === "high") score += 25;
    if (leadData.projectClarity === "clear") score += 20;
    if (leadData.industryFit === true) score += 15;

    return score;
}

function categorizeLead(score) {
    if (score >= 70) return "Hot";
    if (score >= 40) return "Warm";
    return "Cold";
}

module.exports = { calculateLeadScore, categorizeLead };
