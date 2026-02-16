import { NextRequest, NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'bali-villa-truth/website';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const deployKey = process.env.DEPLOY_KEY;
  
  if (\!deployKey || authHeader \!== `Bearer ${deployKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (\!GITHUB_TOKEN) {
    return NextResponse.json({ error: 'GITHUB_TOKEN not configured' }, { status: 500 });
  }

  const body = await req.json();
  const { path, content, message, branch = 'main' } = body;

  if (\!path || \!content || \!message) {
    return NextResponse.json({ error: 'Missing path, content, or message' }, { status: 400 });
  }

  // Get current file SHA
  const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${branch}`, {
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
    },
  });

  let sha: string | undefined;
  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
  }

  // Push file
  const putRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content,
      ...(sha ? { sha } : {}),
      branch,
    }),
  });

  const result = await putRes.json();

  if (\!putRes.ok) {
    return NextResponse.json({ error: result.message || 'GitHub push failed' }, { status: putRes.status });
  }

  return NextResponse.json({
    success: true,
    sha: result.content?.sha,
    commit: result.commit?.html_url,
  });
}
