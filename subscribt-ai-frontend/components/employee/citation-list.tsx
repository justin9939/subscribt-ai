'use client';

/**
 * Citation list component
 * Displays source citations with expandable details
 */

import { useState } from 'react';
import { Citation } from '@/types/query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CitationListProps {
  citations: Citation[];
}

export function CitationList({ citations }: CitationListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (citations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <FileText className="h-4 w-4" />
        <span>
          {citations.length} {citations.length === 1 ? 'Source' : 'Sources'}
        </span>
      </div>

      <div className="space-y-2">
        {citations.map((citation, index) => {
          const isExpanded = expandedIds.has(citation.id);

          return (
            <Card
              key={citation.id}
              className="border-l-4 border-l-primary/50 shadow-sm"
            >
              <CardHeader className="p-3 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium">
                      [{index + 1}] {citation.sectionHeading}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>Page {citation.pageNumber}</span>
                      <span>•</span>
                      <span
                        className="truncate"
                        title={citation.hierarchyPath}
                      >
                        {citation.hierarchyPath}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(citation.id)}
                    className="flex-shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="p-3 pt-0">
                  <div className="space-y-3">
                    {/* Snippet */}
                    <div className="bg-muted/50 rounded-md p-3 text-sm">
                      <p className="text-muted-foreground italic leading-relaxed">
                        &ldquo;{citation.snippet}&rdquo;
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>Relevance:</span>
                        <div className="flex items-center gap-1">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full transition-all',
                                citation.relevanceScore >= 0.8
                                  ? 'bg-green-500'
                                  : citation.relevanceScore >= 0.6
                                  ? 'bg-yellow-500'
                                  : 'bg-orange-500'
                              )}
                              style={{
                                width: `${citation.relevanceScore * 100}%`,
                              }}
                            />
                          </div>
                          <span className="font-medium">
                            {Math.round(citation.relevanceScore * 100)}%
                          </span>
                        </div>
                      </div>

                      {/* View Document Link (placeholder) */}
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => {
                          // TODO: Implement document viewer
                          console.log('View document:', citation.documentId);
                        }}
                      >
                        View in document
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
