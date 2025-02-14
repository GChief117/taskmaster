import express, { Request, Response } from "express";
import cors from "cors";
import { pool } from "./db";  // ✅ Corrected import

import { addTask, getTasks, getTaskLogs, removeTask, pollTasks } from "./scheduler";
import { Task } from "./types";

const app = express();
app.use(cors({
  origin: "*", // Allows any origin
  methods: ["GET", "POST", "DELETE", "PUT"], // Add "PUT" method here
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Check Database Connection
pool.query("SELECT 1", (err, result) => {
  if (err) {
    console.error("❌ PostgreSQL Connection Failed", err);
  } else {
    console.log("✅ PostgreSQL Connected Successfully");
  }
});

// ✅ GET: Retrieve all tasks (Ensure scheduledtime is formatted properly)
app.get("/tasks", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT id, name, type, cron_expression, scheduledtime FROM tasks ORDER BY scheduledtime ASC");

    // Ensure date formatting is correct before sending to frontend
    const formattedTasks = result.rows.map(task => ({
      ...task,
      scheduledtime: task.scheduledtime ? new Date(task.scheduledtime).toLocaleString() : "No Date Set"
    }));

    res.json(formattedTasks);
  } catch (err) {
    console.error("Error fetching tasks", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * Retrieves the list of executed tasks
 */
app.get("/executed-tasks", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM executed_tasks ORDER BY executed_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching executed tasks", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update an existing task (for rescheduling Tasks)
app.put("/tasks/:id", async (req: Request, res: Response) => {
    const { name, type, cron_expression, scheduledtime } = req.body;
    const taskId = req.params.id;

    try {
        await pool.query(
            `UPDATE tasks SET name = $1, type = $2, cron_expression = $3, scheduledtime = $4 WHERE id = $5`,
            [name, type, cron_expression || null, scheduledtime || null, taskId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error("Error updating task", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// POST: Create a new task with Date & Time
app.post("/tasks", async (req: Request, res: Response) => {
  const { name, type, cron_expression, scheduledtime } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: "Task name and type are required." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks (name, type, cron_expression, scheduledtime) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, type, cron_expression || null, scheduledtime ? new Date(scheduledtime) : null]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error adding task", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// DELETE: Remove a task
app.delete("/tasks/:id", async (req: Request, res: Response) => {
  const taskId = req.params.id;

  try {
    const result = await pool.query("DELETE FROM tasks WHERE id = $1 RETURNING *", [taskId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ success: true, message: "Task deleted successfully" });
  } catch (err) {
    console.error("Error deleting task", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/executed-tasks/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM executed_tasks WHERE id = $1 RETURNING *", [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Executed task not found" });
        }
        res.json({ success: true });
    } catch (err) {
        console.error("Error deleting executed task", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET: Retrieve execution logs
app.get("/logs", async (req: Request, res: Response) => {
  const logs = await pool.query("SELECT * FROM logs");
  res.json(logs.rows);
});

// Periodically check for one-time tasks that need execution
setInterval(pollTasks, 10000);

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
