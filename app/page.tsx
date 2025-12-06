import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to public tools page for now
  // Will add logic to redirect to dashboard if authenticated
  redirect('/tools');
}
