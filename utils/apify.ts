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

export const runApifyTask = async (
  token: string,
  actorId: string,
  payload: any,
  addLog: (msg: string) => void
): Promise<any[]> => {
  const cleanToken = token ? token.trim() : '';
  if (!cleanToken) {
    addLog('Error: Apify Token is empty/undefined!');
    throw new Error('Apify Token is missing');
  }
  addLog(`Debug: Using Apify Token: ${cleanToken.substring(0, 5)}...${cleanToken.substring(cleanToken.length - 4)}`);

  // HYBRID MODE SELECTION
  // Mode A: Sync Direct (Fastest, for audit/scraper)
  // Mode B: Async Polling (Robust, for search/discovery)
  // REVERT TO ASYNC POLLING FOR STABILITY
  // Sync mode caused browser timeouts (ERR_ABORTED), so we use polling for everything but keep the V3.1 parameters.
  
  addLog(`Mode: Async Polling Execution (${actorId})...`);
  const baseUrl = '/api/apify';
  const headers = {
    Authorization: `Bearer ${cleanToken}`,
    'Content-Type': 'application/json',
  };
  
  // 1. Start the run
  const startUrl = `${baseUrl}/acts/${actorId}/runs?token=${cleanToken}`;
  const startRes = await fetch(startUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!startRes.ok) {
    const err = await startRes.text();
    throw new Error(`Failed to start task (${startRes.status}): ${err.slice(0, 100)}`);
  }
  const startData = await startRes.json();
  const runId = startData.data.id;
  const datasetId = startData.data.defaultDatasetId;

  // 2. Poll for completion
  let attempts = 0;
  const maxAttempts = 30; // 30 * 2s = 60s timeout
  
  while (attempts < maxAttempts) { 
    await new Promise(r => setTimeout(r, 2000)); // Wait 2s
    attempts++;
    
      // Use a timeout for status check to prevent hanging connections
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout per poll

      try {
        const statusUrl = `${baseUrl}/acts/${actorId}/runs/${runId}?token=${token}`;
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
        if (pollErr.name === 'AbortError') {
             addLog(`Debug: Polling request timed out (10s). Retrying...`);
        } else {
             console.warn("Polling error:", pollErr);
             addLog(`Polling error: ${pollErr.message}`);
        }
      }
    }

    // ... (rest of the file) ...

  if (attempts >= maxAttempts) {
    throw new Error(`Task timed out after ${maxAttempts * 2}s`);
  }

  // 3. Fetch results
  addLog(`Debug: Fetching results for dataset ${datasetId}...`);
  const resultsUrl = `${baseUrl}/datasets/${datasetId}/items?token=${token}`;
  const resultsRes = await fetch(resultsUrl);
  
  if (!resultsRes.ok) {
    const errText = await resultsRes.text();
    throw new Error(`Failed to fetch results: ${resultsRes.status}${errText ? ` - ${errText}` : ''}`);
  }
  
  const finalJson = await resultsRes.json();
  addLog(`Debug: Dataset fetched. Items: ${Array.isArray(finalJson) ? finalJson.length : 'Not Array'}`);
  return finalJson;
};

export const fetchInstagramData = async (
  username: string,
  token: string,
  addLog: (msg: string) => void
): Promise<InstagramData | null> => {
  if (!token) {
    addLog('Error: Apify Token is missing.');
    return null;
  }

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
    const results = await runApifyTask(token, actorId, payload, addLog);
    
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
