// Extract structured error details from raw error message
const extractErrorDetails = (rawMessage) => {
  const result = { error_type: null, error_code: null };

  // Extract error type: TypeError, ReferenceError, etc.
  const typeMatch = rawMessage.match(/^(\w+Error|ErrnoError|\w+Exception|Fatal\s+\w+)/i);
  if (typeMatch) result.error_type = typeMatch[1];

  // Extract error codes: ECONNREFUSED, ENOENT, etc.
  const codeMatch = rawMessage.match(/\b(E[A-Z]{2,}|ERR_[A-Z_]+)\b/);
  if (codeMatch) result.error_code = codeMatch[1];

  // Extract file path
  const fileMatch = rawMessage.match(/(?:at\s+)?(?:file:\/\/)?([\/\w.-]+\.\w+)(?::(\d+))?/);
  if (fileMatch) {
    result.file_path = fileMatch[1];
    if (fileMatch[2]) result.line_number = parseInt(fileMatch[2], 10);
  }

  return result;
};

module.exports = { extractErrorDetails };
