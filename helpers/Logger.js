const fs = require('fs');
const { createLogger, format, transports}=require('winston');
const logsDir = './logs';
let reqCounter=0;

if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

const request_logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({
            format: 'DD-MM-YYYY HH:mm:ss.SSS'
        }),
        format.printf(({ level, message, timestamp,reqCounter }) => {
            return `${timestamp} ${level.toUpperCase()}: ${message} | request #${reqCounter}`;
        })
    ),

    transports: [
        new transports.File({ filename: 'logs/requests.log' }),
        new transports.Console()
    ],
});

const todo_logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({
            format: 'DD-MM-YYYY HH:mm:ss.SSS'
        }),
        format.printf(({ level, message, timestamp,reqCounter }) => {
            return `${timestamp} ${level.toUpperCase()}: ${message} | request #${reqCounter}`;
        })
    ),

    transports: [
        new transports.File({ filename: 'logs/todos.log' }),
    ],
});

function UpdateCounter() {
    return ++reqCounter
}


module.exports = { request_logger,todo_logger,UpdateCounter }

