/**
 * Citation Component Usage Example
 * 
 * This file demonstrates how to use the CitationList component
 * with realistic data examples.
 */

import { CitationList } from './citation-list';
import type { Citation } from '@/types/query';

/**
 * Example 1: Single Citation
 * Use case: Simple query with one relevant source
 */
export function SingleCitationExample() {
  const citations: Citation[] = [
    {
      id: 'cite-001',
      documentId: 'doc-employee-handbook-2024',
      chunkId: 'chunk-benefits-vacation',
      snippet: 'Employees are entitled to 15 days of paid vacation per year. Vacation time accrues monthly and must be requested at least 2 weeks in advance.',
      pageNumber: 12,
      sectionHeading: 'Vacation Policy',
      hierarchyPath: 'Employee Handbook > Benefits > Time Off',
      relevanceScore: 0.92
    }
  ];

  return (
    <div className="p-4 max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">Single Citation Example</h2>
      <CitationList citations={citations} />
    </div>
  );
}

/**
 * Example 2: Multiple Citations
 * Use case: Complex query requiring multiple sources
 */
export function MultipleCitationsExample() {
  const citations: Citation[] = [
    {
      id: 'cite-001',
      documentId: 'doc-employee-handbook-2024',
      chunkId: 'chunk-benefits-vacation',
      snippet: 'Employees are entitled to 15 days of paid vacation per year. Vacation time accrues monthly and must be requested at least 2 weeks in advance.',
      pageNumber: 12,
      sectionHeading: 'Vacation Policy',
      hierarchyPath: 'Employee Handbook > Benefits > Time Off',
      relevanceScore: 0.92
    },
    {
      id: 'cite-002',
      documentId: 'doc-employee-handbook-2024',
      chunkId: 'chunk-benefits-sick-leave',
      snippet: 'Full-time employees receive 10 days of paid sick leave annually. Sick leave does not roll over to the following year.',
      pageNumber: 15,
      sectionHeading: 'Sick Leave Entitlement',
      hierarchyPath: 'Employee Handbook > Benefits > Leave Policies',
      relevanceScore: 0.78
    },
    {
      id: 'cite-003',
      documentId: 'doc-employee-handbook-2024',
      chunkId: 'chunk-general-holidays',
      snippet: 'The company observes 10 federal holidays per year. Holiday schedules are published annually in January.',
      pageNumber: 8,
      sectionHeading: 'Holiday Schedule',
      hierarchyPath: 'Employee Handbook > General Information > Holidays',
      relevanceScore: 0.65
    }
  ];

  return (
    <div className="p-4 max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">Multiple Citations Example</h2>
      <CitationList citations={citations} />
    </div>
  );
}

/**
 * Example 3: High Relevance Citations
 * Use case: Very specific query with highly relevant sources
 */
export function HighRelevanceExample() {
  const citations: Citation[] = [
    {
      id: 'cite-001',
      documentId: 'doc-code-of-conduct-2024',
      chunkId: 'chunk-harassment-policy',
      snippet: 'The company maintains a zero-tolerance policy for harassment of any kind. All employees have the right to work in an environment free from harassment, discrimination, and retaliation.',
      pageNumber: 5,
      sectionHeading: 'Anti-Harassment Policy',
      hierarchyPath: 'Code of Conduct > Workplace Standards > Harassment Prevention',
      relevanceScore: 0.98
    },
    {
      id: 'cite-002',
      documentId: 'doc-code-of-conduct-2024',
      chunkId: 'chunk-reporting-procedures',
      snippet: 'Employees who experience or witness harassment should immediately report the incident to HR or use the anonymous hotline at 1-800-REPORT.',
      pageNumber: 6,
      sectionHeading: 'Reporting Procedures',
      hierarchyPath: 'Code of Conduct > Workplace Standards > Reporting',
      relevanceScore: 0.95
    }
  ];

  return (
    <div className="p-4 max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">High Relevance Example</h2>
      <CitationList citations={citations} />
    </div>
  );
}

/**
 * Example 4: Mixed Relevance Citations
 * Use case: Query with varying source relevance
 */
export function MixedRelevanceExample() {
  const citations: Citation[] = [
    {
      id: 'cite-001',
      documentId: 'doc-remote-work-policy-2024',
      chunkId: 'chunk-eligibility',
      snippet: 'Employees who have completed their probationary period and received manager approval are eligible for remote work arrangements up to 3 days per week.',
      pageNumber: 3,
      sectionHeading: 'Remote Work Eligibility',
      hierarchyPath: 'Remote Work Policy > Eligibility Requirements',
      relevanceScore: 0.89
    },
    {
      id: 'cite-002',
      documentId: 'doc-remote-work-policy-2024',
      chunkId: 'chunk-equipment',
      snippet: 'The company will provide necessary equipment including laptop, monitor, and ergonomic accessories for approved remote work setups.',
      pageNumber: 7,
      sectionHeading: 'Equipment Provision',
      hierarchyPath: 'Remote Work Policy > Equipment and Support',
      relevanceScore: 0.67
    },
    {
      id: 'cite-003',
      documentId: 'doc-it-security-policy-2024',
      chunkId: 'chunk-vpn-requirements',
      snippet: 'All remote connections must use the company VPN. Employees are required to enable two-factor authentication on all work devices.',
      pageNumber: 12,
      sectionHeading: 'VPN and Security Requirements',
      hierarchyPath: 'IT Security Policy > Remote Access > VPN',
      relevanceScore: 0.54
    }
  ];

  return (
    <div className="p-4 max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">Mixed Relevance Example</h2>
      <CitationList citations={citations} />
    </div>
  );
}

/**
 * Example 5: No Citations
 * Use case: Query with no relevant sources found
 */
export function NoCitationsExample() {
  const citations: Citation[] = [];

  return (
    <div className="p-4 max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">No Citations Example</h2>
      <CitationList citations={citations} />
      <p className="text-sm text-muted-foreground mt-4">
        (Component renders nothing when citations array is empty)
      </p>
    </div>
  );
}

/**
 * Example 6: Long Snippet
 * Use case: Citation with extensive quoted text
 */
export function LongSnippetExample() {
  const citations: Citation[] = [
    {
      id: 'cite-001',
      documentId: 'doc-parental-leave-policy-2024',
      chunkId: 'chunk-eligibility-benefits',
      snippet: 'Employees who have been with the company for at least 12 months are eligible for parental leave. Primary caregivers receive 16 weeks of paid leave, while secondary caregivers receive 6 weeks. Leave must be taken within the first year of the child\'s birth or adoption. Employees may request an additional 8 weeks of unpaid leave if needed. During paid leave, employees continue to receive full salary and benefits. Return-to-work support includes flexible scheduling options for the first 3 months.',
      pageNumber: 18,
      sectionHeading: 'Parental Leave Benefits',
      hierarchyPath: 'Employee Handbook > Benefits > Family Leave',
      relevanceScore: 0.91
    }
  ];

  return (
    <div className="p-4 max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">Long Snippet Example</h2>
      <CitationList citations={citations} />
    </div>
  );
}

/**
 * Example 7: Deep Hierarchy Path
 * Use case: Citation from deeply nested document section
 */
export function DeepHierarchyExample() {
  const citations: Citation[] = [
    {
      id: 'cite-001',
      documentId: 'doc-compliance-manual-2024',
      chunkId: 'chunk-data-retention',
      snippet: 'Customer data must be retained for a minimum of 7 years in accordance with federal regulations. Data retention policies apply to both digital and physical records.',
      pageNumber: 45,
      sectionHeading: 'Data Retention Requirements',
      hierarchyPath: 'Compliance Manual > Data Protection > Privacy Standards > Retention Policies > Customer Data',
      relevanceScore: 0.83
    }
  ];

  return (
    <div className="p-4 max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">Deep Hierarchy Example</h2>
      <CitationList citations={citations} />
    </div>
  );
}

/**
 * Example 8: Complete Chat Message with Citations
 * Use case: Full integration example showing message + citations
 */
export function CompleteChatExample() {
  const citations: Citation[] = [
    {
      id: 'cite-001',
      documentId: 'doc-employee-handbook-2024',
      chunkId: 'chunk-benefits-vacation',
      snippet: 'Employees are entitled to 15 days of paid vacation per year. Vacation time accrues monthly and must be requested at least 2 weeks in advance.',
      pageNumber: 12,
      sectionHeading: 'Vacation Policy',
      hierarchyPath: 'Employee Handbook > Benefits > Time Off',
      relevanceScore: 0.92
    }
  ];

  return (
    <div className="p-4 max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold">Complete Chat Example</h2>
      
      {/* User Message */}
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground rounded-lg p-4 max-w-[80%]">
          <p>How many vacation days do I get per year?</p>
        </div>
      </div>

      {/* Assistant Message */}
      <div className="flex justify-start">
        <div className="space-y-2 max-w-[80%]">
          <div className="bg-card rounded-lg p-4 border">
            <p>
              According to the Employee Handbook, you are entitled to{' '}
              <strong>15 days of paid vacation per year</strong>. Vacation time
              accrues monthly, and you must request time off at least 2 weeks
              in advance.
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              Retrieved 1 relevant section
            </div>
          </div>
          
          {/* Citations */}
          <CitationList citations={citations} />
        </div>
      </div>
    </div>
  );
}

/**
 * Example 9: Realistic Multi-Document Query
 * Use case: Query spanning multiple policy documents
 */
export function MultiDocumentExample() {
  const citations: Citation[] = [
    {
      id: 'cite-001',
      documentId: 'doc-employee-handbook-2024',
      chunkId: 'chunk-termination-notice',
      snippet: 'Employees are required to provide 2 weeks written notice when resigning. Failure to provide adequate notice may result in forfeiture of accrued vacation pay.',
      pageNumber: 34,
      sectionHeading: 'Resignation Notice Requirements',
      hierarchyPath: 'Employee Handbook > Employment Terms > Termination',
      relevanceScore: 0.94
    },
    {
      id: 'cite-002',
      documentId: 'doc-benefits-guide-2024',
      chunkId: 'chunk-cobra-continuation',
      snippet: 'Upon termination, employees may elect to continue health insurance coverage under COBRA for up to 18 months. COBRA enrollment must be completed within 60 days of termination.',
      pageNumber: 22,
      sectionHeading: 'COBRA Continuation Coverage',
      hierarchyPath: 'Benefits Guide > Health Insurance > Coverage Continuation',
      relevanceScore: 0.87
    },
    {
      id: 'cite-003',
      documentId: 'doc-401k-plan-summary-2024',
      chunkId: 'chunk-vesting-schedule',
      snippet: 'Company 401(k) matching contributions vest over 4 years. Employees who leave before full vesting will forfeit unvested employer contributions.',
      pageNumber: 8,
      sectionHeading: 'Vesting Schedule',
      hierarchyPath: '401(k) Plan Summary > Employer Contributions > Vesting',
      relevanceScore: 0.76
    }
  ];

  return (
    <div className="p-4 max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">Multi-Document Example</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Query: "What happens to my benefits if I resign?"
      </p>
      <CitationList citations={citations} />
    </div>
  );
}

/**
 * Example 10: All Examples Combined
 * Use case: Demo page showing all variations
 */
export function AllExamples() {
  return (
    <div className="space-y-8 p-8">
      <h1 className="text-2xl font-bold">Citation Component Examples</h1>
      
      <SingleCitationExample />
      <hr />
      
      <MultipleCitationsExample />
      <hr />
      
      <HighRelevanceExample />
      <hr />
      
      <MixedRelevanceExample />
      <hr />
      
      <NoCitationsExample />
      <hr />
      
      <LongSnippetExample />
      <hr />
      
      <DeepHierarchyExample />
      <hr />
      
      <CompleteChatExample />
      <hr />
      
      <MultiDocumentExample />
    </div>
  );
}
