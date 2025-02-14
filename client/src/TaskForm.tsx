import React, { useState } from "react";
import axios from "axios";

// Adjust as needed, or pull from .env:
const API_URL = "http://localhost:4000";

const TaskForm: React.FC = () => {
  const [name, setName] = useState("");
  const [type, setType] = useState<"one-time" | "recurring">("one-time");
  const [cronExpression, setCronExpression] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/tasks`, {
        name,
        type,
        // If it's recurring, send cronExpression. If one-time, send scheduledTime.
        cronExpression: type === "recurring" ? cronExpression : undefined,
        scheduledTime: type === "one-time" ? scheduledTime : undefined,
      });
      // Reset the form fields
      setName("");
      setCronExpression("");
      setScheduledTime("");
    } catch (err) {
      console.error("Error creating task:", err);
    }
  };

  return (
    <div>
      <h2>Create a Task</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Task Name: </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label>Task Type: </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "one-time" | "recurring")}
          >
            <option value="one-time">One-Time</option>
            <option value="recurring">Recurring</option>
          </select>
        </div>

        {type === "recurring" && (
          <div>
            <label>Cron Expression: </label>
            <input
              type="text"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              placeholder="e.g. */10 * * * * *"
            />
          </div>
        )}

        {type === "one-time" && (
          <div>
            <label>Scheduled Time: </label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>
        )}

        <button type="submit">Add Task</button>
      </form>
    </div>
  );
};

export default TaskForm;
