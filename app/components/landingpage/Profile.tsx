import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Linkedin, Github } from 'lucide-react';
import ChikenImage from '@/public/images/chiken image.jpg';

const UserProfileComponent = () => {
  return (
    <Card className="max-w-[1800px] mx-auto my-4 shadow-md">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="flex flex-col items-center md:col-span-4">
            <Image
              src={ChikenImage}
              alt="Support"
              height={140}
              width={140}
              className="rounded-full"
            />

            <h4 className="text-primary mt-4 mb-2 font-bold text-2xl">
              DevOps
            </h4>

            <div className="flex gap-4 mb-3 justify-center">
              <Link
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                <Linkedin className="h-8 w-8" />
              </Link>
              <Link
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                <Github className="h-8 w-8" />
              </Link>
            </div>
          </div>

          <div className="md:col-span-8">
            <h5 className="text-primary mb-2 font-bold text-xl">About Me</h5>
            <p className="text-muted-foreground mb-6">
              Based in a vibrant tech hub, we are a team of developers
              passionate about integrating AI into data management solutions.
              Our ongoing project is an innovative chatbot designed to
              streamline the flow of information for users across various
              platforms. Additionally, we are in the process of developing a
              knowledge-based vector database. This database integrates
              cutting-edge technologies from leading AI and database providers.
              With this tool, we aim to revolutionize the way data is accessed,
              making searches faster and more relevant.
            </p>

            <h6 className="text-primary mb-2 font-bold text-lg">Skills</h6>
            <div className="flex flex-wrap gap-2">
              {[
                'Data Management with AI',
                'ChatBot Development',
                'Database Development',
                'JavaScript/TypeScript',
                'PostgreSQL and SQL',
                'PineCone Vector Database',
                'Supabase Development',
                'Embeddings',
                'OpenAI',
                'Python',
                'React',
                'Next.js',
                'HuggingFace'
              ].map((skill, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-primary border-primary hover:bg-primary/10 transition-colors"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfileComponent;
