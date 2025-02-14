"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const scheduler_1 = require("./scheduler");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const PORT = process.env.PORT || 4000;
// GET: Retrieve all tasks
app.get("/tasks", (req, res) => {
    res.json((0, scheduler_1.getTasks)());
});
// POST: Create a new task
app.post("/tasks", (req, res) => {
    const { name, type, cronExpression, scheduledTime } = req.body;
    if (!name || !type) {
        return res.status(400).json({ error: "Task name and type are required." });
    }
    const newTask = (0, scheduler_1.addTask)({ name, type, cronExpression, scheduledTime });
    res.json(newTask);
});
// DELETE: Remove a task
app.delete("/tasks/:id", (req, res) => {
    const taskId = req.params.id;
    (0, scheduler_1.removeTask)(taskId);
    res.json({ success: true });
});
// GET: Retrieve execution logs
app.get("/logs", (req, res) => {
    res.json((0, scheduler_1.getTaskLogs)());
});
// Periodically check for one-time tasks that need execution
setInterval(scheduler_1.pollOneTimeTasks, 2000);
app.listen(PORT, () => {
    console.log(`Scheduler running on port ${PORT}`);
});
