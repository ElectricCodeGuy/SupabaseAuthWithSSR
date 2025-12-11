import { Suspense } from 'react';
import { fetchUserFilesData } from './fetch';
import { FileManager } from './components/FileManager';
import { DocumentViewer } from './components/DocumentViewer';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getSession } from '@/lib/server/supabase';
import { createAdminClient } from '@/lib/server/admin';
import { decodeBase64 } from '@/utils/base64';
import { Loader } from 'lucide-react';

async function DocumentPreview({ encodedTitle }: { encodedTitle: string }) {
  const session = await getSession();
  const userId = session?.sub;

  let signedUrl: string | null = null;
  let decodedTitle: string | null = null;

  if (userId && encodedTitle) {
    try {
      const supabase = createAdminClient();
      // The file is stored as userId/base64EncodedTitle
      const filePath = `${userId}/${encodedTitle}`;
      decodedTitle = decodeBase64(encodedTitle);

      const { data, error } = await supabase.storage
        .from('userfiles')
        .createSignedUrl(filePath, 3600);

      if (!error && data) {
        signedUrl = data.signedUrl;
      }
    } catch (error) {
      console.error('Error creating signed URL:', error);
    }
  }

  return <DocumentViewer fileName={decodedTitle} signedUrl={signedUrl} />;
}

function PreviewLoading() {
  return (
    <div className="flex-1 border rounded-lg bg-card flex items-center justify-center">
      <Loader className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

interface PageProps {
  searchParams: Promise<{ doc?: string; page?: string }>;
}

export default async function FilerPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await fetchUserFilesData();

  if (!data) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Du skal være logget ind for at se denne side
            </p>
            <Button asChild className="mt-4">
              <Link href="/login">Log ind</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedDoc = params.doc || null;
  const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1);

  return (
    <div className="flex h-screen gap-4">
      <FileManager
        documents={data.userDocuments}
        selectedDocFileName={selectedDoc}
        currentPage={currentPage}
      />

      {selectedDoc ? (
        <Suspense fallback={<PreviewLoading />}>
          <DocumentPreview encodedTitle={selectedDoc} />
        </Suspense>
      ) : (
        <DocumentViewer fileName={null} signedUrl={null} />
      )}
    </div>
  );
}
