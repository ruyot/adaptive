// API configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

// API helper functions
export async function fetchRepoData(owner: string, repo: string, branch: string = 'main'): Promise<any> {
  const response = await fetch(
    `${API_URL}/process-repo?owner=${owner}&repo=${repo}&branch=${branch}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch repository data');
  }
  
  return await response.json();
}

export async function analyzeFile(path: string, content: string): Promise<any> {
  const response = await fetch(`${API_URL}/process-file`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: path,
      content: content
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze file');
  }
  
  return await response.json();
}

