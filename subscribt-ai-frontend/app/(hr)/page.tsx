import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function HRDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Policy Dashboard</h1>
        <p className="text-muted-foreground">
          Manage policy documents, analyze queries, and identify compliance gaps.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Upload className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Upload Documents</CardTitle>
            <CardDescription>
              Add new policy documents, codes of conduct, or workplace rights materials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/hr/upload">Upload New Document</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <FileText className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Manage Documents</CardTitle>
            <CardDescription>
              View, update, or remove existing policy documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/hr/documents">View Documents</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <TrendingUp className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Analytics</CardTitle>
            <CardDescription>
              View query trends and identify policy gaps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/hr/analytics">View Analytics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Documents</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Processing</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Queries This Week</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Identified Gaps</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Follow these steps to set up your policy knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="font-semibold mb-1">Upload Policy Documents</h3>
              <p className="text-sm text-muted-foreground">
                Start by uploading your organization's policy documents, codes of conduct, 
                and workplace rights materials. Documents will be automatically processed and indexed.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="font-semibold mb-1">Share Access with Employees</h3>
              <p className="text-sm text-muted-foreground">
                Once documents are processed, employees can query them through the employee portal 
                to understand their rights and obligations.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="font-semibold mb-1">Monitor and Analyze</h3>
              <p className="text-sm text-muted-foreground">
                Review query trends and analytics to identify policy gaps and areas where 
                employees need more clarity.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <CardTitle className="text-amber-900 dark:text-amber-100">
              Important Notes
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-amber-900 dark:text-amber-100">
          <p>
            <strong>Processing Time:</strong> Large documents may take several minutes to process. 
            You'll be notified when processing is complete.
          </p>
          <p>
            <strong>Privacy:</strong> Individual employee queries are anonymized. You can see 
            aggregated trends but not specific queries or employee identities.
          </p>
          <p>
            <strong>Accuracy:</strong> All AI responses are grounded in your uploaded documents. 
            If information isn't in the policy, the system will explicitly state that.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
