/**
 * Employee query page
 * Main interface for employees to query policy documents
 */

import { QueryInterface } from '@/components/employee/query-interface';

export default function QueryPage() {
  return (
    <div className="h-screen flex flex-col">
      <QueryInterface />
    </div>
  );
}
