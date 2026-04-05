const { z } = require('zod');
const BugFix = require('../../models/BugFix.model');

const listFixesTool = (server) => {
  server.tool(
    'list_fixes',
    'List stored bug fixes. Optionally filter by language.',
    {
      language: z.string().optional().describe('Filter by language'),
      limit: z.number().optional().describe('Max results (default 20)')
    },
    async ({ language, limit = 20 }) => {
      try {
        const query = language ? { 'environment.language': language } : {};
        const fixes = await BugFix.find(query)
          .sort({ created_at: -1 })
          .limit(limit)
          .select('bug_id error.error_type error.raw_message fix.description success_count success_rate tags created_at')
          .lean();

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              total: fixes.length,
              fixes: fixes.map(f => ({
                bug_id: f.bug_id,
                error_type: f.error?.error_type,
                error_preview: f.error?.raw_message?.slice(0, 80),
                fix_preview: f.fix?.description?.slice(0, 80),
                success_rate: f.success_rate,
                used_count: f.success_count,
                tags: f.tags
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

module.exports = { listFixesTool };
