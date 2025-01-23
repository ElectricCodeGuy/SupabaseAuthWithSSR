import React from 'react';
import { Stack, Typography } from '@mui/material';
import {
  GavelRounded as GavelRoundedIcon,
  SearchRounded as SearchRoundedIcon,
  ChatRounded as ChatRoundedIcon,
  CardGiftcardRounded as CardGiftcardRoundedIcon
} from '@mui/icons-material';

const items = [
  {
    icon: <GavelRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Feature 1',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nulla sit amet aliquam lacinia, nisl nisl aliquam nisl, nec aliquam nisl nisl sit amet nisl.'
  },
  {
    icon: <SearchRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Feature 2',
    description:
      'Praesent et eros eu felis eleifend egestas. Nullam at dolor quis ante porta tincidunt. Sed euismod, nulla sit amet aliquam lacinia, nisl nisl aliquam nisl.'
  },
  {
    icon: <ChatRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Feature 3',
    description:
      'Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Sed euismod, nulla sit amet aliquam lacinia, nisl nisl aliquam nisl.'
  },
  {
    icon: <CardGiftcardRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Free Trial',
    description:
      'Ut ornare lectus sit amet est placerat, nec elementum arcu dignissim. Sed euismod, nulla sit amet aliquam lacinia, nisl nisl aliquam nisl, nec aliquam nisl nisl sit amet nisl.'
  }
];

export default function Content() {
  return (
    <Stack
      sx={{
        flexDirection: 'column',
        alignSelf: 'center',
        gap: 4,
        maxWidth: 450
      }}
    >
      {items.map((item, index) => (
        <Stack
          key={index}
          direction="row"
          sx={{
            gap: 2
          }}
        >
          {item.icon}
          <div>
            <Typography
              gutterBottom
              sx={{
                fontWeight: 'medium'
              }}
            >
              {item.title}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary'
              }}
            >
              {item.description}
            </Typography>
          </div>
        </Stack>
      ))}
    </Stack>
  );
}
