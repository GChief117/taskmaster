import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

// Task interfaces
interface Task {
  id: string;
  name: string;
  type: string;
  cron_expression?: string;
  scheduledtime?: string;
}

interface ExecutedTask {
  id: string;
  name: string;
  type: string;
  cron_expression?: string;
  executed_at: string;
}

const App: React.FC = () => {
  // State for tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [executedTasks, setExecutedTasks] = useState<ExecutedTask[]>([]);

  // State for input fields
  const [name, setName] = useState("");
  const [type, setType] = useState("Recurring");
  const [cron_expression, setcron_expression] = useState("");
  const [scheduledtime, setscheduledtime] = useState("");

  // State for editing tasks
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Fetch tasks on load and poll executed tasks
  useEffect(() => {
    fetchTasks();
    fetchExecutedTasks();
    const interval = setInterval(fetchExecutedTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Fetches scheduled tasks from the backend.
   */
  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks`);
      const formattedTasks = response.data.map(task => ({
        ...task,
        scheduledtime: task.scheduledtime 
          ? new Date(task.scheduledtime).toLocaleString()
          : "No Date Set"
      }));
      setTasks(formattedTasks);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    }
  };

  /**
   * Fetches executed tasks from the backend.
   */
  const fetchExecutedTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/executed-tasks`);
      const formattedExecutedTasks = response.data.map(task => ({
        ...task,
        executed_at: new Date(task.executed_at).toLocaleString()
      }));
      setExecutedTasks(formattedExecutedTasks);
    } catch (error) {
      console.error("Failed to fetch executed tasks", error);
    }
  };

  /**
   * Adds or updates a task.
   */
  const saveTask = async () => {
    try {
      if (editingTask) {
        // Update existing task
        await axios.put(`${API_URL}/tasks/${editingTask.id}`, { name, type, cron_expression, scheduledtime });
      } else {
        // Add new task
        await axios.post(`${API_URL}/tasks`, { name, type, cron_expression, scheduledtime });
      }
      fetchTasks();
      resetForm();
    } catch (error) {
      console.error("Failed to save task", error);
    }
  };

  /**
   * Deletes a scheduled task.
   */
  const deleteTask = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/tasks/${id}`);
      setTasks(tasks.filter(task => task.id !== id));
    } catch (error) {
      console.error("Failed to delete task", error);
    }
  };

  /**
   * Deletes an executed task.
   */
  const deleteExecutedTask = async (id: string) => {
    try {
        const response = await axios.delete(`${API_URL}/executed-tasks/${id}`);
        if (response.data.success) {
            setExecutedTasks(executedTasks.filter(task => task.id !== id));
        }
    } catch (error) {
        console.error("Failed to delete executed task", error);
    }
  };


  /**
   * Populates form fields with task data for editing.
   */
  const editTask = (task: Task) => {
    setEditingTask(task);
    setName(task.name);
    setType(task.type);
    setcron_expression(task.cron_expression || "");
    setscheduledtime(task.scheduledtime || "");
  };

  /**
   * Resets form fields after task is added or edited.
   */
  const resetForm = () => {
    setEditingTask(null);
    setName("");
    setType("Recurring");
    setcron_expression("");
    setscheduledtime("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "Arial, sans-serif", marginTop: "40px" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>Taskmaster</h1>
      
      {/* Task Creation Section */}
      <h2 style={{ fontSize: "1.5rem", marginTop: "10px" }}>{editingTask ? "Edit Task" : "Create a Task"}</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "320px", backgroundColor: "#f9f9f9", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
        <input placeholder="Task Name" value={name} onChange={(e) => setName(e.target.value)} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} />
        
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}>
          <option value="Recurring">Recurring</option>
          <option value="One-Time">One-Time</option>
        </select>

{type === "Recurring" && (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    <input 
      placeholder="Cron Expression (e.g., */10 * * * *)" 
      value={cron_expression} 
      onChange={(e) => setcron_expression(e.target.value)} 
      style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
    />
    
    {/* 📌 Cron Syntax Description with Link */}
    <small style={{ fontSize: "12px", color: "#666", marginTop: "5px", textAlign: "center" }}>
      ⚡ A Cron Expression defines a schedule for recurring tasks.<br />
      Example:  
      <b>*/10 * * * *</b> → Runs every 10 minutes <br />
      <b>0 12 * * 1</b> → Runs every Monday at 12:00 PM <br />
      <b>0 9 * * *</b> → Runs daily at 9:00 AM <br />
      <br />
      📖 <a href="https://crontab.guru/" target="_blank" rel="noopener noreferrer">
        Learn more about Cron expressions
      </a>
    </small>
  </div>
)}

        <input type="datetime-local" step="1" value={scheduledtime} onChange={(e) => setscheduledtime(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }} />

        <button onClick={saveTask} style={{ padding: "10px", backgroundColor: "blue", color: "white", fontWeight: "bold", borderRadius: "5px", cursor: "pointer" }}>
          {editingTask ? "Update Task" : "Add Task"}
        </button>
      </div>

      {/* Scheduled Tasks Section */}
      <h2 style={{ fontSize: "1.5rem", marginTop: "20px" }}>Scheduled Tasks</h2>
      <ul style={{ listStyle: "none", padding: 0, width: "350px" }}>
        {tasks.map(task => (
          <li key={task.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: "10px", borderRadius: "5px", marginBottom: "10px" }}>
            <span><strong>{task.name}</strong> ({task.type}) 📅 {task.scheduledtime}</span>
            <div>
              <button onClick={() => editTask(task)} style={{ padding: "5px 10px", backgroundColor: "orange", marginRight: "5px" }}>Edit</button>
              <button onClick={() => deleteTask(task.id)} style={{ padding: "5px 10px", backgroundColor: "red" }}>Delete</button>
            </div>
          </li>
        ))}
      </ul>

      {/* Executed Tasks Section */}
      <h2 style={{ fontSize: "1.5rem", marginTop: "20px" }}>Executed Tasks</h2>
      <ul style={{ listStyle: "none", padding: 0, width: "350px" }}>
        {executedTasks.map(task => (
          <li key={task.id} style={{ backgroundColor: "#e8f5e9", padding: "10px", borderRadius: "5px", marginBottom: "10px" }}>
            ✅ <strong>{task.name}</strong> executed at {task.executed_at}
            <button onClick={() => deleteExecutedTask(task.id)} style={{ marginLeft: "10px", backgroundColor: "red" }}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
