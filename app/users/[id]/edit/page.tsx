'use client';

import UserForm from '@/components/UserForm';

export default function EditUserPage({ params }: { params: { id: string } }) {
  return <UserForm id={params.id} />;
}
