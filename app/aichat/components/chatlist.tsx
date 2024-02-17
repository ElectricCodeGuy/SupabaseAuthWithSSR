'use client';
import React, { useState } from 'react';
import Drawer from '@mui/material/Drawer';
import MuiLink from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { usePathname, useSearchParams } from 'next/navigation';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Backdrop from '@mui/material/Backdrop';
import { deleteChatData } from '../actions';

type ChatPreview = {
  id: string;
  firstMessage: string;
};

type ChatListProps = {
  userId: string;
  chatPreviews: ChatPreview[];
};

const ChatList: React.FC<ChatListProps> = ({ userId, chatPreviews }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const currentChatId = searchParams.get('chatId');

  const selectedStyle = {
    backgroundColor: theme.palette.action.selected,
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    borderRadius: '0 4px 4px 0'
  };
  const listItemButtonStyle = {
    fontSize: '0.9rem' // Set a smaller font size
    // ... other styles if needed
  };
  const drawerWidth = isMobile ? 160 : 210;

  const truncateMessage = (message: string, length: number) => {
    return message.length > length
      ? `${message.substring(0, length)}...`
      : message;
  };

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const isSelected = (id: string) => id === currentChatId;
  const createNewChatLink = () => {
    const dbValue = searchParams.get('db'); // Get 'db' parameter if it exists
    let link = `/aichat`;

    // Append 'db' parameter if it exists
    if (dbValue) {
      link += `&db=${dbValue}`;
    }

    return link;
  };

  return (
    <>
      {isMobile && !mobileDrawerOpen && (
        <Button
          onClick={() => setMobileDrawerOpen(true)}
          sx={{
            margin: 1,
            position: 'fixed',
            right: 0,
            top: 0,
            zIndex: theme.zIndex.drawer + 1
          }}
        >
          Open Chat List
        </Button>
      )}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileDrawerOpen : true}
        onClose={() => setMobileDrawerOpen(false)}
        anchor="right"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box'
          }
        }}
      >
        {isMobile && (
          <Button onClick={handleDrawerToggle}>
            {mobileDrawerOpen ? 'Close' : 'Open'} Chat List
          </Button>
        )}

        <ListItem
          key="newChat"
          disablePadding
          sx={{ width: '100%', padding: 0 }}
        >
          <MuiLink
            href={createNewChatLink()} // Use the function to create the link
            underline="none"
            sx={{ width: '100%', display: 'block' }}
          >
            <Button variant="outlined" fullWidth>
              New Chat
            </Button>
          </MuiLink>
        </ListItem>

        <List>
          {chatPreviews.map(({ id, firstMessage }) => (
            <Tooltip
              key={id}
              title={firstMessage || 'No messages yet'}
              placement="left"
              arrow
            >
              <ListItem disablePadding>
                <MuiLink
                  href={`${pathname}?chatId=${id}#firstMessage`}
                  underline="none"
                >
                  <ListItemButton
                    sx={{
                      ...(isSelected(id) ? selectedStyle : {}),
                      ...listItemButtonStyle
                    }}
                  >
                    {truncateMessage(firstMessage || `Chat ID: ${id}`, 16)}
                  </ListItemButton>
                </MuiLink>

                {isSelected(id) && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      deleteChatData(userId, id);
                    }}
                  >
                    <IconButton
                      type="submit"
                      size="small"
                      sx={{ padding: '4px' }}
                    >
                      <DeleteIcon fontSize="small" /> {/* Adjusted font size */}
                    </IconButton>
                  </form>
                )}
              </ListItem>
            </Tooltip>
          ))}
        </List>
      </Drawer>
      {isMobile && (
        <Backdrop
          open={mobileDrawerOpen}
          onClick={() => setMobileDrawerOpen(false)}
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer - 1 }}
        />
      )}
    </>
  );
};

export default ChatList;
