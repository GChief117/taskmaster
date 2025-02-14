import { Task, TaskLog } from "./types";
import cron from "node-cron";
import dayjs from "dayjs";
import { v4 as uuid } from "uuid";
import { pool } from "./db";

// In-memory storage for tasks and logs
let tasks: Task[] = [];
let taskLogs: TaskLog[] = [];

// Stores cron jobs for recurring tasks
const cronJobs: Record<string, cron.ScheduledTask> = {};

// Add a new task
export function addTask(newTask: Omit<Task, "id" | "createdAt">): Task {
  const task: Task = {
    id: uuid(),
    name: newTask.name,
    type: newTask.type,
    cronExpression: newTask.cronExpression,
    scheduledTime: newTask.scheduledTime,
    createdAt: dayjs().toISOString(),
  };
  tasks.push(task);

  // If recurring, create a cron job
  if (task.type === "recurring" && task.cronExpression) {
    createCronJob(task);
  }

  return task;
}

// Create a cron job for recurring tasks
function createCronJob(task: Task) {
  if (!task.cronExpression) return;
  const job = cron.schedule(task.cronExpression, () => {
    executeTask(task.id);
  });
  cronJobs[task.id] = job;
}

// Executes a task by logging it
function executeTask(taskId: string) {
  const now = dayjs().toISOString();
  taskLogs.push({ taskId, executedAt: now });

  // If it's a one-time task, remove it after execution
  tasks = tasks.filter((task) => task.id !== taskId);
}

/**
 * Polls the database for scheduled tasks and executes them if it's time.
 */
export const pollTasks = async () => {
    try {
        const now = new Date();
        now.setSeconds(now.getSeconds() - 10); // Allow execution within 10 seconds of scheduled time

        // Fetch tasks that are due to be executed
        const result = await pool.query(
            `SELECT * FROM tasks WHERE scheduledtime <= NOW()`
        );

        for (const task of result.rows) {
            console.log(`Executing Task: ${task.name}`);

            // Move task to `executed_tasks`
            await pool.query(
                `INSERT INTO executed_tasks (name, type, cron_expression, executed_at)
                 VALUES ($1, $2, $3, NOW())`,
                [task.name, task.type, task.cron_expression]
            );

            if (task.type === "One-Time") {
                // Remove One-Time tasks after execution
                await pool.query(`DELETE FROM tasks WHERE id = $1`, [task.id]);
            } else if (task.type === "Recurring") {
                // Recurring Task: Calculate next execution time using Cron
                const nextExecutionTime = getNextCronExecution(task.cron_expression);
                
                if (nextExecutionTime) {
                    await pool.query(
                        `UPDATE tasks SET scheduledtime = $1 WHERE id = $2`,
                        [nextExecutionTime, task.id]
                    );
                }
            }
        }
    } catch (error) {
        console.error("Error polling tasks:", error);
    }
};

/**
 * Calculates the next execution time based on the cron expression.
 */
const getNextCronExecution = (cronExpression: string): string | null => {
    try {
        const cronParser = require("cron-parser");
        const nextDate = cronParser.parseExpression(cronExpression).next().toDate();
        return nextDate.toISOString();
    } catch (error) {
        console.error("Error parsing cron expression:", error);
        return null;
    }
};


// Run this function every 5 seconds to check for tasks
setInterval(pollTasks, 5000);

// Get all tasks
export function getTasks(): Task[] {
  return tasks;
}

// Get execution logs
export function getTaskLogs(): TaskLog[] {
  return taskLogs;
}

// Delete a task
export function removeTask(taskId: string) {
  if (cronJobs[taskId]) {
    cronJobs[taskId].stop();
    delete cronJobs[taskId];
  }
  tasks = tasks.filter((t) => t.id !== taskId);
}
