const { z } = require('zod');
const BugFix = require('../../models/BugFix.model');
const { extractErrorDetails } = require('../../services/extractor.service');
const logger = require('../../utils/logger');

const storeBugFixTool = (server) => {
  server.tool(
    'store_bug_fix',
    'Store a bug fix you just solved so you never have to debug it again.',
    {
      error_message: z.string().describe('The exact error message'),
      fix_description: z.string().describe('Plain English description of the fix'),
      code_before: z.string().optional().describe('The broken code'),
      code_after: z.string().optional().describe('The fixed code'),
      language: z.string().describe('javascript, php, python, typescript, etc'),
      framework: z.string().optional().describe('Express, Laravel, React, etc'),
      fix_type: z.enum(['config', 'code_change', 'dependency', 'env_variable', 'other']).optional(),
      steps: z.array(z.string()).optional().describe('Step-by-step fix instructions'),
      tags: z.array(z.string()).optional().describe('Keywords like jwt, auth, cors')
    },
    async (input) => {
      try {
        const extracted = extractErrorDetails(input.error_message);

        const bugFix = new BugFix({
          error: {
            raw_message: input.error_message,
            error_type: extracted.error_type,
            error_code: extracted.error_code
          },
          environment: {
            language: input.language,
            framework: input.framework
          },
          fix: {
            description: input.fix_description,
            code_before: input.code_before,
            code_after: input.code_after,
            fix_type: input.fix_type || 'code_change',
            steps: input.steps || []
          },
          tags: input.tags || [],
          source: 'cursor'
        });

        await bugFix.save();

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              bug_id: bugFix.bug_id,
              message: 'Fix stored! You will never debug this again.'
            })
          }]
        };
      } catch (err) {
        logger.error('store_bug_fix error:', err.message);
        return {
          content: [{ type: 'text', text: `Error: ${err.message}` }],
          isError: true
        };
      }
    }
  );
};

module.exports = { storeBugFixTool };
