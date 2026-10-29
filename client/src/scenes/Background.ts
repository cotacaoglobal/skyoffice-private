import Phaser from 'phaser'
import { BackgroundMode } from '../../../types/BackgroundMode'

export default class Background extends Phaser.Scene {
  private cloud!: Phaser.Physics.Arcade.Group
  private cloudKey!: string
  private backdropKey!: string

  constructor() {
    super('background')
  }

  create(data: { backgroundMode: BackgroundMode }) {
    const sceneHeight = this.cameras.main.height
    const sceneWidth = this.cameras.main.width
    this.cameras.main.setRoundPixels(true)

    const isGreenHills = data.backgroundMode === BackgroundMode.GREEN_HILLS

    // set texture of images based on the background mode
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
      this.cameras.main.setBackgroundColor('#5b8c34')
    }

    // Add backdrop image
    const backdropImage = this.add.image(sceneWidth / 2, sceneHeight / 2, this.backdropKey)
    const scale = Math.max(sceneWidth / backdropImage.width, sceneHeight / backdropImage.height)
    backdropImage.setScale(scale).setScrollFactor(0)

    // Add sun or moon image (apenas no modo DAY ou NIGHT)
    if (!isGreenHills) {
      const sunMoonImage = this.add.image(sceneWidth / 2, sceneHeight / 2, 'sun_moon')
      const scale2 = Math.max(sceneWidth / sunMoonImage.width, sceneHeight / sunMoonImage.height)
      sunMoonImage.setScale(scale2).setScrollFactor(0)
    }

    // Inicializa o grupo de nuvens (sempre criado para manter a compatibilidade com o physics wrap)
    const frames = this.textures.get(this.cloudKey).getFrameNames()
    this.cloud = this.physics.add.group()

    // Se NÃO for Green Hills, popula as 24 nuvens visíveis
    if (!isGreenHills) {
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
  }

  update(t: number, dt: number) {
    if (this.cloud && this.cloud.children && this.cloud.getLength() > 0) {
      this.physics.world.wrap(this.cloud, 500)
    }
  }
}
