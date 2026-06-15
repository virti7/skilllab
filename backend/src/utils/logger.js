const LOG_LEVELS = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.INFO;

function formatMessage(level, message, meta) {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaStr}`;
}

const logger = {
  error: (message, meta) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.ERROR) console.error(formatMessage('ERROR', message, meta));
  },
  warn: (message, meta) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.WARN) console.warn(formatMessage('WARN', message, meta));
  },
  info: (message, meta) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.INFO) console.log(formatMessage('INFO', message, meta));
  },
  debug: (message, meta) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.DEBUG) console.log(formatMessage('DEBUG', message, meta));
  },
};

export default logger;
