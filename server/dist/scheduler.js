"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeTask = exports.getTaskLogs = exports.getTasks = exports.pollOneTimeTasks = exports.addTask = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const dayjs_1 = __importDefault(require("dayjs"));
const uuid_1 = require("uuid");
// In-memory storage for tasks and logs
let tasks = [];
let taskLogs = [];
// Stores cron jobs for recurring tasks
const cronJobs = {};
// Add a new task
function addTask(newTask) {
    const task = {
        id: (0, uuid_1.v4)(),
        name: newTask.name,
        type: newTask.type,
        cronExpression: newTask.cronExpression,
        scheduledTime: newTask.scheduledTime,
        createdAt: (0, dayjs_1.default)().toISOString(),
    };
    tasks.push(task);
    // If recurring, create a cron job
    if (task.type === "recurring" && task.cronExpression) {
        createCronJob(task);
    }
    return task;
}
exports.addTask = addTask;
// Create a cron job for recurring tasks
function createCronJob(task) {
    if (!task.cronExpression)
        return;
    const job = node_cron_1.default.schedule(task.cronExpression, () => {
        executeTask(task.id);
    });
    cronJobs[task.id] = job;
}
// Executes a task by logging it
function executeTask(taskId) {
    const now = (0, dayjs_1.default)().toISOString();
    taskLogs.push({ taskId, executedAt: now });
    // If it's a one-time task, remove it after execution
    tasks = tasks.filter((task) => task.id !== taskId);
}
// Polls for one-time tasks and executes them if due within 10s
function pollOneTimeTasks() {
    const now = (0, dayjs_1.default)();
    tasks.forEach((task) => {
        if (task.type === "one-time" && task.scheduledTime) {
            const scheduleTime = (0, dayjs_1.default)(task.scheduledTime);
            const diff = scheduleTime.diff(now, "second");
            if (diff <= 10 && diff >= -10) {
                executeTask(task.id);
            }
        }
    });
}
exports.pollOneTimeTasks = pollOneTimeTasks;
// Get all tasks
function getTasks() {
    return tasks;
}
exports.getTasks = getTasks;
// Get execution logs
function getTaskLogs() {
    return taskLogs;
}
exports.getTaskLogs = getTaskLogs;
// Delete a task
function removeTask(taskId) {
    if (cronJobs[taskId]) {
        cronJobs[taskId].stop();
        delete cronJobs[taskId];
    }
    tasks = tasks.filter((t) => t.id !== taskId);
}
exports.removeTask = removeTask;
