import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";

const API_URL = "http://localhost:4000";

interface TaskLog {
  taskId: string;
  executedAt: string;
}

const TaskLogs: React.FC = () => {
  const [logs, setLogs] = useState<TaskLog[]>([]);

  const fetchLogs = async () => {
    try {
      const response = await axios.get<TaskLog[]>(`${API_URL}/logs`);
      setLogs(response.data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Optional: poll every 5 seconds for new logs
    const interval = setInterval(() => {
      fetchLogs();
    }, 5000);
    // Cleanup when component unmounts
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>Execution Logs</h2>
      <ul>
        {logs.map((log, index) => (
          <li key={index}>
            Task ID: {log.taskId}, Executed At:{" "}
            {dayjs(log.executedAt).format("YYYY-MM-DD HH:mm:ss")}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskLogs;
