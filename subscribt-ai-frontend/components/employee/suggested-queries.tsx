'use client';

/**
 * Suggested queries component
 * Displays example queries to help users get started
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Clock, Shield, Users, FileQuestion, Briefcase } from 'lucide-react';

interface SuggestedQuery {
  id: string;
  text: string;
  category: string;
  icon: React.ReactNode;
}

const SUGGESTED_QUERIES: SuggestedQuery[] = [
  {
    id: 'pto',
    text: 'How many days of paid time off am I entitled to?',
    category: 'Time Off',
    icon: <Clock className="h-4 w-4" />,
  },
  {
    id: 'harassment',
    text: 'What should I do if I experience workplace harassment?',
    category: 'Workplace Safety',
    icon: <Shield className="h-4 w-4" />,
  },
  {
    id: 'remote',
    text: 'What is the company policy on remote work?',
    category: 'Work Arrangements',
    icon: <Briefcase className="h-4 w-4" />,
  },
  {
    id: 'discrimination',
    text: 'How does the company handle discrimination complaints?',
    category: 'Rights & Protections',
    icon: <Users className="h-4 w-4" />,
  },
  {
    id: 'benefits',
    text: 'What health insurance benefits are available to me?',
    category: 'Benefits',
    icon: <FileQuestion className="h-4 w-4" />,
  },
  {
    id: 'termination',
    text: 'What are the grounds for termination outlined in the policy?',
    category: 'Employment Terms',
    icon: <MessageSquare className="h-4 w-4" />,
  },
];

interface SuggestedQueriesProps {
  onSelectQuery: (query: string) => void;
}

export function SuggestedQueries({ onSelectQuery }: SuggestedQueriesProps) {
  return (
    <div className="space-y-4">
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">Welcome to Policy Assistant</CardTitle>
          <CardDescription>
            Ask questions about your workplace policies in plain language. All answers
            are grounded in your organization&apos;s official documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Try asking about:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {SUGGESTED_QUERIES.map((query) => (
                <Button
                  key={query.id}
                  variant="outline"
                  className="h-auto py-3 px-4 justify-start text-left"
                  onClick={() => onSelectQuery(query.text)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0 mt-0.5 text-primary">
                      {query.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium leading-tight">
                        {query.text}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {query.category}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-medium">Strict Grounding Guarantee</p>
              <p className="text-muted-foreground">
                Every answer is sourced directly from your organization&apos;s policy
                documents. If information isn&apos;t in the policy, you&apos;ll be told
                explicitly: <span className="italic">&ldquo;Not addressed in the provided policy.&rdquo;</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
