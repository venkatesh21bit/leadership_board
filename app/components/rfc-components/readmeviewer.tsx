'use client';

import { Button } from '@/app/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { File, FileText, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ReadmeViewerProps {
  owner: string;
  repoName: string;
  pdfLink?: string;
}

const ReadmeViewer = ({ owner, repoName, pdfLink }: ReadmeViewerProps) => {
  const [readmeContent, setReadmeContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReadme() {
      setLoading(true);
      setError(null);
      try {
        const rawResponse = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repoName}/main/README.md`,
        );

        if (rawResponse.ok) {
          const content = await rawResponse.text();
          setReadmeContent(content);
          setLoading(false);
          return;
        }

        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/readme`,
          {
            headers: {
              Accept: 'application/vnd.github.v3+json',
            },
          },
        );

        if (!response.ok) {
          throw new Error(`GitHub API error! Status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.content) {
          throw new Error('No content found in README');
        }

        const content = atob(data.content.replace(/\s/g, ''));
        setReadmeContent(content);
      } catch (error) {
        setError(
          `Failed to load README: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      } finally {
        setLoading(false);
      }
    }

    fetchReadme();
  }, [owner, repoName]);

  if (loading) {
    return (
      <Card className="bg-white/20 backdrop-blur-md border border-white/30 shadow-sm h-full">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Loader2 className="mb-2 h-8 w-8 text-gray-600 animate-spin" />
          <p className="text-gray-600">Loading README...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/20 backdrop-blur-md border border-white/30 shadow-sm h-full">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <p className="text-red-600 mb-4 font-semibold">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="flex cursor-pointer transform items-center justify-between rounded-3xl bg-gray-800 px-4 py-2 text-sm font-medium w-fit sm:font-semibold text-white shadow-lg transition duration-300 ease-in-out hover:scale-105 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/20 backdrop-blur-md border border-white/30 shadow-sm h-full flex flex-col">
      <CardContent className="flex-1 flex flex-col bg-accent rounded-xl p-4">
        {pdfLink && (
          <div className="mt-4 mb-16 flex flex-col items-start">
            <p className="text-gray-800 mb-2">
              Additional project details are available in the PDF document.
            </p>
            <Button
              asChild
              className="flex cursor-pointer transform items-center justify-between rounded-3xl bg-gray-800 px-4 py-2 text-sm font-medium w-fit sm:font-semibold text-white shadow-lg transition duration-300 ease-in-out hover:scale-105 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <a
                href={pdfLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <File className="mr-2 h-5 w-5" />
                View Project PDF
              </a>
            </Button>
          </div>
        )}
        <div className="prose prose-lg max-w-none flex-1 overflow-y-auto bg-accent/40 prose-a:text-blue-600 prose-a:hover:text-blue-500 prose-a:font-semibold prose-li:text-gray-800 prose-li:font-medium prose-blockquote:text-gray-600 prose-blockquote:border-l-gray-400">
          {readmeContent ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {readmeContent}
            </ReactMarkdown>
          ) : (
            <div className="text-center text-gray-600">
              <FileText className="mx-auto mb-2 h-8 w-8 text-gray-600" />
              <p>No README content available.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReadmeViewer;
