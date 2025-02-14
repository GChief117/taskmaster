import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";

const API_URL = "http://localhost:4000";

interface Task {
  id: string;
  name: string;
  type: "one-time" | "recurring";
  cronExpression?: string;
  scheduledTime?: string;
  createdAt: string;
}

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get<Task[]>(`${API_URL}/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await axios.delete(`${API_URL}/tasks/${taskId}`);
      fetchTasks(); // refresh list after deletion
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div>
      <h2>Scheduled Tasks</h2>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <strong>{task.name}</strong> ({task.type})  
            {task.type === "recurring" && task.cronExpression && (
              <> — Cron: {task.cronExpression}</>
            )}
            {task.type === "one-time" && task.scheduledTime && (
              <> — Scheduled: {task.scheduledTime}</>
            )}
            <div>Created: {dayjs(task.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
            <button onClick={() => handleDelete(task.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskList;
