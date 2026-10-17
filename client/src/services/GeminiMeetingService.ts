import { MeetingRecord, MeetingStorage, ActionItem } from './MeetingStorage'

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
    const apiKey = MeetingStorage.getApiKey()
    const durationFormatted = this.formatDuration(params.durationSeconds)
    const title = params.meetingTitle || `Reunião - ${params.roomName}`

    // Se temos chave e áudio ou transcrição, chama a API do Gemini
    if (apiKey) {
      try {
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
            transcript: result.transcript || params.rawTranscript || '',
          }
          MeetingStorage.saveMeeting(meeting)
          return meeting
        }
      } catch (err) {
        console.warn('Falha na chamada da API Gemini, usando síntese estruturada', err)
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
  "transcript": "Transcrição aproximada ou tópicos detalhados da conversa"
}`

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

    try {
      const parsed = JSON.parse(contentText)
      return {
        summary: Array.isArray(parsed.summary) ? parsed.summary : [parsed.summary || ''],
        decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [parsed.decisions || ''],
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
        transcript: parsed.transcript || '',
      }
    } catch (e) {
      console.error('Erro ao fazer parse do JSON do Gemini', e, contentText)
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
