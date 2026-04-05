const mongoose = require('mongoose');

const BugFixSchema = new mongoose.Schema({
  bug_id: {
    type: String,
    unique: true,
    default: () => `bug_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  },

  // === ERROR DETAILS ===
  error: {
    raw_message: {
      type: String,
      required: true,
      index: 'text'
    },
    error_type: String,
    error_code: String,
    file_path: String,
    line_number: Number,
    stack_trace: String
  },

  // === ENVIRONMENT ===
  environment: {
    language: {
      type: String,
      enum: ['javascript', 'php', 'python', 'typescript', 'java', 'go', 'rust', 'other'],
      required: true
    },
    framework: String,
    runtime_version: String,
    os: String,
    package_versions: [
      {
        name: String,
        version: String
      }
    ]
  },

  // === THE FIX ===
  fix: {
    description: {
      type: String,
      required: true
    },
    code_before: String,
    code_after: String,
    fix_type: {
      type: String,
      enum: ['config', 'code_change', 'dependency', 'env_variable', 'other'],
      default: 'code_change'
    },
    steps: [String],
    related_files: [String]
  },

  // === METADATA ===
  tags: [String],
  project_type: String,
  source: {
    type: String,
    enum: ['manual', 'cursor', 'windsurf', 'claude', 'cli'],
    default: 'manual'
  },

  // === SUCCESS TRACKING ===
  success_count: {
    type: Number,
    default: 1
  },
  fail_count: {
    type: Number,
    default: 0
  },
  success_rate: {
    type: Number,
    default: 100
  },
  last_used: Date,

  created_at: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Text search index
BugFixSchema.index({
  'error.raw_message': 'text',
  'error.error_type': 'text',
  'fix.description': 'text',
  'tags': 'text'
});

module.exports = mongoose.model('BugFix', BugFixSchema);
