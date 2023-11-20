import winston from "winston";

const logger = winston.createLogger({
  level:
    process.env.LOG_LEVEL ??
    (process.env.NODE_ENV === "production" ? "info" : "silly"),
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true, stackTrace: true }),
    winston.format.json({ space: "" }),
  ),
});

export default logger;
