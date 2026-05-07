import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">
          View query trends and identify policy gaps
        </p>
      </div>

      {/* Empty State */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No analytics data yet</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Analytics will appear here once employees start querying your policy documents.
            You'll see aggregated trends without individual employee identities.
          </p>
        </CardContent>
      </Card>

      {/* TODO: Analytics dashboard will go here */}
      {/* Features to implement:
        - Most queried topics (aggregated from DynamoDB Streams)
        - Query volume over time (daily/weekly/monthly)
        - Identified policy gaps (topics with "Not addressed" responses)
        - Response confidence scores
        - Document coverage analysis
        - Trending concerns
        - Suggested policy improvements
      */}
    </div>
  );
}
