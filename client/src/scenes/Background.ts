import Phaser from 'phaser'
import { BackgroundMode } from '../../../types/BackgroundMode'

export default class Background extends Phaser.Scene {
  private cloud?: Phaser.Physics.Arcade.Group
  private cloudKey!: string
  private backdropKey!: string
  private backdropImage?: Phaser.GameObjects.Image
  private sunMoonImage?: Phaser.GameObjects.Image

  constructor() {
    super('background')
  }

  create(data: { backgroundMode: BackgroundMode }) {
    this.cameras.main.setRoundPixels(true)

    const isGreenHills = data.backgroundMode === BackgroundMode.GREEN_HILLS

    // Define chaves e cor de fundo de acordo com o modo
    if (data.backgroundMode === BackgroundMode.DAY) {
      this.backdropKey = 'backdrop_day'
      this.cloudKey = 'cloud_day'
      this.cameras.main.setBackgroundColor('#c6eefc')
    } else if (data.backgroundMode === BackgroundMode.NIGHT) {
      this.backdropKey = 'backdrop_night'
      this.cloudKey = 'cloud_night'
      this.cameras.main.setBackgroundColor('#2c4464')
    } else {
      this.backdropKey = 'skybox_green_hills'
      this.cloudKey = 'cloud_day'
      this.cameras.main.setBackgroundColor('#000000')
    }

    // Adiciona imagem de fundo
    this.backdropImage = this.add.image(0, 0, this.backdropKey).setScrollFactor(0)

    // Filtro linear para imagem de alta resolução (evita pixelização serrilhada)
    if (isGreenHills && this.backdropImage.texture) {
      this.backdropImage.texture.setFilter(Phaser.Textures.FilterMode.LINEAR)
    }

    // Sol, lua e nuvens são adicionados APENAS nos modos clássicos (DAY / NIGHT)
    if (!isGreenHills) {
      this.sunMoonImage = this.add.image(0, 0, 'sun_moon').setScrollFactor(0)

      const sceneWidth = this.scale.width
      const sceneHeight = this.scale.height
      const frames = this.textures.get(this.cloudKey).getFrameNames()
      this.cloud = this.physics.add.group()
      for (let i = 0; i < 24; i++) {
        const x = Phaser.Math.RND.between(-sceneWidth * 0.5, sceneWidth * 1.5)
        const y = Phaser.Math.RND.between(sceneHeight * 0.2, sceneHeight * 0.8)
        const velocity = Phaser.Math.RND.between(15, 30)

        this.cloud
          .get(x, y, this.cloudKey, frames[i % 6])
          .setScale(3)
          .setVelocity(velocity, 0)
      }
    }

    // Posiciona e ajusta a escala para preencher perfeitamente a tela (cover)
    this.layoutImages()

    // Ouve evento de redimensionamento da janela do navegador
    this.scale.on('resize', this.handleResize, this)
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.handleResize, this)
    })
  }

  private layoutImages() {
    const sceneWidth = this.scale.width
    const sceneHeight = this.scale.height

    if (this.backdropImage) {
      this.backdropImage.setPosition(sceneWidth / 2, sceneHeight / 2)
      const scale = Math.max(
        sceneWidth / this.backdropImage.width,
        sceneHeight / this.backdropImage.height
      )
      this.backdropImage.setScale(scale)
    }

    if (this.sunMoonImage) {
      this.sunMoonImage.setPosition(sceneWidth / 2, sceneHeight / 2)
      const scale = Math.max(
        sceneWidth / this.sunMoonImage.width,
        sceneHeight / this.sunMoonImage.height
      )
      this.sunMoonImage.setScale(scale)
    }
  }

  private handleResize() {
    this.layoutImages()
  }

  update(t: number, dt: number) {
    if (this.cloud) {
      this.physics.world.wrap(this.cloud, 500)
    }
  }
}
