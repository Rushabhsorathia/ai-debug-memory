const { z } = require('zod');
const { matchFix } = require('../../services/matching.service');
const logger = require('../../utils/logger');

const findFixTool = (server) => {
  server.tool(
    'find_fix',
    'Search your personal bug fix database for a matching solution. Always call this before googling.',
    {
      error_message: z.string().describe('The full error message or stack trace'),
      language: z.string().optional().describe('Programming language e.g. javascript, php'),
      framework: z.string().optional().describe('Framework e.g. Express, Laravel, React')
    },
    async ({ error_message, language, framework }) => {
      try {
        const matches = await matchFix({ error_message, language, framework });

        if (!matches.length) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                found: false,
                message: 'No matching fix found. After you solve it, store it with store_bug_fix tool!'
              })
            }]
          };
        }

        const top = matches[0];
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              found: true,
              match_score: top.match_score,
              fix_summary: top.fix.description,
              success_rate: `${top.success_rate}%`,
              steps: top.fix.steps,
              code_fix: top.fix.code_after,
              tags: top.tags,
              total_alternatives: matches.length - 1
            })
          }]
        };
      } catch (err) {
        logger.error('find_fix error:', err.message);
        return {
          content: [{ type: 'text', text: `Error: ${err.message}` }],
          isError: true
        };
      }
    }
  );
};

module.exports = { findFixTool };
