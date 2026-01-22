/*
 * @Author: gifted-professor 1044396185@qq.com
 * @Date: 2026-01-20 12:46:35
 * @LastEditors: gifted-professor 1044396185@qq.com
 * @LastEditTime: 2026-01-20 12:46:37
 * @FilePath: /Vetta/utils/apify.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export interface InstagramData {
  username: string;
  fullName?: string;
  biography?: string;
  followersCount?: number;
  posts: Array<{
    caption: string;
    url: string;
    likesCount?: number;
    commentsCount?: number;
    imageUrl?: string;
  }>;
}

export interface ApifyLimitsSummary {
  maxMonthlyUsageUsd?: number;
  monthlyUsageUsd?: number;
  cycleStartAt?: string;
  cycleEndAt?: string;
}

export interface ApifyRunUsageSummary {
  runId: string;
  usageUsd?: number;
  usageTotalUsd?: number;
}

export interface ApifyTaskControl {
  signal?: AbortSignal;
  onRunStarted?: (runId: string) => void;
}

const extractNumber = (value: any): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
};

const createAbortError = () => {
  try {
    return new DOMException('Aborted', 'AbortError');
  } catch {
    const err = new Error('Aborted');
    (err as any).name = 'AbortError';
    return err;
  }
};

const abortableDelay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }
    const id = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(id);
      cleanup();
      reject(createAbortError());
    };
    const cleanup = () => {
      if (signal) signal.removeEventListener('abort', onAbort);
    };
    if (signal) signal.addEventListener('abort', onAbort);
  });

export const fetchApifyLimits = async (): Promise<ApifyLimitsSummary | null> => {
  const baseUrl = '/api/apify';
  const res = await fetch(`${baseUrl}/users/me/limits`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) return null;
  const json = await res.json();
  const data = json?.data ?? json;

  const maxMonthlyUsageUsd =
    extractNumber(data?.limits?.maxMonthlyUsageUsd) ??
    extractNumber(data?.maxMonthlyUsageUsd) ??
    extractNumber(data?.maxMonthlyUsage?.usd) ??
    extractNumber(data?.maxMonthlyUsageUSD);

  const monthlyUsageUsd =
    extractNumber(data?.currentUsage?.monthlyUsageUsd) ??
    extractNumber(data?.currentUsage?.monthlyUsageUSD) ??
    extractNumber(data?.current?.monthlyUsageUsd) ??
    extractNumber(data?.current?.monthlyUsageUSD) ??
    extractNumber(data?.currentUsage?.totalUsd) ??
    extractNumber(data?.currentUsage?.usageUsd) ??
    extractNumber(data?.usage?.monthlyUsageUsd) ??
    extractNumber(data?.usage?.totalUsd) ??
    extractNumber(data?.usageUsd) ??
    extractNumber(data?.totalUsd);

  const cycleStartAt =
    data?.currentUsageCycle?.startedAt ??
    data?.currentUsageCycle?.startAt ??
    data?.monthlyUsageCycle?.startedAt ??
    data?.monthlyUsageCycle?.startAt ??
    data?.usageCycle?.startedAt ??
    data?.usageCycle?.startAt ??
    data?.startedAt;
  const cycleEndAt =
    data?.currentUsageCycle?.endsAt ??
    data?.currentUsageCycle?.endAt ??
    data?.monthlyUsageCycle?.endsAt ??
    data?.monthlyUsageCycle?.endAt ??
    data?.usageCycle?.endsAt ??
    data?.usageCycle?.endAt ??
    data?.endsAt;

  return {
    maxMonthlyUsageUsd,
    monthlyUsageUsd,
    cycleStartAt,
    cycleEndAt,
  };
};

export const fetchApifyRunUsage = async (runId: string): Promise<ApifyRunUsageSummary | null> => {
  if (!runId) return null;

  const baseUrl = '/api/apify';
  const res = await fetch(`${baseUrl}/actor-runs/${runId}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) return null;
  const json = await res.json();
  const data = json?.data ?? json;

  return {
    runId,
    usageUsd: extractNumber(data?.usageUsd) ?? extractNumber(data?.usage?.usageUsd),
    usageTotalUsd: extractNumber(data?.usageTotalUsd) ?? extractNumber(data?.usage?.usageTotalUsd),
  };
};

export const abortApifyRun = async (runId: string): Promise<boolean> => {
  if (!runId) return false;
  const baseUrl = '/api/apify';
  const res = await fetch(`${baseUrl}/actor-runs/${runId}/abort`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return res.ok;
};

export const runApifyTask = async (
  actorId: string,
  payload: any,
  addLog: (msg: string) => void,
  onRunFinished?: (info: { actorId: string; runId: string; datasetId?: string; usageTotalUsd?: number; usageUsd?: number }) => void,
  control?: ApifyTaskControl
): Promise<any[]> => {
  // HYBRID MODE SELECTION
  // Mode A: Sync Direct (Fastest, for audit/scraper)
  // Mode B: Async Polling (Robust, for search/discovery)
  // REVERT TO ASYNC POLLING FOR STABILITY
  // Sync mode caused browser timeouts (ERR_ABORTED), so we use polling for everything but keep the V3.1 parameters.
  
  addLog(`Mode: Async Polling Execution (${actorId})...`);
  const baseUrl = '/api/apify';
  const signal = control?.signal;
  if (signal?.aborted) throw createAbortError();
  
  // 1. Start the run
  const startUrl = `${baseUrl}/acts/${actorId}/runs`;
  const startRes = await fetch(startUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
  
  if (!startRes.ok) {
    const err = await startRes.text();
    throw new Error(`Failed to start task (${startRes.status}): ${err.slice(0, 100)}`);
  }
  const startData = await startRes.json();
  const runId = startData.data.id;
  const datasetId = startData.data.defaultDatasetId;
  if (control?.onRunStarted) control.onRunStarted(runId);
  if (signal?.aborted) {
    await abortApifyRun(runId).catch(() => false);
    throw createAbortError();
  }

  // 2. Poll for completion
  let attempts = 0;
  const maxAttempts = actorId.includes('instagram-search-scraper') ? 60 : 30; // 60 * 2s = 120s timeout
  
  while (attempts < maxAttempts) { 
    await abortableDelay(2000, signal);
    attempts++;
    
      // Use a timeout for status check to prevent hanging connections
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout per poll
      const onAbort = () => controller.abort();
      if (signal) signal.addEventListener('abort', onAbort, { once: true });

      try {
        const statusUrl = `${baseUrl}/acts/${actorId}/runs/${runId}`;
        const statusRes = await fetch(statusUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!statusRes.ok) {
           addLog(`Warning: Polling status failed (${statusRes.status}). Retrying...`);
           continue;
        }

        const statusData = await statusRes.json();
        const status = statusData.data.status;
        
        addLog(`Debug: Run ${runId} status: ${status} (${attempts}/${maxAttempts})`);

        if (status === 'SUCCEEDED') {
          break;
        } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
          throw new Error(`Task ended with status: ${status}`);
        }
      } catch (pollErr: any) {
        clearTimeout(timeoutId);
        if (signal?.aborted) {
          await abortApifyRun(runId).catch(() => false);
          throw createAbortError();
        }
        if (pollErr.name === 'AbortError') {
             addLog(`Debug: Polling request timed out (10s). Retrying...`);
        } else {
             console.warn("Polling error:", pollErr);
             addLog(`Polling error: ${pollErr.message}`);
        }
      } finally {
        if (signal) signal.removeEventListener('abort', onAbort);
      }
    }

    // ... (rest of the file) ...

  if (attempts >= maxAttempts) {
    throw new Error(`Task timed out after ${maxAttempts * 2}s`);
  }

  // 3. Fetch results
  addLog(`Debug: Fetching results for dataset ${datasetId}...`);
  const resultsUrl = `${baseUrl}/datasets/${datasetId}/items`;
  const resultsRes = await fetch(resultsUrl, { signal });
  
  if (!resultsRes.ok) {
    const errText = await resultsRes.text();
    throw new Error(`Failed to fetch results: ${resultsRes.status}${errText ? ` - ${errText}` : ''}`);
  }
  
  const finalJson = await resultsRes.json();
  addLog(`Debug: Dataset fetched. Items: ${Array.isArray(finalJson) ? finalJson.length : 'Not Array'}`);
  if (onRunFinished) {
    const usage = await fetchApifyRunUsage(runId);
    onRunFinished({
      actorId,
      runId,
      datasetId,
      usageTotalUsd: usage?.usageTotalUsd,
      usageUsd: usage?.usageUsd,
    });
  }
  return finalJson;
};

export const fetchInstagramData = async (
  username: string,
  addLog: (msg: string) => void,
  onRunFinished?: (info: { actorId: string; runId: string; datasetId?: string; usageTotalUsd?: number; usageUsd?: number }) => void,
  control?: ApifyTaskControl
): Promise<InstagramData | null> => {
  // Use the robust runApifyTask instead of fragile sync call
  const actorId = 'apify~instagram-scraper'; 
  
  addLog(`Connecting to Apify (${actorId})...`);

  // Try directUrls first as it's more reliable for some profiles
  const payload = {
    directUrls: [`https://www.instagram.com/${username}/`],
    resultsLimit: 12,
    // searchType: 'details', // Removed: Not supported by apify~instagram-scraper in this mode
    // proxy: { useApifyProxy: true }, // Removed: Let Apify handle proxy rotation automatically to avoid stuck sessions
    resultsType: 'posts' // Ensure we get posts data
  };

  try {
    const results = await runApifyTask(actorId, payload, addLog, onRunFinished, control);
    
    // Check for specific error object returned by Apify
    if (results && results.length === 1 && (results[0].error || results[0].errorDescription)) {
       const errItem = results[0];
       addLog(`Apify Error: ${errItem.error} - ${errItem.errorDescription}`);
       if (errItem.error === 'no_items') {
          addLog("Possible causes: Private account, Invalid username, or Geo-restriction.");
       }
       return null;
    }

    if (!results || results.length === 0) {
      addLog('No data found for this user.');
      return null;
    }

    // 聚合数据
    const posts = results.map((item: any) => ({
      caption: item.caption || item.text || '',
      url: item.url || item.postUrl,
      likesCount: item.likesCount || item.likes_count || 0,
      commentsCount: item.commentsCount || item.comments_count || 0,
      imageUrl: item.displayUrl || item.display_url || item.imageUrl
    })).filter(p => p.imageUrl); // Only keep posts with images

    // 从第一条数据中提取用户信息
    const firstItem = results[0];
    const owner = firstItem.owner || {};

    addLog(`Successfully scraped ${posts.length} posts for analysis.`);

    return {
      username: owner.username || username,
      fullName: owner.fullName || owner.full_name,
      biography: owner.biography || owner.bio || "No bio available (Scraped from posts)",
      followersCount: owner.followersCount || owner.followers_count || 0,
      posts
    };

  } catch (error: any) {
    addLog(`Scraping failed: ${error.message}`);
    throw error;
  }
};
