import Phaser from 'phaser'
import { ItemType } from '../../../types/Items'
import Item from './Item'
import { phaserEvents } from '../events/EventCenter'

export interface IChairClaimData {
  sessionId: string
  name: string
  avatar: string
}

export default class Chair extends Item {
  itemDirection?: string
  id!: string
  claimedBy?: IChairClaimData
  badgeContainer: Phaser.GameObjects.Container

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame)

    this.itemType = ItemType.CHAIR
    this.badgeContainer = this.scene.add.container(this.x, this.y - 48).setDepth(10000)

    // Permite clicar na cadeira com o mouse
    this.setInteractive({ cursor: 'pointer' })
    this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button === 2 || pointer.rightButtonDown()) return
      pointer.event?.stopPropagation()
      phaserEvents.emit('CHAIR_CLICKED', this)
    })
  }

  isClaimedByMe(mySessionId?: string, myName?: string): boolean {
    if (!this.claimedBy) return false
    if (mySessionId && this.claimedBy.sessionId === mySessionId) return true
    if (myName && this.claimedBy.name === myName) return true
    return false
  }

  isClaimedByOther(mySessionId?: string, myName?: string): boolean {
    if (!this.claimedBy) return false
    return !this.isClaimedByMe(mySessionId, myName)
  }

  setClaim(data: IChairClaimData, mySessionId?: string, myName?: string) {
    this.claimedBy = data
    this.updateBadge(mySessionId, myName)
  }

  clearClaim() {
    this.claimedBy = undefined
    this.badgeContainer.removeAll(true)
  }

  updateBadge(mySessionId?: string, myName?: string) {
    this.badgeContainer.removeAll(true)
    if (!this.claimedBy) return

    const isMine = this.isClaimedByMe(mySessionId, myName)
    const ownerName = this.claimedBy.name || 'Membro'
    const labelText = isMine ? 'Minha mesa' : `Mesa de ${ownerName}`

    // 1. Botão de ação (se for minha mesa): Botão circular com ícone de sentar e 'X' para desvincular
    if (isMine) {
      // Botão circular "Sentar na minha mesa"
      const actionBtn = this.scene.add.graphics()
      actionBtn.fillStyle(0x0f172a, 0.95)
      actionBtn.fillCircle(0, -28, 15)
      actionBtn.lineStyle(2, 0x00ebc7, 1)
      actionBtn.strokeCircle(0, -28, 15)

      const chairIcon = this.scene.add
        .text(0, -28, '🪑', { fontSize: '14px' })
        .setOrigin(0.5)

      const hitCircle = this.scene.add.zone(0, -28, 30, 30).setOrigin(0.5)
      hitCircle.setInteractive({ cursor: 'pointer' })
      hitCircle.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation()
        phaserEvents.emit('NAVIGATE_TO_MY_DESK', this)
      })

      // Botão 'X' no canto superior direito para desvincular
      const closeBtnBg = this.scene.add.graphics()
      closeBtnBg.fillStyle(0x6366f1, 1) // Roxo elegante (estilo SoWork)
      closeBtnBg.fillCircle(11, -38, 7.5)
      closeBtnBg.lineStyle(1.5, 0xffffff, 1)
      closeBtnBg.strokeCircle(11, -38, 7.5)

      const closeText = this.scene.add
        .text(11, -38, '✕', {
          fontSize: '9px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)

      const hitClose = this.scene.add.zone(11, -38, 16, 16).setOrigin(0.5)
      hitClose.setInteractive({ cursor: 'pointer' })
      hitClose.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation()
        phaserEvents.emit('UNCLAIM_DESK', this.id)
      })

      this.badgeContainer.add([actionBtn, chairIcon, hitCircle, closeBtnBg, closeText, hitClose])
    }

    // 2. Pílula com o nome / "Minha mesa" (estilo SoWork com cantos arredondados)
    const textObj = this.scene.add
      .text(8, 0, labelText, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: isMine ? '#0f172a' : '#f8fafc',
      })
      .setOrigin(0, 0.5)

    const textWidth = textObj.width
    const pillWidth = Math.max(textWidth + 34, 80)
    const pillHeight = 22
    const pillX = -pillWidth / 2
    const pillY = -pillHeight / 2

    const pillBg = this.scene.add.graphics()
    // Sombra
    pillBg.fillStyle(0x000000, 0.4)
    pillBg.fillRoundedRect(pillX + 1, pillY + 2, pillWidth, pillHeight, 11)

    // Fundo da pílula (Branco brilhante para Minha Mesa, Dark slate para outros)
    pillBg.fillStyle(isMine ? 0xffffff : 0x1e293b, isMine ? 0.98 : 0.92)
    pillBg.fillRoundedRect(pillX, pillY, pillWidth, pillHeight, 11)

    // Borda da pílula
    pillBg.lineStyle(1.5, isMine ? 0x00ebc7 : 0x475569, 1)
    pillBg.strokeRoundedRect(pillX, pillY, pillWidth, pillHeight, 11)

    // Círculo com ícone do avatar
    const avatarCircle = this.scene.add.graphics()
    avatarCircle.fillStyle(isMine ? 0x00ebc7 : 0x64748b, 1)
    avatarCircle.fillCircle(pillX + 11, 0, 7.5)

    const avatarIcon = this.scene.add
      .text(pillX + 11, 0, '👤', { fontSize: '9px' })
      .setOrigin(0.5)

    textObj.setX(pillX + 22)

    if (isMine) {
      // Clicar na pílula também faz caminhar até a mesa e sentar
      const hitPill = this.scene.add.zone(0, 0, pillWidth, pillHeight).setOrigin(0.5)
      hitPill.setInteractive({ cursor: 'pointer' })
      hitPill.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation()
        phaserEvents.emit('NAVIGATE_TO_MY_DESK', this)
      })
      this.badgeContainer.add([pillBg, avatarCircle, avatarIcon, textObj, hitPill])
    } else {
      this.badgeContainer.add([pillBg, avatarCircle, avatarIcon, textObj])
    }
  }

  onOverlapDialog() {
    if (this.claimedBy) {
      const gameInstance = (window as any).game?.scene?.keys?.game
      const mySessionId = gameInstance?.network?.mySessionId
      const myName = gameInstance?.myPlayer?.playerName?.text
      const isMine = this.isClaimedByMe(mySessionId, myName)

      if (isMine) {
        this.setDialogBox('Minha mesa [Pressione E para sentar]')
      } else {
        this.setDialogBox(`🔒 Mesa de ${this.claimedBy.name}`)
      }
      return
    }

    this.setDialogBox('E: Sentar | C: Vincular mesa')
  }

  destroy(fromScene?: boolean) {
    this.badgeContainer.destroy()
    super.destroy(fromScene)
  }
}
