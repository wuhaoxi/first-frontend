import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserById, createUser, updateUser } from '../api/users';
import { CreateUserRequest, UpdateUserRequest } from '../types/user';
import './UserForm.css';

function UserForm() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      setLoading(true);
      getUserById(Number(id))
        .then((user) => {
          setName(user.name);
          setEmail(user.email);
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load user'))
        .finally(() => setLoading(false));
    }
  }, [id, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isEditMode && id) {
        const data: UpdateUserRequest = { name, email };
        await updateUser(Number(id), data);
      } else {
        const data: CreateUserRequest = { name, email };
        await createUser(data);
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2>{isEditMode ? 'Edit User' : 'New User'}</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="user-form">
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-actions">
          <button type="submit">{isEditMode ? 'Update' : 'Create'}</button>
          <button type="button" onClick={() => navigate('/')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default UserForm;
