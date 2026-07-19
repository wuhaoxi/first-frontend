import { Routes, Route, Link } from 'react-router-dom'
import UserList from './components/UserList'
import UserForm from './components/UserForm'
import TodoList from './components/TodoList'
import TodoForm from './components/TodoForm'
import './App.css'

function App() {
  return (
    <div className="app">
      <header>
        <h1>My App</h1>
      </header>
      <nav>
        <Link to="/">Users</Link>
        <span className="nav-sep"> | </span>
        <Link to="/todos">Todos</Link>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<UserList />} />
          <Route path="/users/new" element={<UserForm />} />
          <Route path="/users/:id/edit" element={<UserForm />} />
          <Route path="/todos" element={<TodoList />} />
          <Route path="/todos/new" element={<TodoForm />} />
          <Route path="/todos/:id/edit" element={<TodoForm />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
