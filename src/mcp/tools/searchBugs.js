const { z } = require('zod');
const BugFix = require('../../models/BugFix.model');

const searchBugsTool = (server) => {
  server.tool(
    'search_bugs',
    'Full text search across all bug fixes. Searches error messages, fix descriptions, and tags.',
    {
      keyword: z.string().describe('Search keyword or phrase'),
      language: z.string().optional().describe('Filter by language')
    },
    async ({ keyword, language }) => {
      try {
        const query = { $text: { $search: keyword } };
        if (language) query['environment.language'] = language;

        const results = await BugFix.find(query, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' } })
          .limit(10)
          .select('bug_id error.error_type error.raw_message fix.description success_rate tags')
          .lean();

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              keyword,
              total: results.length,
              results: results.map(r => ({
                bug_id: r.bug_id,
                error_type: r.error?.error_type,
                fix_description: r.fix?.description,
                success_rate: r.success_rate,
                tags: r.tags,
                relevance: r._doc?.score
              }))
            })
          }]
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error: ${err.message}` }],
          isError: true
        };
      }
    }
  );
};

module.exports = { searchBugsTool };
