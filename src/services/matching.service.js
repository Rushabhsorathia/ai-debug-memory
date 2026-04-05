const BugFix = require('../models/BugFix.model');
const SearchLog = require('../models/SearchLog.model');

// Jaccard similarity
const calculateSimilarity = (str1, str2) => {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));
  const intersection = [...words1].filter(w => words2.has(w));
  const union = new Set([...words1, ...words2]);
  if (union.size === 0) return 0;
  return Math.round((intersection.length / union.size) * 100);
};

const matchFix = async ({ error_message, language, framework }) => {
  // Step 1: MongoDB full-text search
  let query = { $text: { $search: error_message } };
  if (language) query['environment.language'] = language;

  let results = await BugFix.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(10)
    .lean();

  // Step 2: Fuzzy fallback if no text match
  if (!results.length) {
    const fallbackQuery = language ? { 'environment.language': language } : {};
    results = await BugFix.find(fallbackQuery).limit(50).lean();
  }

  // Step 3: Score each result
  const scored = results.map(fix => {
    const similarity = calculateSimilarity(error_message, fix.error.raw_message);
    let boost = 0;
    if (framework && fix.environment.framework?.toLowerCase() === framework.toLowerCase()) boost += 10;
    boost += Math.round(fix.success_rate / 20);
    return { ...fix, match_score: Math.min(100, similarity + boost) };
  });

  // Step 4: Log search
  const filtered = scored.filter(f => f.match_score >= 30).sort((a, b) => b.match_score - a.match_score).slice(0, 5);
  await SearchLog.create({
    query: error_message,
    language,
    framework,
    results_count: filtered.length,
    top_match_score: filtered[0]?.match_score || 0,
    had_match: filtered.length > 0
  });

  return filtered;
};

module.exports = { matchFix, calculateSimilarity };
