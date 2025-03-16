import React from 'react';
import Image from 'next/image';
import ChikenImage from '@/public/images/chiken image.jpg';
import { Card, CardContent } from '@/components/ui/card';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'HR Manager',
    avatar: ChikenImage,
    content:
      "The AI integration has revolutionized our HR processes. We're now able to handle employee queries more efficiently than ever before."
  },
  {
    name: 'Michael Chen',
    role: 'Financial Analyst',
    avatar: ChikenImage,
    content:
      "The real-time updates feature has been a game-changer for our financial forecasting. We're always working with the most current data."
  },
  {
    name: 'Emily Rodriguez',
    role: 'Operations Director',
    avatar: ChikenImage,
    content:
      "The deep insights provided by this platform have helped us identify and resolve operational bottlenecks we didn't even know existed."
  },
  {
    name: 'David Kim',
    role: 'Compliance Officer',
    avatar: ChikenImage,
    content:
      "Having all our guidelines and protocols in one place has significantly improved our compliance rates. It's user-friendly"
  },
  {
    name: 'Lisa Patel',
    role: 'Team Lead',
    avatar: ChikenImage,
    content:
      "The absence management features have streamlined our leave approval process. It's made my job as a team lead much easier."
  },
  {
    name: 'Robert Taylor',
    role: 'CFO',
    avatar: ChikenImage,
    content:
      "The financial information section is comprehensive and well-organized. It's become an indispensable tool for our finance department."
  }
];

const Testimonials: React.FC = () => {
  return (
    <div id="testimonials" className="max-w-[1800px] mx-auto mt-2 mb-4 px-1">
      <h3 className="text-center font-bold font-mono tracking-widest text-primary pb-2 text-3xl">
        What Our Users Say
      </h3>
      <p className="text-center font-bold max-w-[800px] mx-auto font-mono tracking-wider pb-2 text-foreground/90">
        Real Experiences from Satisfied Customers
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 items-stretch">
        {testimonials.map((testimonial, index) => (
          <Card
            key={index}
            className="h-full shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <p className="text-muted-foreground mb-4 flex-grow">
                &ldquo;{testimonial.content}&rdquo;
              </p>
              <div className="flex items-center mt-2">
                <Image
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="object-contain w-[100px] h-[100px]"
                />
                <div className="ml-4">
                  <p className="font-bold text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Testimonials;
