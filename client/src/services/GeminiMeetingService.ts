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
   * Consulta a lista de modelos ativos disponíveis para a chave do Gemini
   */
  static async getAvailableModels(apiKey: string): Promise<string[]> {
    const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '')
    const defaultList = [
      'gemini-3.8-flash',
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro',
    ]

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.models)) {
          const contentModels = data.models
            .filter((m: any) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
            .map((m: any) => m.name.replace(/^models\//, ''))

          if (contentModels.length > 0) {
            // Ordena os modelos "flash" primeiro
            contentModels.sort((a: string, b: string) => {
              const aIsFlash = a.includes('flash') ? -1 : 1
              const bIsFlash = b.includes('flash') ? -1 : 1
              return aIsFlash - bIsFlash
            })
            return Array.from(new Set([...contentModels, ...defaultList]))
          }
        }
      }
    } catch (e) {
      console.warn('[GeminiMeetingService] Erro ao listar modelos dinamicamente:', e)
    }

    return defaultList
  }

  /**
   * Testa a validade de uma chave de API do Gemini em tempo real
   */
  static async testApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '')
    if (!cleanKey) {
      return { success: false, message: 'Por favor, insira uma chave de API antes de testar.' }
    }

    const candidateModels = await this.getAvailableModels(cleanKey)
    let lastError = ''

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: 'Responda apenas: OK' }],
              },
            ],
            generationConfig: {
              maxOutputTokens: 10,
            },
          }),
        })

        if (res.ok) {
          return {
            success: true,
            message: `Conexão bem-sucedida com o modelo ${model}! Sua IA está 100% pronta para gerar atas e transcrições.`,
          }
        }

        const errData = await res.json().catch(() => ({}))
        const errMsg = errData.error?.message || `HTTP ${res.status} ${res.statusText}`
        lastError = `[${model}]: ${errMsg}`
      } catch (err) {
        lastError = String(err)
      }
    }

    return {
      success: false,
      message: `Falha na validação com o Google: ${lastError}`,
    }
  }

  /**
   * Processa uma gravação com a IA (Google Gemini 1.5 Flash / 2.0 Flash)
   */
  static async generateMeetingNotes(params: {
    audioBlob?: Blob | null
    rawTranscript?: string
    meetingTitle?: string
    roomName: string
    participants: string[]
    durationSeconds: number
  }): Promise<MeetingRecord> {
    let apiKey = await MeetingStorage.getApiKeyAsync()
    const durationFormatted = this.formatDuration(params.durationSeconds)
    const title = params.meetingTitle || `Reunião - ${params.roomName}`
    const nowIso = new Date().toISOString()
    const participantsList = params.participants.length > 0 ? params.participants : ['Você']

    console.log('[GeminiMeetingService] Processando ata:', {
      title,
      duration: durationFormatted,
      room: params.roomName,
      hasApiKey: Boolean(apiKey),
      hasAudioBlob: Boolean(params.audioBlob),
      audioSize: params.audioBlob?.size || 0,
      hasRawTranscript: Boolean(params.rawTranscript),
    })

    let apiError: string | null = null

    // Se temos chave, tenta gerar via IA multimodal
    if (apiKey) {
      try {
        const result = await this.callGeminiAPI({
          apiKey,
          audioBlob: params.audioBlob,
          rawTranscript: params.rawTranscript,
          roomName: params.roomName,
          participants: participantsList,
          durationFormatted,
        })

        if (result) {
          const meeting: MeetingRecord = {
            id: `meeting-${Date.now()}`,
            title,
            createdAt: nowIso,
            durationFormatted,
            roomName: params.roomName,
            participants: participantsList,
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
      } catch (err: any) {
        apiError = err?.message || String(err)
        console.error('[GeminiMeetingService] Erro na chamada da API Gemini:', apiError)
      }
    }

    // Se não há chave ou se a chamada da API falhou, gera uma ata real baseada no que foi capturado
    const summaryItems: string[] = []
    const decisionItems: string[] = []
    const actionItems: ActionItem[] = []

    if (apiError) {
      summaryItems.push(`⚠️ Aviso da IA: Não foi possível obter resposta do Gemini (${apiError}).`)
      summaryItems.push(`Reunião realizada com sucesso na sala "${params.roomName}" com duração de ${durationFormatted}.`)
    } else if (!apiKey) {
      summaryItems.push(`Reunião realizada com sucesso na sala "${params.roomName}" com duração de ${durationFormatted}.`)
      summaryItems.push('💡 Para atas automáticas com IA generativa avançada, configure sua chave de API do Gemini na aba "Configurações de IA".')
    } else {
      summaryItems.push(`Reunião realizada na sala "${params.roomName}" com duração de ${durationFormatted}.`)
    }

    if (params.rawTranscript && params.rawTranscript.trim().length > 0) {
      summaryItems.push(`Transcrição de áudio capturada com ${params.rawTranscript.split('\n').length} falas registradas.`)
      decisionItems.push('Diálogos e registros da conversa foram preservados na íntegra.')
    } else {
      summaryItems.push('Gravação de áudio e vídeo capturada e salva com sucesso.')
      decisionItems.push('Gravação armazenada no histórico para consulta e download.')
    }

    if (!apiKey) {
      actionItems.push({
        task: 'Configurar a Chave de API do Gemini no menu Configurações de IA',
        assignee: participantsList[0] || 'Você',
        deadline: 'Quando conveniente',
      })
    }

    const fallbackMeeting: MeetingRecord = {
      id: `meeting-${Date.now()}`,
      title,
      createdAt: nowIso,
      durationFormatted,
      roomName: params.roomName,
      participants: participantsList,
      summary: summaryItems,
      decisions: decisionItems.length > 0 ? decisionItems : ['Nenhuma decisão explícita registrada.'],
      actionItems,
      commitments: [],
      timestampedSegments: [],
      transcript:
        params.rawTranscript ||
        `[Gravação da reunião na sala "${params.roomName}" finalizada com sucesso. Duração: ${durationFormatted}]`,
    }

    MeetingStorage.saveMeeting(fallbackMeeting)
    return fallbackMeeting
  }

  private static async callGeminiAPI(params: {
    apiKey: string
    audioBlob?: Blob | null
    rawTranscript?: string
    roomName: string
    participants: string[]
    durationFormatted: string
  }): Promise<{
    summary: string[]
    decisions: string[]
    actionItems: ActionItem[]
    commitments: Commitment[]
    timestampedSegments: TimestampedSegment[]
    transcript: string
  } | null> {
    const prompt = `Você é um assistente executivo sênior especialista em atas e documentação corporativa para a reunião realizada na sala "${params.roomName}" com duração de ${params.durationFormatted}.
Participantes da reunião: ${params.participants.join(', ')}.

Analise todo o conteúdo do áudio e/ou da transcrição das falas fornecidas e gere a ATA COMPLETA da reunião.
Responda EXCLUSIVAMENTE em formato JSON com o seguinte formato exato (sem texto ou blocos markdown adicionais):
{
  "summary": [
    "Resumo detalhado do ponto 1 discutido na reunião",
    "Resumo detalhado do ponto 2 discutido na reunião"
  ],
  "decisions": [
    "Decisão clara e acordada tomada pela equipe",
    "Outra deliberação ou definição"
  ],
  "actionItems": [
    {
      "task": "Descrição clara da tarefa a ser executada",
      "assignee": "Nome do participante responsável (use um dos participantes: ${params.participants.join(', ')})",
      "deadline": "Prazo acordado ou Em breve"
    }
  ],
  "commitments": [
    {
      "description": "Compromisso ou promessa verbal feita por alguém",
      "responsiblePerson": "Nome da pessoa que se comprometeu",
      "deadline": "Prazo mencionado ou A definir",
      "detectedAt": "MM:SS",
      "status": "pending"
    }
  ],
  "timestampedSegments": [
    {
      "timestamp": "MM:SS",
      "speaker": "Nome de quem falou",
      "content": "Resumo do que foi falado neste trecho",
      "type": "summary"
    }
  ],
  "transcript": "Transcrição completa, clara e organizada de tudo o que foi conversado durante a reunião"
}

DIRETRIZES FUNDAMENTAIS:
1. Resuma todos os pontos principais de forma executiva, objetiva e profissional em português do Brasil.
2. Identifique todas as tarefas ("actionItems") distribuindo entre os participantes presentes.
3. Em "transcript", transcreva com fidelidade as falas dos participantes.
4. Se houver áudio e pouca fala, descreva os tópicos contextuais abordados na sala.`

    const parts: any[] = []

    // Adiciona o áudio se disponível e com tamanho aceitável para inline (< 15MB)
    if (params.audioBlob && params.audioBlob.size > 0) {
      if (params.audioBlob.size <= 15 * 1024 * 1024) {
        try {
          const base64Data = await this.blobToBase64(params.audioBlob)
          const mimeType = params.audioBlob.type && params.audioBlob.type.startsWith('audio/')
            ? params.audioBlob.type.split(';')[0]
            : 'audio/webm'

          parts.push({
            inlineData: {
              mimeType,
              data: base64Data,
            },
          })
          console.log(`[GeminiMeetingService] Áudio anexado (${Math.round(params.audioBlob.size / 1024)} KB, ${mimeType})`)
        } catch (e) {
          console.warn('[GeminiMeetingService] Não foi possível converter áudio para Base64:', e)
        }
      } else {
        console.warn(`[GeminiMeetingService] Áudio excede 15MB (${Math.round(params.audioBlob.size / 1024 / 1024)} MB). Priorizando transcrição textual.`)
      }
    }

    if (params.rawTranscript && params.rawTranscript.trim()) {
      parts.push({
        text: `Registros de falas capturados em tempo real durante a reunião:\n${params.rawTranscript}`,
      })
    }

    parts.push({ text: prompt })

    const candidateModels = await this.getAvailableModels(params.apiKey)

    let response: Response | null = null
    let lastError = ''

    for (const model of candidateModels) {
      try {
        console.log(`[GeminiMeetingService] Tentando requisição com modelo: ${model}`)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${params.apiKey}`
        const res = await fetch(url, {
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
              temperature: 0.3,
              responseMimeType: 'application/json',
            },
          }),
        })

        if (res.ok) {
          response = res
          console.log(`[GeminiMeetingService] Sucesso na resposta do modelo: ${model}`)
          break
        } else {
          const errBody = await res.text()
          lastError = `[${model}] (${res.status}): ${errBody}`
          console.warn(`[GeminiMeetingService] Tentativa com modelo ${model} falhou:`, res.status, errBody)
        }
      } catch (err) {
        lastError = String(err)
        console.warn(`[GeminiMeetingService] Exceção na conexão com ${model}:`, err)
      }
    }

    if (!response || !response.ok) {
      throw new Error(`Falha em todos os modelos do Gemini: ${lastError}`)
    }

    const data = await response.json()
    const contentText = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!contentText) {
      throw new Error('O Gemini retornou uma resposta sem conteúdo.')
    }

    let cleanedText = contentText.trim()
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```\s*$/, '')
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```\s*$/, '')
    }

    try {
      const parsed = JSON.parse(cleanedText)
      return {
        summary: Array.isArray(parsed.summary) && parsed.summary.length > 0 ? parsed.summary : [parsed.summary || 'Reunião realizada com sucesso.'],
        decisions: Array.isArray(parsed.decisions) && parsed.decisions.length > 0 ? parsed.decisions : [parsed.decisions || 'Decisões deliberadas na conversa.'],
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
        commitments: Array.isArray(parsed.commitments)
          ? parsed.commitments.map((c: any) => ({
              description: c.description || '',
              responsiblePerson: c.responsiblePerson || '',
              deadline: c.deadline || 'Em breve',
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
        transcript: parsed.transcript || params.rawTranscript || '',
      }
    } catch (e) {
      console.error('[GeminiMeetingService] Erro ao fazer parse do JSON do Gemini:', e, contentText)
      throw new Error('Não foi possível interpretar o formato retornado pela IA.')
    }
  }

  private static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    if (mins === 0) return `${secs} seg`
    return `${mins} min ${secs > 0 ? `${secs}s` : ''}`
  }
}

