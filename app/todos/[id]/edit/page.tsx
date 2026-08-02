'use client';

import TodoForm from '@/components/TodoForm';

export default function EditTodoPage({ params }: { params: { id: string } }) {
  return <TodoForm id={params.id} />;
}
