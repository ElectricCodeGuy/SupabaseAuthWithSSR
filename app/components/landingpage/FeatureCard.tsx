import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const features = [
  {
    title: 'Advanced AI Integration',
    description:
      'Leverage state-of-the-art AI capabilities for enhanced NLP features and efficient data retrieval.',
    Icon: '🤖'
  },
  {
    title: 'Real-time Updates',
    description:
      'Stay informed with real-time data sourced from reputable sources, ensuring you have the most recent updates.',
    Icon: '🔄'
  },
  {
    title: 'Deep Insights',
    description:
      'Dive deep into the data, understanding intricate patterns and insights that can help drive informed decisions.',
    Icon: '📚'
  },
  {
    title: 'Guidelines & Protocols',
    description:
      'Stay informed about organizational structures, guidelines, and best practices to ensure smooth operations.',
    Icon: '🔐'
  },
  {
    title: 'Absence Policies',
    description:
      'Know the protocol for leaves, attendance, sick days, and other related matters for smooth workflow.',
    Icon: '📅'
  },
  {
    title: 'Financial Information',
    description: (
      <>
        Stay informed about financial regulations, provisions, and insights.
        Learn more at{' '}
        <Link
          href="#models"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 underline decoration-primary/30 hover:decoration-primary transition-colors"
        >
          Financial Info
        </Link>
        .
      </>
    ),
    Icon: '💰'
  }
];

export default function Component() {
  return (
    <div
      id="models"
      className="pt-1 sm:pt-2 md:pt-3 lg:pt-4 pb-1 sm:pb-2 md:pb-3 lg:pb-6 max-w-[1800px] mx-auto px-4"
    >
      <h2 className="text-center font-bold font-mono tracking-widest text-primary text-3xl mb-2">
        Discover Our Features
      </h2>
      <p className="font-bold text-center max-w-[800px] mx-auto font-mono tracking-wider mb-8 text-foreground/90">
        Harnessing Advanced AI for Better Insights and Efficient Operations
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card
            key={index}
            className="h-full min-h-[350px] flex flex-col shadow-md bg-card hover:shadow-lg transition-shadow duration-300"
          >
            <CardContent className="flex flex-col items-center justify-center text-center h-full p-6">
              <div className="text-5xl opacity-90 mb-4">{feature.Icon}</div>
              <h6 className="text-primary font-bold text-lg mb-2">
                {feature.title}
              </h6>
              <Separator className="w-1/2 my-2" />
              <div className="text-muted-foreground mt-4 text-sm">
                {feature.description}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
