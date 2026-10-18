export interface ActionItem {
  id?: string
  task: string
  assignee: string
  deadline?: string
  status?: 'pending' | 'done'
}

export interface Commitment {
  description: string
  responsiblePerson: string
  deadline?: string
  detectedAt: string // timestamp no áudio, ex: "02:34"
  status: 'pending' | 'done'
}

export interface TimestampedSegment {
  timestamp: string // ex: "01:23"
  speaker?: string
  content: string
  type: 'summary' | 'decision' | 'commitment' | 'general'
}

export interface MeetingPulse {
  alignmentLevel: 'Alto' | 'Médio' | 'Baixo' | string
  tone: string // ex: "Produtivo e Colaborativo"
  focusArea: string // ex: "Técnico e Operacional"
  efficiencyRating: string // ex: "Alta Eficiência"
}

export interface StrategicInsight {
  type: 'risk' | 'blind_spot' | 'recommendation'
  title: string
  description: string
}

export interface MeetingRecord {
  id: string
  title: string
  createdAt: string
  durationFormatted: string
  roomName: string
  participants: string[]
  videoBlobUrl?: string
  videoFileName?: string
  summary: string[]
  decisions: string[]
  actionItems: ActionItem[]
  commitments: Commitment[]
  timestampedSegments: TimestampedSegment[]
  transcript?: string
  // Novas inteligências corporativas
  pulse?: MeetingPulse
  insights?: StrategicInsight[]
}

const STORAGE_KEY = 'skyoffice_meeting_records'
const GEMINI_API_KEY_STORAGE = 'skyoffice_gemini_api_key'

export class MeetingStorage {
  private static cachedServerKey: string | null = null

  static getHttpBaseUrl(): string {
    const protocol = window.location.protocol
    const port = window.location.port
    if (import.meta.env.VITE_SERVER_URL) {
      return import.meta.env.VITE_SERVER_URL.replace('ws', 'http').replace('/colyseus', '')
    }
    if (port === '2567' || port === '5173' || port === '3000') {
      return `${protocol}//${window.location.hostname}:2567`
    }
    return `${protocol}//${window.location.host}`
  }

  static getApiKey(): string {
    if (this.cachedServerKey) return this.cachedServerKey
    return (localStorage.getItem(GEMINI_API_KEY_STORAGE) || '').trim().replace(/^["']|["']$/g, '')
  }

  private static async fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 3000): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, { ...options, signal: controller.signal })
      clearTimeout(timer)
      return res
    } catch (err) {
      clearTimeout(timer)
      throw err
    }
  }

  static async getApiKeyAsync(): Promise<string> {
    if (this.cachedServerKey) return this.cachedServerKey

    const endpoints = [
      `${this.getHttpBaseUrl()}/api/office-settings`,
      `${window.location.protocol}//${window.location.hostname}:2567/api/office-settings`,
    ]

    for (const url of endpoints) {
      try {
        const res = await this.fetchWithTimeout(url, {}, 3000)
        if (res.ok) {
          const contentType = res.headers.get('content-type') || ''
          if (contentType.includes('application/json')) {
            const data = await res.json()
            if (data.geminiApiKey) {
              const cleanKey = String(data.geminiApiKey).trim().replace(/^["']|["']$/g, '')
              this.cachedServerKey = cleanKey
              localStorage.setItem(GEMINI_API_KEY_STORAGE, cleanKey)
              return cleanKey
            }
          }
        }
      } catch (e) {
        // tenta o próximo endpoint
      }
    }

    const localKey = this.getApiKey()
    // Se temos localKey mas o servidor não tinha, sincroniza para o servidor
    if (localKey) {
      this.cachedServerKey = localKey
      this.syncKeyToServer(localKey).catch(() => {})
    }
    return localKey
  }

  static async syncKeyToServer(key: string): Promise<boolean> {
    const trimmed = key.trim().replace(/^["']|["']$/g, '')
    const endpoints = [
      `${this.getHttpBaseUrl()}/api/office-settings`,
      `${window.location.protocol}//${window.location.hostname}:2567/api/office-settings`,
    ]

    for (const url of endpoints) {
      try {
        const res = await this.fetchWithTimeout(
          url,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ geminiApiKey: trimmed }),
          },
          3000
        )
        if (res.ok) return true
      } catch (e) {
        // tenta o próximo endpoint
      }
    }
    return false
  }

  static async setApiKey(key: string): Promise<void> {
    const trimmed = key.trim().replace(/^["']|["']$/g, '')
    this.cachedServerKey = trimmed
    localStorage.setItem(GEMINI_API_KEY_STORAGE, trimmed)
    await this.syncKeyToServer(trimmed)
  }

  static getMeetings(): MeetingRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return this.getSampleMeetings()
      return JSON.parse(data)
    } catch (err) {
      console.error('Erro ao ler reuniões do localStorage', err)
      return this.getSampleMeetings()
    }
  }

  static saveMeeting(meeting: MeetingRecord): void {
    try {
      const current = this.getMeetings()
      // Não duplica se já existir
      const updated = [meeting, ...current.filter((m) => m.id !== meeting.id)]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (err) {
      console.error('Erro ao salvar reunião', err)
    }
  }

  static deleteMeeting(id: string): void {
    try {
      const current = this.getMeetings()
      const updated = current.filter((m) => m.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (err) {
      console.error('Erro ao deletar reunião', err)
    }
  }

  static toggleActionItemStatus(meetingId: string, actionIndex: number): MeetingRecord | null {
    try {
      const current = this.getMeetings()
      const meeting = current.find((m) => m.id === meetingId)
      if (!meeting || !meeting.actionItems || !meeting.actionItems[actionIndex]) return null

      const currentStatus = meeting.actionItems[actionIndex].status || 'pending'
      meeting.actionItems[actionIndex].status = currentStatus === 'done' ? 'pending' : 'done'

      this.saveMeeting(meeting)
      return meeting
    } catch (err) {
      console.error('Erro ao alternar status do item de ação:', err)
      return null
    }
  }

  private static getSampleMeetings(): MeetingRecord[] {
    return [
      {
        id: 'sample-1',
        title: 'Alinhamento Semanal - Squad Produto',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        durationFormatted: '34 min',
        roomName: 'Sala de Reunião 1',
        participants: ['Felipe Rocha', 'Ana Paula', 'Carlos Mendes'],
        summary: [
          'Apresentação dos resultados da sprint anterior com 94% de entrega das metas.',
          'Validação da nova interface do escritório virtual no estilo pixel art.',
          'Discussão sobre a transição dos servidores para a VPS própria.',
        ],
        decisions: [
          'Ficou decidido que o estilo retrô arcade será o padrão visual oficial de todos os modais.',
          'As gravações serão armazenadas localmente com opção de download imediato em alta resolução.',
          'Próxima reunião técnica marcada para sexta-feira às 15h.',
        ],
        actionItems: [
          {
            task: 'Implementar a integração com a API Gemini para transcrição de atas',
            assignee: 'Felipe Rocha',
            deadline: 'Sexta-feira',
          },
          {
            task: 'Revisar os limites de banda WebRTC com a equipe na VPS',
            assignee: 'Carlos Mendes',
            deadline: 'Amanhã',
          },
          {
            task: 'Criar o checklist de boas-vindas para novos membros no escritório',
            assignee: 'Ana Paula',
            deadline: 'Segunda-feira',
          },
        ],
        commitments: [
          {
            description: 'Felipe vai entregar a integração com Gemini até sexta-feira',
            responsiblePerson: 'Felipe Rocha',
            deadline: 'Sexta-feira',
            detectedAt: '02:30',
            status: 'pending',
          },
          {
            description: 'Carlos vai revisar os limites de banda WebRTC amanhã',
            responsiblePerson: 'Carlos Mendes',
            deadline: 'Amanhã',
            detectedAt: '01:05',
            status: 'pending',
          },
          {
            description: 'Ana vai criar o checklist de boas-vindas até segunda-feira',
            responsiblePerson: 'Ana Paula',
            deadline: 'Segunda-feira',
            detectedAt: '02:45',
            status: 'done',
          },
        ],
        timestampedSegments: [
          {
            timestamp: '00:01',
            speaker: 'Felipe Rocha',
            content: 'Abertura do alinhamento semanal',
            type: 'general',
          },
          {
            timestamp: '00:15',
            speaker: 'Ana Paula',
            content: 'Apresentação dos resultados da sprint anterior com 94% de entrega das metas',
            type: 'summary',
          },
          {
            timestamp: '01:05',
            speaker: 'Carlos Mendes',
            content: 'WebRTC na VPS está estável — compromisso de revisar limites de banda amanhã',
            type: 'commitment',
          },
          {
            timestamp: '02:30',
            speaker: 'Felipe Rocha',
            content: 'Decisão de priorizar o gravador e IA de atas como próximo foco da equipe',
            type: 'decision',
          },
        ],
        transcript:
          '[00:01] Felipe: Bom dia a todos, vamos começar nosso alinhamento semanal.\n[00:15] Ana: Bom dia! Os dados da sprint passada já estão consolidados.\n[01:05] Carlos: O desempenho do WebRTC na VPS está muito estável após os ajustes.\n[02:30] Felipe: Excelente. Vamos focar agora em finalizar o gravador e a IA de atas.',
        pulse: {
          alignmentLevel: 'Alto',
          tone: 'Produtivo e Colaborativo',
          focusArea: 'Arquitetura e Produto',
          efficiencyRating: 'Alta Eficiência (92%)',
        },
        insights: [
          {
            type: 'risk',
            title: 'Gargalo de Banda em Picos de Conexão WebRTC',
            description:
              'A transição para VPS exige monitoramento proativo da quota de transferência para evitar degradação de vídeo em reuniões com mais de 8 participantes simultâneos.',
          },
          {
            type: 'blind_spot',
            title: 'Ausência de Fallback para Modelos Gemini Descontinuados',
            description:
              'Recomenda-se listar dinamicamente os modelos ativos da API do Gemini para evitar falhas silenciosas caso versões como gemini-2.0 sejam aposentadas pela Google.',
          },
          {
            type: 'recommendation',
            title: 'Sincronização Contínua de Tarefas',
            description:
              'Permitir que itens de ação da ata sejam marcados como concluídos diretamente na interface de atas melhora a governança e o acompanhamento pós-reunião.',
          },
        ],
      },
    ]
  }
}
