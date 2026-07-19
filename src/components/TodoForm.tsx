import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTodoById, createTodo, updateTodo } from '../api/todos';
import { CreateTodoRequest, UpdateTodoRequest, TodoPriority } from '../types/todo';
import './TodoForm.css';

function TodoForm() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      setLoading(true);
      getTodoById(Number(id))
        .then((todo) => {
          setTitle(todo.title);
          setDescription(todo.description || '');
          setPriority(todo.priority);
          setDueDate(todo.dueDate ? todo.dueDate.slice(0, 16) : '');
          setTagsInput(todo.tags.join(', '));
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
        .finally(() => setLoading(false));
    }
  }, [id, isEditMode]);

  const parseTags = (input: string): string[] => {
    return input.split(',').map(t => t.trim()).filter(t => t.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const tags = parseTags(tagsInput);

    try {
      if (isEditMode && id) {
        const data: UpdateTodoRequest = { title, description, priority, tags };
        if (dueDate) data.dueDate = dueDate + ':00';
        await updateTodo(Number(id), data);
      } else {
        const data: CreateTodoRequest = { title, description, priority, tags };
        if (dueDate) data.dueDate = dueDate + ':00';
        await createTodo(data);
      }
      navigate('/todos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2>{isEditMode ? 'Edit Todo' : 'New Todo'}</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="todo-form">
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={3} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value as TodoPriority)}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="dueDate">Due Date</label>
            <input id="dueDate" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input id="tags" type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="work, urgent, personal" />
        </div>
        <div className="form-actions">
          <button type="submit">{isEditMode ? 'Update' : 'Create'}</button>
          <button type="button" onClick={() => navigate('/todos')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default TodoForm;
