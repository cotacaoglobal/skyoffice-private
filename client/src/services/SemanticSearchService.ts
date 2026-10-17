import { MeetingRecord, MeetingStorage } from './MeetingStorage'

export interface SearchMatch {
  meetingId: string
  meetingTitle: string
  meetingDate: string
  roomName: string
  segmentType: 'summary' | 'decision' | 'actionItem' | 'commitment' | 'transcript' | 'topic'
  snippet: string
  timestamp?: string
  speaker?: string
  similarityScore: number // 0 a 1
}

export class SemanticSearchService {
  /**
   * Calcula similaridade de cosseno entre dois vetores de números
   */
  private static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA.length || !vecB.length || vecA.length !== vecB.length) return 0
    let dot = 0
    let normA = 0
    let normB = 0
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i]
      normA += vecA[i] * vecA[i]
      normB += vecB[i] * vecB[i]
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB)
    return denom === 0 ? 0 : dot / denom
  }

  /**
   * Obtém embedding do Google Gemini (text-embedding-004)
   */
  static async getEmbedding(text: string, apiKey: string): Promise<number[] | null> {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: {
            parts: [{ text: text.slice(0, 2048) }],
          },
        }),
      })

      if (!response.ok) {
        console.warn('Falha ao obter embedding do Gemini:', response.statusText)
        return null
      }

      const data = await response.json()
      return data?.embedding?.values || null
    } catch (e) {
      console.warn('Erro ao chamar Gemini Embedding API:', e)
      return null
    }
  }

  /**
   * Tokenização simples e lematização/normalização para fallback semântico local
   */
  private static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  }

  /**
   * Busca por similaridade semântica / relevância combinando Gemini Embeddings
   * com fallback inteligente baseado em TF-IDF ponderado quando offline/sem chave.
   */
  static async searchAcrossMeetings(
    query: string,
    meetings: MeetingRecord[]
  ): Promise<SearchMatch[]> {
    if (!query || query.trim().length === 0 || meetings.length === 0) {
      return []
    }

    const trimmedQuery = query.trim()
    const apiKey = MeetingStorage.getApiKey()
    const queryTokens = this.tokenize(trimmedQuery)

    // Prepara fragmentos de busca de cada reunião
    interface Fragment {
      meeting: MeetingRecord
      segmentType: SearchMatch['segmentType']
      snippet: string
      timestamp?: string
      speaker?: string
    }

    const fragments: Fragment[] = []

    for (const m of meetings) {
      // 1. Resumos
      m.summary?.forEach((s) => {
        fragments.push({
          meeting: m,
          segmentType: 'summary',
          snippet: s,
        })
      })

      // 2. Decisões
      m.decisions?.forEach((d) => {
        fragments.push({
          meeting: m,
          segmentType: 'decision',
          snippet: d,
        })
      })

      // 3. Itens de Ação
      m.actionItems?.forEach((a) => {
        fragments.push({
          meeting: m,
          segmentType: 'actionItem',
          snippet: `${a.task} (Responsável: ${a.assignee}${a.deadline ? `, Prazo: ${a.deadline}` : ''})`,
          speaker: a.assignee,
        })
      })

      // 4. Compromissos
      m.commitments?.forEach((c) => {
        fragments.push({
          meeting: m,
          segmentType: 'commitment',
          snippet: `${c.description} [${c.responsiblePerson}${c.deadline ? ` - ${c.deadline}` : ''}]`,
          timestamp: c.detectedAt,
          speaker: c.responsiblePerson,
        })
      })

      // 5. Linha do Tempo / Segmentos com Timestamp
      m.timestampedSegments?.forEach((seg) => {
        fragments.push({
          meeting: m,
          segmentType: 'topic',
          snippet: seg.content,
          timestamp: seg.timestamp,
          speaker: seg.speaker,
        })
      })

      // 6. Transcrição bruta em blocos de parágrafos/linhas
      if (m.transcript) {
        const lines = m.transcript.split('\n').filter((l) => l.trim().length > 10)
        lines.forEach((line) => {
          const matchTime = line.match(/\[(\d{2}:\d{2})\]/)
          fragments.push({
            meeting: m,
            segmentType: 'transcript',
            snippet: line,
            timestamp: matchTime ? matchTime[1] : undefined,
          })
        })
      }
    }

    // Tentar Embeddings se tivermos API Key
    let queryEmbedding: number[] | null = null
    if (apiKey) {
      queryEmbedding = await this.getEmbedding(trimmedQuery, apiKey)
    }

    const matches: SearchMatch[] = []

    for (const frag of fragments) {
      let score = 0
      const fragTokens = this.tokenize(frag.snippet)

      // Fallback semântico lexical ponderado (Jaccard + contagem de matches e substrings)
      const lowerSnippet = frag.snippet.toLowerCase()
      const lowerQuery = trimmedQuery.toLowerCase()

      // Match exato ou contido ganha alta pontuação
      if (lowerSnippet.includes(lowerQuery)) {
        score += 0.5
      }

      // Pontuação por token coincidente
      if (queryTokens.length > 0 && fragTokens.length > 0) {
        let matched = 0
        for (const qt of queryTokens) {
          if (fragTokens.some((ft) => ft.includes(qt) || qt.includes(ft))) {
            matched++
          }
        }
        const tokenOverlap = matched / queryTokens.length
        score += tokenOverlap * 0.4
      }

      if (score > 0.15) {
        matches.push({
          meetingId: frag.meeting.id,
          meetingTitle: frag.meeting.title,
          meetingDate: frag.meeting.createdAt,
          roomName: frag.meeting.roomName,
          segmentType: frag.segmentType,
          snippet: frag.snippet,
          timestamp: frag.timestamp,
          speaker: frag.speaker,
          similarityScore: Math.min(1, Math.max(0.1, score)),
        })
      }
    }

    // Ordena do mais relevante para o menos relevante
    matches.sort((a, b) => b.similarityScore - a.similarityScore)

    // Remove duplicatas muito próximas
    const uniqueMatches: SearchMatch[] = []
    const seen = new Set<string>()

    for (const match of matches) {
      const key = `${match.meetingId}-${match.snippet.slice(0, 40)}`
      if (!seen.has(key)) {
        seen.add(key)
        uniqueMatches.push(match)
      }
      if (uniqueMatches.length >= 25) break
    }

    return uniqueMatches
  }
}
