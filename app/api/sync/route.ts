import { NextResponse } from 'next/server';
import { runSync } from '@/lib/sync-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Secret-protected endpoint that runs the score sync. Called every ~15 min by an
// external cron (e.g. cron-job.org) so we don't depend on GitHub's flaky scheduler.
// Auth: header  Authorization: Bearer <CRON_SECRET>   or   ?key=<CRON_SECRET>
async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured on the server' }, { status: 500 });
  }
  const url = new URL(req.url);
  const provided =
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
    url.searchParams.get('key') ||
    '';
  if (provided !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const dryRun = url.searchParams.get('dry') === '1';
    const result = await runSync({ dryRun });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
