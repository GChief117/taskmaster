export interface Task {
  id: string;
  name: string;
  type: "one-time" | "recurring";
  cronExpression?: string; // for recurring tasks
  scheduledTime?: string;  // ISO datetime for one-time tasks
  createdAt: string;
}

export interface TaskLog {
  taskId: string;
  executedAt: string; // when the task was executed
}
