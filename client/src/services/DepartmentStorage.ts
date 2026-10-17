import { RoomTheme } from '../../../types/Rooms'

export interface DepartmentMember {
  id: string
  name: string
  role: 'admin' | 'member' | 'guest'
  email?: string
}

export interface DepartmentRoom {
  id: string
  name: string
  description: string
  theme: RoomTheme
  accessType: 'open' | 'members_only' | 'password'
  password?: string | null
  allowedMembers: string[] // nomes ou identificadores de quem pode entrar
  createdAt: string
  isPermanent: boolean
}

export class DepartmentStorage {
  private static STORAGE_KEY = 'skyoffice_departments_v1'

  private static defaultDepartments: DepartmentRoom[] = [
    {
      id: 'dept-geral',
      name: 'Escritório Geral',
      description: 'Espaço compartilhado para toda a empresa e convivência geral',
      theme: 'default',
      accessType: 'open',
      allowedMembers: [],
      createdAt: new Date().toISOString(),
      isPermanent: true,
    },
    {
      id: 'dept-ti',
      name: 'Squad TI & Infra',
      description: 'Desenvolvimento de software, infraestrutura e monitoramento',
      theme: 'ti_dev',
      accessType: 'open',
      allowedMembers: ['Wanderson Felipe', 'Carlos Mendes', 'Dev Team'],
      createdAt: new Date().toISOString(),
      isPermanent: true,
    },
    {
      id: 'dept-executivo',
      name: 'Diretoria & Reuniões Executivas',
      description: 'Alinhamento estratégico, reuniões com clientes e tomadas de decisão',
      theme: 'executive',
      accessType: 'members_only',
      allowedMembers: ['Wanderson Felipe', 'Diretoria'],
      createdAt: new Date().toISOString(),
      isPermanent: true,
    },
    {
      id: 'dept-design',
      name: 'Design & Marketing',
      description: 'Criação de interfaces, branding e ideação de produtos',
      theme: 'creative',
      accessType: 'open',
      allowedMembers: ['Ana Paula'],
      createdAt: new Date().toISOString(),
      isPermanent: true,
    },
  ]

  /**
   * Obtém a lista de departamentos salvos (ou inicia com os padrões)
   */
  static getDepartments(): DepartmentRoom[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) {
        this.saveAllDepartments(this.defaultDepartments)
        return this.defaultDepartments
      }
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : this.defaultDepartments
    } catch (e) {
      console.warn('Erro ao carregar departamentos:', e)
      return this.defaultDepartments
    }
  }

  /**
   * Salva toda a lista de departamentos
   */
  static saveAllDepartments(departments: DepartmentRoom[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(departments))
    } catch (e) {
      console.error('Erro ao salvar departamentos:', e)
    }
  }

  /**
   * Adiciona ou atualiza um departamento
   */
  static upsertDepartment(dept: DepartmentRoom): void {
    const list = this.getDepartments()
    const index = list.findIndex((d) => d.id === dept.id)
    if (index >= 0) {
      list[index] = dept
    } else {
      list.push(dept)
    }
    this.saveAllDepartments(list)
  }

  /**
   * Remove um departamento (se não for permanente de sistema)
   */
  static deleteDepartment(id: string): void {
    const list = this.getDepartments().filter((d) => d.id !== id)
    this.saveAllDepartments(list)
  }

  /**
   * Verifica se um usuário tem permissão para entrar em um departamento
   */
  static canUserAccess(dept: DepartmentRoom, userName: string): boolean {
    if (dept.accessType === 'open') return true
    if (!userName) return false
    const normalized = userName.trim().toLowerCase()
    return dept.allowedMembers.some(
      (m) => m.toLowerCase().includes(normalized) || normalized.includes(m.toLowerCase())
    )
  }
}
