'use client';

import { PostForm } from '@/components/PostForm';

export default function EditPostPage({ params }: { params: { id: string } }) {
  return <PostForm id={params.id} />;
}
