import React from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';

const ChatPageSkeleton: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Main chat area */}
      <Box
        sx={{
          flexGrow: 1,
          p: 2,
          overflow: 'auto',
          width: 'calc(100% - 360px)'
        }}
      >
        {' '}
        {/* Adjust width to exclude chat list area */}
        {/* Message skeletons */}
        <List>
          {Array.from(new Array(5)).map((_, index) => (
            <ListItem key={index}>
              <Skeleton
                variant="rectangular"
                width="70%"
                height={60}
                sx={{ borderRadius: '16px', mb: 1 }}
              />
            </ListItem>
          ))}
        </List>
        {/* Chat input field skeleton */}
        <Box sx={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
          <Skeleton
            variant="rectangular"
            height={50}
            sx={{ borderRadius: '24px' }}
          />
        </Box>
      </Box>

      {/* Chat list area - moved to the side */}
      <Box
        sx={{
          width: 360,
          p: 2,
          borderLeft: '1px solid #e0e0e0',
          overflow: 'auto'
        }}
      >
        {/* Chat list item skeletons */}
        {Array.from(new Array(10)).map((_, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Skeleton
              variant="rectangular"
              height={70}
              sx={{ borderRadius: '16px' }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ChatPageSkeleton;
