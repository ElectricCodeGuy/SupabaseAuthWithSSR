import Sidebar from './SideBar';
import { getSession } from '@/lib/server/supabase'; // Import getSession

export default async function NavBar() {
  const session = await getSession(); // Get session

  const isSessionAvailable = session !== null; // Check if session is available
  return <Sidebar session={isSessionAvailable} />;
}
