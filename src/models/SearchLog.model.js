const mongoose = require('mongoose');

const SearchLogSchema = new mongoose.Schema({
  query: String,
  language: String,
  framework: String,
  results_count: Number,
  top_match_score: Number,
  had_match: Boolean,
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SearchLog', SearchLogSchema);
