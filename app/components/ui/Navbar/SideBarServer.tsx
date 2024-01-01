import Sidebar from './SideBar';
import { getSession } from '@/lib/client/supabase'; // Import getSession

export default async function NavBar() {
  const session = await getSession(); // Get session

  // Console logging the session data
  console.log('Session data:', session);

  return <Sidebar session={session} />;
}
