import { MeetingRecord, MeetingStorage } from './MeetingStorage'

export interface ChatMessage {
  id: string
  sender: 'user' | 'bia'
  text: string
  timestamp: string
  references?: Array<{
    meetingId: string
    meetingTitle: string
    snippet: string
  }>
}

export class BiaChatService {
  /**
   * Constrói o contexto consolidado de todas as reuniões para alimentar o prompt
   */
  private static buildMeetingsContext(meetings: MeetingRecord[]): string {
    if (!meetings || meetings.length === 0) {
      return 'Nenhuma ata de reunião cadastrada até o momento.'
    }

    return meetings
      .map((m, idx) => {
        const date = new Date(m.createdAt).toLocaleDateString('pt-BR')
        const summaries = m.summary?.map((s) => `  - ${s}`).join('\n') || '  (Sem resumo)'
        const decisions = m.decisions?.map((d) => `  - ${d}`).join('\n') || '  (Sem decisões)'
        const actions =
          m.actionItems
            ?.map((a) => `  - ${a.task} [Responsável: ${a.assignee}${a.deadline ? `, Prazo: ${a.deadline}` : ''}]`)
            .join('\n') || '  (Sem tarefas)'
        const commitments =
          m.commitments
            ?.map(
              (c) =>
                `  - ${c.description} [Pessoa: ${c.responsiblePerson}${c.deadline ? `, Prazo: ${c.deadline}` : ''}, Horário: ${c.detectedAt}, Status: ${c.status}]`
            )
            .join('\n') || '  (Sem compromissos)'

        return `[REUNIÃO ${idx + 1}] ID: ${m.id}
Título: "${m.title}"
Data: ${date} | Duração: ${m.durationFormatted} | Sala: ${m.roomName}
Participantes: ${m.participants.join(', ')}

RESUMO DOS PONTOS:
${summaries}

DECISÕES TOMADAS:
${decisions}

ITENS DE AÇÃO / TAREFAS:
${actions}

COMPROMISSOS DETECTADOS:
${commitments}
`
      })
      .join('\n---\n\n')
  }

  /**
   * Envia uma pergunta para a assistente Bia
   */
  static async askBia(params: {
    question: string
    chatHistory: ChatMessage[]
    meetings: MeetingRecord[]
  }): Promise<{ text: string; references?: ChatMessage['references'] }> {
    const apiKey = MeetingStorage.getApiKey()
    const context = this.buildMeetingsContext(params.meetings)

    // Se temos a API Key do Gemini configurada, chama o modelo 1.5 Flash
    if (apiKey) {
      try {
        const systemPrompt = `Você é "Bia", uma assistente executiva inteligente e amigável da plataforma de escritório virtual.
Sua missão é responder perguntas da equipe com base EXCLUSIVAMENTE nas atas e histórico de reuniões corporativas fornecidas abaixo.

Histórico de Reuniões:
${context}

Diretrizes de Resposta:
1. Seja clara, objetiva, profissional e prestativa.
2. Sempre que citar uma informação, mencione em qual reunião (Título ou Data) e quem é o responsável se houver.
3. Use formatação limpa em tópicos quando listar itens ou decisões.
4. Se uma informação não constar em nenhuma ata, diga honestamente que não encontrou registro dessa informação nas reuniões gravadas.
5. Se for perguntado sobre compromissos ou prazos, destaque os nomes das pessoas e seus respectivos prazos.`

        const conversationParts = params.chatHistory.slice(-6).map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        }))

        // Adiciona a pergunta atual
        conversationParts.push({
          role: 'user',
          parts: [{ text: params.question }],
        })

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
              contents: conversationParts,
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1024,
              },
            }),
          }
        )

        if (response.ok) {
          const data = await response.json()
          const answer = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (answer) {
            // Tenta vincular referências das reuniões citadas
            const refs: ChatMessage['references'] = []
            params.meetings.forEach((m) => {
              if (
                answer.toLowerCase().includes(m.title.toLowerCase()) ||
                answer.toLowerCase().includes(m.roomName.toLowerCase())
              ) {
                refs.push({
                  meetingId: m.id,
                  meetingTitle: m.title,
                  snippet: m.summary?.[0] || m.decisions?.[0] || 'Registro da reunião',
                })
              }
            })

            return {
              text: answer,
              references: refs.length > 0 ? refs : undefined,
            }
          }
        }
      } catch (e) {
        console.warn('Erro ao chamar Gemini para o chat com a Bia:', e)
      }
    }

    // Fallback inteligente offline caso não haja API Key
    return this.generateOfflineAnswer(params.question, params.meetings)
  }

  /**
   * Resposta offline heurística para demonstração mesmo sem chave de API
   */
  private static generateOfflineAnswer(
    question: string,
    meetings: MeetingRecord[]
  ): { text: string; references?: ChatMessage['references'] } {
    const q = question.toLowerCase()
    const refs: ChatMessage['references'] = []

    if (meetings.length === 0) {
      return {
        text: 'Olá! Ainda não temos nenhuma ata de reunião registrada no histórico. Grave ou importe uma reunião para que eu possa analisar tudo para você!',
      }
    }

    // 1. Perguntas sobre tarefas/prazos
    if (q.includes('tarefa') || q.includes('prazo') || q.includes('fazer') || q.includes('pendent')) {
      const allActions: string[] = []
      meetings.forEach((m) => {
        m.actionItems?.forEach((a) => {
          allActions.push(`• **${a.task}** — Responsável: *${a.assignee}* ${a.deadline ? `(Prazo: ${a.deadline})` : ''} [da reunião "${m.title}"]`)
          refs.push({ meetingId: m.id, meetingTitle: m.title, snippet: a.task })
        })
      })

      if (allActions.length > 0) {
        return {
          text: `Encontrei as seguintes tarefas registradas nas reuniões:\n\n${allActions.join('\n')}\n\n💡 *Dica: Você pode marcar compromissos como concluídos na aba "Atas & Resumos IA".*`,
          references: refs.slice(0, 3),
        }
      }
    }

    // 2. Perguntas sobre compromissos ou promessas
    if (q.includes('compromisso') || q.includes('promess') || q.includes('prometeu')) {
      const allCommits: string[] = []
      meetings.forEach((m) => {
        m.commitments?.forEach((c) => {
          const statusIcon = c.status === 'done' ? '✅' : '⏳'
          allCommits.push(`• ${statusIcon} **${c.responsiblePerson}**: ${c.description} (Prazo: ${c.deadline || 'A definir'}) às ${c.detectedAt}`)
          refs.push({ meetingId: m.id, meetingTitle: m.title, snippet: c.description })
        })
      })

      if (allCommits.length > 0) {
        return {
          text: `Aqui estão os compromissos detectados pela IA:\n\n${allCommits.join('\n')}`,
          references: refs.slice(0, 3),
        }
      }
    }

    // 3. Perguntas sobre decisões
    if (q.includes('decis') || q.includes('decidid') || q.includes('definid')) {
      const allDecisions: string[] = []
      meetings.forEach((m) => {
        m.decisions?.forEach((d) => {
          allDecisions.push(`• **${d}** (em *${m.title}*)`)
          refs.push({ meetingId: m.id, meetingTitle: m.title, snippet: d })
        })
      })

      if (allDecisions.length > 0) {
        return {
          text: `Estas foram as principais decisões tomadas pela equipe:\n\n${allDecisions.join('\n')}`,
          references: refs.slice(0, 3),
        }
      }
    }

    // 4. Resumo geral / última reunião
    const latest = meetings[0]
    refs.push({ meetingId: latest.id, meetingTitle: latest.title, snippet: latest.summary?.[0] || '' })

    return {
      text: `Analisei o histórico das reuniões. Na última reunião (**"${latest.title}"**, realizada em ${new Date(latest.createdAt).toLocaleDateString('pt-BR')}):\n\n` +
        `📌 **Resumo dos pontos principais:**\n${latest.summary.map((s) => `• ${s}`).join('\n')}\n\n` +
        `⚖️ **Decisões:**\n${latest.decisions.map((d) => `• ${d}`).join('\n')}\n\n` +
        `*(Para respostas mais detalhadas e conversacionais em tempo real, configure sua chave de API do Gemini na aba "Configuração de IA")*`,
      references: refs,
    }
  }
}
