type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'apikey',
  'api_key',
]);

function resolveMinLevel(): LogLevel {
  const configured = process.env.EXPO_PUBLIC_LOG_LEVEL as LogLevel | undefined;
  if (configured && configured in LEVEL_RANK) {
    return configured;
  }
  return __DEV__ ? 'debug' : 'warn';
}

function redactMeta(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return undefined;

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      redacted[key] = '[REDACTED]';
      continue;
    }
    redacted[key] = value;
  }
  return redacted;
}

function write(level: LogLevel, namespace: string, message: string, meta?: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    namespace,
    msg: message,
    ...redactMeta(meta),
  };

  if (__DEV__) {
    const prefix = `[${namespace}]`;
    switch (level) {
      case 'error':
        console.error(prefix, message, redactMeta(meta) ?? '');
        break;
      case 'warn':
        console.warn(prefix, message, redactMeta(meta) ?? '');
        break;
      default:
        console.log(prefix, message, redactMeta(meta) ?? '');
    }
    return;
  }

  if (level === 'error') {
    console.error(JSON.stringify(entry));
    return;
  }
  if (level === 'warn') {
    console.warn(JSON.stringify(entry));
    return;
  }
  console.log(JSON.stringify(entry));
}

export type Logger = {
  debug: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
};

export function createLogger(namespace: string): Logger {
  const minLevel = resolveMinLevel();
  const minRank = LEVEL_RANK[minLevel];

  const log =
    (level: LogLevel) =>
    (message: string, meta?: Record<string, unknown>) => {
      if (LEVEL_RANK[level] < minRank) return;
      write(level, namespace, message, meta);
    };

  return {
    debug: log('debug'),
    info: log('info'),
    warn: log('warn'),
    error: log('error'),
  };
}
