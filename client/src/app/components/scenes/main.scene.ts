import {Scene, GameObjects } from 'phaser'
import { Subscription } from 'rxjs'
import {SCENE_MAIN, IMG_TILES} from '../../constants'
import {GameService} from '../../services/game.service'
import { AllPlayerLocationsMessage, MSG_TYPE_ALL_PLAYER_LOCATIONS, MSG_TYPE_PLAYER_JOINED, MSG_TYPE_PLAYER_LOCATION, MSG_TYPE_PLAYER_MOVED, MSG_TYPE_REQUEST_MOVEMENT, PlayerJoinedMessage, PlayerLocationMessage, PlayerMovedMessage, RequestMovementMessage } from '../../messages'
import {Globals, ID_TO_IMG} from '../../model'
import { ScreenMapper } from '../../services/scene-mapper'
import { eventNames } from 'process'

interface OtherPlayer {
  player: number
  sprite: GameObjects.Sprite
}

export class MainScene extends Scene {

    gameSvc: GameService
    me: GameObjects.Sprite
    currX = 5 // spawn location
    currY = 5
    speed = 50
    totalBombs = 1
    currentBombs = 0
    bombSize = 3
    screenMap: ScreenMapper
    game$: Subscription
    animToPlay;
    isLeft = false
    isRight = false
    isUp = false
    isDown = false

    player;
    grid = new Grid(18,14)

    otherPlayer: OtherPlayer[] = []

	constructor() {
        super(SCENE_MAIN)
        this.gameSvc = Globals.injector.get(GameService)
        this.game$ = this.gameSvc.event.subscribe(
        (msg) => {
            switch (msg.type) {
            case MSG_TYPE_PLAYER_LOCATION:
                //const playerLocationMsg: PlayerLocationMessage = msg as PlayerLocationMessage
                var { player, x, y } = msg as PlayerLocationMessage
                if (this.gameSvc.player != player)
                return
                this.screenMap.placeObjectAt(x, y, this.me)
                this.currX = x
                this.currY = y
                break;

            case MSG_TYPE_ALL_PLAYER_LOCATIONS:
                const allPlayerLoc = msg as AllPlayerLocationsMessage
                for (let i = 0; i < allPlayerLoc.players.length; i++) {
                const m = allPlayerLoc.players[i]
                // if the player is us, update our position
                if (m.player == this.gameSvc.player) {
                    this.screenMap.placeObjectAt(m.x, m.y, this.me)
                    this.currX = m.x
                    this.currY = m.y
                    continue
                }
                // other player, create the object
                const newPlayer = this.add.sprite(m.x, m.y, IMG_TILES)
                newPlayer.setFrame(ID_TO_IMG[m.player])
                this.screenMap.placeObjectAt(m.x, m.y, newPlayer)
                this.otherPlayer.push({ player: m.player, sprite: newPlayer })
                }
                break;

            case MSG_TYPE_PLAYER_JOINED:
                var { player, x, y } = msg as PlayerJoinedMessage
                // if it is us, ignore it
                if (this.gameSvc.player == player)
                return

                const newPlayer = this.add.sprite(x, y, IMG_TILES)
                newPlayer.setFrame(ID_TO_IMG[player])
                this.screenMap.placeObjectAt(x, y, newPlayer)
                this.otherPlayer.push({ player, sprite: newPlayer })
                break;

            case MSG_TYPE_PLAYER_MOVED:
                const playerMoved = msg as PlayerMovedMessage
                let sprite = this.me
                // if we add this.me to this.otherPlayer array, then we eliminate the if condition
                if (this.gameSvc.player != playerMoved.player) {
                const idx = this.otherPlayer.findIndex(v => v.player == playerMoved.player)
                sprite = this.otherPlayer[idx].sprite
                }
                // keep the object in sync with the server
                this.screenMap.placeObjectAt(playerMoved.from.x, playerMoved.from.y, sprite)
                this.screenMap.placeObjectAt(playerMoved.to.x, playerMoved.to.y, sprite)
                break

            default:
            }
        })
	}

	preload() {
		// this.load.spritesheet(IMG_TILES, 'assets/64x64.png',
        //     { frameWidth: 64, frameHeight: 64 })
        this.load.spritesheet(IMG_TILES, 'assets/images/myspritesheet.png',
			{ frameWidth: 16, frameHeight: 24, endFrame: 40 })
	}

	create() {
		this.screenMap = new ScreenMapper({
			columns: 24, rows: 16, scene: this
        })
        
        this.me = this.add.sprite(0, 0, IMG_TILES)

        this.player = new Player(this, 3, 3, this.screenMap)


        this.physics.world.enable(this.me)
        this.physics.world.enable(this.player)
        this.me.setFrame(0)
        this.player.setFrame(10)
        this.me.anims.create({key:'up',frames: this.anims.generateFrameNumbers(IMG_TILES, {start: 30, end:34}), frameRate: 5, repeat: -1});
        this.me.anims.create({key:'side',frames: this.anims.generateFrameNumbers(IMG_TILES, {start: 15, end:20}), frameRate: 5, repeat: -1});
        this.me.anims.create({key:'down',frames: this.anims.generateFrameNumbers(IMG_TILES, {start: 2, end:6}), frameRate: 5, repeat: -1});

        this.screenMap.placeObjectAt(this.currX, this.currY, this.me)

        //this.gameSvc.getPlayerLocation()
        this.gameSvc.getAllPlayerLocations()

        this.screenMap.drawGrids()

        const upKey = this.input.keyboard.addKey('W')
        const downKey = this.input.keyboard.addKey('S')
        const leftKey = this.input.keyboard.addKey('A')
        const rightKey = this.input.keyboard.addKey('D')

        upKey.on('down', (event) => {
            this.isUp = true
            this.player.isUp = true
            console.info("player",this.player)
            console.info("me",this.me)
            this.me.anims.play('up')
            this.player.anims.play('up')
        })
        upKey.on('up', (event) => {
            this.isUp = false
            this.me.body.velocity.y = 0
        })
        downKey.on('down', (event) => {
            this.isDown = true
            this.me.anims.play('down')
        })
        downKey.on('up', (event) => {
            this.isDown = false
            this.me.body.velocity.y = 0
        })
        leftKey.on('down', (event) => {
            this.isLeft = true
            this.me.anims.play('side')
        })
        leftKey.on('up', (event) => {
            this.isLeft = false
            this.me.body.velocity.x = 0
        })
        rightKey.on('down', (event) => {
            this.isRight = true
            this.me.anims.play('side')
        })
        rightKey.on('up', (event) => {
            this.isRight = false
            this.me.body.velocity.x = 0
        })
	}


	update() {
        this.player.update()
        if (this.isUp) {
            this.player.body.velocity.y = -this.speed
            this.me.body.velocity.y = -this.speed
            this.me.body.velocity.x = 0
            if (this.me.anims.currentAnim.key != 'up') {
                this.me.anims.play('up')
                this.player.anims.play('up')
            }
        }

        else if (this.isDown) {
            this.me.body.velocity.y = this.speed
            this.me.body.velocity.x = 0
            if (this.me.anims.currentAnim.key != 'down') {
                this.me.anims.play('down')
            }
        }

        else if (this.isLeft) {
            this.me.body.velocity.x = -this.speed
            this.me.body.velocity.y = 0
            this.me.flipX = true
            if (this.me.anims.currentAnim.key != 'side') {
                this.me.anims.play('side')
            }
        }

        else if (this.isRight) {
            this.me.body.velocity.x = this.speed
            this.me.body.velocity.y = 0
            this.me.flipX = false
            if (this.me.anims.currentAnim.key != 'side') {
                this.me.anims.play('side')
            }
        } else if (this.me.anims.currentAnim) {
            if (this.me.anims.currentAnim.key == 'up') {
                this.me.setFrame(29)
            } else if (this.me.anims.currentAnim.key == 'down') {
                this.me.setFrame(1) 
            } else if (this.me.anims.currentAnim.key == 'side'){
                this.me.setFrame(15)
            }
        }
	}
}

class Entity extends Phaser.Physics.Arcade.Sprite {
    screenMap;
    gridPos;
    anchor;
    me
    constructor(scene, x, y, texture, frame = 0) {
        super(scene, x, y, IMG_TILES, frame);
        scene.physics.world.enableBody(this, 0);
        this.me = scene.add.sprite(0, 0, IMG_TILES)
        // this.anchor = .5;
        this.screenMap = texture;
        this.screenMap.placeObjectAt(x, y, this.me)

        if (this.gridPos) {
            // this.screenMap.screenToGrid(this.x, this.y, this.gridPos);
        }
    }

    destroy() {
    //   this.texture.remove(this);
      super.destroy();
    }
  
    kill() {
    }
  }

class Player extends Entity {
    controls;
    speed;
    totalBombs;
    currentBombs;
    bombSize;
    lastGridPos;
    blastThrough;
    alive = true;
    parent;
    isUp = false;
    isDown = false;
    isLeft = false;
    isRight = false;
    upKey;
    downKey;
    leftKey;
    rightKey;

    constructor(game, x, y, grid) {
        super(game, x, y, grid);
        this.speed = 50;
        this.totalBombs = 1;
        this.currentBombs = 0;
        this.bombSize = 3;
        this.body.setCircle(16);
    //   this.lastGridPos = this.gridPos.clone();
        this.blastThrough = true;

        this.upKey = game.input.keyboard.addKey('W')
        this.downKey = game.input.keyboard.addKey('S')
        this.leftKey = game.input.keyboard.addKey('A')
        this.rightKey = game.input.keyboard.addKey('D')

        this.anims.create({key:'up',frames: this.anims.generateFrameNumbers(IMG_TILES, {start: 30, end:34}), frameRate: 5, repeat: -1});
        this.anims.create({key:'side',frames: this.anims.generateFrameNumbers(IMG_TILES, {start: 15, end:20}), frameRate: 5, repeat: -1});
        this.anims.create({key:'down',frames: this.anims.generateFrameNumbers(IMG_TILES, {start: 2, end:6}), frameRate: 5, repeat: -1});
    }
    
    update() {
        super.update();
        // console.info("update calling")
        if (!this.alive) {
            return;
        }
        if (this.isUp) {
            // console.info("isup is called")
            this.body.velocity.y = -this.speed
            this.body.velocity.x = 0
            if (this.anims.currentAnim.key != 'up') {
                this.anims.play('up')
            }
        }

        else if (this.isDown) {
            this.body.velocity.y = this.speed
            this.body.velocity.x = 0
            if (this.anims.currentAnim.key != 'down') {
                this.anims.play('down')
            }
        }

        else if (this.isLeft) {
            this.body.velocity.x = -this.speed
            this.body.velocity.y = 0
            this.flipX = true
            if (this.anims.currentAnim.key != 'side') {
                this.anims.play('side')
            }
        }

        else if (this.isRight) {
            this.body.velocity.x = this.speed
            this.body.velocity.y = 0
            this.flipX = false
            if (this.anims.currentAnim.key != 'side') {
                this.anims.play('side')
            }
        } else if (this.anims.currentAnim) {
            if (this.anims.currentAnim.key == 'up') {
                this.setFrame(29)
            } else if (this.me.anims.currentAnim.key == 'down') {
                this.setFrame(1) 
            } else if (this.me.anims.currentAnim.key == 'side'){
                this.setFrame(15)
            }
        }
        
      if (this.gridPos) {
        this.screenMap.screenToGrid(this.x, this.y, this.gridPos);
      }
  
    //   if (!this.gridPos.equals(this.lastGridPos)) {
    //     this.lastGridPos.copyFrom(this.gridPos);
    //     // this.checkGrid();
    //   }
    }
    
    kill() {
      this.body.enable = false;
      super.kill();
    }
  
    canPlaceBomb(place) {
    //   const item = this.screenMap.getAt(place.x, place.y, this);
    //   if (!item) {
    //     return true;
    //   }
    //   return false;
    }
  
    dropBomb() {    
    //   const place = this.gridPos.clone();
    //   const screenPos = this.grid.gridToScreen(place.x, place.y);
    //   if (this.currentBombs < this.totalBombs && this.canPlaceBomb(place)) {
    //     const bomb = new Bomb(this.scene.game, screenPos.x, screenPos.y, this.grid, this);
    //     this.parent.add(bomb);
    //   }
    }
    
    // checkGrid() {
    //   const item = this.grid.getAt(this.gridPos.x, this.gridPos.y, this);
    //   if (item && item instanceof Pickup) {
    //     item.collect(this);
    //   }
    // }
  }

  class Grid {
    width
    height
    size
    items
    constructor(width, height, size = 32) {
        this.width = width;
        this.height = height;
        this.size = size;
        this.items = [];
    }
  
    add(item) {
      this.items.push(item);
      item.gridPos = this.screenToGrid(item.x, item.y, 0);
    }
  
    remove(item) {
      if (this.items.indexOf(item) !== -1) {
        this.items.splice(this.items.indexOf(item), 1);
      }
    }
  
    getAt(x, y, ignore) {
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        for (let i = 0; i < this.items.length; i++) {
          let item = this.items[i];
          if (item !== ignore && item.gridPos.x === x && item.gridPos.y === y) {
            return item;
          }
        }
        return null;
      }
      return -1;
    }
  
    screenToGrid(x, y, point) {
      if (point) {
        point.x = Math.round(x / this.size);
        point.y = Math.round(y / this.size);
        return point;
      }
      return new Phaser.Geom.Point(Math.round(x / this.size), Math.round(y / this.size));
    }
  
    gridToScreen(x, y, point) {
      if (point) {
        point.x = x * this.size;
        point.y = y * this.size;
        return point;
      }
      return new Phaser.Geom.Point(x * this.size, y * this.size);
    }
  }


