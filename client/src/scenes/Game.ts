import Phaser from 'phaser'

// import { debugDraw } from '../utils/debug'
import { createCharacterAnims } from '../anims/CharacterAnims'

import Item from '../items/Item'
import Chair from '../items/Chair'
import Computer from '../items/Computer'
import Whiteboard from '../items/Whiteboard'
import VendingMachine from '../items/VendingMachine'
import '../characters/MyPlayer'
import '../characters/OtherPlayer'
import MyPlayer from '../characters/MyPlayer'
import OtherPlayer from '../characters/OtherPlayer'
import PlayerSelector from '../characters/PlayerSelector'
import Network from '../services/Network'
import { IPlayer, IClaimedChair } from '../../../types/IOfficeState'
import { PlayerBehavior } from '../../../types/PlayerBehavior'
import { ItemType } from '../../../types/Items'
import { phaserEvents, Event } from '../events/EventCenter'

import store from '../stores'
import { setFocused, setShowChat } from '../stores/ChatStore'
import { NavKeys, Keyboard } from '../../../types/KeyboardState'
import { Pathfinding } from '../utils/Pathfinding'

export default class Game extends Phaser.Scene {
  network!: Network
  private cursors!: NavKeys
  private keyE!: Phaser.Input.Keyboard.Key
  private keyR!: Phaser.Input.Keyboard.Key
  private keyC!: Phaser.Input.Keyboard.Key
  private map!: Phaser.Tilemaps.Tilemap
  myPlayer!: MyPlayer
  private playerSelector!: Phaser.GameObjects.Zone
  private otherPlayers!: Phaser.Physics.Arcade.Group
  otherPlayerMap = new Map<string, OtherPlayer>()
  computerMap = new Map<string, Computer>()
  chairMap = new Map<string, Chair>()
  private whiteboardMap = new Map<string, Whiteboard>()
  private isPanning = false

  constructor() {
    super('game')
  }

  registerKeys() {
    this.cursors = {
      ...this.input.keyboard.createCursorKeys(),
      ...(this.input.keyboard.addKeys('W,S,A,D') as Keyboard),
    }

    // maybe we can have a dedicated method for adding keys if more keys are needed in the future
    this.keyE = this.input.keyboard.addKey('E')
    this.keyR = this.input.keyboard.addKey('R')
    this.keyC = this.input.keyboard.addKey('C')
    this.input.keyboard.disableGlobalCapture()
    this.input.keyboard.on('keydown-ENTER', (event) => {
      store.dispatch(setShowChat(true))
      store.dispatch(setFocused(true))
    })
    this.input.keyboard.on('keydown-ESC', (event) => {
      store.dispatch(setShowChat(false))
    })
  }

  disableKeys() {
    this.input.keyboard.enabled = false
    this.input.keyboard.resetKeys()
  }

  enableKeys() {
    this.input.keyboard.enabled = true
    this.input.keyboard.resetKeys()
  }

  create(data: { network: Network }) {
    if (!data.network) {
      throw new Error('server instance missing')
    } else {
      this.network = data.network
    }

    createCharacterAnims(this.anims)

    this.map = this.make.tilemap({ key: 'tilemap' })
    // Utiliza o tileset extrudado (tileWidth: 32, tileHeight: 32, margin: 1, spacing: 2)
    // Esse é o padrão ouro na indústria/Phaser para eliminar 100% o sub-pixel texture bleeding (linhas/frestas entre tiles)
    const FloorAndGround = this.map.addTilesetImage(
      'FloorAndGround',
      'tiles_wall_extruded',
      32,
      32,
      1,
      2
    )

    const groundLayer = this.map.createLayer('Ground', FloorAndGround)
    groundLayer.setCollisionByProperty({ collides: true })
    groundLayer.skipCull = true
    groundLayer.setCullPadding(4, 4)

    // Piso de mármore personalizado na sala de reunião (colunas 6 a 18, linhas 18 a 23)
    // O piso original é 440x241 em perspectiva isométrica/diamante. Escalonamos para cobrir os blocos 32x32 perfeitamente.
    const marbleTileWidth = 64
    const marbleTileHeight = 32
    for (let my = 18 * 32; my < 24 * 32; my += marbleTileHeight) {
      for (let mx = 6 * 32; mx < 19 * 32; mx += marbleTileWidth) {
        const tile = this.add.image(mx + marbleTileWidth / 2, my + marbleTileHeight / 2, 'marble_floor')
        tile.setDisplaySize(marbleTileWidth, marbleTileHeight)
        tile.setDepth(-10) // Fica abaixo dos avatares, cadeiras e mesas, mas acima do fundo
      }
    }

    // Posição de spawn inicial adaptada ao modelo/tema da sala
    const currentTheme = (store.getState() as any).room?.roomTheme || 'default'
    let spawnX = 705
    let spawnY = 500

    if (currentTheme === 'ti_dev') {
      spawnX = 1050
      spawnY = 640 // Spawna direto na ala dos computadores e servidores de TI
    } else if (currentTheme === 'executive') {
      spawnX = 400
      spawnY = 640 // Spawna dentro da sala de conferência e diretoria
    } else if (currentTheme === 'creative') {
      spawnX = 960
      spawnY = 240 // Spawna no estúdio de design e quadros brancos
    }

    this.myPlayer = this.add.myPlayer(spawnX, spawnY, 'adam', this.network.mySessionId)
    this.playerSelector = new PlayerSelector(this, 0, 0, 16, 16)

    // import chair objects from Tiled map to Phaser
    const chairs = this.physics.add.staticGroup({ classType: Chair })
    const chairLayer = this.map.getObjectLayer('Chair')
    chairLayer.objects.forEach((chairObj, i) => {
      const item = this.addObjectFromTiled(chairs, chairObj, 'chairs', 'chair') as Chair
      // custom properties[0] is the object direction specified in Tiled
      item.itemDirection = chairObj.properties[0].value
      const id = chairObj.id ? `${chairObj.id}` : `chair_${i}`
      item.id = id

      // Teste com a Cadeira Gamer (substitui a primeira cadeira de mesa ou cadeira 334)
      if (chairObj.id === 334 || i === 0) {
        item.setTexture('gamer_chair')
        // Ajusta a escala para ficar proporcional ao grid de 32x32 do jogo (100x163 -> ~38x62)
        item.setScale(0.38)
        // Ajusta o corpo de colisão / física para manter compatibilidade com o grid
        if (item.body) {
          item.body.setSize(32, 64)
          item.body.setOffset((item.width - 32 / 0.38) / 2, (item.height - 64 / 0.38) / 2)
        }
      }

      this.chairMap.set(id, item)
    })

    // import computers objects from Tiled map to Phaser
    const computers = this.physics.add.staticGroup({ classType: Computer })
    const computerLayer = this.map.getObjectLayer('Computer')
    computerLayer.objects.forEach((obj, i) => {
      const item = this.addObjectFromTiled(computers, obj, 'computers', 'computer') as Computer
      item.setDepth(item.y + item.height * 0.27)
      const id = `${i}`
      item.id = id
      this.computerMap.set(id, item)
    })

    // import whiteboards objects from Tiled map to Phaser
    const whiteboards = this.physics.add.staticGroup({ classType: Whiteboard })
    const whiteboardLayer = this.map.getObjectLayer('Whiteboard')
    whiteboardLayer.objects.forEach((obj, i) => {
      const item = this.addObjectFromTiled(
        whiteboards,
        obj,
        'whiteboards',
        'whiteboard'
      ) as Whiteboard
      const id = `${i}`
      item.id = id
      this.whiteboardMap.set(id, item)
    })

    // import vending machine objects from Tiled map to Phaser
    const vendingMachines = this.physics.add.staticGroup({ classType: VendingMachine })
    const vendingMachineLayer = this.map.getObjectLayer('VendingMachine')
    vendingMachineLayer.objects.forEach((obj, i) => {
      this.addObjectFromTiled(vendingMachines, obj, 'vendingmachines', 'vendingmachine')
    })

    // import other objects from Tiled map to Phaser
    this.addGroupFromTiled('Wall', 'tiles_wall', 'FloorAndGround', false)
    this.addGroupFromTiled('Objects', 'office', 'Modern_Office_Black_Shadow', false)
    this.addGroupFromTiled('ObjectsOnCollide', 'office', 'Modern_Office_Black_Shadow', true)
    this.addGroupFromTiled('GenericObjects', 'generic', 'Generic', false)
    this.addGroupFromTiled('GenericObjectsOnCollide', 'generic', 'Generic', true)
    this.addGroupFromTiled('Basement', 'basement', 'Basement', true)

    // Inicializa a malha de navegação para cálculo de rotas com desvio de obstáculos (A*)
    Pathfinding.init(this.map)

    this.otherPlayers = this.physics.add.group({ classType: OtherPlayer })

    this.cameras.main.setZoom(1.0)
    this.cameras.main.setRoundPixels(true)
    this.cameras.main.startFollow(this.myPlayer, true)

    // Suporte a Zoom com níveis de escala estáveis e seguros
    // Níveis de zoom discretos que não geram artefatos ou frestas sub-pixels (exclui o penúltimo nível instável)
    const zoomLevels = [0.8, 1.0, 1.25, 1.5, 2.0]
    let currentZoomIndex = 1 // Padrão: 1.0x

    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: number, deltaY: number) => {
      if (deltaY > 0) {
        // Reduz zoom (afasta a visão)
        if (currentZoomIndex > 0) {
          currentZoomIndex--
          this.cameras.main.setZoom(zoomLevels[currentZoomIndex])
        }
      } else if (deltaY < 0) {
        // Aumenta zoom (aproxima a visão)
        if (currentZoomIndex < zoomLevels.length - 1) {
          currentZoomIndex++
          this.cameras.main.setZoom(zoomLevels[currentZoomIndex])
        }
      }
    })

    // Suporte a Arrastar o Mapa com o Mouse (Pan) com cursor de mãozinha
    let startPanX = 0
    let startPanY = 0
    const canvas = this.game.canvas

    if (canvas) canvas.style.cursor = 'grab'

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Ignora se o clique ocorreu sobre algum elemento HTML da interface
      const target = pointer.event?.target as HTMLElement
      if (target && target.tagName !== 'CANVAS') return

      // Retira o foco de qualquer campo HTML (ex: chat) para liberar o teclado para o jogo
      if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
        document.activeElement.blur()
        store.dispatch(setFocused(false))
      }

      // Duplo-clique no chão centraliza imediatamente no avatar
      if (pointer.event?.detail === 2) {
        this.cameras.main.startFollow(this.myPlayer, true, 0.15, 0.15)
        return
      }

      // Permite arrastar apenas com o botão esquerdo (botão direito reservado para menus)
      if (pointer.button !== 0 && !pointer.leftButtonDown()) return

      this.isPanning = true
      startPanX = pointer.x
      startPanY = pointer.y
      this.cameras.main.stopFollow()
      if (canvas) canvas.style.cursor = 'grabbing'
    })

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isPanning && pointer.isDown) {
        const dx = (startPanX - pointer.x) / this.cameras.main.zoom
        const dy = (startPanY - pointer.y) / this.cameras.main.zoom
        this.cameras.main.scrollX = Math.round(this.cameras.main.scrollX + dx)
        this.cameras.main.scrollY = Math.round(this.cameras.main.scrollY + dy)
        startPanX = pointer.x
        startPanY = pointer.y
      }
    })

    const stopPan = () => {
      if (this.isPanning) {
        this.isPanning = false
        if (canvas) canvas.style.cursor = 'grab'
      }
    }

    this.input.on('pointerup', stopPan)
    this.input.on('gameout', stopPan)

    // Previne menu de contexto do navegador
    this.input.mouse.disableContextMenu()

    this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], groundLayer)
    this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], vendingMachines)

    this.physics.add.overlap(
      this.playerSelector,
      [chairs, computers, whiteboards, vendingMachines],
      this.handleItemSelectorOverlap,
      undefined,
      this
    )

    this.physics.add.overlap(
      this.myPlayer,
      this.otherPlayers,
      this.handlePlayersOverlap,
      undefined,
      this
    )

    // register network event listeners
    this.network.onPlayerJoined(this.handlePlayerJoined, this)
    this.network.onPlayerLeft(this.handlePlayerLeft, this)
    this.network.onMyPlayerReady(this.handleMyPlayerReady, this)
    this.network.onMyPlayerVideoConnected(this.handleMyVideoConnected, this)
    this.network.onPlayerUpdated(this.handlePlayerUpdated, this)
    this.network.onItemUserAdded(this.handleItemUserAdded, this)
    this.network.onItemUserRemoved(this.handleItemUserRemoved, this)
    this.network.onChatMessageAdded(this.handleChatMessageAdded, this)
    // Eventos de vinculação e navegação até a mesa de trabalho
    phaserEvents.on('CHAIR_CLAIMED', (data: IClaimedChair) => {
      const chair = this.chairMap.get(data.chairId)
      if (chair) {
        chair.setClaim(
          { sessionId: data.ownerSessionId, name: data.ownerName, avatar: data.ownerAvatar },
          this.network.mySessionId,
          this.myPlayer.playerName.text
        )
      }
    })

    phaserEvents.on('CHAIR_UNCLAIMED', ({ chairId }: { chairId: string }) => {
      const chair = this.chairMap.get(chairId)
      if (chair) {
        chair.clearClaim()
      }
    })

    phaserEvents.on('CHAIRS_SYNCED', (data: IClaimedChair[]) => {
      data.forEach((claim) => {
        const chair = this.chairMap.get(claim.chairId)
        if (chair) {
          chair.setClaim(
            { sessionId: claim.ownerSessionId, name: claim.ownerName, avatar: claim.ownerAvatar },
            this.network.mySessionId,
            this.myPlayer.playerName.text
          )
        }
      })
    })

    phaserEvents.on('NAVIGATE_TO_MY_DESK', (chair: Chair) => {
      if (this.myPlayer.playerBehavior === PlayerBehavior.SITTING) {
        this.myPlayer.standUp(this.network, this.playerSelector)
      } else {
        this.myPlayer.autoWalkToAndSit(chair, this.network)
      }
    })

    phaserEvents.on('UNCLAIM_DESK', (chairId: string) => {
      if (this.myPlayer.playerBehavior === PlayerBehavior.SITTING) {
        this.myPlayer.standUp(this.network, this.playerSelector)
      }
      this.network.unclaimChair(chairId)
    })

    phaserEvents.on('CHAIR_CLICKED', (chair: Chair) => {
      if (chair.isClaimedByMe(this.network.mySessionId, this.myPlayer.playerName.text)) {
        this.myPlayer.autoWalkToAndSit(chair, this.network)
      } else if (chair.isClaimedByOther(this.network.mySessionId, this.myPlayer.playerName.text)) {
        this.myPlayer.updateDialogBubble(`🔒 Esta mesa é de ${chair.claimedBy?.name}!`)
      } else {
        // Cadeira livre: vincular e caminhar até ela para sentar!
        this.network.claimChair(chair.id, this.myPlayer.playerName.text, this.myPlayer.playerTexture)
        this.myPlayer.autoWalkToAndSit(chair, this.network)
      }
    })

    phaserEvents.on(Event.MY_PLAYER_NAME_CHANGE, (name: string) => {
      this.chairMap.forEach((c) => c.updateBadge(this.network.mySessionId, name))
    })

    // Flush any PLAYER_JOINED events that fired before the Game scene was ready.
    // This handles existing players in the room when we join or after a page refresh.
    this.network.flushPendingPlayers()

    // Sincronização direta e infalível com todos os jogadores presentes no estado do servidor
    if (this.network?.room?.state?.players) {
      this.network.room.state.players.forEach((player: IPlayer, key: string) => {
        if (key !== this.network.mySessionId && !this.otherPlayerMap.has(key)) {
          this.handlePlayerJoined(player, key)
        }
      })
    }

    phaserEvents.on('PLAYER_STREAM_DISCONNECTED', (id: string) => {
      const other = this.otherPlayerMap.get(id)
      if (other) {
        other.setConnected(false)
      }
    })
  }

  private handleItemSelectorOverlap(playerSelector, selectionItem) {
    const currentItem = playerSelector.selectedItem as Item
    // currentItem is undefined if nothing was perviously selected
    if (currentItem) {
      // if the selection has not changed, do nothing
      if (currentItem === selectionItem || currentItem.depth >= selectionItem.depth) {
        return
      }
      // if selection changes, clear pervious dialog
      if (this.myPlayer.playerBehavior !== PlayerBehavior.SITTING) currentItem.clearDialogBox()
    }

    // set selected item and set up new dialog
    playerSelector.selectedItem = selectionItem
    selectionItem.onOverlapDialog()
  }

  private addObjectFromTiled(
    group: Phaser.Physics.Arcade.StaticGroup,
    object: Phaser.Types.Tilemaps.TiledObject,
    key: string,
    tilesetName: string
  ) {
    const actualX = object.x! + object.width! * 0.5
    const actualY = object.y! - object.height! * 0.5
    const obj = group
      .get(actualX, actualY, key, object.gid! - this.map.getTileset(tilesetName).firstgid)
      .setDepth(actualY)
    return obj
  }

  private addGroupFromTiled(
    objectLayerName: string,
    key: string,
    tilesetName: string,
    collidable: boolean
  ) {
    const group = this.physics.add.staticGroup()
    const objectLayer = this.map.getObjectLayer(objectLayerName)
    objectLayer.objects.forEach((object) => {
      const actualX = object.x! + object.width! * 0.5
      const actualY = object.y! - object.height! * 0.5
      group
        .get(actualX, actualY, key, object.gid! - this.map.getTileset(tilesetName).firstgid)
        .setDepth(actualY)
    })
    if (this.myPlayer && collidable)
      this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], group)
  }

  // function to add new player to the otherPlayer group
  private handlePlayerJoined(newPlayer: IPlayer, id: string) {
    if (this.otherPlayerMap.has(id)) return
    const initialTexture = newPlayer.anim?.split('_')[0] || 'adam'
    const otherPlayer = this.add.otherPlayer(newPlayer.x, newPlayer.y, initialTexture, id, newPlayer.name)
    if (newPlayer.anim) {
      otherPlayer.updateOtherPlayer('anim', newPlayer.anim)
    }
    if (newPlayer.readyToConnect) {
      otherPlayer.updateOtherPlayer('readyToConnect', newPlayer.readyToConnect)
    }
    if (newPlayer.videoConnected) {
      otherPlayer.updateOtherPlayer('videoConnected', newPlayer.videoConnected)
    }
    this.otherPlayers.add(otherPlayer)
    this.otherPlayerMap.set(id, otherPlayer)
  }

  // function to remove the player who left from the otherPlayer group
  private handlePlayerLeft(id: string) {
    if (this.otherPlayerMap.has(id)) {
      const otherPlayer = this.otherPlayerMap.get(id)
      if (!otherPlayer) return
      this.otherPlayers.remove(otherPlayer, true, true)
      this.otherPlayerMap.delete(id)
    }
  }

  private handleMyPlayerReady() {
    this.myPlayer.readyToConnect = true
  }

  private handleMyVideoConnected() {
    this.myPlayer.videoConnected = true
  }

  // function to update target position upon receiving player updates
  private handlePlayerUpdated(field: string, value: number | string, id: string) {
    let otherPlayer = this.otherPlayerMap.get(id)
    if (!otherPlayer && this.network?.room?.state?.players?.has(id)) {
      const playerSchema = this.network.room.state.players.get(id)
      if (playerSchema) {
        this.handlePlayerJoined(playerSchema, id)
        otherPlayer = this.otherPlayerMap.get(id)
      }
    }
    otherPlayer?.updateOtherPlayer(field, value)
  }

  private handlePlayersOverlap(myPlayer, otherPlayer) {
    otherPlayer.makeCall(myPlayer, this.network?.webRTC)
  }

  private handleItemUserAdded(playerId: string, itemId: string, itemType: ItemType) {
    if (itemType === ItemType.COMPUTER) {
      const computer = this.computerMap.get(itemId)
      computer?.addCurrentUser(playerId)
    } else if (itemType === ItemType.WHITEBOARD) {
      const whiteboard = this.whiteboardMap.get(itemId)
      whiteboard?.addCurrentUser(playerId)
    }
  }

  private handleItemUserRemoved(playerId: string, itemId: string, itemType: ItemType) {
    if (itemType === ItemType.COMPUTER) {
      const computer = this.computerMap.get(itemId)
      computer?.removeCurrentUser(playerId)
    } else if (itemType === ItemType.WHITEBOARD) {
      const whiteboard = this.whiteboardMap.get(itemId)
      whiteboard?.removeCurrentUser(playerId)
    }
  }

  private handleChatMessageAdded(playerId: string, content: string) {
    const otherPlayer = this.otherPlayerMap.get(playerId)
    otherPlayer?.updateDialogBubble(content)
  }

  private isInMeetingRoom(x: number, y: number): boolean {
    return x >= 180 && x <= 620 && y >= 490 && y <= 830
  }

  update(t: number, dt: number) {
    if (this.myPlayer && this.network) {
      if (!this.input.keyboard.enabled) {
        if (this.myPlayer.playerBehavior === PlayerBehavior.IDLE) {
          this.myPlayer.setVelocity(0, 0)
        }
        return
      }

      if (!this.cursors) return

      this.playerSelector.update(this.myPlayer, this.cursors)
      this.myPlayer.update(this.playerSelector, this.cursors, this.keyE, this.keyR, this.keyC, this.network)

      // Retomada automática da câmera seguindo o avatar
      if (!this.isPanning) {
        const isMoving =
          this.cursors?.left?.isDown ||
          this.cursors?.right?.isDown ||
          this.cursors?.up?.isDown ||
          this.cursors?.down?.isDown ||
          !!this.myPlayer.joystickMovement?.isMoving

        const isFollowing = !!(this.cameras.main as any)._follow

        if (!isFollowing) {
          if (
            isMoving ||
            (this.cameras.main.worldView &&
              !this.cameras.main.worldView.contains(this.myPlayer.x, this.myPlayer.y))
          ) {
            // Se o usuário andou ou o avatar saiu do campo de visão, volta a seguir imediatamente
            this.cameras.main.startFollow(this.myPlayer, true, 0.1, 0.1)
          }
        }
      }

      // Checa automaticamente conexões de reunião (sala de conferência / mesa) e proximidade
      const myInMeeting = this.isInMeetingRoom(this.myPlayer.x, this.myPlayer.y)
      this.otherPlayerMap.forEach((other) => {
        const otherInMeeting = this.isInMeetingRoom(other.x, other.y)
        const dist = Phaser.Math.Distance.Between(this.myPlayer.x, this.myPlayer.y, other.x, other.y)
        const inProximity = dist <= 100

        if ((myInMeeting && otherInMeeting) || inProximity) {
          other.makeCall(this.myPlayer, this.network.webRTC)
        }
      })
    }
  }
}
