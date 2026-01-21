import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ScanSearch,
  History,
  Sparkles,
} from 'lucide-react';

import { translations } from './locales/translations';
import { SourcingStrategy, Candidate, AuditResult } from './types';
import { Header } from './components/Header';
import { LogViewer } from './components/LogViewer';
import { FilterPanel } from './components/FilterPanel';
import { InputSection } from './components/InputSection';
import { StrategyMatrix } from './components/StrategyMatrix';
import { CandidateList } from './components/CandidateList';
import { AuditReport } from './components/AuditReport';

import { fetchInstagramData, runApifyTask } from './utils/apify';

const App = () => {
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const t = translations[lang];
  const [mode, setMode] = useState<'discovery' | 'audit'>('discovery');
  
  const [productImg, setProductImg] = useState<string | null>(() => localStorage.getItem('vetta_productImg') || null);
  const [productDesc, setProductDesc] = useState(() => localStorage.getItem('vetta_productDesc') || '');
  const [strategy, setStrategy] = useState<SourcingStrategy | null>(() => {
    const s = localStorage.getItem('vetta_strategy');
    return s ? JSON.parse(s) : null;
  });
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const c = localStorage.getItem('vetta_candidates');
    return c ? JSON.parse(c) : [];
  });
  
  // Persistence effects
  React.useEffect(() => {
    if (productImg) localStorage.setItem('vetta_productImg', productImg);
    else localStorage.removeItem('vetta_productImg');
  }, [productImg]);

  React.useEffect(() => {
    localStorage.setItem('vetta_productDesc', productDesc);
  }, [productDesc]);

  React.useEffect(() => {
    if (strategy) localStorage.setItem('vetta_strategy', JSON.stringify(strategy));
    else localStorage.removeItem('vetta_strategy');
  }, [strategy]);

  React.useEffect(() => {
    localStorage.setItem('vetta_candidates', JSON.stringify(candidates));
  }, [candidates]);
  
  const [minFollowers, setMinFollowers] = useState<number>(1000); 
  const [creatorOnly, setCreatorOnly] = useState<boolean>(true);
  
  const [url, setUrl] = useState('');
  const [brandProfile, setBrandProfile] = useState('');
  const [apifyToken, setApifyToken] = useState(process.env.APIFY_API_TOKEN || '');
  
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<AuditResult | null>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const geminiGenerateJson = async (parts: any[]) => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error('Missing Gemini API key');

    const url = `/api/gemini/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `Gemini HTTP ${response.status}`);
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || '').join('') || '';
    if (!text) throw new Error('Empty Gemini response');
    return text;
  };

  const normalizeList = (arr: any[]): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr
      .map(s => String(s || ''))
      .map(s => s.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')) // Remove emojis only
      .map(s => s.replace(/[#@]/g, '').trim()) // Remove # and @
      .filter(s => s.length > 2)
      .slice(0, 8); // Top 8
  };

  const validateStrategyJson = (json: any) => {
    const core = normalizeList(json?.core_tags || []);
    const lifestyle = normalizeList(json?.lifestyle_tags || []);
    const actions = normalizeList(json?.visual_actions || []);
    const aesthetic = normalizeList(json?.aesthetic_keywords || []);
    const queries = normalizeList(json?.search_queries || []);

    const bad =
      core.length < 4 ||
      lifestyle.length < 6 ||
      actions.length < 6 ||
      aesthetic.length < 6 ||
      queries.length < 8;

    return {
      ok: !bad,
      strategy: {
        core_tags: core,
        lifestyle_tags: lifestyle,
        visual_actions: actions,
        aesthetic_keywords: aesthetic,
        search_queries: queries,
      },
    };
  };

  const analyzeProduct = async () => {
    if (!productImg) return;
    setLoading(true);
    setStrategy(null);
    setCandidates([]);
    addLog("Applying 4:4:2 Scene-Based Logic via Gemini...");
    
    try {
      const b64Parts = productImg.split(',');
      const b64Data = b64Parts.length > 1 ? b64Parts[1] : b64Parts[0];

      const baseParts = [
        { inlineData: { data: b64Data, mimeType: "image/jpeg" } },
        {
          text: `Role: Senior Instagram Strategist & Aesthetics Curator.
Input: product image + optional description.
Description: ${productDesc || "(none)"}

Task: Generate a 4:4:2 sourcing matrix to find high-end LIFESTYLE creators (NOT sellers/shops).

### Strategy & Constraints:
1. **visual_actions (40%) - The Scene**:
   - Focus on "Lifestyle Moments" and "Visual Context".
   - MUST be purely aesthetic/routine based (e.g., "Morning Ritual", "Vanity Organization", "Texture Shot").
   - ⚠️ STRICTLY FORBIDDEN: Transactional verbs (Buy, Order, Shop, Sale, Deal).

2. **lifestyle_tags (40%) - Aesthetic DNA**:
   - Focus on VISUAL STYLE, COLOR, and VIBE.
   - Include color/texture keywords matching the product (e.g., #goldaesthetic, #minimalistchic, #glossyfeed).
   - Avoid generic tags like #love or #happy. Use niche tags like #vanitydetails, #skincaretexture, #slowliving.

3. **core_tags (20%) - Creative Identity**:
   - ⚠️ CRITICAL: STRICTLY FORBIDDEN to use Product Names or Brand Names.
   - MUST be a PERSONA found in a Bio (e.g., "Beauty Editor", "Visual Curator", "Aesthete", "Content Creator").
   - EXCLUDE: "Seller", "Shop", "Store", "Wholesaler".

4. **search_queries**:
     - Generate 12 "Username-like" search terms.
     - MUST look like Instagram handles (no spaces, use . or _).
     - Examples: "luxury.vanity", "gold_decor_daily", "skincare.routines", "minimalist_home".
     - AVOID long sentences.
  
  Rules:
- - All strings MUST be English only (ASCII).
- - ⚠️ ABSOLUTE BAN on Commercial/Seller terms: daigou, seller, shop, store, discount, order, price, shipping, wholesale, agent.
- - Output STRICT JSON only.

Output JSON schema:
{
  "core_tags": string[] (>= 6),
  "lifestyle_tags": string[] (>= 10),
  "visual_actions": string[] (>= 10),
  "aesthetic_keywords": string[] (>= 10),
  "search_queries": string[] (>= 12)
}
`,
        },
      ];

      const attempt = async (extraInstruction?: string) => {
        const parts = extraInstruction ? [...baseParts, { text: extraInstruction }] : baseParts;
        const text = await geminiGenerateJson(parts);
        const json = JSON.parse(text || '{}');
        return { text, json };
      };

      let { json } = await attempt();
      let validated = validateStrategyJson(json);
      if (!validated.ok) {
        addLog('Matrix quality low. Regenerating with stricter constraints...');
        ({ json } = await attempt(`Your previous JSON was low quality or violated rules.
Fix it by regenerating a brand new JSON that satisfies ALL rules and minimum counts.
Return JSON only.`));
        validated = validateStrategyJson(json);
      }

      setStrategy(validated.strategy);
      addLog("Matrix Ready. Parallel Scenarios Capturing Engine Initialized.");
    } catch (err: any) {
      addLog("Analysis Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const startSourcing = async () => {
    const token = apifyToken?.trim();
    if (!token) {
      addLog("Error: Missing Apify API Token.");
      return;
    }
    
    setLoading(true);
    setCandidates([]);
    addLog(`Launching Parallel Sourcing (Concurrent Mode)...`);
    
    try {
      const uniqueMap = new Map();
      let totalFiltered = 0;

      const commercialBlacklist = [
        'daigou', 'price', 'wholesale', 'reseller', 'seller', 'sale', 'shop', 'store', 
        'factory', 'deals', 'global', 'shipping', 'order', 'original', 'discount', 
        'agent', 'proxy', 'personalshopper', 'mall', 'outlet', 'service'
      ];

      const ingestResults = (raw: any[], matchReason: string) => {
        if (!raw || raw.length === 0) return;

        // Debug: Log first item keys to understand Apify response structure
        const first = raw[0];
        addLog(`Debug: Raw batch size: ${raw.length}. First item keys: ${Object.keys(first || {}).join(', ')}`);
        if (first?.user) addLog(`Debug: item.user keys: ${Object.keys(first.user).join(', ')}`);
        if (first?.owner) addLog(`Debug: item.owner keys: ${Object.keys(first.owner).join(', ')}`);

        let addedCount = 0;
        let batchFiltered = 0;

        raw.forEach((item: any) => {
          if (item?.error || item?.errorDescription) return;

          // 1. 基础信息提取 - Enhanced Compatibility
          const userObj = item.user || item.owner || item.node?.owner || item;
          const usernameRaw = userObj.username || userObj.handle || item.username || item.userName || '';
          const username = String(usernameRaw).toLowerCase().trim();
          
          if (!username || username.length < 2) return;

          if (uniqueMap.has(username)) return;

          const bio = String(userObj.biography || userObj.bio || item.biography || item.bio || '').toLowerCase();
          const isCommercial = commercialBlacklist.some((kw) => username.includes(kw) || bio.includes(kw));
          
          const fCount =
            userObj.followerCount ||
            userObj.followersCount ||
            userObj.follower_count ||
            userObj.edge_followed_by?.count ||
            item.followerCount ||
            item.followersCount ||
            item.follower_count ||
            0;

          // Scoring System V2 (Adaptive)
          let score = 80;
          let reasons: string[] = [];

          if (fCount > 0 && fCount < minFollowers) {
            score -= 20;
            reasons.push(`LowFollowers(${fCount})`);
          }
          if (fCount === 0) {
            score -= 10;
            reasons.push(`NoData`);
          }
          if (isCommercial) {
            score -= 30;
            reasons.push(`Commercial`);
          }
          
          if (strategy?.aesthetic_keywords.some((kw) => bio.includes(kw.toLowerCase()))) {
            score += 15;
            reasons.push('Aesthetic');
          }
          if (strategy?.core_tags.some((kw) => bio.includes(kw.toLowerCase()))) {
            score += 10;
            reasons.push('TagMatch');
          }

          // Soft Filter: Only drop if commercial AND low score
          if (creatorOnly && isCommercial && score < 50) {
            totalFiltered++;
            batchFiltered++;
            return;
          }

          const avatarUrl =
            userObj.profile_pic_url ||
            userObj.profilePicUrl ||
            userObj.profile_pic_url_hd ||
            item.profile_pic_url ||
            item.profilePicUrl ||
            item.profile_pic_url_hd ||
            null;

          const displayName = userObj.fullName || userObj.full_name || item.fullName || item.full_name || username;
          const verified = !!(userObj.isVerified || userObj.is_verified || item.isVerified || item.is_verified);

          uniqueMap.set(username, {
            username,
            followers: fCount,
            displayName,
            verified,
            match_reason: matchReason,
            avatarUrl,
            match_score: Math.min(Math.max(score, 10), 99),
            is_commercial: isCommercial,
          });
          addedCount++;
        });
        
        addLog(`Ingest: ${addedCount} added, ${batchFiltered} filtered from batch.`);
      };

      const cleanQuery = (s: string) => s.replace(/^#/, '').trim();

      const targetCount = 5;
      const maxRounds = 8;
      addLog(`Adaptive sourcing: probe 3 dimensions per round until ${targetCount}+ (max ${maxRounds} rounds).`);
      
      const { core_tags, lifestyle_tags, visual_actions, search_queries } = strategy!;
      const actionPool = (visual_actions || []).map((q) => cleanQuery(String(q || ''))).filter(Boolean);
      const aestheticPool = (lifestyle_tags || []).map((q) => cleanQuery(String(q || ''))).filter(Boolean);
      const identityPool = (core_tags || []).map((q) => cleanQuery(String(q || ''))).filter(Boolean);
      const fallbackPool = [
        ...(search_queries || []),
        ...(strategy?.aesthetic_keywords || []),
        ...(core_tags || []),
        ...(lifestyle_tags || []),
        ...(visual_actions || []),
      ]
        .map((q) => cleanQuery(String(q || '')))
        .filter((q) => q.length > 0);

      addLog(`Query pools: action=${actionPool.length}, aesthetic=${aestheticPool.length}, identity=${identityPool.length}, fallback=${fallbackPool.length}`);

      const tried = new Set<string>();
      let actionIdx = 0;
      let aestheticIdx = 0;
      let identityIdx = 0;
      let fallbackIdx = 0;

      const nextFrom = (pool: string[], idxRef: { v: number }) => {
        while (idxRef.v < pool.length) {
          const q = pool[idxRef.v++];
          if (!q) continue;
          const key = q.toLowerCase();
          if (tried.has(key)) continue;
          tried.add(key);
          return q;
        }
        return null;
      };

      for (let round = 1; round <= maxRounds && uniqueMap.size < targetCount; round++) {
        const actionQ = nextFrom(actionPool, { v: actionIdx });
        actionIdx = Math.min(actionIdx + 1, actionPool.length);
        const aestheticQ = nextFrom(aestheticPool, { v: aestheticIdx });
        aestheticIdx = Math.min(aestheticIdx + 1, aestheticPool.length);
        const identityQ = nextFrom(identityPool, { v: identityIdx });
        identityIdx = Math.min(identityIdx + 1, identityPool.length);

        const tasks: Array<{ q: string; label: string; reason: string; type: string; rType?: string }> = [];

        // 1. Action-Scene (动作): 必须搜内容 (Hashtag/Posts)
        if (actionQ) {
             tasks.push({ q: actionQ, label: 'Action-Scene', reason: actionQ, type: 'hashtag', rType: 'posts' });
        }
        
        // 2. Aesthetic DNA (审美): 搜内容或Top (Hashtag通常更准)
        if (aestheticQ) {
             tasks.push({ q: aestheticQ, label: 'Aesthetic DNA', reason: aestheticQ, type: 'hashtag', rType: 'posts' });
        }
        
        // 3. Creative Identity (身份): 必须搜人 (User Bio)
        if (identityQ) {
             tasks.push({ q: identityQ, label: 'Creative Identity', reason: identityQ, type: 'user', rType: 'details' });
        }

        while (tasks.length < 3) {
          const fb = nextFrom(fallbackPool, { v: fallbackIdx });
          fallbackIdx = Math.min(fallbackIdx + 1, fallbackPool.length);
          if (!fb) break;
          // Fallback 默认搜 Top，容错率高
          tasks.push({ q: fb, label: 'Fallback', reason: fb, type: 'top', rType: 'details' });
        }

        if (tasks.length === 0) break;

        addLog(`Round ${round}/${maxRounds}: probing ${tasks.length} dimensions...`);

        // Streaming execution with Concurrency Control (Max 2 parallel tasks) to avoid ERR_ABORTED
        const CONCURRENCY = 2;
        for (let i = 0; i < tasks.length; i += CONCURRENCY) {
            const chunk = tasks.slice(i, i + CONCURRENCY);
            await Promise.all(chunk.map(async (t) => {
                // Add jitter
                await new Promise(r => setTimeout(r, Math.random() * 1000));
                
                // CRITICAL FIX V8: Correct parameter mapping for "user" searchType
                 // If searchType is 'user', the actor expects 'usernames' (array), NOT 'search' (string).
                 const cleanQuery = t.q.replace(/^#/, '').replace(/\s+/g, '.'); 
                 
                 let payload: any = {
                     searchType: 'user', 
                     resultsLimit: 12, // Optimized for speed: 20 is too slow for user search, 12 fits within timeout
                     proxy: { useApifyProxy: true },
                 };

                 // Dynamically assign the correct input field based on searchType
                 // For 'user' type, use 'usernames'. For others, use 'search'.
                 if (payload.searchType === 'user') {
                     payload.usernames = [cleanQuery];
                 } else {
                     payload.search = cleanQuery;
                 }

                try {
                  const results = await runApifyTask(token, 'apify~instagram-search-scraper', payload, addLog);
                  
                  addLog(`Dimension [${t.label}] "${t.q}" -> ${results.length} results.`);
                  ingestResults(results, t.reason);

                  // Update UI
                  const mapped = Array.from(uniqueMap.values()).map((u: any, idx: number) => {
                      const gradients = ["from-indigo-500 to-purple-600", "from-pink-500 to-rose-500", "from-emerald-400 to-cyan-500", "from-amber-400 to-orange-500"];
                      return {
                        id: u.username,
                        url: `https://www.instagram.com/${u.username}/`,
                        match_score: u.match_score,
                        niche: u.displayName,
                        followers: u.followers,
                        avatar_url: u.avatarUrl,
                        avatar_color: `bg-gradient-to-br ${gradients[idx % gradients.length]}`,
                        is_verified: u.verified,
                        match_reason: u.match_reason,
                        is_commercial: u.is_commercial
                      };
                  });
                  mapped.sort((a, b) => b.match_score - a.match_score);
                  setCandidates(mapped);

                } catch (err: any) {
                  addLog(`Dimension probe failed: ${err.message}`);
                }
            }));
        }

        addLog(`Round ${round} finished. Current candidate pool: ${uniqueMap.size}/${targetCount}.`);
        
        // Cooldown between rounds
        if (uniqueMap.size < targetCount) {
             await new Promise(r => setTimeout(r, 1500));
        }
      }

      const mapped = Array.from(uniqueMap.values()).map((u: any, idx: number) => {
          const gradients = ["from-indigo-500 to-purple-600", "from-pink-500 to-rose-500", "from-emerald-400 to-cyan-500", "from-amber-400 to-orange-500"];
          return {
            id: u.username,
            url: `https://www.instagram.com/${u.username}/`,
            match_score: u.match_score,
            niche: u.displayName,
            followers: u.followers,
            avatar_url: u.avatarUrl,
            avatar_color: `bg-gradient-to-br ${gradients[idx % gradients.length]}`,
            is_verified: u.verified,
            match_reason: u.match_reason,
            is_commercial: u.is_commercial
          };
      });

      mapped.sort((a, b) => b.match_score - a.match_score);

      setCandidates(mapped);
      addLog(`Capture finished. ${mapped.length} high-aesthetic creators verified.`);
      if (totalFiltered > 0) addLog(`De-commercialized: Suppressed ${totalFiltered} sellers/shops.`);

    } catch (err: any) {
      addLog("Sourcing Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerDeepAudit = (candidate: Candidate) => {
    setUrl(candidate.url);
    setBrandProfile(productDesc || strategy?.core_tags.join(', ') || "Niche Influencer");
    setMode('audit');
    addLog(`Penetrating: @${candidate.id}`);
  };

  const runAudit = async () => {
    setLoading(true);
    setResult(null);
    addLog(`Performing Deep Audit on Target: ${url}`);

    // Extract username from URL
    let targetUsername = url.replace(/\/$/, '').split('/').pop() || url;
    if (targetUsername.includes('?')) targetUsername = targetUsername.split('?')[0];
    
    if (!targetUsername) {
       addLog("Error: Invalid URL or Username");
       setLoading(false);
       return;
    }
    
    try {
      const igData = await fetchInstagramData(targetUsername, apifyToken, addLog);
      
      if (!igData) {
         throw new Error("Failed to retrieve Instagram data");
      }

      addLog(`Data Retrieved: ${igData.posts.length} posts ready for Gemini analysis.`);

      // Prepare images for Gemini (Max 4 images to save bandwidth)
       const imageParts = await Promise.all(
         igData.posts.slice(0, 4).map(async (p) => {
            if (!p.imageUrl) return null;
            try {
              // Use local proxy to fetch image with timeout
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

              const proxyUrl = `/api/image?url=${encodeURIComponent(p.imageUrl)}`;
              const res = await fetch(proxyUrl, { signal: controller.signal });
              clearTimeout(timeoutId);

              if (!res.ok) return null;
              const blob = await res.blob();
              const arrayBuffer = await blob.arrayBuffer();
              const base64 = Buffer.from(arrayBuffer).toString('base64');
              return { inlineData: { data: base64, mimeType: "image/jpeg" } };
            } catch (e) {
              return null;
            }
         })
       );
      
      const validImages = imageParts.filter(Boolean);
      addLog(`Visual Context: ${validImages.length} images loaded for AI audit.`);

      const prompt = `
      Role: Expert Influencer Auditor & Brand Strategist (V3.1 Protocol).
      Task: Perform a deep audit of the following Instagram Creator to determine fit for the brand.
      
      Brand Profile: ${brandProfile || "General High-End Lifestyle Brand"}
      
      Creator Data:
      - Username: @${igData.username}
      - Bio: ${igData.biography}
      - Followers: ${igData.followersCount}
      
      Recent Content Analysis (Last ${igData.posts.length} posts):
      ${igData.posts.map((p, i) => `
      Post #${i+1}:
      - Caption: "${p.caption.substring(0, 300)}..."
      - Engagement: ${p.likesCount} likes, ${p.commentsCount} comments
      `).join('\n')}
      
      Output Requirement:
      Return a JSON object strictly adhering to the schema.
      - style_tags: Array of keywords describing their visual style (e.g., Minimalist, Retro).
      - brand_fit_score: 0-100 score based on alignment with Brand Profile.
      - consistency_score: 0-100 score on how consistent their aesthetic is across posts.
      - audit_reason: A detailed professional explanation of why they fit or don't fit.
      - personalized_greeting: A DM draft that mentions specific details from their recent posts.
      - engagement_analysis: Short analysis of if engagement looks organic or fake.
      - visual_analysis: Describe their aesthetic consistency (Refer to the provided images).
      - niche_category: Their primary content category.
      - risk_factors: Array of red flags (e.g., "Mismatched Audience", "Low Engagement", "Competitor Promo").
      `;

      const parts = [...validImages, { text: prompt }];
      const text = await geminiGenerateJson(parts);
      const aiResult = JSON.parse(text || '{}');
      
      // Calculate costs (approximate)
      // Apify: ~$0.03 per run
      // Gemini: ~$0.002 per request (image + text)
      const apifyCost = 0.03 * 7.2; // CNY
      const aiCost = 0.002 * 7.2;   // CNY
      
      const fullResult = {
        ...aiResult,
        cost_estimation: {
          apify_cost: Number(apifyCost.toFixed(4)),
          ai_cost: Number(aiCost.toFixed(4)),
          total_cny: Number((apifyCost + aiCost).toFixed(4))
        },
        recent_posts: igData.posts.slice(0, 3).map((p: any) => ({
          url: p.imageUrl,
          caption: p.caption ? p.caption.substring(0, 50) + '...' : '',
          likes: p.likesCount
        })),
        profile: {
          username: igData.username,
          followers: igData.followersCount,
          avg_likes: Math.floor(igData.posts.reduce((acc: number, p: any) => acc + (p.likesCount || 0), 0) / (igData.posts.length || 1)),
          engagement_rate: ((igData.posts.reduce((acc: number, p: any) => acc + (p.likesCount || 0) + (p.commentsCount || 0), 0) / (igData.posts.length || 1)) / (igData.followersCount || 1) * 100).toFixed(2) + '%'
        }
      };

      setResult(fullResult);
      addLog("Deep Audit Complete. Report Generated.");

    } catch (err: any) {
      addLog("Audit Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetDiscovery = () => {
    setProductImg(null);
    setStrategy(null);
    setCandidates([]);
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] pb-24 font-sans text-slate-900">
      <Header lang={lang} setLang={setLang} mode={mode} setMode={setMode} />

      <main className="max-w-7xl mx-auto mt-12 px-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-8">
          <InputSection
            lang={lang}
            mode={mode}
            apifyToken={apifyToken}
            setApifyToken={setApifyToken}
            productImg={productImg}
            setProductImg={setProductImg}
            productDesc={productDesc}
            setProductDesc={setProductDesc}
            url={url}
            setUrl={setUrl}
            brandProfile={brandProfile}
            setBrandProfile={setBrandProfile}
            loading={loading}
            analyzeProduct={analyzeProduct}
            runAudit={runAudit}
            resetDiscovery={resetDiscovery}
          />

          {mode === 'discovery' && (
            <FilterPanel
              lang={lang}
              minFollowers={minFollowers}
              setMinFollowers={setMinFollowers}
              creatorOnly={creatorOnly}
              setCreatorOnly={setCreatorOnly}
            />
          )}

          <LogViewer logs={logs} />
        </div>

        <div className="lg:col-span-8 space-y-10">
          {mode === 'discovery' && strategy && (
            <>
              <StrategyMatrix
                lang={lang}
                strategy={strategy}
                candidates={candidates}
                loading={loading}
                apifyToken={apifyToken}
                startSourcing={startSourcing}
              />
              {candidates.length > 0 && (
                <CandidateList
                  lang={lang}
                  candidates={candidates}
                  setCandidates={setCandidates}
                  triggerDeepAudit={triggerDeepAudit}
                />
              )}
            </>
          )}

          {mode === 'audit' && result && <AuditReport lang={lang} result={result} />}

          {!result && mode === 'audit' && !loading && (
            <div className="bg-white h-[600px] border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-slate-200 shadow-sm">
              <ScanSearch size={64} className="mb-6 opacity-10" />
              <h3 className="text-slate-800 font-black text-xl uppercase tracking-widest">
                Awaiting Target URL
              </h3>
              <p className="text-slate-400 mt-4 font-bold text-sm text-center max-w-xs">
                Run a discovery scan or paste a link to initiate Gemini 3.0 deep penetration.
              </p>
            </div>
          )}

          {mode === 'discovery' && !strategy && !loading && (
            <div className="bg-white h-[600px] border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-slate-200 shadow-sm">
              <History size={64} className="mb-6 opacity-10" />
              <h3 className="text-slate-800 font-black text-xl uppercase tracking-widest">
                Discovery Idle
              </h3>
              <p className="max-w-xs text-center text-slate-400 mt-4 font-bold leading-relaxed text-sm">
                {t.waiting_desc}
              </p>
            </div>
          )}

          {loading && !strategy && (
            <div className="bg-white h-[600px] border border-slate-100 rounded-[3rem] flex flex-col items-center justify-center animate-in zoom-in-95">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                  <Sparkles size={28} className="animate-pulse" />
                </div>
              </div>
              <p className="mt-8 text-slate-900 font-black text-lg uppercase tracking-widest">
                Launching Parallel Probe
              </p>
              <p className="text-slate-400 text-[9px] mt-2 font-black uppercase tracking-[0.3em] animate-pulse">
                Concurrent Inference: Scene & Aesthetic Interception...
              </p>
            </div>
          )}
        </div>
      </main>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
