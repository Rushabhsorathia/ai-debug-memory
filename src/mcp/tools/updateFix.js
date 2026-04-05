const { z } = require('zod');
const BugFix = require('../../models/BugFix.model');

const updateFixTool = (server) => {
  server.tool(
    'update_fix',
    'Mark a stored fix as worked or failed. Updates success rate automatically.',
    {
      bug_id: z.string().describe('The bug fix ID'),
      worked: z.boolean().describe('true if the fix worked, false if it did not')
    },
    async ({ bug_id, worked }) => {
      try {
        const bugFix = await BugFix.findOne({ bug_id });
        if (!bugFix) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: 'Bug fix not found', bug_id }) }],
            isError: true
          };
        }

        if (worked) {
          bugFix.success_count += 1;
        } else {
          bugFix.fail_count += 1;
        }

        const total = bugFix.success_count + bugFix.fail_count;
        bugFix.success_rate = Math.round((bugFix.success_count / total) * 100);
        bugFix.last_used = new Date();
        await bugFix.save();

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              bug_id,
              worked,
              success_rate: `${bugFix.success_rate}%`,
              total_uses: total
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

module.exports = { updateFixTool };
