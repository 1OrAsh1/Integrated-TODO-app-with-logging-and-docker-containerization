const {request_logger,todo_logger,UpdateCounter} = require('./helpers/Logger.js');


const bodyParser = require("body-parser");
const express = require("express");
const app = express();

const LISTENING_PORT = 9285;

let todolist = [];
let IdCounter=1;
let reqCounter



app.use(
    bodyParser.json({
        type() {
            return true;
        },
    })
);

app.use((req,res,next)=> {
    reqCounter = UpdateCounter();
    next();
});

//1111111111
app.get('/todo/health',(req, res)=>{
    const start=Date.now();
    request_logger.info(`Incoming request | #${reqCounter} | resource: /todo/health | HTTP Verb GET`,{reqCounter});
    const duration = Date.now() - start;
    request_logger.debug(`request #${reqCounter} duration: ${duration}ms`, {reqCounter});
    res.status(200).send("OK");

})
//222222222
app.post('/todo',(req, res)=>{
    const start=Date.now();
    request_logger.info(`Incoming request | #${reqCounter} | resource: /todo | HTTP Verb POST`,{reqCounter});
    let {title,content,dueDate} = req.body;
    if (existingTodoTitle(title)) {
        const errorMessage = `Error: TODO with the title [${title}] already exists in the system`;
        todo_logger.error(errorMessage,{reqCounter});
        res.status(409).json({result:errorMessage});
    }
    else if (!DateVerification(dueDate))
    {
        const errorMessage = "Error: Can’t create new TODO that its due date is in the past";
        todo_logger.error(errorMessage,{reqCounter});
        res.status(409).json({result:errorMessage});

    }
    else {
        // Create a new TODO item with the provided values
        todo_logger.info(`Creating new TODO with Title [${title}]`,{reqCounter});
        todo_logger.debug(`Currently there are ${todolist.length} TODOs in the system. New TODO will be assigned with id ${IdCounter}`,{reqCounter});
        let todo = {
            id: IdCounter++,
            title: title,
            content: content,
            dueDate: dueDate,
            status: "PENDING"
        };
        todolist.push(todo);
        const duration = Date.now() - start;
        request_logger.debug(`request #${reqCounter} duration: ${duration}ms`, {reqCounter});
        res.status(200).json({result:todo.id});
    }
})

//3333333333333
app.get('/todo/size',(req, res)=>{
    const start=Date.now();
    request_logger.info(`Incoming request | #${reqCounter} | resource: /todo/size | HTTP Verb GET`,{reqCounter});
    let {status}=req.query;
    if (status!=='PENDING' && status!=='ALL' && status!=='DONE' && status!=='LATE')
        res.status(400).json({result:"Bad request"});
    else if (status==='ALL') {
        todo_logger.info(`Total TODOs count for state ${status} is ${todolist.length}`,{reqCounter});
        res.status(200).json({result:todolist.length});
    }
    else{
        const pendingTodos = todolist.filter(todo => todo.status === status);
        const count = pendingTodos.length;
        todo_logger.info(`Total TODOs count for state ${status} is ${count}`,{reqCounter});
        res.status(200).json({result:count});
    }
    const duration = Date.now() - start;
    request_logger.debug(`request #${reqCounter} duration: ${duration}ms`, {reqCounter});
})

//44444444444444
app.get('/todo/content',(req, res)=>{
    const start=Date.now();
    request_logger.info(`Incoming request | #${reqCounter} | resource: /todo/content | HTTP Verb GET`,{reqCounter});
    let{status,sortBy}=req.query;
    if (status!=='PENDING' && status!=='ALL' && status!=='DONE' && status!=='LATE')
        res.status(400).json({result:"Bad request"});
    let resArray =todolist.slice();
    if (status !== 'ALL')
        resArray = resArray.filter(todo => todo.status === status);
    switch (sortBy)
    {
        case 'ID':
            todo_logger.info(`Extracting todos content. Filter: ${status} | Sorting by: ${sortBy}`,{reqCounter});
            resArray.sort((a, b) => a.id - b.id);
            break;
        case 'DUE_DATE':
            todo_logger.info(`Extracting todos content. Filter: ${status} | Sorting by: ${sortBy}`,{reqCounter});
            resArray.sort((a, b) => a.dueDate - b.dueDate);
            break;
        case 'TITLE':
            todo_logger.info(`Extracting todos content. Filter: ${status} | Sorting by: ${sortBy}`,{reqCounter});
            resArray.sort((a, b) => {
                if (a.title < b.title) {
                    return -1;
                } else if (a.name > b.name) {
                    return 1;
                } else {
                    return 0;
                }
            });
            break;
        case undefined:
            todo_logger.info(`Extracting todos content. Filter: ${status} | Sorting by: ID`,{reqCounter});
            resArray.sort((a, b) => a.id - b.id);
            break;
        default:
            res.status(400).json({result: "Bad request"});
    }
    const duration = Date.now() - start;
    request_logger.debug(`request #${reqCounter} duration: ${duration}ms`, {reqCounter});
    todo_logger.debug(`There are a total of ${todolist.length} todos in the system. The result holds ${resArray.length} todos`,{reqCounter});
    res.status(200).json({result:resArray});
})

//5555555555555555
app.put('/todo',(req, res)=>{
    const start=Date.now();
    request_logger.info(`Incoming request | #${reqCounter} | resource: /todo | HTTP Verb PUT`,{reqCounter});
    let {id,status}=req.query;
    // check if the status is valid
    if (status !== 'PENDING' && status !== 'LATE' && status !== 'DONE') {
        res.status(400).json({result:"Bad request: invalid status"});
    }
    // find the TODO object with the given id
    const todo = todolist.find(todo => todo.id === parseInt(id));
    if (!todo) {
        todo_logger.error(`Error: no such TODO with id ${id}`,{reqCounter});
        res.status(404).json({result:`Error: no such TODO with id ${id}`});
    }
    else if (todo!==undefined)
    {
        todo_logger.info(`Update TODO id [${id}] state to ${status}`,{reqCounter});
        // update the status and get the old state
        const oldStatus = todo.status;
        todo.status = status;
        const duration = Date.now() - start;
        request_logger.debug(`request #${reqCounter} duration: ${duration}ms`, {reqCounter});
        // send the response with the old state
        todo_logger.debug(`Todo id [${id}] state change: ${oldStatus} --> ${status}`,{reqCounter});
        res.status(200).json({result:oldStatus});
    }

})

//666666666666666
app.delete('/todo',(req, res)=>{
    const start=Date.now();
    request_logger.info(`Incoming request | #${reqCounter} | resource: /todo | HTTP Verb DELETE`,{reqCounter});
    let{id}=req.query;
    // find the index of the TODO object with the given id
    const index = todolist.findIndex(todo => todo.id === parseInt(id));
    if (index === -1) {
        // no such TODO exists
        todo_logger.error(`Error: no such TODO with id ${id}`,{reqCounter});
        res.status(404).json({result:`Error: no such TODO with id ${id}`});
        return;
    }

    // remove the TODO object from the array
    todo_logger.info(`Removing todo id ${id}`,{reqCounter});
    todolist.splice(index, 1);
    todo_logger.debug(`After removing todo id [${id}] there are ${todolist.length} TODOs in the system`,{reqCounter});
    const duration = Date.now() - start;
    request_logger.debug(`request #${reqCounter} duration: ${duration}ms`, {reqCounter});
    // send the response with the number of TODOs left
    res.status(200).json({result:todolist.length});

})


app.get('/logs/level',(req, res)=> {
    const start=Date.now();
    request_logger.info(`Incoming request | #${reqCounter} | resource: /logs/level | HTTP Verb GET`,{reqCounter});
    if (loggerName === 'request-logger') {
        const logLevel = request_logger.level;
        request_logger.debug(`request #${reqCounter} duration: ${duration}ms`, {reqCounter});
        res.send(`Success:${logLevel}`);
    } else if (loggerName === 'todo-logger') {
        const logLevel = todo_logger.level;
        request_logger.debug(`request #${reqCounter} duration: ${duration}ms`, {reqCounter});
        res.send(`Success:${logLevel.toUpperCase()}`);
    }
    else {
        res.status(400).send('Failure: Invalid logger name');
    }
})

app.put('/logs/level',(req, res)=> {
    const start=Date.now();
    request_logger.info(`Incoming request | #${reqCounter} | resource: /logs/level | HTTP Verb PUT`,{reqCounter});
    const loggerName = req.query['logger-name'];
    let loggerLevel = req.query['logger-level'];
    if (!loggerName || !loggerLevel) {
        res.status(400).send('Failure: Invalid logger name or level');
        return;
    }
    let logger;
    if (loggerName === 'request-logger') {
        logger = request_logger;
    } else if (loggerName === 'todo-logger') {
        logger = todo_logger;
    } else {
        res.status(400).send('Failure: Invalid logger name');
        return;
    }
    const validLevels = ['error', 'info', 'debug'];
    if (!validLevels.includes(loggerLevel.toLowerCase())) {
        res.status(400).send('Failure: Invalid logger level');
        return;
    }
    logger.level = loggerLevel.toLowerCase();
    request_logger.debug(`request #${reqCounter} duration: ${duration}ms`, {reqCounter});
    res.send(`Success:${logger.level.toUpperCase()}`);
})

// all other requests return 404
app.all('*', (req, res) => {
    res.status(404).json('Unknown API call');
});

app.listen(LISTENING_PORT, () => {
    console.log(`Server listening on port ${LISTENING_PORT}...\n`);
});


function existingTodoTitle(title) {
    // Check if a TODO with this title already exists
    const existingTodo = todolist.find(todo => todo.title === title);
    return existingTodo;
}

function DateVerification(dueDate) {
    const currentDate = new Date();
    return dueDate >= currentDate;
}