import { MeetingRecord, MeetingStorage, Commitment, ActionItem } from './MeetingStorage'

export interface DailyStandupDigest {
  dateFormatted: string
  totalMeetings: number
  totalCommitments: number
  pendingCommitments: Array<{
    meetingTitle: string
    responsiblePerson: string
    description: string
    deadline?: string
    detectedAt: string
  }>
  recentDecisions: Array<{
    meetingTitle: string
    decision: string
  }>
  actionItems: Array<{
    meetingTitle: string
    task: string
    assignee: string
    deadline?: string
  }>
}

export class DailyStandupService {
  private static STORAGE_KEY_LAST_DISMISSED = 'skyoffice_standup_last_dismissed'

  /**
   * Verifica se o standup do dia já foi dispensado hoje pelo usuário
   */
  static isStandupDismissedToday(): boolean {
    const lastDismissed = localStorage.getItem(this.STORAGE_KEY_LAST_DISMISSED)
    if (!lastDismissed) return false
    const today = new Date().toDateString()
    return lastDismissed === today
  }

  /**
   * Registra que o standup de hoje foi visto/dispensado
   */
  static dismissStandupToday(): void {
    const today = new Date().toDateString()
    localStorage.setItem(this.STORAGE_KEY_LAST_DISMISSED, today)
  }

  /**
   * Força reset para fins de teste ou reabertura manual
   */
  static resetDismissed(): void {
    localStorage.removeItem(this.STORAGE_KEY_LAST_DISMISSED)
  }

  /**
   * Consolida as reuniões e gera o resumo diário
   */
  static generateDailyStandup(meetings: MeetingRecord[]): DailyStandupDigest {
    const todayFormatted = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })

    const pendingCommitments: DailyStandupDigest['pendingCommitments'] = []
    const recentDecisions: DailyStandupDigest['recentDecisions'] = []
    const actionItems: DailyStandupDigest['actionItems'] = []

    meetings.forEach((m) => {
      // Coleta compromissos pendentes
      m.commitments?.forEach((c) => {
        if (c.status === 'pending') {
          pendingCommitments.push({
            meetingTitle: m.title,
            responsiblePerson: c.responsiblePerson,
            description: c.description,
            deadline: c.deadline,
            detectedAt: c.detectedAt,
          })
        }
      })

      // Coleta decisões
      m.decisions?.forEach((d) => {
        recentDecisions.push({
          meetingTitle: m.title,
          decision: d,
        })
      })

      // Coleta itens de ação
      m.actionItems?.forEach((a) => {
        actionItems.push({
          meetingTitle: m.title,
          task: a.task,
          assignee: a.assignee,
          deadline: a.deadline,
        })
      })
    })

    return {
      dateFormatted: todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1),
      totalMeetings: meetings.length,
      totalCommitments: pendingCommitments.length,
      pendingCommitments,
      recentDecisions: recentDecisions.slice(0, 5),
      actionItems: actionItems.slice(0, 5),
    }
  }
}
