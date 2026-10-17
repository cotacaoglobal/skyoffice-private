export interface ActionItem {
  task: string
  assignee: string
  deadline?: string
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
  transcript?: string
}

const STORAGE_KEY = 'skyoffice_meeting_records'
const GEMINI_API_KEY_STORAGE = 'skyoffice_gemini_api_key'

export class MeetingStorage {
  static getApiKey(): string {
    return localStorage.getItem(GEMINI_API_KEY_STORAGE) || ''
  }

  static setApiKey(key: string): void {
    localStorage.setItem(GEMINI_API_KEY_STORAGE, key.trim())
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
        transcript:
          '[00:01] Felipe: Bom dia a todos, vamos começar nosso alinhamento semanal.\n[00:15] Ana: Bom dia! Os dados da sprint passada já estão consolidados.\n[01:05] Carlos: O desempenho do WebRTC na VPS está muito estável após os ajustes.\n[02:30] Felipe: Excelente. Vamos focar agora em finalizar o gravador e a IA de atas.',
      },
    ]
  }
}
