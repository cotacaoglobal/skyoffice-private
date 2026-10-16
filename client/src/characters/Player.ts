import Phaser from 'phaser'
import { PlayerBehavior } from '../../../types/PlayerBehavior'
/**
 * shifting distance for sitting animation
 * format: direction: [xShift, yShift, depthShift]
 */
export const sittingShiftData = {
  up: [0, 3, -10],
  down: [0, 3, 1],
  left: [0, -8, 10],
  right: [0, -8, 10],
}

export default class Player extends Phaser.Physics.Arcade.Sprite {
  playerId: string
  playerTexture: string
  playerBehavior = PlayerBehavior.IDLE
  readyToConnect = false
  videoConnected = false
  playerName: Phaser.GameObjects.Text
  playerContainer: Phaser.GameObjects.Container
  private playerDialogBubble: Phaser.GameObjects.Container
  private timeoutID?: number

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    id: string,
    frame?: string | number
  ) {
    super(scene, x, y, texture, frame)

    this.playerId = id
    this.playerTexture = texture
    this.setDepth(this.y)

    this.anims.play(`${this.playerTexture}_idle_down`, true)

    this.playerContainer = this.scene.add.container(this.x, this.y - 30).setDepth(5000)

    // add dialogBubble to playerContainer
    this.playerDialogBubble = this.scene.add.container(0, 0).setDepth(5000)
    this.playerContainer.add(this.playerDialogBubble)

    // add playerName to playerContainer
    this.playerName = this.scene.add
      .text(0, 0, '')
      .setFontFamily('-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif')
      .setFontSize(12)
      .setFontStyle('bold')
      .setColor('#0f172a')
      .setStroke('#ffffff', 3)
      .setOrigin(0.5)
      .setResolution(2)
    this.playerContainer.add(this.playerName)

    this.scene.physics.world.enable(this.playerContainer)
    const playContainerBody = this.playerContainer.body as Phaser.Physics.Arcade.Body
    const collisionScale = [0.5, 0.2]
    playContainerBody
      .setSize(this.width * collisionScale[0], this.height * collisionScale[1])
      .setOffset(-8, this.height * (1 - collisionScale[1]) + 6)
  }

  updateDialogBubble(content: string) {
    this.clearDialogBubble()

    const trimmed = content.trim()
    if (!trimmed) return

    // 1. Detecta tipo de mensagem
    const isBroadcast =
      trimmed.includes('📢') ||
      trimmed.toUpperCase().includes('[TRANSMISSÃO]') ||
      trimmed.toUpperCase().includes('TRANSMISSÃO:')

    const isHandWave =
      trimmed.includes('✋') ||
      trimmed.includes('👋') ||
      trimmed.toLowerCase().includes('mão levantada') ||
      trimmed.toLowerCase().includes('levantou a mão') ||
      trimmed.toLowerCase().includes('acen')

    const isEmoji =
      /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]){1,2}$/.test(
        trimmed
      )

    // 2. Parâmetros visuais e temporais por tipo
    let displayText = trimmed
    let duration = 6000
    let wrapWidth = 180
    let fontSize = 12
    let fontColor = '#0f172a'
    let fontStyle = 'bold'
    let bgColor = 0xffffff
    let bgAlpha = 0.98
    let borderColor = 0x334155
    let borderWidth = 1.5
    let shadowAlpha = 0.35
    let padX = 12
    let padY = 7
    let borderRadius = 8

    if (isBroadcast) {
      duration = 12000 // 12 segundos para transmissão
      wrapWidth = 230
      fontSize = 12
      fontColor = '#ffffff'
      fontStyle = 'bold'
      bgColor = 0x111827 // Dark slate premium
      bgAlpha = 0.98
      borderColor = 0xf43f5e // Rose-500 vibrante e chamativo
      borderWidth = 2.5
      shadowAlpha = 0.55
      padX = 14
      padY = 9
      borderRadius = 10

      // Formatação destacada para transmissão
      const cleanMsg = trimmed.replace(/^📢\s*(\[TRANSMISSÃO\]:?)?\s*/i, '').trim()
      displayText = `📢 TRANSMISSÃO\n${cleanMsg.length <= 140 ? cleanMsg : cleanMsg.substring(0, 140) + '...'}`
    } else if (isHandWave) {
      duration = 10000 // 10 segundos para aceno / mão levantada
      wrapWidth = 190
      fontSize = 13
      fontColor = '#fef08a' // Amarelo dourado vivo
      fontStyle = 'bold'
      bgColor = 0x1c1917 // Obsidian escuro
      bgAlpha = 0.98
      borderColor = 0xf59e0b // Âmbar 500
      borderWidth = 2.5
      shadowAlpha = 0.5
      padX = 14
      padY = 8
      borderRadius = 12
      displayText = trimmed.length <= 70 ? trimmed : trimmed.substring(0, 70) + '...'
    } else if (isEmoji) {
      duration = 5000
      wrapWidth = 60
      fontSize = 22
      fontColor = '#000000'
      fontStyle = 'normal'
      bgColor = 0xffffff
      bgAlpha = 1
      borderColor = 0x00ebc7 // SkyOffice teal
      borderWidth = 2
      shadowAlpha = 0.3
      padX = 10
      padY = 6
      borderRadius = 16
    } else {
      displayText = trimmed.length <= 80 ? trimmed : trimmed.substring(0, 80) + '...'
    }

    // 3. Criação do elemento de texto com alta resolução anti-serrilhado
    const innerText = this.scene.add
      .text(0, 0, displayText, {
        wordWrap: { width: wrapWidth, useAdvancedWrap: true },
        align: 'center',
      })
      .setFontFamily('-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif')
      .setFontSize(fontSize)
      .setFontStyle(fontStyle)
      .setColor(fontColor)
      .setLineSpacing(isBroadcast ? 4 : 2)
      .setOrigin(0.5)
      .setResolution(2)

    // 4. Dimensionamento e posicionamento sem sobrepor o nome
    const innerTextWidth = innerText.width
    const innerTextHeight = innerText.height

    const dialogBoxWidth = Math.max(innerTextWidth + padX * 2, isEmoji ? 36 : 48)
    const dialogBoxHeight = Math.max(innerTextHeight + padY * 2, isEmoji ? 36 : 28)

    const nameHeight = this.playerName.height || 14
    const tailHeight = 6
    const gapAboveName = 6
    const dialogBoxY = -nameHeight / 2 - gapAboveName - tailHeight - dialogBoxHeight
    const dialogBoxX = -dialogBoxWidth / 2

    innerText.setPosition(0, dialogBoxY + dialogBoxHeight / 2)

    // 5. Desenha sombra e caixa gráfica
    const graphics = this.scene.add.graphics()

    // Sombra projetada
    const shadowOffsetX = 2
    const shadowOffsetY = 3
    graphics.fillStyle(0x000000, shadowAlpha)
    graphics.fillRoundedRect(
      dialogBoxX + shadowOffsetX,
      dialogBoxY + shadowOffsetY,
      dialogBoxWidth,
      dialogBoxHeight,
      borderRadius
    )

    // Fundo do balão
    graphics.fillStyle(bgColor, bgAlpha)
    graphics.fillRoundedRect(dialogBoxX, dialogBoxY, dialogBoxWidth, dialogBoxHeight, borderRadius)

    // Cauda / Ponteiro apontando para a cabeça do avatar
    const tailWidth = isEmoji ? 8 : 10
    const tailX = 0
    const tailY = dialogBoxY + dialogBoxHeight

    graphics.beginPath()
    graphics.moveTo(tailX - tailWidth / 2, tailY - 0.5)
    graphics.lineTo(tailX, tailY + tailHeight)
    graphics.lineTo(tailX + tailWidth / 2, tailY - 0.5)
    graphics.closePath()
    graphics.fillPath()

    // Borda nítida de contorno
    graphics.lineStyle(borderWidth, borderColor, 1)
    graphics.strokeRoundedRect(dialogBoxX, dialogBoxY, dialogBoxWidth, dialogBoxHeight, borderRadius)

    // Contorno da cauda
    graphics.beginPath()
    graphics.moveTo(tailX - tailWidth / 2, tailY)
    graphics.lineTo(tailX, tailY + tailHeight)
    graphics.lineTo(tailX + tailWidth / 2, tailY)
    graphics.strokePath()

    // 6. Adiciona ao container
    this.playerDialogBubble.add(graphics)
    this.playerDialogBubble.add(innerText)

    // 7. Auto-limpeza após término do tempo
    this.timeoutID = window.setTimeout(() => {
      this.clearDialogBubble()
    }, duration)
  }

  clearDialogBubble() {
    clearTimeout(this.timeoutID)
    this.playerDialogBubble.removeAll(true)
  }
}
