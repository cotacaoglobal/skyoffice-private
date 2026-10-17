export enum RoomType {
  LOBBY = 'lobby',
  PUBLIC = 'skyoffice',
  CUSTOM = 'custom',
}

export type RoomTheme = 'default' | 'ti_dev' | 'executive' | 'creative'

export interface IRoomData {
  name: string
  description: string
  password: string | null
  autoDispose: boolean
  theme?: RoomTheme
}
