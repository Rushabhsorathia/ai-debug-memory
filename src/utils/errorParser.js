// Parse stack traces into structured format
const parseStackTrace = (stack) => {
  if (!stack) return [];
  return stack.split('\n')
    .filter(line => line.trim().startsWith('at'))
    .map(line => {
      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
      if (match) {
        return { fn: match[1], file: match[2], line: parseInt(match[3]), col: parseInt(match[4]) };
      }
      const simple = line.match(/at\s+(.+)/);
      return simple ? { fn: simple[1] } : null;
    })
    .filter(Boolean);
};

module.exports = { parseStackTrace };
