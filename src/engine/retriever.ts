/**
 * Phase 3a: Precision Hybrid Retriever
 * Combines L2-normalized TF-IDF vector similarity with IT-domain term boosting
 */

import { TfidfEmbedder, defaultEmbedder } from './embedder';
import { RetrievedChunk } from '../types';

const DOMAIN_BOOST_MAP: Record<string, string[]> = {
  'KB-ACC-001': ['password', 'reset', 'sspr', 'forgot', 'passphrase', 'identity'],
  'KB-ACC-002': ['mfa', 'push', 'authenticator', '2fa', 'code', 'rolling'],
  'KB-ACC-003': ['locked', 'lockout', 'attempts', 'cooldown', 'bad password'],
  'KB-ACC-004': ['expired', 'expiration', 'domain password', 'lapsed'],
  'KB-ACC-005': ['shared mailbox', 'send-as', 'delegate', 'mailbox'],
  'KB-ACC-006': ['admin', 'elevation', 'makemeadmin', 'installer', 'privileges'],
  'KB-NET-001': ['vpn', 'anyconnect', 'globalprotect', 'disconnect', 'tunneling'],
  'KB-NET-002': ['guest', 'visitor', 'captive portal', 'neverssl', 'ssid'],
  'KB-NET-003': ['802.1x', 'certificate', 'corp-secure', 'handshake'],
  'KB-NET-004': ['dns', 'flushdns', 'lookup', 'intranet', 'resolution'],
  'KB-NET-005': ['ethernet', 'jack', 'rj45', 'rj-45', 'vlan', 'faceplate'],
  'KB-NET-006': ['rdp', 'remote desktop', 'lag', 'latency', 'freeze'],
  'KB-HW-001': ['battery', 'drain', 'draining', 'charge', 'powercfg'],
  'KB-HW-002': ['turn on', 'black screen', 'hard reset', 'power button', 'dead'],
  'KB-HW-003': ['monitor', 'display', 'screen', 'hdmi', 'displayport', 'no signal'],
  'KB-HW-004': ['dock', 'docking', 'usb-c', 'peripherals', 'disconnects'],
  'KB-HW-005': ['printer', 'spooler', 'queue', 'offline', 'papercut', 'print'],
  'KB-HW-006': ['microphone', 'headset', 'mic', 'mute', 'hear me', 'sound'],
  'KB-HW-007': ['smoke', 'fire', 'spark', 'sparks', 'smell', 'burning', 'hot', 'swollen'],
  'KB-SW-001': ['install', 'software', 'company portal', 'self service', 'catalog'],
  'KB-SW-002': ['excel', 'macro', 'xlsm', 'crash', 'crashing', 'safe mode'],
  'KB-SW-003': ['cache', 'cookies', 'browser', 'chrome', 'edge', 'hard refresh'],
  'KB-SW-004': ['screen share', 'zoom', 'macos', 'screen recording', 'monterey'],
  'KB-SW-005': ['pdf', 'acrobat', 'signature', 'digital signature', 'adobe'],
  'KB-SW-006': ['crowdstrike', 'falcon', 'cpu', 'antivirus', 'sentinelone'],
  'KB-SW-007': ['onedrive', 'sync', 'conflict', 'sharepoint'],
  'KB-PRD-001': ['calendar', 'meeting', 'sync', 'exchange', 'outlook'],
  'KB-PRD-002': ['teams', 'notifications', 'banner', 'pop-up', 'alerts'],
  'KB-PRD-003': ['slack', 'dnd', 'mute', 'schedule', 'silence'],
  'KB-PRD-004': ['signature', 'branding', 'email signature', 'logo'],
  'KB-PRD-005': ['airplay', 'miracast', 'cast', 'tv', 'conference', 'meeting room'],
  'KB-FAC-001': ['ergonomic', 'chair', 'standing desk', 'back pain'],
  'KB-FAC-002': ['cold', 'hot', 'ac', 'hvac', 'temperature', 'thermostat', 'freezing'],
  'KB-FAC-003': ['marker', 'whiteboard', 'stationery', 'erasers', 'supplies'],
  'KB-FAC-004': ['badge', 'card', 'rfid', 'lost', 'turnstile', 'keycard'],
  'KB-FAC-005': ['server room', 'escort', 'data center', 'access authorization'],
  'KB-ACC-007': ['okta', 'fastpass', 'device trust', 'certificate', 'passwordless', 'biometrics'],
  'KB-ACC-008': ['entra', 'intune', 'compliance', 'conditional access', 'quarantine', 'company portal'],
  'KB-NET-007': ['wifi', 'roaming', 'intel', 'wpa3', 'disconnect', 'wifi7', 'network'],
  'KB-NET-008': ['zscaler', 'warp', 'mtu', 'packet loss', 'ssh hang', 'zero trust'],
  'KB-HW-008': ['bitlocker', 'recovery key', 'tpm', 'bios', 'blue screen', 'encryption'],
  'KB-HW-009': ['macbook', 'apple silicon', 'dual monitor', 'displaylink', 'mst', 'dock', 'mirroring'],
  'KB-SW-008': ['crowdstrike', 'falcon', 'bsod', 'csagent.sys', 'blue screen', 'safe mode', 'channel file'],
  'KB-SW-009': ['docker', 'wsl2', 'vmmem', 'ram', 'memory leak', 'wslconfig'],
  'KB-SW-010': ['macos', 'sequoia', 'local network', 'privacy', 'ssh', 'terminal'],
  'KB-SW-011': ['outlook', 'new outlook', 'shared mailbox', 'pst', 'archive', 'missing'],
  'KB-PRD-006': ['zoom', 'teams', 'audio', 'echo', 'microphone', 'sound', 'stutter'],
  'KB-PRD-007': ['slack', 'crash', 'black screen', 'hardware acceleration', 'gpu', 'cache'],
};

export class Retriever {
  private embedder: TfidfEmbedder;

  constructor(embedder: TfidfEmbedder = defaultEmbedder) {
    this.embedder = embedder;
  }

  public retrieve(queryText: string, topK: number = 3): RetrievedChunk[] {
    const queryVec = this.embedder.embed(queryText);
    const chunks = this.embedder.getChunks();
    const chunkVectors = this.embedder.getChunkEmbeddings();
    const lowerQuery = queryText.toLowerCase();

    const scored = chunks.map((chunk, idx) => {
      const vectorSim = this.embedder.dotProduct(queryVec, chunkVectors[idx]);

      // Calculate domain keyword boost
      let keywordBoost = 0;
      const boostKeywords = DOMAIN_BOOST_MAP[chunk.kb_id] || [];
      for (const kw of boostKeywords) {
        if (lowerQuery.includes(kw)) {
          keywordBoost += 0.15;
        }
      }
      keywordBoost = Math.min(0.45, keywordBoost);

      // Blended precision score
      let combinedScore = vectorSim * 0.7 + keywordBoost * 0.3;

      // Penalize completely unrelated queries
      if (vectorSim < 0.05 && keywordBoost === 0) {
        combinedScore = Math.min(0.04, vectorSim);
      }

      return {
        chunk_id: chunk.chunk_id,
        kb_id: chunk.kb_id,
        category: chunk.category,
        issue: chunk.issue,
        text: chunk.text,
        similarity: Math.max(0, Math.min(0.98, Number(combinedScore.toFixed(4)))),
      };
    });

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, topK);
  }
}

export const defaultRetriever = new Retriever();

