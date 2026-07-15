import winston from 'winston'

const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

const winstonLogger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'swiftmatch-api' },
  transports: [
    new winston.transports.Console(),
  ],
})

export function createLogger(rid) {
  return {
    error: (msg, err) => winstonLogger.error(msg, { rid, err: err?.message || err, stack: err?.stack }),
    warn: (msg) => winstonLogger.warn(msg, { rid }),
    info: (msg) => winstonLogger.info(msg, { rid }),
    debug: (msg) => winstonLogger.debug(msg, { rid }),
  }
}

export const rootLogger = createLogger('bootstrap')
export default winstonLogger
