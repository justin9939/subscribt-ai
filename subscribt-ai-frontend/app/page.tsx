import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to employee query interface (default persona)
  redirect('/query');
}
