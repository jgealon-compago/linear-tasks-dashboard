import { LinearClient } from '@linear/sdk';

interface Issue {
  id: string;
  identifier: string;
  title: string;
  priority: number;
  url: string;
  createdAt: Date;
  state: { name: string; color: string } | null;
  team: { name: string; key: string } | null;
}

async function getIssues(): Promise<Issue[]> {
  const apiKey = process.env.LINEAR_API_KEY;
  
  if (!apiKey) {
    return [];
  }
  
  try {
    const client = new LinearClient({ apiKey });
    const me = await client.viewer;
    const issues = await me.assignedIssues({
      first: 50,
    });
    
    const issuesWithDetails = await Promise.all(
      issues.nodes.map(async (issue) => {
        const state = await issue.state;
        const team = await issue.team;
        return {
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          priority: issue.priority,
          url: issue.url,
          createdAt: issue.createdAt,
          state: state ? { name: state.name, color: state.color } : null,
          team: team ? { name: team.name, key: team.key } : null,
        };
      })
    );
    
    return issuesWithDetails;
  } catch (error) {
    console.error('Error fetching issues:', error);
    return [];
  }
}

function getPriorityLabel(priority: number): { label: string; color: string } {
  switch (priority) {
    case 1: return { label: 'Urgent', color: 'bg-red-100 text-red-800' };
    case 2: return { label: 'High', color: 'bg-orange-100 text-orange-800' };
    case 3: return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    case 4: return { label: 'Low', color: 'bg-green-100 text-green-800' };
    default: return { label: 'None', color: 'bg-gray-100 text-gray-800' };
  }
}

export default async function Home() {
  const issues = await getIssues();
  const hasApiKey = !!process.env.LINEAR_API_KEY;
  
  return (
    <main className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Linear Tasks Dashboard</h1>
        <p className="text-gray-600 mt-2">Your assigned tasks from Linear</p>
      </div>
      
      {!hasApiKey ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800">Setup Required</h2>
          <p className="text-yellow-700 mt-2">
            Add your LINEAR_API_KEY environment variable in Vercel to see your tasks.
          </p>
          <ol className="mt-4 text-yellow-700 list-decimal list-inside space-y-1">
            <li>Go to your Vercel project settings</li>
            <li>Navigate to Environment Variables</li>
            <li>Add LINEAR_API_KEY with your Linear API key</li>
            <li>Redeploy the app</li>
          </ol>
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-blue-700">No assigned tasks found or there was an error fetching tasks.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => {
            const priority = getPriorityLabel(issue.priority);
            return (
              <a
                key={issue.id}
                href={issue.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono text-gray-500">{issue.identifier}</span>
                      {issue.team && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                          {issue.team.name}
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 truncate">{issue.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {issue.state && (
                      <span 
                        className="text-xs px-2 py-1 rounded"
                        style={{ 
                          backgroundColor: `${issue.state.color}20`,
                          color: issue.state.color 
                        }}
                      >
                        {issue.state.name}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded ${priority.color}`}>
                      {priority.label}
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
      
      <div className="mt-8 text-center text-sm text-gray-500">
        {issues.length > 0 && <p>Showing {issues.length} tasks</p>}
      </div>
    </main>
  );
}

export const revalidate = 60;