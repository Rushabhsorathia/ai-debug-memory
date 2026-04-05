const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { storeBugFixTool } = require('./tools/storeBugFix');
const { findFixTool } = require('./tools/findFix');
const { listFixesTool } = require('./tools/listFixes');
const { updateFixTool } = require('./tools/updateFix');
const { searchBugsTool } = require('./tools/searchBugs');
const logger = require('../utils/logger');

const setupMCPServer = (app) => {
  const server = new McpServer({
    name: 'ai-debug-memory',
    version: '1.0.0'
  });

  // Register all tools
  storeBugFixTool(server);
  findFixTool(server);
  listFixesTool(server);
  updateFixTool(server);
  searchBugsTool(server);

  // MCP HTTP endpoints
  const handleMcpRequest = async (req, res) => {
    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => `mcp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      logger.error('MCP request error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'MCP request failed' });
      }
    }
  };

  app.post('/mcp', handleMcpRequest);
  app.get('/mcp', handleMcpRequest);
  app.delete('/mcp', handleMcpRequest);

  logger.info('MCP Server registered: store_bug_fix, find_fix, list_fixes, update_fix, search_bugs');
};

module.exports = { setupMCPServer };
