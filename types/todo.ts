export type TodoPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Todo {
  id: number;
  title: string;
  description: string | null;
  priority: TodoPriority;
  completed: boolean;
  completedAt: string | null;
  dueDate: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  priority?: TodoPriority;
  dueDate?: string;
  tags?: string[];
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  priority?: TodoPriority;
  dueDate?: string;
  tags?: string[];
}
