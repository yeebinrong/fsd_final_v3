import {Scene, GameObjects } from 'phaser'
import { Subscription } from 'rxjs'
import {SCENE_MAIN, IMG_PLAYER, IMG_ENV} from '../../constants'
import { WebSocketService } from '../../services/websocket.service'

import { AllPlayerLocationsMessage, MSG_TYPE_ALL_PLAYER_LOCATIONS, MSG_TYPE_PLAYER_JOINED, MSG_TYPE_PLAYER_LOCATION, MSG_TYPE_PLAYER_MOVED, MSG_TYPE_REQUEST_MOVEMENT, PlayerJoinedMessage, PlayerLocationMessage, PlayerMovedMessage, RequestMovementMessage } from '../../messages'
import {Globals} from '../../model'
import { ScreenMapper } from '../../services/scene-mapper'

interface OtherPlayer {
  player: number
  sprite: GameObjects.Sprite
}

export class MainScene extends Scene {

    socketSvc: WebSocketService
    screenMap: ScreenMapper
    game$: Subscription
    isLeft = false
    isRight = false
    isUp = false
    isDown = false
    currX;
    currY;
    background = {}

    player;
    // grid = new Grid(18,14)
    allPlayers = {}
    allPlayerSpawn = {};

	constructor() {
        super(SCENE_MAIN)
        this.socketSvc = Globals.injector.get(WebSocketService)
        this.game$ = this.socketSvc.event.subscribe(
        (msg) => {
            switch (msg.type) {
            // case 'set_player_id':
            //     this.socketSvc.setPlayer(msg['id'])
            //     console.info("MY ID IS",this.socketSvc.getPlayer())
            //     break;
            case 'generate_rock':
                    this.background = msg['tiles']
                    console.info(this.background)
                break;
            case MSG_TYPE_PLAYER_LOCATION:
                const playerLocationMsg: PlayerLocationMessage = msg as PlayerLocationMessage
                var { player, x, y } = msg as PlayerLocationMessage
                const test = this.socketSvc.getPlayer()
                    if (test == null) {
                        this.socketSvc.setPlayer(player)
                    }
                    const id = "p" + player
                    this.allPlayerSpawn[id] = {}
                    this.allPlayerSpawn[id].x = x
                    this.allPlayerSpawn[id].y = y
                    if (!!this.screenMap) {
                        const id = "p" + player
                        const other = new Player(this, x, y, this.screenMap)
                        this.allPlayers[id] = {}
                        this.allPlayers[id].player = other
                        this.screenMap.placeObjectAt(x, y, other.me)  
                        return
                    }                
                break;
            // case MSG_TYPE_ALL_PLAYER_LOCATIONS:
            //     const allPlayerLoc = msg as AllPlayerLocationsMessage
            //     for (let i = 0; i < allPlayerLoc.players.length; i++) {
            //     const m = allPlayerLoc.players[i]
            //     // if the player is us, update our position
            //     if (m.player == this.gameSvc.player) {
            //         this.screenMap.placeObjectAt(m.x, m.y, this.me)
            //         this.currX = m.x
            //         this.currY = m.y
            //         continue
            //     }
            //     // other player, create the object
            //     const newPlayer = this.add.sprite(m.x, m.y, IMG_PLAYER)
            //     newPlayer.setFrame(ID_TO_IMG[m.player])
            //     this.screenMap.placeObjectAt(m.x, m.y, newPlayer)
            //     this.otherPlayer.push({ player: m.player, sprite: newPlayer })
            //     }
            //     break;

            // case MSG_TYPE_PLAYER_JOINED:
            //     var { player, x, y } = msg as PlayerJoinedMessage
            //     // if it is us, ignore it
            //     if (this.gameSvc.player == player)
            //     return

            //     const newPlayer = this.add.sprite(x, y, IMG_PLAYER)
            //     newPlayer.setFrame(ID_TO_IMG[player])
            //     this.screenMap.placeObjectAt(x, y, newPlayer)
            //     this.otherPlayer.push({ player, sprite: newPlayer })
            //     break;

            case MSG_TYPE_PLAYER_MOVED:
                const playerMoved = msg as PlayerMovedMessage
                console.info(playerMoved)
                switch (playerMoved.key) {
                    case "up_down": 
                        this.allPlayers["p" + playerMoved.player].player.isUp = true
                        this.allPlayers["p" + playerMoved.player].player.me.anims.play('up')

                        // this.player.isUp = true
                        // this.player.me.anims.play('up')
                    break;
                    case "up_up":
                        this.allPlayers["p" + playerMoved.player].player.isUp = false
                        this.allPlayers["p" + playerMoved.player].player.me.body.velocity.y = 0
                    break;
                    case "down_down": 
                    this.allPlayers["p" + playerMoved.player].player.isDown = true
                    this.allPlayers["p" + playerMoved.player].player.me.anims.play('down')
                    break;
                    case "down_up":
                        this.allPlayers["p" + playerMoved.player].player.isDown = false
                        this.allPlayers["p" + playerMoved.player].player.me.body.velocity.y = 0
                    break; 
                    case "left_down":
                        this.allPlayers["p" + playerMoved.player].player.isLeft = true
                        this.allPlayers["p" + playerMoved.player].player.me.anims.play('side')
                    break;
                    case "left_up":
                        this.allPlayers["p" + playerMoved.player].player.isLeft = false
                        this.allPlayers["p" + playerMoved.player].player.me.body.velocity.x = 0
                    break;
                    case "right_down":
                        this.allPlayers["p" + playerMoved.player].player.isRight = true
                        this.allPlayers["p" + playerMoved.player].player.me.anims.play('side')
                    break;
                    case "right_up":
                        this.allPlayers["p" + playerMoved.player].player.isRight = false
                        this.allPlayers["p" + playerMoved.player].player.me.body.velocity.x = 0
                    break;
                    case "space":
                        this.allPlayers["p" + playerMoved.player].player.dropBomb()
                    break;
                }
                // let sprite = this.me
                // if we add this.me to this.otherPlayer array, then we eliminate the if condition
                // if (this.gameSvc.player != playerMoved.player) {
                // const idx = this.otherPlayer.findIndex(v => v.player == playerMoved.player)
                // sprite = this.otherPlayer[idx].sprite
                // }
                // // keep the object in sync with the server
                // this.screenMap.placeObjectAt(playerMoved.from.x, playerMoved.from.y, sprite)
                // this.screenMap.placeObjectAt(playerMoved.to.x, playerMoved.to.y, sprite)
                break

            default:
            }
        })
	}

	preload() {
        this.load.spritesheet(IMG_PLAYER, 'assets/images/myspritesheet_player.png',
            { frameWidth: 16, frameHeight: 24, endFrame: 40 })
        this.load.spritesheet(IMG_ENV, 'assets/images/myspritesheet_bomb.png',
            { frameWidth: 16, frameHeight: 16, endFrame: 40 })
        }

	create() {
		this.screenMap = new ScreenMapper({
			columns: 17, rows: 13, scene: this
        })

        for (let x = 0; x <= 17; x++) {
            for (let y = 0; y <= 13; y++) {
                if (x ==  0 || x == 16 || y == 0 || y == 12) {
                    const wall = new Wall(this ,x ,y , this.screenMap)
                    wall.me.ignoreDestroy = true
                    this.screenMap.add(wall.me)
                }
                else if ((x >= 0.1 && x < 17 && !(x%2) && (y > 0 && y < 11  && !(y%2)))) {
                    const wall = new Wall(this ,x ,y , this.screenMap)
                    wall.me.ignoreDestroy = true
                    this.screenMap.add(wall.me)
                }
                else if (x > 0 && x < 17 && y > 0 && y <= 13 && !(x == 1 && y == 1) && !(x == 15 && y == 11) && !(x == 15 && y == 1) && !(x == 1 && y == 11) && !(x == 1 && y == 2) && !(x == 2 && y == 1) && !(x == 14 && y == 11) && !(x == 14 && y == 1) && !(x == 2 && y == 11) && !(x == 15 && y == 10) && !(x == 15 && y == 2) && !(x == 1 && y == 10)) {
                    const px = "x" + x
                    const py = "y" + y
                    if (this.background[px]) {
                        if (this.background[px][py] == "bricks") {
                            console.info("true")
                              const bricks = new Bricks(this, x , y , this.screenMap);
                              this.screenMap.add(bricks.me);
                        }
                    }
                }
            }
        }

        // for (let x = 0; x <= 17; x++) {
        //     for (let y = 0; y <= 13; y++) {
        //         if (x ==  0 || x == 16 || y == 0 || y == 12) {
        //             if (this.background[`${x}`][`${y}`] == true) {
        //                 console.info("true")
        //             }
        //             // const wall = new Wall(this ,x ,y , this.screenMap)
        //             // wall.me.ignoreDestroy = true
        //             // this.screenMap.add(wall.me)
        //         }
        //         else if ((x >= 0.1 && x < 17 && !(x%2) && (y > 0 && y < 11  && !(y%2)))) {
        //             // const wall = new Wall(this ,x ,y , this.screenMap)
        //             // wall.me.ignoreDestroy = true
        //             // this.screenMap.add(wall.me)
        //         }
        //         else if (x > 0 && x < 17 && y > 0 && y <= 13 && Math.random() > 0.25 && !(x == 1 && y == 1) && !(x == 15 && y == 11) && !(x == 15 && y == 1) && !(x == 1 && y == 11) && !(x == 1 && y == 2) && !(x == 2 && y == 1) && !(x == 14 && y == 11) && !(x == 14 && y == 1) && !(x == 2 && y == 11) && !(x == 15 && y == 10) && !(x == 15 && y == 2) && !(x == 1 && y == 10)) {
        //         //   const bricks = new Bricks(this, x , y , this.screenMap);
        //         //   this.screenMap.add(bricks.me);
        //         }
        //     }
        // }

        const id = "p" + this.socketSvc.getPlayer()
        console.info(this.allPlayerSpawn)
        for (let i in this.allPlayerSpawn) {
            let p = new Player(this, this.allPlayerSpawn[i].x, this.allPlayerSpawn[i].y, this.screenMap)
            this.screenMap.placeObjectAt(this.allPlayerSpawn[i].x, this.allPlayerSpawn[i].y, p.me)
            this.allPlayers[i] = {}
            this.allPlayers[i].player = p
            if (i == id) {
                console.info("id match")
                this.player = this.allPlayers[i].player
            } else {
                console.info("id dont match " + id + " " + i)
            }
        }
        console.info(this.allPlayers)
        //this.gameSvc.getPlayerLocation()
        // this.gameSvc.getAllPlayerLocations()

        // this.screenMap.drawGrids()

        const upKey = this.input.keyboard.addKey('W')
        const downKey = this.input.keyboard.addKey('S')
        const leftKey = this.input.keyboard.addKey('A')
        const rightKey = this.input.keyboard.addKey('D')
        const spaceBar = this.input.keyboard.addKey('SPACE')
        // const collide = this.physics.add.collider(this.player, this.screenMap.items)

        this.input.keyboard.on('keydown', (eventName, event) => {
            const dir = eventName.key
            console.info(eventName)
            if (dir == 'w' || dir == 'a' || dir == 's' || dir == 'd') {
                // console.info(this.player.me.gridPos)
                if (this.player) {
                    this.socketSvc.movePlayer(this.player.me.gridPos)
                }
                console.info(this.player)
            }  
            
            
        })

        if (this.player) {
            upKey.on('down', (event) => {
                if(this.player.alive) {
                    // this.player.isUp = true
                    // this.player.me.anims.play('up')
                    this.socketSvc.movePlayer('up_down')
                }
            })
            upKey.on('up', (event) => {
                if(this.player.alive) {
                    // this.player.isUp = false
                    // this.player.me.body.velocity.y = 0
                    this.socketSvc.movePlayer('up_up')
                }
            })
            downKey.on('down', (event) => {
                if(this.player.alive) {
                    // this.player.isDown = true
                    // this.player.me.anims.play('down')
                    this.socketSvc.movePlayer('down_down')
                }
            })
            downKey.on('up', (event) => {
                if(this.player.alive) {
                    // this.player.isDown = false
                    // this.player.me.body.velocity.y = 0
                    this.socketSvc.movePlayer('down_up')
                }
            })
            leftKey.on('down', (event) => {
                if(this.player.alive) {
                    // this.player.isLeft = true
                    // this.player.me.anims.play('side')
                    this.socketSvc.movePlayer('left_down')
                }
            })
            leftKey.on('up', (event) => {
                if(this.player.alive) {
                    // this.player.isLeft = false
                    // this.player.me.body.velocity.x = 0
                    this.socketSvc.movePlayer('left_up')
                }
            })
            rightKey.on('down', (event) => {
                if(this.player.alive) {
                    // this.player.isRight = true
                    // this.player.me.anims.play('side')
                    this.socketSvc.movePlayer('right_down')
                }
            })
            rightKey.on('up', (event) => {
                if(this.player.alive) {
                    // this.player.isRight = false
                    // this.player.me.body.velocity.x = 0
                    this.socketSvc.movePlayer('right_up')
                }
            })
            spaceBar.on('down', (event) => {
                if(this.player.alive) {
                    // this.player.dropBomb()
                    this.socketSvc.movePlayer('space')
                }
            })
        }
	}
    
	update() {
        if (!!this.player) {
            if(this.player.alive) {
                for (let i in this.allPlayers) {
                    this.allPlayers[i].player.update()
                    this.physics.collide(this.allPlayers[i].player.me, this.screenMap.items, null, null, this)
                    this.physics.overlap(this.allPlayers[i].player.me, this.screenMap.fires, () => this.checkplayer(this.allPlayers[i].player), null, this)
                }
                // this.player.update()
            }
        }
    }

    checkplayer(player) {
        const fire = this.screenMap.getFireAt(player.gridPos.x, player.gridPos.y, this.player.me);
        if (fire) {
            if (!fire.collect) {
                this.player.kill()
            }
        }
    }
}

class Entity extends Phaser.Physics.Arcade.Sprite {
    screenMap;
    gridPos;
    anchor;
    me
    blastThrough;
    constructor(game, x, y, grid, frame = 0) {
        super(game, x, y, grid, frame);
        // this.anchor = .5;
        this.screenMap = grid;
        
        if (!this.gridPos) {
            this.gridPos = new Phaser.Geom.Point(this.x, this.y);
        }
    }
    
    destroy() {
        this.screenMap.remove(this)
        super.destroy();
        console.info("an object was destroyed")
    }

    collect(player) {

    }
  }

class Player extends Entity {
    game;
    speed;
    totalBombs;
    currentBombs;
    bombSize;
    lastGridPos;
    blastThrough;
    alive = true;
    parent = []
    isUp = false;
    isDown = false;
    isLeft = false;
    isRight = false;

    constructor(game, x, y, grid) {
        super(game, x, y, grid);
        this.game = game
        this.me = game.physics.add.sprite(0, 0, IMG_PLAYER)
        // this.me.body.onCollide = true;
        this.screenMap.placeObjectAt(x, y, this.me)
        this.speed = 50;
        this.totalBombs = 1;
        // this.totalBombs = 100;
        this.currentBombs = 0;
        this.bombSize = 2;
        this.me.body.setCircle(6);
        this.me.body.offset = new Phaser.Math.Vector2(2,12)
        this.me.body.drag.set(768)
        this.lastGridPos = this.gridPos;
        this.me.gridPos = this.gridPos
        this.me.blastThrough = true;
        
        this.me.kill = () => this.kill()

        this.me.anims.create({key:'up',frames: this.anims.generateFrameNumbers(IMG_PLAYER, {start: 30, end:34}), frameRate: 5, repeat: -1});
        this.me.anims.create({key:'side',frames: this.anims.generateFrameNumbers(IMG_PLAYER, {start: 15, end:20}), frameRate: 5, repeat: -1});
        this.me.anims.create({key:'down',frames: this.anims.generateFrameNumbers(IMG_PLAYER, {start: 2, end:6}), frameRate: 5, repeat: -1});
    }
    
    update() {
        super.update();
        if (!this.alive) {
            return;
        }
        if (this.isUp) {
            this.me.body.velocity.y = -this.speed
            this.me.body.velocity.x = 0
            if (this.me.anims.currentAnim.key != 'up') {
                this.me.anims.play('up')
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
        
        if (this.gridPos) {
            this.gridPos = this.screenMap.screenToGrid(this.me.body.position.x, this.me.body.position.y)
            this.me.gridPos = this.gridPos
        } 
        if (!(Phaser.Geom.Point.Equals(this.gridPos, this.lastGridPos))) {
            Phaser.Geom.Point.CopyFrom(this.gridPos, this.lastGridPos)
            this.checkGrid();
        }
    }
    
    kill () {
        this.me.body.moves = false
        this.screenMap.remove(this.me)
        this.alive = false
        this.me.destroy()
    }
  
    canPlaceBomb(place) {
        const item = this.screenMap.getAt(place.x, place.y, this.me);
      if (!item) {
        return true;
      }
      return false;
    }
  
    dropBomb() {    
      const place = this.gridPos;
      if (this.currentBombs < this.totalBombs && this.canPlaceBomb(place)) {
        const point = this.screenMap.screenToGrid(this.me.body.position.x, this.me.body.position.y)
        const bomb = new Bomb(this.game, point.x, point.y, this.screenMap, this);
        this.screenMap.add(bomb.me);
      }
    }
    
    checkGrid() {
      const item = this.screenMap.getAt(this.gridPos.x, this.gridPos.y, this.me);
      if (item) {
          console.info("collecting",item)
          console.info(item.collect)
          if (item.collect) {
              console.info("collecting2")
              item.collect(this);
          }
      }
    }
  }

  class Bomb extends Entity {
    owner;
    size;
    duration;
    explodeTimer;
    game
    constructor(game, x, y, grid, owner) {
        super(game, x, y, grid, 2);
        this.game = game
        this.me = game.physics.add.sprite(x, y, IMG_ENV)
        // game.physics.world.enableBody(this.me);
        this.screenMap.placeObjectAt(x, y, this.me)
        this.owner = owner;
        this.me.setFrame(0)
        this.me.body.immovable = true;
        this.me.body.moves = false;
        this.me.kill = () => this.kill()

        if (this.owner) {
            this.owner.currentBombs += 1;
        }
        
        this.size = this.owner.bombSize || 3;
        this.me.anims.create({key:'bomb',frames: this.anims.generateFrameNumbers(IMG_ENV, {start: 0, end:3}), frameRate: 3, repeat: -1});
        this.me.anims.play('bomb')
        this.duration = 3000 // in milliseconds
        // this.duration = 1000 // in milliseconds
        this.scene.time.addEvent({delay:this.duration, callback: () => this.explode()})
    }

    explode() {
            this.scene.time.removeEvent(this.explodeTimer)
            if (this.owner) {
                this.owner.currentBombs -= 1;
            }
            this.screenMap.remove(this.me)
            if (this.me.body) {
                const point = this.screenMap.screenToGrid(this.me.body.position.x, this.me.body.position.y)
                const explosion = new Explosion(this.game, point.x, point.y, this.screenMap, this.owner, this.size, this);
                this.me.destroy()
            }
    }

    kill () {
        this.explode();
    }

    // destroy() {
    //     this.explode();
    // }
  }

  class Explosion extends Entity {
    size;
    owner;
    duration;
    decayTimer;
    locs;
    blast = [];
    game;
    constructor(game, x, y, grid, owner, size = 3, parent = null) {
        super(game, x, y, grid, 5);
        this.size = size;
        this.game = game
        this.owner = owner;

        this.duration = 500 //millisecond
        this.scene.time.addEvent({delay:this.duration, callback: () => this.destroy()})

        // parent.add(this);

        this.locs = this.getExplosionLocations(x,y);
        this.doExplosion();
    } 
  
    doExplosion() {
      this.blast = [];
      const blast = new Blast(this.game, this.x, this.y, this.screenMap, this.owner);
      blast.me.anims.create({key:'blast',frames: this.anims.generateFrameNumbers(IMG_ENV, {start: 10, end:14}), frameRate: 5, repeat: -1});
      blast.me.anims.play('blast')
      this.blast.push(blast)
      this.screenMap.addFire(blast.me);
  
      // Urgh. Improve plz.
      for (let i = 0; i < this.locs.left.length; i++) {
        const blast = new Blast(this.game, this.locs.left[i].x, this.locs.left[i].y, this.screenMap, this.owner);
        blast.me.angle = -90;
        if (i === this.size - 2) {
            blast.me.anims.create({key:'blast',frames: this.anims.generateFrameNumbers(IMG_ENV, {start: 5, end:9}), frameRate: 5, repeat: -1});
            blast.me.anims.play('blast')
        } else {
            blast.me.anims.create({key:'blast',frames: this.anims.generateFrameNumbers(IMG_ENV, {start: 20, end:24}), frameRate: 5, repeat: -1});
            blast.me.anims.play('blast')
        }
        this.blast.push(blast);
        this.screenMap.addFire(blast.me);
      }
  
      for (let i = 0; i < this.locs.right.length; i++) {
        const blast = new Blast(this.game, this.locs.right[i].x, this.locs.right[i].y, this.screenMap, this.owner);

        blast.me.angle = 90;
        if (i === this.size - 2) {
            blast.me.anims.create({key:'blast',frames: this.anims.generateFrameNumbers(IMG_ENV, {start: 5, end:9}), frameRate: 5, repeat: -1});
            blast.me.anims.play('blast')
        } else {
            blast.me.anims.create({key:'blast',frames: this.anims.generateFrameNumbers(IMG_ENV, {start: 20, end:24}), frameRate: 5, repeat: -1});
            blast.me.anims.play('blast')
        }
        this.blast.push(blast);
        this.screenMap.addFire(blast.me);
      }
  
      for (let i = 0; i < this.locs.up.length; i++) {
        const blast = new Blast(this.game, this.locs.up[i].x, this.locs.up[i].y, this.screenMap, this.owner);

        blast.me.angle = 0;
        if (i === this.size - 2) {
            blast.me.anims.create({key:'blast',frames: this.anims.generateFrameNumbers(IMG_ENV, {start: 5, end:9}), frameRate: 5, repeat: -1});
            blast.me.anims.play('blast')
        } else {
            blast.me.anims.create({key:'blast',frames: this.anims.generateFrameNumbers(IMG_ENV, {start: 20, end:24}), frameRate: 5, repeat: -1});
            blast.me.anims.play('blast')
        }
        this.blast.push(blast);
        this.screenMap.addFire(blast.me);
      }
  
      for (let i = 0; i < this.locs.down.length; i++) {
        const blast = new Blast(this.game, this.locs.down[i].x, this.locs.down[i].y, this.screenMap, this.owner);

        blast.me.angle = 180;
        if (i === this.size - 2) {
            blast.me.anims.create({key:'blast',frames: this.anims.generateFrameNumbers(IMG_ENV, {start: 5, end:9}), frameRate: 5, repeat: -1});
            blast.me.anims.play('blast')
        } else {
            blast.me.anims.create({key:'blast',frames: this.anims.generateFrameNumbers(IMG_ENV, {start: 20, end:24}), frameRate: 5, repeat: -1});
            blast.me.anims.play('blast')
        }
        this.blast.push(blast);
        this.screenMap.addFire(blast.me);
      }
    }
  
    getExplosionLocations(bomb_x,bomb_y) {
      const x = bomb_x;
      const y = bomb_y;
      const points = {
        left: [],
        right: [],
        up: [],
        down: []
      };
      const obstructed = {
        left: false,
        right: false,
        up: false,
        down: false
      }
  
      // Jesus, these explosion routines... gotta fix these :(
      for (let w = 1; w < this.size; w++) {
        let entity;
        if (!obstructed.right) {
            entity = this.screenMap.getAt(x + w, y);
          if (!entity || entity.blastThrough) {
            points.right.push(new Phaser.Geom.Point(x + w, y));
          }
          else {
            obstructed.right = true;

            if (entity.kill) {
                entity.kill();
            }
          }
        }
  
        if (!obstructed.left) {
          entity = this.screenMap.getAt(x - w, y);

          if (!entity || entity.blastThrough) {
            points.left.push(new Phaser.Geom.Point(x - w, y));
          }
          else {
            obstructed.left = true;

            if (entity.kill) {
                entity.kill();
            }
          }
        }
  
        if (!obstructed.down) {
          entity = this.screenMap.getAt(x, y + w);

          if (!entity || entity.blastThrough) {
            points.down.push(new Phaser.Geom.Point(x, y + w));
          }
          else {
            obstructed.down = true;

            if (entity.kill) {
                entity.kill();
            }
          }
        }
  
        if (!obstructed.up) {
          entity = this.screenMap.getAt(x, y - w);
          
          if (!entity || entity.blastThrough) {
            points.up.push(new Phaser.Geom.Point(x, y - w));
          }
          else {
            obstructed.up = true;

            if (entity.kill) {
                entity.kill();
            }
          }
        }
      }
      return points;
    }
  
    destroy() {
        this.scene.time.removeEvent(this.decayTimer)
        // console.info("blast is", this.blast.length)
        for (let i = 0; i < this.blast.length; i++) {
            this.screenMap.remove(this.blast[i].me)
            this.screenMap.removeFire(this.blast[i].me)
            this.blast[i].me.destroy();
        }
    }
    
    kill() {
      // cannot be killed
    }
  }

  class Blast extends Entity {
    frame
    slack;
    blastThrough;
    x;
    y;
    constructor(game, x, y, grid, owner) {
        super(game, x, y, grid, 0);
        this.x = x
        this.y = y
        this.me = game.physics.add.sprite(x, y, IMG_ENV)
        this.me.body.moves = false;
        // this.me.body.enable = false
        this.me.body.immovable = true;
        this.screenMap.placeObjectAt(this.x, this.y , this.me)
        this.me.setFrame(5)
        this.slack = 0.5;
        this.me.body.setSize(16 - this.slack, 16 - this.slack,true)
        this.blastThrough = true;

    }
    
    kill() {
      // cannot be killed
    }
    
    destroy() {
        this.me.body.enable = false;
        this.me.destroy()
        super.destroy()
    }
  }

  class Wall extends Entity {
    slack;
    constructor(game, x, y, grid) {
        super(game, x, y, grid, 0);
        this.me = game.physics.add.sprite(x, y, IMG_ENV)
        this.screenMap.placeObjectAt(this.x, this.y , this.me)
        this.me.setFrame(25)
        // this.me.body.moves = false
        this.me.body.immovable = true
        this.slack = 0.5;
        this.me.body.setSize(16 - this.slack, 16 - this.slack, true)
        this.me.kill = () => this.kill()
    }
    
    kill() {
        // cannot be killed
      }
  }

  class Bricks extends Wall {
    parent;
    place
    game
    constructor(game, x, y, grid) {
        super(game, x, y, grid);
        this.me.setFrame(26)
        this.game = game
    }
    
    kill() {
        const pickupChance = Math.random();
        // 1/4 chance of dropping a power-up feels about right to me...
        if (pickupChance < 0.25) {
        // if (pickupChance <= 1) {
            this.dropPickup();
        }
        this.screenMap.remove(this.me)
        this.me.destroy()
    }
    
    dropPickup() {
        this.place = this.gridPos

        // const screenPos = this.screenMap.gridToScreen(this.place.x, this.place.y);
        
        const pickupClasses = [PickupBomb, PickupFire];
        const pickupClass = pickupClasses[Math.floor(Math.random()*pickupClasses.length)];
        
        const pickup = new (pickupClass)(this.game, this.place.x, this.place.y, this.screenMap);
        this.screenMap.add(pickup);
    }
  }

  class Pickup extends Entity {
    slack;

    constructor(game, x, y, grid, index) {
      if (new.target === Pickup) {
        throw new TypeError("Cannot construct Abstract instances directly");
      }
      super(game, x, y, grid, index);
      this.me = game.physics.add.sprite(x, y, IMG_ENV)
      this.screenMap.placeObjectAt(this.x, this.y , this.me)
      this.me.body.moves = false
      this.me.body.enable = false
      this.me.body.immovable = true
      this.slack = 0.5;
      this.me.body.setSize(16 - this.slack, 16 - this.slack, true)
      this.screenMap.add(this.me)
      this.me.collect = (player) => this.collect(player)
      this.me.kill = () => this.kill()
    }
    
    collect(player) {
        this.screenMap.remove(this.me)
        this.me.destroy();
    }

    kill () {
        this.screenMap.remove(this.me)
        this.me.destroy();
    }
  }

  class PickupBomb extends Pickup {
    constructor(game, x, y, grid) {
      super(game, x, y, grid, 8);
      this.me.setFrame(31)
    }
    
    collect(player) {
      super.collect(player);
      player.totalBombs += 1;
    }
  }

  class PickupFire extends Pickup {
    constructor(game, x, y, grid) {
      super(game, x, y, grid, 9);
      this.me.setFrame(30)
    }
    
    collect(player) {
      super.collect(player);
      player.bombSize += 1;
    }
  }