import { redirect } from 'next/navigation';

export default function HomePage() {
  // Keep the docs site focused: `/` becomes the docs root.
  redirect('/docs');
}
