import { MeetingRecord, MeetingStorage, ActionItem, Commitment, TimestampedSegment } from './MeetingStorage'

export class GeminiMeetingService {
  /**
   * Converte um Blob de áudio/vídeo em string Base64
   */
  private static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1] || ''
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  /**
   * Processa uma gravação com a IA (Google Gemini 1.5 Flash)
   * Se a chave não estiver configurada, gera uma estrutura inteligente com base no contexto.
   */
  static async generateMeetingNotes(params: {
    audioBlob?: Blob
    rawTranscript?: string
    meetingTitle?: string
    roomName: string
    participants: string[]
    durationSeconds: number
  }): Promise<MeetingRecord> {
    let apiKey = await MeetingStorage.getApiKeyAsync()
    const durationFormatted = this.formatDuration(params.durationSeconds)
    const title = params.meetingTitle || `Reunião - ${params.roomName}`

    // Se temos chave e áudio ou transcrição, chama a API do Gemini
    if (apiKey) {
      try {
        console.log('[GeminiMeetingService] Iniciando processamento de ata com IA para:', title)
        const result = await this.callGeminiAPI({
          apiKey,
          audioBlob: params.audioBlob,
          rawTranscript: params.rawTranscript,
          roomName: params.roomName,
          participants: params.participants,
        })

        if (result) {
          const meeting: MeetingRecord = {
            id: `meeting-${Date.now()}`,
            title,
            createdAt: new Date().toISOString(),
            durationFormatted,
            roomName: params.roomName,
            participants: params.participants.length > 0 ? params.participants : ['Você'],
            summary: result.summary,
            decisions: result.decisions,
            actionItems: result.actionItems,
            commitments: result.commitments,
            timestampedSegments: result.timestampedSegments,
            transcript: result.transcript || params.rawTranscript || '',
          }
          MeetingStorage.saveMeeting(meeting)
          return meeting
        }
      } catch (err) {
        console.error('Falha na chamada da API Gemini:', err)
      }
    }

    // Fallback inteligente caso a chave ainda não tenha sido inserida
    const fallbackMeeting: MeetingRecord = {
      id: `meeting-${Date.now()}`,
      title,
      createdAt: new Date().toISOString(),
      durationFormatted,
      roomName: params.roomName,
      participants: params.participants.length > 0 ? params.participants : ['Você'],
      summary: [
        `Reunião realizada com sucesso na sala "${params.roomName}" com duração de ${durationFormatted}.`,
        'Gravação de áudio e vídeo capturada em alta definição.',
        'Para transcrição detalhada automatizada via IA, configure sua chave do Google Gemini no painel de configurações.',
      ],
      decisions: [
        'A gravação foi salva localmente e pode ser baixada a qualquer momento.',
        'Pontos deliberados na conversa permanecem disponíveis no histórico deste dispositivo.',
      ],
      actionItems: [
        {
          task: 'Inserir a Chave de API do Gemini na aba Configurações de IA para transcrição completa',
          assignee: params.participants[0] || 'Você',
          deadline: 'Opcional',
        },
      ],
      commitments: [],
      timestampedSegments: [],
      transcript: params.rawTranscript || `[Gravação de ${durationFormatted} finalizada com sucesso.]`,
    }

    MeetingStorage.saveMeeting(fallbackMeeting)
    return fallbackMeeting
  }

  private static async callGeminiAPI(params: {
    apiKey: string
    audioBlob?: Blob
    rawTranscript?: string
    roomName: string
    participants: string[]
  }): Promise<{
    summary: string[]
    decisions: string[]
    actionItems: ActionItem[]
    commitments: Commitment[]
    timestampedSegments: TimestampedSegment[]
    transcript: string
  } | null> {
    const prompt = `Você é um assistente executivo sênior de atas e reuniões corporativas no escritório virtual "${params.roomName}".
Participantes conhecidos: ${params.participants.join(', ') || 'Equipe'}.

Analise o conteúdo da reunião e responda EXCLUSIVAMENTE em formato JSON com o seguinte formato exato (sem blocos markdown adicionais além do json):
{
  "summary": [
    "Ponto principal discutido 1",
    "Ponto principal discutido 2"
  ],
  "decisions": [
    "Decisão tomada 1",
    "Decisão tomada 2"
  ],
  "actionItems": [
    {
      "task": "Descrição da tarefa",
      "assignee": "Nome do responsável",
      "deadline": "Prazo estimado ou Em breve"
    }
  ],
  "commitments": [
    {
      "description": "Descrição do compromisso ou promessa feita",
      "responsiblePerson": "Nome da pessoa que se comprometeu",
      "deadline": "Prazo mencionado ou Em breve",
      "detectedAt": "MM:SS",
      "status": "pending"
    }
  ],
  "timestampedSegments": [
    {
      "timestamp": "MM:SS",
      "speaker": "Nome de quem falou",
      "content": "Resumo do que foi dito nesse momento",
      "type": "summary | decision | commitment | general"
    }
  ],
  "transcript": "Transcrição aproximada ou tópicos detalhados da conversa"
}

IMPORTANTE:
- Em "commitments", identifique todas as PROMESSAS, COMPROMISSOS e PRAZOS mencionados durante a reunião. Inclua quem se comprometeu, o que prometeu fazer e o timestamp aproximado de quando falou isso.
- Em "timestampedSegments", vincule cada trecho importante da conversa ao timestamp aproximado no áudio. Classifique cada segmento como: summary (ponto discutido), decision (decisão tomada), commitment (promessa/compromisso) ou general (outros).
- Os timestamps devem estar no formato MM:SS.`

    const parts: any[] = []

    if (params.audioBlob) {
      const base64Data = await this.blobToBase64(params.audioBlob)
      parts.push({
        inlineData: {
          mimeType: params.audioBlob.type || 'audio/webm',
          data: base64Data,
        },
      })
    }

    if (params.rawTranscript) {
      parts.push({
        text: `Transcrição preliminar capturada:\n${params.rawTranscript}`,
      })
    }

    parts.push({ text: prompt })

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${params.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts,
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Erro na API Gemini (${response.status}): ${errText}`)
    }

    const data = await response.json()
    const contentText = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!contentText) return null

    let cleanedText = contentText.trim()
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```\s*$/, '')
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```\s*$/, '')
    }

    try {
      const parsed = JSON.parse(cleanedText)
      return {
        summary: Array.isArray(parsed.summary) ? parsed.summary : [parsed.summary || ''],
        decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [parsed.decisions || ''],
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
        commitments: Array.isArray(parsed.commitments)
          ? parsed.commitments.map((c: any) => ({
              description: c.description || '',
              responsiblePerson: c.responsiblePerson || '',
              deadline: c.deadline || '',
              detectedAt: c.detectedAt || '00:00',
              status: c.status === 'done' ? 'done' : 'pending',
            }))
          : [],
        timestampedSegments: Array.isArray(parsed.timestampedSegments)
          ? parsed.timestampedSegments.map((s: any) => ({
              timestamp: s.timestamp || '00:00',
              speaker: s.speaker || '',
              content: s.content || '',
              type: ['summary', 'decision', 'commitment', 'general'].includes(s.type)
                ? s.type
                : 'general',
            }))
          : [],
        transcript: parsed.transcript || '',
      }
    } catch (e) {
      console.error('Erro ao fazer parse do JSON do Gemini:', e, contentText)
      return null
    }
  }

  private static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    if (mins === 0) return `${secs} seg`
    return `${mins} min ${secs > 0 ? `${secs}s` : ''}`
  }
}
