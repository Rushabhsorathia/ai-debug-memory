const BugFix = require('../models/BugFix.model');
const { extractErrorDetails } = require('../services/extractor.service');
const { matchFix } = require('../services/matching.service');
const logger = require('../utils/logger');

const storeBugFix = async (req, res) => {
  try {
    const data = req.body;

    // Auto-extract error type if not provided
    if (!data.error?.error_type && data.error?.raw_message) {
      const extracted = extractErrorDetails(data.error.raw_message);
      data.error.error_type = data.error.error_type || extracted.error_type;
      data.error.error_code = data.error.error_code || extracted.error_code;
    }

    const bugFix = new BugFix(data);
    await bugFix.save();

    res.status(201).json({
      success: true,
      message: 'Bug fix stored!',
      data: { bug_id: bugFix.bug_id }
    });
  } catch (err) {
    logger.error('Store bug fix error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

const listFixes = async (req, res) => {
  try {
    const { language, page = 1, limit = 20 } = req.query;
    const query = language ? { 'environment.language': language } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [fixes, total] = await Promise.all([
      BugFix.find(query).sort({ created_at: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      BugFix.countDocuments(query)
    ]);

    res.json({
      success: true,
      fixes,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    logger.error('List fixes error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

const getFix = async (req, res) => {
  try {
    const fix = await BugFix.findOne({ bug_id: req.params.bugId }).lean();
    if (!fix) return res.status(404).json({ success: false, message: 'Bug fix not found' });
    res.json({ success: true, data: fix });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const updateFix = async (req, res) => {
  try {
    const fix = await BugFix.findOneAndUpdate(
      { bug_id: req.params.bugId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!fix) return res.status(404).json({ success: false, message: 'Bug fix not found' });
    res.json({ success: true, data: fix });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const deleteFix = async (req, res) => {
  try {
    const deleted = await BugFix.findOneAndDelete({ bug_id: req.params.bugId });
    if (!deleted) return res.status(404).json({ success: false, message: 'Bug fix not found' });
    res.json({ success: true, message: 'Bug fix deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const submitFeedback = async (req, res) => {
  try {
    const { worked } = req.body;
    const bugFix = await BugFix.findOne({ bug_id: req.params.bugId });
    if (!bugFix) return res.status(404).json({ success: false, message: 'Bug fix not found' });

    if (worked) {
      bugFix.success_count += 1;
    } else {
      bugFix.fail_count += 1;
    }

    const total = bugFix.success_count + bugFix.fail_count;
    bugFix.success_rate = Math.round((bugFix.success_count / total) * 100);
    bugFix.last_used = new Date();
    await bugFix.save();

    res.json({ success: true, data: { success_rate: bugFix.success_rate, success_count: bugFix.success_count, fail_count: bugFix.fail_count } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const searchFixes = async (req, res) => {
  try {
    const { error_message, language, framework } = req.body;
    if (!error_message) return res.status(400).json({ success: false, message: 'error_message is required' });

    const startTime = Date.now();
    const matches = await matchFix({ error_message, language, framework });

    res.json({
      success: true,
      matches: matches.map(m => ({
        bug_id: m.bug_id,
        match_score: m.match_score,
        error_type: m.error.error_type,
        fix_summary: m.fix.description,
        success_rate: m.success_rate,
        used_count: m.success_count,
        fix: {
          steps: m.fix.steps,
          code_after: m.fix.code_after
        },
        tags: m.tags
      })),
      total_matches: matches.length,
      search_time_ms: Date.now() - startTime
    });
  } catch (err) {
    logger.error('Search error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

const getStats = async (req, res) => {
  try {
    const [total, topLanguages, topFixes, searchStats] = await Promise.all([
      BugFix.countDocuments(),
      BugFix.aggregate([{ $group: { _id: '$environment.language', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      BugFix.find().sort({ success_count: -1 }).limit(5).select('bug_id error.error_type fix.description success_count success_rate').lean(),
      require('../models/SearchLog.model').aggregate([
        { $group: { _id: null, totalSearches: { $sum: 1 }, matchRate: { $avg: { $cond: ['$had_match', 1, 0] } } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        total_fixes: total,
        languages: topLanguages,
        top_fixes: topFixes,
        search_stats: searchStats[0] || { totalSearches: 0, matchRate: 0 }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { storeBugFix, listFixes, getFix, updateFix, deleteFix, submitFeedback, searchFixes, getStats };
