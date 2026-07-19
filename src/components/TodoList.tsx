import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTodos, toggleTodo, deleteTodo } from '../api/todos';
import { Todo } from '../types/todo';
import './TodoList.css';

function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchTodos = async (status?: string) => {
    try {
      setLoading(true);
      const data = await getTodos(status || undefined);
      setTodos(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos(statusFilter);
  }, [statusFilter]);

  const handleToggle = async (id: number) => {
    try {
      await toggleTodo(id);
      fetchTodos(statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this todo?')) return;
    try {
      await deleteTodo(id);
      fetchTodos(statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const priorityClass = (p: string) => `priority-${p.toLowerCase()}`;

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div className="todo-list-header">
        <h2>Todos</h2>
        <Link to="/todos/new" className="btn-primary">New Todo</Link>
      </div>

      <div className="filter-tabs">
        <button className={!statusFilter ? 'active' : ''} onClick={() => setStatusFilter('')}>All</button>
        <button className={statusFilter === 'active' ? 'active' : ''} onClick={() => setStatusFilter('active')}>Active</button>
        <button className={statusFilter === 'completed' ? 'active' : ''} onClick={() => setStatusFilter('completed')}>Completed</button>
      </div>

      {error && <p className="error">{error}</p>}

      {todos.length === 0 ? (
        <p>No todos. <Link to="/todos/new">Create one</Link></p>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggle(todo.id)}
              />
              <div className="todo-content">
                <span className="todo-title">{todo.title}</span>
                <span className={`priority-badge ${priorityClass(todo.priority)}`}>{todo.priority}</span>
                {todo.tags.length > 0 && (
                  <span className="todo-tags">{todo.tags.map(t => `#${t}`).join(' ')}</span>
                )}
                {todo.dueDate && <span className="todo-due">Due: {todo.dueDate.slice(0, 16)}</span>}
              </div>
              <div className="todo-actions">
                <button onClick={() => navigate(`/todos/${todo.id}/edit`)}>Edit</button>
                <button className="danger" onClick={() => handleDelete(todo.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TodoList;
