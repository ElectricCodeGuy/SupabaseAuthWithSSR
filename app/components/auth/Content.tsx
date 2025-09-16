import React from 'react';
import { Gavel, Search, MessageCircle, Gift } from 'lucide-react';

const items = [
  {
    icon: <Gavel className="h-5 w-5 text-muted-foreground" />,
    title: 'Feature 1',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nulla sit amet aliquam lacinia, nisl nisl aliquam nisl, nec aliquam nisl nisl sit amet nisl.'
  },
  {
    icon: <Search className="h-5 w-5 text-muted-foreground" />,
    title: 'Feature 2',
    description:
      'Praesent et eros eu felis eleifend egestas. Nullam at dolor quis ante porta tincidunt. Sed euismod, nulla sit amet aliquam lacinia, nisl nisl aliquam nisl.'
  },
  {
    icon: <MessageCircle className="h-5 w-5 text-muted-foreground" />,
    title: 'Feature 3',
    description:
      'Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Sed euismod, nulla sit amet aliquam lacinia, nisl nisl aliquam nisl.'
  },
  {
    icon: <Gift className="h-5 w-5 text-muted-foreground" />,
    title: 'Free Trial',
    description:
      'Ut ornare lectus sit amet est placerat, nec elementum arcu dignissim. Sed euismod, nulla sit amet aliquam lacinia, nisl nisl aliquam nisl, nec aliquam nisl nisl sit amet nisl.'
  }
];

export default function Content() {
  return (
    <div className="flex flex-col self-center gap-8 max-w-[450px]">
      {items.map((item, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
          <div>
            <h3 className="font-medium mb-1.5">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
