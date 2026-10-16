import Phaser from 'phaser'
import PlayerSelector from './PlayerSelector'
import { PlayerBehavior } from '../../../types/PlayerBehavior'
import { sittingShiftData } from './Player'
import Player from './Player'
import Network from '../services/Network'
import Chair from '../items/Chair'
import Computer from '../items/Computer'
import Whiteboard from '../items/Whiteboard'

import { phaserEvents, Event } from '../events/EventCenter'
import store from '../stores'
import { pushPlayerJoinedMessage } from '../stores/ChatStore'
import { ItemType } from '../../../types/Items'
import { NavKeys } from '../../../types/KeyboardState'
import { JoystickMovement } from '../components/Joystick'
import { openURL } from '../utils/helpers'
import { Pathfinding } from '../utils/Pathfinding'

export default class MyPlayer extends Player {
  private playContainerBody: Phaser.Physics.Arcade.Body
  private chairOnSit?: Chair
  public joystickMovement?: JoystickMovement
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    id: string,
    frame?: string | number
  ) {
    super(scene, x, y, texture, id, frame)
    this.playContainerBody = this.playerContainer.body as Phaser.Physics.Arcade.Body
  }

  setPlayerName(name: string) {
    this.playerName.setText(name)
    phaserEvents.emit(Event.MY_PLAYER_NAME_CHANGE, name)
    store.dispatch(pushPlayerJoinedMessage(name))
  }

  setPlayerTexture(texture: string) {
    this.playerTexture = texture
    this.anims.play(`${this.playerTexture}_idle_down`, true)
    phaserEvents.emit(Event.MY_PLAYER_TEXTURE_CHANGE, this.x, this.y, this.anims.currentAnim.key)
  }

  handleJoystickMovement(movement: JoystickMovement) {
    this.joystickMovement = movement
  }

  public autoWalkPath: Array<{ x: number; y: number }> = []
  public autoWalkTargetChair?: Chair | null
  private autoWalkStartTime = 0

  autoWalkToAndSit(chair: Chair, network: Network) {
    if (this.playerBehavior === PlayerBehavior.SITTING) {
      const parts = this.anims.currentAnim.key.split('_')
      parts[1] = 'idle'
      this.play(parts.join('_'), true)
      this.playerBehavior = PlayerBehavior.IDLE
      this.chairOnSit?.clearDialogBox()
      network.updatePlayer(this.x, this.y, this.anims.currentAnim.key)
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, chair.x, chair.y)
    if (dist <= 25) {
      this.sitOnChair(chair, network)
      return
    }

    // Calcula rota desviando de paredes e obstáculos com A*
    const waypoints = Pathfinding.findPath(this.x, this.y, chair.x, chair.y)
    this.autoWalkPath = waypoints
    this.autoWalkTargetChair = chair
    this.autoWalkStartTime = Date.now()
    this.scene.cameras.main.startFollow(this, true, 0.1, 0.1)
  }

  sitOnChair(chairItem: Chair, network: Network, playerSelector?: PlayerSelector) {
    this.autoWalkPath = []
    this.autoWalkTargetChair = null
    this.setVelocity(0, 0)
    this.playContainerBody.setVelocity(0, 0)

    this.scene.time.addEvent({
      delay: 10,
      callback: () => {
        this.setVelocity(0, 0)
        if (chairItem.itemDirection) {
          this.setPosition(
            chairItem.x + sittingShiftData[chairItem.itemDirection][0],
            chairItem.y + sittingShiftData[chairItem.itemDirection][1]
          ).setDepth(chairItem.depth + sittingShiftData[chairItem.itemDirection][2])

          this.playContainerBody.setVelocity(0, 0)
          this.playerContainer.setPosition(
            chairItem.x + sittingShiftData[chairItem.itemDirection][0],
            chairItem.y + sittingShiftData[chairItem.itemDirection][1] - 30
          )
        }

        this.play(`${this.playerTexture}_sit_${chairItem.itemDirection}`, true)
        if (playerSelector) {
          playerSelector.selectedItem = undefined
          if (chairItem.itemDirection === 'up') {
            playerSelector.setPosition(this.x, this.y - this.height)
          } else {
            playerSelector.setPosition(0, 0)
          }
        }
        network.updatePlayer(this.x, this.y, this.anims.currentAnim.key)
      },
      loop: false,
    })

    chairItem.clearDialogBox()
    chairItem.setDialogBox('Pressione E para levantar')
    this.chairOnSit = chairItem
    this.playerBehavior = PlayerBehavior.SITTING
  }

  update(
    playerSelector: PlayerSelector,
    cursors: NavKeys,
    keyE: Phaser.Input.Keyboard.Key,
    keyR: Phaser.Input.Keyboard.Key,
    keyC: Phaser.Input.Keyboard.Key,
    network: Network
  ) {
    if (!cursors) return

    const item = playerSelector.selectedItem

    if (Phaser.Input.Keyboard.JustDown(keyR)) {
      switch (item?.itemType) {
        case ItemType.COMPUTER:
          const computer = item as Computer
          computer.openDialog(this.playerId, network)
          break
        case ItemType.WHITEBOARD:
          const whiteboard = item as Whiteboard
          whiteboard.openDialog(network)
          break
        case ItemType.VENDINGMACHINE:
          // hacky and hard-coded, but leaving it as is for now
          const url = 'https://www.buymeacoffee.com/skyoffice'
          openURL(url)
          break
      }
    }

    // Tecla C: Vincular mesa
    if (Phaser.Input.Keyboard.JustDown(keyC) && item?.itemType === ItemType.CHAIR) {
      const chairItem = item as Chair
      if (chairItem.isClaimedByOther(network.mySessionId, this.playerName.text)) {
        this.updateDialogBubble(`Esta mesa já pertence a ${chairItem.claimedBy?.name}!`)
      } else {
        network.claimChair(chairItem.id, this.playerName.text, this.playerTexture)
        this.updateDialogBubble('Mesa vinculada!')
      }
      return
    }

    switch (this.playerBehavior) {
      case PlayerBehavior.IDLE:
        // if press E in front of selected chair
        if (Phaser.Input.Keyboard.JustDown(keyE) && item?.itemType === ItemType.CHAIR) {
          const chairItem = item as Chair

          // Se a mesa estiver vinculada a outro membro, não tem permissão para sentar!
          if (chairItem.isClaimedByOther(network.mySessionId, this.playerName.text)) {
            this.updateDialogBubble(`🔒 Esta mesa é de ${chairItem.claimedBy?.name}!`)
            return
          }

          this.sitOnChair(chairItem, network, playerSelector)
          return
        }

        // Se estiver em caminhada automática pela rota planejada desviando de obstáculos:
        if (this.autoWalkPath.length > 0 && this.autoWalkTargetChair) {
          const manualInput =
            cursors.left?.isDown ||
            cursors.right?.isDown ||
            cursors.up?.isDown ||
            cursors.down?.isDown ||
            cursors.A?.isDown ||
            cursors.D?.isDown ||
            cursors.W?.isDown ||
            cursors.S?.isDown ||
            this.joystickMovement?.isMoving

          // Se o jogador pressionar qualquer tecla de movimento manual ou timeout (25s), cancela
          if (manualInput || Date.now() - this.autoWalkStartTime > 25000) {
            this.autoWalkPath = []
            this.autoWalkTargetChair = null
          } else {
            // Próximo waypoint no caminho
            const nextWaypoint = this.autoWalkPath[0]
            const distToWaypoint = Phaser.Math.Distance.Between(
              this.x,
              this.y,
              nextWaypoint.x,
              nextWaypoint.y
            )

            // Se for o último waypoint (a própria cadeira) e estiver perto (<= 24px)
            const isFinalWaypoint = this.autoWalkPath.length === 1
            if (isFinalWaypoint && distToWaypoint <= 24) {
              const targetChair = this.autoWalkTargetChair
              this.sitOnChair(targetChair, network, playerSelector)
              return
            }

            // Se alcançou o waypoint intermediário atual (<= 14px), avança para o próximo waypoint
            if (!isFinalWaypoint && distToWaypoint <= 14) {
              this.autoWalkPath.shift()
              return
            }

            // Move-se em direção ao waypoint atual
            const angle = Phaser.Math.Angle.Between(
              this.x,
              this.y,
              nextWaypoint.x,
              nextWaypoint.y
            )
            const speed = 200
            const autoVx = Math.cos(angle) * speed
            const autoVy = Math.sin(angle) * speed

            this.setVelocity(autoVx, autoVy)
            this.body.velocity.setLength(speed)
            this.playContainerBody.setVelocity(autoVx, autoVy)
            this.playContainerBody.velocity.setLength(speed)
            this.setDepth(this.y)

            if (Math.abs(autoVx) > Math.abs(autoVy)) {
              if (autoVx > 0) {
                this.play(`${this.playerTexture}_run_right`, true)
              } else {
                this.play(`${this.playerTexture}_run_left`, true)
              }
            } else {
              if (autoVy > 0) {
                this.play(`${this.playerTexture}_run_down`, true)
              } else {
                this.play(`${this.playerTexture}_run_up`, true)
              }
            }

            network.updatePlayer(this.x, this.y, this.anims.currentAnim.key)
            return
          }
        }

        const speed = 200
        let vx = 0
        let vy = 0

        let joystickLeft = false
        let joystickRight = false
        let joystickUp = false
        let joystickDown = false

        if (this.joystickMovement?.isMoving) {
          joystickLeft = this.joystickMovement.direction.left
          joystickRight = this.joystickMovement.direction.right
          joystickUp = this.joystickMovement.direction.up
          joystickDown = this.joystickMovement.direction.down
        }

        if (cursors.left?.isDown || cursors.A?.isDown || joystickLeft) vx -= speed
        if (cursors.right?.isDown || cursors.D?.isDown || joystickRight) vx += speed
        if (cursors.up?.isDown || cursors.W?.isDown || joystickUp) {
          vy -= speed
          this.setDepth(this.y) //change player.depth if player.y changes
        }
        if (cursors.down?.isDown || cursors.S?.isDown || joystickDown) {
          vy += speed
          this.setDepth(this.y) //change player.depth if player.y changes
        }
        // update character velocity
        this.setVelocity(vx, vy)
        this.body.velocity.setLength(speed)
        // also update playerNameContainer velocity
        this.playContainerBody.setVelocity(vx, vy)
        this.playContainerBody.velocity.setLength(speed)

        // update animation according to velocity and send new location and anim to server
        if (vx !== 0 || vy !== 0) network.updatePlayer(this.x, this.y, this.anims.currentAnim.key)
        if (vx > 0) {
          this.play(`${this.playerTexture}_run_right`, true)
        } else if (vx < 0) {
          this.play(`${this.playerTexture}_run_left`, true)
        } else if (vy > 0) {
          this.play(`${this.playerTexture}_run_down`, true)
        } else if (vy < 0) {
          this.play(`${this.playerTexture}_run_up`, true)
        } else {
          const parts = this.anims.currentAnim.key.split('_')
          parts[1] = 'idle'
          const newAnim = parts.join('_')
          // this prevents idle animation keeps getting called
          if (this.anims.currentAnim.key !== newAnim) {
            this.play(parts.join('_'), true)
            // send new location and anim to server
            network.updatePlayer(this.x, this.y, this.anims.currentAnim.key)
          }
        }
        break

      case PlayerBehavior.SITTING:
        // back to idle if player press E while sitting
        if (Phaser.Input.Keyboard.JustDown(keyE)) {
          const parts = this.anims.currentAnim.key.split('_')
          parts[1] = 'idle'
          this.play(parts.join('_'), true)
          this.playerBehavior = PlayerBehavior.IDLE
          this.chairOnSit?.clearDialogBox()
          playerSelector.setPosition(this.x, this.y)
          playerSelector.update(this, cursors)
          network.updatePlayer(this.x, this.y, this.anims.currentAnim.key)
        }
        break
    }
  }
}

declare global {
  namespace Phaser.GameObjects {
    interface GameObjectFactory {
      myPlayer(x: number, y: number, texture: string, id: string, frame?: string | number): MyPlayer
    }
  }
}

Phaser.GameObjects.GameObjectFactory.register(
  'myPlayer',
  function (
    this: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    texture: string,
    id: string,
    frame?: string | number
  ) {
    const sprite = new MyPlayer(this.scene, x, y, texture, id, frame)

    this.displayList.add(sprite)
    this.updateList.add(sprite)

    this.scene.physics.world.enableBody(sprite, Phaser.Physics.Arcade.DYNAMIC_BODY)

    const collisionScale = [0.5, 0.2]
    sprite.body
      .setSize(sprite.width * collisionScale[0], sprite.height * collisionScale[1])
      .setOffset(
        sprite.width * (1 - collisionScale[0]) * 0.5,
        sprite.height * (1 - collisionScale[1])
      )

    return sprite
  }
)
