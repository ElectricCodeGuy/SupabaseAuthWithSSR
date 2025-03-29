// app/chat/[chatId]/layout.tsx
import React from 'react';
import ChatHistoryDrawer from './components/UserCharListDrawer';
import { fetchUserDataAndChatSessions } from './fetch';

export default async function Layout(props: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex' }}>
      <ChatHistoryDrawer userChatPromise={fetchUserDataAndChatSessions()} />
      {props.children}
    </div>
  );
}
