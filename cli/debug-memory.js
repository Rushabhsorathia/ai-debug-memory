#!/usr/bin/env node

const { program } = require('commander');
const readline = require('readline');

const API = process.env.DEBUG_MEMORY_URL || 'http://localhost:3457/api/v1';
const API_KEY = process.env.DEBUG_MEMORY_KEY || 'dm_sk_debugmemory_2026_rushabh_secure_key';

const headers = { 'Content-Type': 'application/json', 'x-api-key': API_KEY };

program
  .name('dm')
  .description('AI Debug Memory CLI - never debug the same bug twice')
  .version('1.0.0');

// dm find "error message"
program
  .command('find <error>')
  .description('Find a fix for an error')
  .option('-l, --lang <lang>', 'Language (javascript, php, python)')
  .option('-f, --framework <fw>', 'Framework (Express, Laravel, React)')
  .action(async (error, opts) => {
    try {
      const fetch = (await import('node-fetch')).default;
      const resp = await fetch(`${API}/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ error_message: error, language: opts.lang, framework: opts.framework })
      });
      const data = await resp.json();

      if (!data.matches || !data.matches.length) {
        console.log('\n No fix found. After you solve it, run: dm store\n');
        return;
      }

      const top = data.matches[0];
      console.log(`\n Found Fix (${top.match_score}% match, ${top.success_rate}% success rate)\n`);
      console.log(`  Fix: ${top.fix_summary}`);
      if (top.fix?.steps?.length) {
        console.log('\n  Steps:');
        top.fix.steps.forEach((s, i) => console.log(`    ${i + 1}. ${s}`));
      }
      if (top.fix?.code_after) {
        console.log(`\n  Fixed code:\n    ${top.fix.code_after.split('\n').join('\n    ')}\n`);
      }
      if (data.total_matches > 1) {
        console.log(`  + ${data.total_matches - 1} alternative fix(es) available`);
      }
    } catch (err) {
      console.error('Error:', err.message);
    }
  });

// dm store
program
  .command('store')
  .description('Store a bug fix interactively')
  .action(async () => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (q) => new Promise(resolve => rl.question(q, resolve));

    const error_message = await ask('Error message: ');
    const fix_description = await ask('Fix description: ');
    const language = await ask('Language (javascript/php/python/typescript): ');
    const framework = await ask('Framework (optional): ') || undefined;
    const tagsInput = await ask('Tags (comma separated): ');
    const code_after = await ask('Fixed code (optional, press enter to skip): ') || undefined;
    rl.close();

    try {
      const fetch = (await import('node-fetch')).default;
      const resp = await fetch(`${API}/bugs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          error: { raw_message: error_message },
          environment: { language, framework },
          fix: { description: fix_description, code_after },
          tags: tagsInput ? tagsInput.split(',').map(t => t.trim()) : [],
          source: 'cli'
        })
      });
      const data = await resp.json();
      console.log(`\n Fix stored! ID: ${data.data?.bug_id || data.bug_id}`);
      console.log(' You will never debug this again.\n');
    } catch (err) {
      console.error('Error:', err.message);
    }
  });

// dm list
program
  .command('list')
  .description('List your stored bug fixes')
  .option('-l, --lang <lang>', 'Filter by language')
  .action(async (opts) => {
    try {
      const fetch = (await import('node-fetch')).default;
      const params = opts.lang ? `?language=${opts.lang}` : '';
      const resp = await fetch(`${API}/bugs${params}`, { headers });
      const data = await resp.json();
      console.log(`\n Your Bug Fix Database (${data.total} fixes)\n`);
      if (data.fixes) {
        data.fixes.forEach(f => {
          const preview = f.fix?.description?.slice(0, 60) || 'No description';
          console.log(`  [${f.bug_id}] ${f.error?.error_type || 'Error'}: ${preview}...`);
          console.log(`    Success: ${f.success_rate}% | Used: ${f.success_count}x | Tags: ${(f.tags || []).join(', ')}\n`);
        });
      }
    } catch (err) {
      console.error('Error:', err.message);
    }
  });

// dm stats
program
  .command('stats')
  .description('Show debug memory statistics')
  .action(async () => {
    try {
      const fetch = (await import('node-fetch')).default;
      const resp = await fetch(`${API}/stats`, { headers });
      const data = await resp.json();
      if (data.success) {
        const s = data.data;
        console.log(`\n AI Debug Memory Stats\n`);
        console.log(`  Total fixes stored: ${s.total_fixes}`);
        console.log(`  Languages:`);
        s.languages.forEach(l => console.log(`    - ${l._id}: ${l.count} fixes`));
        console.log(`  Searches: ${s.search_stats?.totalSearches || 0} total, ${Math.round((s.search_stats?.matchRate || 0) * 100)}% match rate\n`);
      }
    } catch (err) {
      console.error('Error:', err.message);
    }
  });

program.parse();
