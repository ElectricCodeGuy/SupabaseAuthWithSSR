import { createClient } from '@/lib/server/server';
import Sidebar from './SideBar';
import { cookies } from 'next/headers'; // Import the cookies function from next/headers

export default async function NavBar() {
  const cookieStore = cookies(); // Initialize cookieStore using cookies function
  const supabase = createClient(cookieStore); // Pass cookieStore as an argument

  // Extract the session data from the data field of the returned object
  const { data } = await supabase.auth.getSession();
  const session = data?.session || null;

  // Console logging the session data
  console.log('Session data:', session);

  return <Sidebar session={session} />;
}
