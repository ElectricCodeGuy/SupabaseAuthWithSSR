import { type Metadata } from 'next';
import SettingsConversations from './components/SettingsConversations';

export const metadata: Metadata = {
  title: 'Conversations - Chat settings'
};

export default function ChatConversationsSettingsPage() {
  return <SettingsConversations />;
}
