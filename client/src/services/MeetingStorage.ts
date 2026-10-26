export interface ActionItem {
  id?: string
  task: string
  assignee: string
  deadline?: string
  status?: 'pending' | 'in_progress' | 'done'
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
  // Controle de sincronizacao entre os membros da sala
  updatedAt?: string
}

const STORAGE_KEY = 'skyoffice_meeting_records'
const GEMINI_API_KEY_STORAGE = 'skyoffice_gemini_api_key'
export const MEETINGS_UPDATED_EVENT = 'skyoffice:meetings-updated'

interface RoomMeetingBridge {
  publish: (meeting: MeetingRecord) => void
  remove: (id: string) => void
}

export class MeetingStorage {
  private static cachedServerKey: string | null = null
  private static roomBridge: RoomMeetingBridge | null = null

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

  static setRoomBridge(bridge: RoomMeetingBridge | null) {
    this.roomBridge = bridge
  }

  private static readStoredMeetings(): MeetingRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return []
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch (err) {
      console.error('Erro ao ler reuniões do localStorage', err)
      return []
    }
  }

  private static writeStoredMeetings(meetings: MeetingRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings))
    } catch (err) {
      console.error('Erro ao salvar reuniões no localStorage', err)
    }
  }

  private static notifyMeetingsUpdated(): void {
    try {
      window.dispatchEvent(new CustomEvent(MEETINGS_UPDATED_EVENT))
    } catch (e) {
      // ambiente sem window (testes)
    }
  }

  private static toSharedPayload(meeting: MeetingRecord): MeetingRecord {
    // videoBlobUrl é uma URL blob: local do navegador de quem gravou e não
    // funciona nos demais clientes. O vídeo permanece apenas com o gravador.
    const { videoBlobUrl, ...shared } = meeting
    return shared
  }

  private static upsertLocalMeeting(meeting: MeetingRecord, preferNewest: boolean): void {
    const current = this.readStoredMeetings()
    const index = current.findIndex((m) => m.id === meeting.id)

    if (index < 0) {
      current.unshift(meeting)
      this.writeStoredMeetings(current)
      return
    }

    const local = current[index]
    if (preferNewest) {
      const localTime = local.updatedAt ? Date.parse(local.updatedAt) : 0
      const incomingTime = meeting.updatedAt ? Date.parse(meeting.updatedAt) : 0
      if (localTime > incomingTime) return
    }

    const merged: MeetingRecord = { ...local, ...meeting }
    // Preserva o vídeo local do gravador quando a atualização vier de fora.
    if (!meeting.videoBlobUrl && local.videoBlobUrl) merged.videoBlobUrl = local.videoBlobUrl
    if (!meeting.videoFileName && local.videoFileName) merged.videoFileName = local.videoFileName

    current[index] = merged
    this.writeStoredMeetings(current)
  }

  private static removeLocalMeeting(id: string): void {
    const current = this.readStoredMeetings()
    this.writeStoredMeetings(current.filter((m) => m.id !== id))
  }

  private static async pushMeetingToServer(meeting: MeetingRecord): Promise<void> {
    const endpoints = [
      `${this.getHttpBaseUrl()}/api/meetings`,
      `${window.location.protocol}//${window.location.hostname}:2567/api/meetings`,
    ]

    for (const url of endpoints) {
      try {
        const res = await this.fetchWithTimeout(
          url,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(meeting),
          },
          5000
        )
        if (res.ok) return
      } catch (e) {
        // tenta o próximo endpoint
      }
    }
  }

  private static async deleteMeetingOnServer(id: string): Promise<void> {
    const endpoints = [
      `${this.getHttpBaseUrl()}/api/meetings/${encodeURIComponent(id)}`,
      `${window.location.protocol}//${window.location.hostname}:2567/api/meetings/${encodeURIComponent(id)}`,
    ]

    for (const url of endpoints) {
      try {
        const res = await this.fetchWithTimeout(url, { method: 'DELETE' }, 5000)
        if (res.ok) return
      } catch (e) {
        // tenta o próximo endpoint
      }
    }
  }

  static getMeetings(): MeetingRecord[] {
    const stored = this.readStoredMeetings()
    if (stored.length > 0) return stored
    return this.getSampleMeetings()
  }

  /**
   * Busca as atas compartilhadas no servidor e mescla com as locais.
   * Garante que todos os membros da sala vejam as atas geradas por qualquer um.
   */
  static async fetchSharedMeetings(): Promise<MeetingRecord[]> {
    const endpoints = [
      `${this.getHttpBaseUrl()}/api/meetings`,
      `${window.location.protocol}//${window.location.hostname}:2567/api/meetings`,
    ]

    for (const url of endpoints) {
      try {
        const res = await this.fetchWithTimeout(url, {}, 5000)
        if (!res.ok) continue
        const contentType = res.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) continue

        const data = await res.json()
        if (!Array.isArray(data)) continue

        data.forEach((meeting) => {
          if (meeting && typeof meeting.id === 'string' && meeting.id) {
            this.upsertLocalMeeting(this.toSharedPayload(meeting), true)
          }
        })
        this.notifyMeetingsUpdated()
        break
      } catch (e) {
        // tenta o próximo endpoint
      }
    }

    return this.getMeetings()
  }

  /** Aplica uma ata recebida de outro membro da sala (via Colyseus). */
  static applyRemoteMeeting(meeting: MeetingRecord): void {
    if (!meeting || typeof meeting.id !== 'string' || !meeting.id) return
    this.upsertLocalMeeting(this.toSharedPayload(meeting), true)
    this.notifyMeetingsUpdated()
  }

  /** Remove localmente uma ata removida por outro membro da sala. */
  static applyRemoteDeletion(id: string): void {
    if (!id) return
    this.removeLocalMeeting(id)
    this.notifyMeetingsUpdated()
  }

  static saveMeeting(meeting: MeetingRecord, publish = true): void {
    try {
      const record: MeetingRecord = { ...meeting, updatedAt: new Date().toISOString() }
      this.upsertLocalMeeting(record, false)
      this.notifyMeetingsUpdated()

      if (!publish) return

      // Atas de exemplo não devem ser compartilhadas com a sala
      if (record.id.startsWith('sample-')) return

      const shared = this.toSharedPayload(record)
      this.pushMeetingToServer(shared).catch(() => {})
      try {
        this.roomBridge?.publish(shared)
      } catch (e) {
        console.warn('Falha ao propagar ata para a sala', e)
      }
    } catch (err) {
      console.error('Erro ao salvar reunião', err)
    }
  }

  static deleteMeeting(id: string): void {
    try {
      this.removeLocalMeeting(id)
      this.notifyMeetingsUpdated()
      this.deleteMeetingOnServer(id).catch(() => {})
      try {
        this.roomBridge?.remove(id)
      } catch (e) {}
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

  static updateActionItemStatus(
    meetingId: string,
    actionIndex: number,
    status: 'pending' | 'in_progress' | 'done'
  ): MeetingRecord | null {
    try {
      const current = this.getMeetings()
      const meeting = current.find((m) => m.id === meetingId)
      if (!meeting || !meeting.actionItems || !meeting.actionItems[actionIndex]) return null

      meeting.actionItems[actionIndex].status = status
      this.saveMeeting(meeting)
      return meeting
    } catch (err) {
      console.error('Erro ao atualizar status do item de ação:', err)
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
