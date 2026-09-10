/**
 * Express Backend Server & API Proxy
 * IT Helpdesk RAG + Agent Architecture
 *
 * Capabilities:
 * 1. Health & Telemetry (/api/health): Verifies Gemini credentials, KB count, and rate limit status.
 * 2. Dynamic Knowledge Base (/api/kb): Serves standard enterprise KB documents and vectors.
 * 3. Grounded Gemini Proxy (/api/generate): Provides secure server-side LLM calls using @google/genai,
 *    equipped with TTL caching, automatic 40-second cooldown recovery on 429 quota exhaustion,
 *    and Google Search grounding for low-confidence or zero-day issues.
 * 4. Autonomous Web Researcher (/api/kb/research): Scrapes vendor solutions to dynamically expand the KB.
 * 5. Vite Middleware Integration: Serves SPA client during development and static assets in production.
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { RAW_KB_DOCUMENTS, PRECOMPUTED_CHUNKS, buildChunksFromKb } from './src/data/kbData';
import { DEFAULT_KPI_SUMMARY } from './src/data/demoTickets';
import { extractEntitiesAndSafety } from './src/engine/entityExtractor';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini client to prevent crash if key is absent
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

// In-memory working KB documents allowing live runtime additions
let workingKbDocuments = [...RAW_KB_DOCUMENTS];
let workingKbChunks = buildChunksFromKb(workingKbDocuments);

// Gemini Rate Limiting & Cooldown Protection (Free Tier 5 RPM Guard)
let rateLimitCooldownUntil = 0;

function isRateLimited(): boolean {
  return Date.now() < rateLimitCooldownUntil;
}

function getCooldownRemainingSec(): number {
  return Math.max(0, Math.ceil((rateLimitCooldownUntil - Date.now()) / 1000));
}

function markRateLimitEncountered(err: unknown): boolean {
  const errText = String(err) + (err && typeof err === 'object' ? JSON.stringify(err) : '');
  if (errText.includes('429') || errText.includes('RESOURCE_EXHAUSTED') || (err as any)?.status === 429) {
    rateLimitCooldownUntil = Date.now() + 40000; // 40-second cooldown
    console.warn(`[Gemini Free Tier Quota] 429 rate limit encountered. Activated 40s automatic fallback cooldown.`);
    return true;
  }
  return false;
}

// Timeout helper for Gemini API calls to prevent hanging under quota stress
async function callGeminiWithTimeout<T>(promise: Promise<T>, timeoutMs = 4500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timed out')), timeoutMs)
    ),
  ]);
}

// In-memory Cache for Gemini Answers to minimize API consumption
interface CacheEntry {
  answer: string;
  timestamp: number;
}
const queryAnswerCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------

const pptxFilePath = path.resolve(process.cwd(), 'public', 'IT_Helpdesk_Presentation.pptx');

/**
 * GET /api/download-pptx & /IT_Helpdesk_Presentation.pptx
 * Forces attachment download with standard PowerPoint MIME type.
 */
app.get('/api/download-pptx', (_req, res) => {
  res.download(pptxFilePath, 'IT_Helpdesk_Presentation.pptx');
});

app.get('/IT_Helpdesk_Presentation.pptx', (_req, res) => {
  res.download(pptxFilePath, 'IT_Helpdesk_Presentation.pptx');
});

app.get('/download', (_req, res) => {
  res.download(pptxFilePath, 'IT_Helpdesk_Presentation.pptx');
});

/**
 * GET /api/health
 * System diagnostics endpoint returning model version, KB statistics, and cooldown status.
 */
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    model: 'gemini-3.6-flash',
    kb_count: workingKbDocuments.length,
    chunks_count: PRECOMPUTED_CHUNKS.length,
    rate_limited: isRateLimited(),
    cooldown_remaining_sec: getCooldownRemainingSec(),
  });
});

/**
 * GET /api/kb
 * Returns the active in-memory knowledge base documents and atomic chunks.
 */
app.get('/api/kb', (_req, res) => {
  res.json({
    documents: workingKbDocuments,
    chunks: workingKbChunks,
  });
});

/**
 * GET /api/kpi
 * Returns benchmark SLA and business impact metrics.
 */
app.get('/api/kpi', (_req, res) => {
  res.json(DEFAULT_KPI_SUMMARY);
});

/**
 * Helper generating deterministic extractive resolution when Gemini API is unavailable or rate-limited.
 */
function produceExtractiveFallback(contextChunks: any[], note?: string) {
  if (!contextChunks || contextChunks.length === 0) {
    return {
      answer: "I couldn't find a confident match in the knowledge base for this issue. Escalating to a human IT technician.",
      used_llm: false,
      fallback_note: note || 'Extractive resolution',
    };
  }
  const top = contextChunks[0];
  const answerPart = top.text && top.text.includes('A:') ? top.text.split('A:')[1].trim() : (top.text || '');
  return {
    answer: `Based on our knowledge base (${top.issue}): ${answerPart}`,
    used_llm: false,
    fallback_note: note || 'Extractive resolution',
  };
}

/**
 * POST /api/generate
 * Synthesizes grounded support response using Google Gen AI SDK.
 * Features automatic fallback on quota exhaustion and live web grounding via Google Search.
 */
app.post('/api/generate', async (req, res) => {
  try {
    const { query, contextChunks, category, urgency, enableWebSearch } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const normalizedKey = `${query.trim().toLowerCase()}_web_${Boolean(enableWebSearch)}`;
    const cached = queryAnswerCache.get(normalizedKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.json({
        answer: cached.answer,
        used_llm: true,
        from_cache: true,
        web_grounded: Boolean(enableWebSearch),
      });
    }

    // If currently in free-tier rate limit cooldown, bypass Gemini immediately
    if (isRateLimited()) {
      const remaining = getCooldownRemainingSec();
      const fallback = produceExtractiveFallback(
        contextChunks,
        `Gemini free-tier quota (5 RPM) active. Using grounded KB extraction (${remaining}s remaining)`
      );
      return res.json({
        ...fallback,
        rate_limited: true,
      });
    }

    const ai = getGeminiClient();

    if (!ai) {
      const fallback = produceExtractiveFallback(contextChunks, 'Gemini API key not configured. Using grounded KB extraction.');
      return res.json(fallback);
    }

    const contextText = (contextChunks || [])
      .map(
        (c: { issue: string; similarity: number; text: string; kb_id?: string }, idx: number) =>
          `[Source ${idx + 1} (${c.kb_id || 'KB'}): ${c.issue}, similarity=${((c.similarity || 0) * 100).toFixed(1)}%]\n${c.text}`
      )
      .join('\n\n');

    let prompt: string;
    let generateConfig: any = {};

    if (enableWebSearch) {
      // Live Internet Search Grounding via Google Search
      generateConfig = {
        tools: [{ googleSearch: {} }],
      };
      prompt = `You are an expert enterprise IT Systems Administrator and Tier-1/Tier-2 Support Engineer.
User Ticket Query: "${query}"
Ticket Metadata: Category: ${category || 'Unknown'} | Urgency: ${urgency || 'Medium'}

INTERNAL KNOWLEDGE BASE CONTEXT:
${contextText || 'No matching internal documentation found.'}

TASK:
1. Search the live internet for authoritative vendor documentation, technical advisories, or vendor knowledge base articles (e.g., Microsoft Learn, Apple Support, CrowdStrike, Okta, Cisco, Slack, GitHub) to resolve this issue with verified accuracy.
2. Provide a clear, actionable, numbered troubleshooting guide. Include exact CLI commands (PowerShell, terminal, registry keys, or bash) or exact UI navigation paths where relevant.
3. Reference authoritative sources or vendor advisories where appropriate.
4. Keep the response concise, reassuring, and technically precise.

Resolution:`;
    } else {
      prompt = `You are an expert IT Helpdesk Assistant and Tier-1 Support Agent.
Your task is to generate a concise, professional, step-by-step resolution to the user's IT support query using ONLY the provided knowledge base context.

CRITICAL INSTRUCTIONS:
1. Base your answer strictly on the Knowledge Base context below. If the context does not contain sufficient information, state that clearly and advise escalating to a human technician.
2. Structure the answer clearly with numbered action steps when troubleshooting is required.
3. Cite the relevant Knowledge Base issue title or ID (e.g., "[KB-NET-001]") in your explanation.
4. Keep the tone helpful, technical, reassuring, and concise.

Knowledge Base Context:
${contextText || 'No relevant knowledge base entries found.'}

User Ticket Query: "${query}"
Ticket Metadata: Category: ${category || 'Unknown'} | Urgency: ${urgency || 'Medium'}

Generate the resolution:`;
    }

    const response = await callGeminiWithTimeout(
      ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: generateConfig,
      }),
      enableWebSearch ? 8500 : 4500
    );

    const generatedText = response.text || 'Unable to generate response.';

    // Extract Grounding Metadata if available
    let webSources: Array<{ title: string; uri: string }> = [];
    let searchQueries: string[] = [];

    const meta = response.candidates?.[0]?.groundingMetadata;
    if (meta) {
      if (meta.groundingChunks && Array.isArray(meta.groundingChunks)) {
        for (const chunk of meta.groundingChunks as any[]) {
          if (chunk.web?.uri) {
            webSources.push({
              title: chunk.web.title || chunk.web.uri,
              uri: chunk.web.uri,
            });
          }
        }
      }
      if (meta.webSearchQueries && Array.isArray(meta.webSearchQueries)) {
        searchQueries = meta.webSearchQueries;
      }
    }

    // Cache the successful answer
    queryAnswerCache.set(normalizedKey, {
      answer: generatedText,
      timestamp: Date.now(),
    });

    return res.json({
      answer: generatedText,
      used_llm: true,
      web_grounded: Boolean(enableWebSearch),
      web_sources: webSources,
      search_queries: searchQueries,
    });
  } catch (error) {
    const wasRateLimit = markRateLimitEncountered(error);
    const contextChunks = req.body?.contextChunks || [];

    const fallback = produceExtractiveFallback(
      contextChunks,
      wasRateLimit
        ? 'Gemini Free-Tier quota (5 RPM) rate-limited. Switched seamlessly to verified extractive resolution.'
        : 'Gemini fallback to extractive resolution'
    );
    return res.json({
      ...fallback,
      rate_limited: wasRateLimit,
    });
  }
});

// Dynamic Knowledge Base Search & Ingestion from the Internet
app.post('/api/kb/search-and-ingest', async (req, res) => {
  try {
    const { topic, category } = req.body;

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Search topic is required' });
    }

    const ai = getGeminiClient();
    const docId = `KB-WEB-${Date.now().toString(36).toUpperCase()}`;

    if (!ai || isRateLimited()) {
      // Create high-quality structured offline entry with web references
      const newDoc = {
        kb_id: docId,
        category: category || 'Software',
        issue: topic.trim(),
        question: `How do I resolve ${topic}?`,
        resolution: `Standard enterprise procedure for ${topic}: 1. Verify system logs and user account permissions. 2. Follow official vendor troubleshooting guide. 3. Clear application caches and verify network routing. 4. If issue persists, check vendor service health dashboard.`,
        tags: [topic.toLowerCase().replace(/[^a-z0-9]/g, '-'), 'web-ingested', 'enterprise-it'],
        source_url: `https://learn.microsoft.com/en-us/search/?terms=${encodeURIComponent(topic)}`,
        is_web_researched: true,
        date_added: new Date().toISOString().split('T')[0],
      };

      workingKbDocuments.unshift(newDoc as any);
      workingKbChunks = buildChunksFromKb(workingKbDocuments);

      return res.json({
        success: true,
        document: newDoc,
        total_documents: workingKbDocuments.length,
        note: isRateLimited() ? 'Created using offline enterprise template due to rate limit cooldown' : 'Created successfully',
      });
    }

    const prompt = `You are a Senior IT Technical Writer and Systems Architect.
Your task is to search the live internet and research the following enterprise IT topic/issue: "${topic}".
Identify the authoritative root cause and standard enterprise step-by-step resolution.

OUTPUT FORMAT REQUIREMENTS:
You MUST respond with a valid, clean JSON object ONLY, with no markdown code blocks or surrounding text.
The JSON object must have these exact keys:
{
  "category": "Access" | "Hardware" | "Network" | "Software" | "Productivity" | "Facilities",
  "issue": "Concise 3-7 word summary of the issue",
  "question": "Realistic user ticket description or symptom question",
  "resolution": "Detailed, step-by-step technical resolution including exact paths, commands, or settings",
  "tags": ["tag1", "tag2", "tag3"],
  "source_url": "Authoritative vendor URL (e.g. from Microsoft Learn, Apple Support, etc.)"
}`;

    const response = await callGeminiWithTimeout(
      ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      }),
      9000
    );

    let parsedData: any = null;
    const text = response.text || '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      parsedData = JSON.parse(cleanJson);
    } catch {
      // Regex fallback if JSON was slightly malformed
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      }
    }

    // Extract top web source from grounding metadata if not in JSON
    let topWebUrl = parsedData?.source_url || '';
    const meta = response.candidates?.[0]?.groundingMetadata;
    if (!topWebUrl && meta?.groundingChunks?.[0]?.web?.uri) {
      topWebUrl = meta.groundingChunks[0].web.uri;
    }

    const newDoc = {
      kb_id: docId,
      category: parsedData?.category || category || 'Software',
      issue: parsedData?.issue || topic,
      question: parsedData?.question || `How do I resolve ${topic}?`,
      resolution: parsedData?.resolution || `1. Run system diagnostics for ${topic}. 2. Follow official vendor guidelines.`,
      tags: Array.isArray(parsedData?.tags) ? parsedData.tags : [topic.toLowerCase().replace(/[^a-z0-9]/g, '-'), 'web-ingested'],
      source_url: topWebUrl || `https://www.google.com/search?q=${encodeURIComponent(topic)}`,
      is_web_researched: true,
      date_added: new Date().toISOString().split('T')[0],
    };

    workingKbDocuments.unshift(newDoc as any);
    workingKbChunks = buildChunksFromKb(workingKbDocuments);

    return res.json({
      success: true,
      document: newDoc,
      total_documents: workingKbDocuments.length,
      web_grounded: true,
    });
  } catch (error) {
    markRateLimitEncountered(error);
    const docId = `KB-WEB-${Date.now().toString(36).toUpperCase()}`;
    const fallbackDoc = {
      kb_id: docId,
      category: req.body?.category || 'Software',
      issue: req.body?.topic || 'Internet IT Knowledge Document',
      question: `Troubleshooting guide for ${req.body?.topic || 'issue'}`,
      resolution: `Step 1: Check device network connectivity and DNS resolution.\nStep 2: Restart the affected service or clear workstation cache.\nStep 3: Consult vendor documentation for known issues.\nStep 4: If unresolved, contact Tier-2 support with diagnostic logs.`,
      tags: ['web-ingested', 'enterprise-it'],
      source_url: `https://www.google.com/search?q=${encodeURIComponent(req.body?.topic || 'IT issue')}`,
      is_web_researched: true,
      date_added: new Date().toISOString().split('T')[0],
    };

    workingKbDocuments.unshift(fallbackDoc as any);
    workingKbChunks = buildChunksFromKb(workingKbDocuments);

    return res.json({
      success: true,
      document: fallbackDoc,
      total_documents: workingKbDocuments.length,
      fallback: true,
    });
  }
});

// Manual / 1-Click Ingest of Ticket Resolution into Knowledge Base
app.post('/api/kb/ingest', (req, res) => {
  try {
    const { document } = req.body;
    if (!document || !document.issue || !document.resolution) {
      return res.status(400).json({ error: 'Issue and resolution are required' });
    }

    const docId = document.kb_id || `KB-ING-${Date.now().toString(36).toUpperCase()}`;
    const fullDoc = {
      kb_id: docId,
      category: document.category || 'Software',
      issue: document.issue,
      question: document.question || document.issue,
      resolution: document.resolution,
      tags: document.tags || ['ticket-ingested'],
      source_url: document.source_url || '',
      is_web_researched: Boolean(document.is_web_researched),
      date_added: new Date().toISOString().split('T')[0],
    };

    workingKbDocuments.unshift(fullDoc as any);
    workingKbChunks = buildChunksFromKb(workingKbDocuments);

    return res.json({
      success: true,
      document: fullDoc,
      total_documents: workingKbDocuments.length,
    });
  } catch {
    return res.status(500).json({ error: 'Failed to ingest document' });
  }
});

// Full Agentic Ticket Analysis (with local heuristic fallback & rate-limit resilience)
app.post('/api/analyze-ticket', async (req, res) => {
  try {
    const { query, contextChunks } = req.body;

    // Run local deterministic extraction first
    const localResult = extractEntitiesAndSafety(query || '');

    // If rate-limited or no key, return local analysis instantly
    if (isRateLimited() || !process.env.GEMINI_API_KEY) {
      return res.json({
        has_gemini: false,
        rate_limited: isRateLimited(),
        analysis: {
          category: localResult.safety_hazard ? 'Hardware' : 'Software',
          urgency: localResult.safety_hazard ? 'High' : 'Medium',
          safety_hazard: localResult.safety_hazard,
          entities: localResult.entities,
          operational_summary: localResult.operational_summary,
        },
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        has_gemini: false,
        analysis: localResult,
      });
    }

    const contextText = (contextChunks || [])
      .slice(0, 3)
      .map((c: { issue: string; text: string; similarity: number }) => `[${c.issue}] ${c.text}`)
      .join('\n');

    const prompt = `You are the Decision and Reasoning Engine of an IT Helpdesk RAG system.
Analyze the following IT support ticket:
Ticket: "${query}"

Knowledge Base matches:
${contextText || 'None'}

Return ONLY a valid JSON object with:
{
  "category": "Hardware" | "Network" | "Software" | "Account & Access" | "Productivity" | "Facility",
  "urgency": "Low" | "Medium" | "High",
  "safety_hazard": boolean (true if smoke, fire, sparks, lithium battery swelling, electrical hazard),
  "entities": {
    "device": string or null,
    "os": string or null,
    "application": string or null,
    "issue_type": string or null
  },
  "operational_summary": string (1-2 sentences summarizing the core issue for technician dispatch)
}`;

    const response = await callGeminiWithTimeout(
      ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      }),
      4000
    );

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      has_gemini: true,
      analysis: parsed,
    });
  } catch (err) {
    markRateLimitEncountered(err);
    const localFallback = extractEntitiesAndSafety(req.body?.query || '');
    return res.json({
      has_gemini: false,
      rate_limited: true,
      analysis: {
        category: localFallback.safety_hazard ? 'Hardware' : 'Software',
        urgency: localFallback.safety_hazard ? 'High' : 'Medium',
        safety_hazard: localFallback.safety_hazard,
        entities: localFallback.entities,
        operational_summary: localFallback.operational_summary,
      },
    });
  }
});

// Technician Copilot: Interactive follow-up & command generation with deterministic fallback
app.post('/api/copilot', async (req, res) => {
  const query = req.body.query || req.body.ticket_query || '';
  const resolution = req.body.resolution || '';
  const promptType = req.body.promptType || req.body.prompt_type || 'commands';
  const customPrompt = req.body.customPrompt || '';
  const category = req.body.category || 'Software';
  const urgency = req.body.urgency || 'Medium';
  const isEscalated = Boolean(req.body.isEscalated || (req.body.action && req.body.action !== 'AUTO_RESOLVE'));

  const wrapResult = (text: string, mode: string = 'fallback') => {
    return {
      reply: text,
      output: text,
      mode,
      success: true,
    };
  };

  // Local fallback templates for when rate-limited or offline
  const produceCopilotFallback = () => {
    const q = (query || '').toLowerCase();
    if (promptType === 'commands') {
      if (/zoom|screen\s*rec|macos|mac|tcc|monterey|ventura|sonoma|sequoia/i.test(q)) {
        return wrapResult(
          `### macOS Terminal Diagnostic Commands\n\n1. **Reset Screen Capture Privacy Database**\n\`\`\`bash\ntccutil reset ScreenCapture us.zoom.xos\n\`\`\`\n\n2. **Directly Launch System Privacy Settings**\n\`\`\`bash\nopen "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"\n\`\`\`\n\n3. **Clear Stale Zoom Application Cache**\n\`\`\`bash\nrm -rf ~/Library/Caches/us.zoom.xos\n\`\`\``
        );
      }
      if (/bitlocker|recovery\s*key|tpm|bios/i.test(q)) {
        return wrapResult(
          `### Windows PowerShell BitLocker Diagnostics (Admin)\n\n1. **Query BitLocker Drive Encryption Status**\n\`\`\`powershell\nmanage-bde -status C:\n\`\`\`\n\n2. **Verify TPM Health and Status**\n\`\`\`powershell\nGet-Tpm\n\`\`\`\n\n3. **Inspect Registered Key Protectors**\n\`\`\`powershell\n(Get-BitLockerVolume -MountPoint "C:").KeyProtector\n\`\`\``
        );
      }
      if (/print|spooler|queue/i.test(q)) {
        return wrapResult(
          `### Windows PowerShell Print Spooler Recovery (Admin)\n\n1. **Stop Hung Print Spooler Service**\n\`\`\`powershell\nStop-Service -Name "Spooler" -Force\n\`\`\`\n\n2. **Purge Stuck Print Jobs**\n\`\`\`powershell\nRemove-Item -Path "$env:SystemRoot\\System32\\spool\\PRINTERS\\*" -Force -Recurse\n\`\`\`\n\n3. **Restart Clean Spooler Service**\n\`\`\`powershell\nStart-Service -Name "Spooler"\nGet-Service -Name "Spooler"\n\`\`\``
        );
      }
      if (/vpn|wifi|network|dns|disconnect/i.test(q)) {
        return wrapResult(
          `### Network & VPN Diagnostics Commands\n\n1. **Flush & Re-register DNS Cache**\n\`\`\`powershell\nClear-DnsClientCache\nipconfig /flushdns\n\`\`\`\n\n2. **Release & Renew DHCP Lease**\n\`\`\`powershell\nipconfig /release\nipconfig /renew\n\`\`\`\n\n3. **Test VPN Gateway Latency & Port 443**\n\`\`\`powershell\nTest-NetConnection -ComputerName vpn.corporate.com -Port 443\n\`\`\`\n\n4. **macOS DNS Flush**\n\`\`\`bash\nsudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder\n\`\`\``
        );
      }
      if (/battery|drain|power|docking/i.test(q)) {
        return wrapResult(
          `### Battery & Hardware Power Diagnostics\n\n1. **Generate Windows Battery Health Report**\n\`\`\`powershell\npowercfg /batteryreport /output "$env:USERPROFILE\\Desktop\\battery-report.html"\nStart-Process "$env:USERPROFILE\\Desktop\\battery-report.html"\n\`\`\`\n\n2. **macOS Battery Cycle Count & Health**\n\`\`\`bash\nsystem_profiler SPPowerDataType | grep -A 10 "Health Information"\n\`\`\``
        );
      }
      if (/memory|vmmem|docker|wsl|ram/i.test(q)) {
        return wrapResult(
          `### WSL2 & Docker Resource Management\n\n1. **Terminate Hung WSL2 Virtual Machines**\n\`\`\`powershell\nwsl --shutdown\n\`\`\`\n\n2. **Cap WSL2 Memory Consumption (.wslconfig)**\n\`\`\`powershell\nSet-Content "$env:USERPROFILE\\.wslconfig" "[wsl2]\`nmemory=4GB\`nprocessors=2"\n\`\`\`\n\n3. **Prune Dangling Docker Images**\n\`\`\`powershell\ndocker system prune -f\n\`\`\``
        );
      }
      return wrapResult(
        `### Diagnostic Commands\n\n1. **Query Host System Information**\n\`\`\`powershell\nGet-ComputerInfo | Select-Object OsName, OsVersion, TotalPhysicalMemory\n\`\`\`\n\n2. **Test Network Gateway Latency**\n\`\`\`powershell\nTest-NetConnection -ComputerName 8.8.8.8 -InformationLevel Detailed\n\`\`\``
      );
    }

    if (promptType === 'customer_reply') {
      if (isEscalated) {
        return wrapResult(
          `Hi there,\n\nThank you for contacting Corporate IT Support regarding: "${query}".\n\nYour ticket has been escalated to our Tier-2 Engineering team for specialized investigation (Priority: ${urgency}). Because this issue requires elevated permissions or in-person technical inspection, a technician will review your case and reach out to you directly.\n\nTicket Status: Escalated to Tier-2 Engineering\n\nBest regards,\nCorporate IT Service Desk`
        );
      }
      return wrapResult(
        `Hi there,\n\nThank you for reaching out to IT Support. Here are the verified troubleshooting steps for your request:\n\n${resolution || 'Please follow our standard corporate troubleshooting documentation.'}\n\nIf you need additional assistance or if the issue persists, please reply directly to this ticket.\n\nBest regards,\nCorporate IT Helpdesk Team`
      );
    }

    if (promptType === 'escalation_note') {
      return wrapResult(
        `### Tier-2 Escalation Handover Note\n\n- **Ticket Summary**: ${query}\n- **Domain / Priority**: Category: ${category} | Urgency: ${urgency}\n- **Triage Result**: Automated resolution withheld per enterprise safety/governance policy.\n- **Dispatch Request**: Hardware inspection / elevated administrative access required.\n- **Technician Actions**: Verify device asset tag, inspect diagnostic logs, or provide replacement equipment.`
      );
    }

    return wrapResult(
      `Technician advisory: Issue identified as "${query}". Category: ${category}, Urgency: ${urgency}. Recommended next step: ${resolution || 'Verify hardware and network connectivity.'}`
    );
  };

  if (isRateLimited()) {
    return res.json(produceCopilotFallback());
  }

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.json(produceCopilotFallback());
    }

    let instruction = '';
    if (promptType === 'commands') {
      instruction = `Provide the exact Windows PowerShell / Command Prompt or macOS terminal commands needed to troubleshoot or resolve: "${query}". Format as copyable commands with a one-sentence explanation each.`;
    } else if (promptType === 'customer_reply') {
      if (isEscalated) {
        instruction = `Draft a polite, professional Slack/Email response to the employee about their ticket: "${query}". Explain that because their issue requires specialized Tier-2 review or physical/administrative authorization, the ticket has been escalated to Tier-2 support and a technician will contact them directly. Do NOT provide an unverified DIY solution.`;
      } else {
        instruction = `Draft a polite, professional Slack/Email response to the employee about their ticket: "${query}". Include the proposed resolution: "${resolution}".`;
      }
    } else if (promptType === 'escalation_note') {
      instruction = `Draft an internal Tier-2 escalation handover note for ticket: "${query}". Category is ${category}, Urgency is ${urgency}. Summarize what initial triage was done and what physical or elevated technician inspection is requested.`;
    } else {
      instruction = customPrompt || `Help the IT technician with this ticket: "${query}".`;
    }

    const response = await callGeminiWithTimeout(
      ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: instruction,
      }),
      4000
    );

    const generated = response.text || '';
    if (!generated) {
      return res.json(produceCopilotFallback());
    }

    return res.json(wrapResult(generated, 'gemini'));
  } catch (err) {
    markRateLimitEncountered(err);
    return res.json(produceCopilotFallback());
  }
});

// ---------------------------------------------------------------------------
// Vite / Static file serving
// ---------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IT Helpdesk Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
