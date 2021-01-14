
// class Entity extends Phaser.Physics.Arcade.Sprite {
//     grid;
//     gridPos;
//     anchor;
//     constructor(game, x, y, grid, index = 0) {
//         super(game, x, y, 'sprites', index);
//         this.anchor.setTo(.5);
//         // this.game.physics.arcade.enable(this);
//         this.scene.physics.world.enable(this)
//         this.grid = grid;
//         this.grid.add(this);
//         if (this.gridPos) {
//             grid.screenToGrid(this.x, this.y, this.gridPos);
//         }
//     }
  
//     destroy() {
//       this.grid.remove(this);
//       super.destroy();
//     }
  
//     kill() {
//     }
//   }

// class Wall extends Entity {
//     slack;
//     constructor(game, x, y, grid) {
//         super(game, x, y, grid, 0);
//         // this.body.enable = false;
//         this.body.immovable = true;
//         this.slack = 0.5;
//         this.body.setSize(32 - this.slack, 32 - this.slack, true)
//     }
    
//     kill() {
//       // cannot be killed
//     }
//   }

//   class Bricks extends Wall {
//     frame;
//     parent;
//     constructor(game, x, y, grid) {
//       super(game, x, y, grid);
//       this.frame = 1;
//     }
    
//     kill() {
//       const pickupChance = Math.random();
//       const tween = this.scene.add.tween({target:this, key:{alpha:0}, end:0, ease:'linear', loop: 0}) //.to({alpha: 0}, 300, Phaser.Easing.Linear.None, true);
      
//       tween.on('complete', () => {
//           this.destroy()
//       })
      
//       // 1/4 chance of dropping a power-up feels about right to me...
//       if (pickupChance < 0.25) {
//         this.dropPickup();
//       }
//     }
    
//     dropPickup() {
//       const place = this.gridPos.clone();
//       const screenPos = this.grid.gridToScreen(place.x, place.y);
      
//       const pickupClasses = [PickupBomb, PickupFire];
//       const pickupClass = pickupClasses[Math.floor(Math.random()*pickupClasses.length)];
      
//       const pickup = new (pickupClass)(this.scene.game, screenPos.x, screenPos.y, this.grid);
      
//       this.parent.add(pickup);
//     }
//   }

//   class Player extends Entity {
//     controls;
//     speed;
//     totalBombs;
//     currentBombs;
//     bombSize;
//     lastGridPos;
//     blastThrough;
//     alive;
//     parent;

//     constructor(game, x, y, grid) {
//       super(game, x, y, grid, 6);
  
//     //   this.controls = this.scene.game.input.keyboard.createCursorKeys();
//       this.speed = 96;
  
//       this.totalBombs = 1;
//       this.currentBombs = 0;
//       this.bombSize = 3;
  
//       this.body.setCircle(16);
//     //   this.body.drag.set(768);
  
//       this.lastGridPos = this.gridPos.clone();
      
//       this.blastThrough = true;
//     }
  
//     update() {
//       super.update();
//       if (!this.alive) {
//         return;
//       }
//     //   if (this.controls.up.isDown) {
//     //     this.body.velocity.y = this.speed * -1;
//     //   }
//     //   else if (this.controls.down.isDown) {
//     //     this.body.velocity.y = this.speed;
//     //   }
  
//     //   if (this.controls.left.isDown) {
//     //     this.body.velocity.x = this.speed * -1;
//     //   }
//     //   else if (this.controls.right.isDown) {
//     //     this.body.velocity.x = this.speed;
//     //   }
  
//     //   if (this.scene.game.input.keyboard.justPressed(Phaser.Keyboard.SPACEBAR)) {
//     //     this.dropBomb();
//     //   }
//       if (this.gridPos) {
//         this.grid.screenToGrid(this.x, this.y, this.gridPos);
//       }
  
//       if (!this.gridPos.equals(this.lastGridPos)) {
//         this.lastGridPos.copyFrom(this.gridPos);
//         this.checkGrid();
//       }
//     }
  
//     kill() {
//       this.body.enable = false;
//       super.kill();
//     }
  
//     canPlaceBomb(place) {
//       const item = this.grid.getAt(place.x, place.y, this);
//       if (!item) {
//         return true;
//       }
//       return false;
//     }
  
//     dropBomb() {    
//       const place = this.gridPos.clone();
//       const screenPos = this.grid.gridToScreen(place.x, place.y);
//       if (this.currentBombs < this.totalBombs && this.canPlaceBomb(place)) {
//         const bomb = new Bomb(this.scene.game, screenPos.x, screenPos.y, this.grid, this);
//         this.parent.add(bomb);
//       }
//     }
    
//     checkGrid() {
//       const item = this.grid.getAt(this.gridPos.x, this.gridPos.y, this);
//       if (item && item instanceof Pickup) {
//         item.collect(this);
//       }
//     }
//   }

//   class Pickup extends Entity {
//     constructor(game, x, y, grid, index) {
//       if (new.target === Pickup) {
//         throw new TypeError("Cannot construct Abstract instances directly");
//       }
//       super(game, x, y, grid, index);
//       this.body.enable = false;
//     //   this.body.moves = false;
//     }
    
//     collect(player) {
//       this.destroy();
//     }
//   }

//   class PickupBomb extends Pickup {
//     constructor(game, x, y, grid) {
//         super(game, x, y, grid, 8);
//     }
    
//     collect(player) {
//         super.collect(player);
//         player.totalBombs += 1;
//     }
//   }
  
//   class PickupFire extends Pickup {
//     constructor(game, x, y, grid) {
//         super(game, x, y, grid, 9);
//     }

//     collect(player) {
//         super.collect(player);
//         player.bombSize += 1;
//     }
//   }

// class Bomb extends Entity {
//     owner;
//     size;
//     duration;
//     explodeTimer;
//     parent;

//     constructor(game, x, y, grid, owner) {
//         super(game, x, y, grid, 2);

//         this.owner = owner;

//         this.body.immovable = true;
//     //   this.body.moves = false;

//         if (this.owner) {
//             this.owner.currentBombs += 1;
//         }
        
//         this.size = this.owner.bombSize || 3;

//         this.duration = 3000 // in milliseconds
//         this.explodeTimer = this.scene.time.addEvent({delay:this.duration, callback: this.explode})
//         const tween1 = this.scene.add.tween({target:this.scale, key:{x:1.1, y:0.9}, duration:this.duration/9, yoyo:true, loop: 0}) 
//         const tween2 = this.scene.add.tween({target:this.anchor, key:{y:0.9}, duration:this.duration/9, yoyo:true, loop: 0}) 
//     }

//     explode() {
//         this.scene.time.removeEvent(this.explodeTimer)
//         if (this.owner) {
//         this.owner.currentBombs -= 1;
//         }
//         this.grid.remove(this);

//         const explosion = new Explosion(this.scene.game, this.x, this.y, this.grid, this.owner, this.size, this.parent);

//         this.destroy();
//     }

//     kill() {
//         this.explode();
//     }
//   }

//   class Explosion extends Entity {
//     size;
//     owner;
//     duration;
//     decayTimer;
//     locs;
//     blast
//     parent
//     constructor(game, x, y, grid, owner, size = 3, parent = null) {
//         super(game, x, y, grid, 5);
//         this.size = size;
//         this.owner = owner;
//         this.body.immovable = true;
//     //   this.body.moves = false;
        
//         this.scene.cameras[0].shake(0.0075, 500);

//         this.duration = 500 //millisecond
//         this.decayTimer = this.scene.time.addEvent({delay:this.duration, callback: this.destroy})

//         parent.add(this);

//         this.locs = this.getExplosionLocations();
//         this.doExplosion();
//     }
  
//     doExplosion() {
//       this.blast = [];
  
//       // Urgh. Improve plz.
//       for (let i = 0; i < this.locs.left.length; i++) {
//         const blastPos = this.grid.gridToScreen(this.locs.left[i].x, this.locs.left[i].y);
//         const blast = new Blast(this.scene.game, blastPos.x, blastPos.y, this.grid, this.owner);
//         blast.angle = -90;
//         if (i === this.size - 2) {
//           blast.frame = 3;
//         }
//         this.blast.push(blast);
//         this.parent.add(blast);
//       }
  
//       for (let i = 0; i < this.locs.right.length; i++) {
//         const blastPos = this.grid.gridToScreen(this.locs.right[i].x, this.locs.right[i].y);
//         const blast = new Blast(this.scene.game, blastPos.x, blastPos.y, this.grid, this.owner);
//         blast.angle = 90;
//         if (i === this.size - 2) {
//           blast.frame = 3;
//         }
//         this.blast.push(blast);
//         this.parent.add(blast);
//       }
  
//       for (let i = 0; i < this.locs.up.length; i++) {
//         const blastPos = this.grid.gridToScreen(this.locs.up[i].x, this.locs.up[i].y);
//         const blast = new Blast(this.scene.game, blastPos.x, blastPos.y, this.grid, this.owner);
//         blast.angle = 0;
//         if (i === this.size - 2) {
//           blast.frame = 3;
//         }
//         this.blast.push(blast);
//         this.parent.add(blast);
//       }
  
//       for (let i = 0; i < this.locs.down.length; i++) {
//         const blastPos = this.grid.gridToScreen(this.locs.down[i].x, this.locs.down[i].y);
//         const blast = new Blast(this.scene.game, blastPos.x, blastPos.y, this.grid, this.owner);
//         blast.angle = 180;
//         if (i === this.size - 2) {
//           blast.frame = 3;
//         }
//         this.blast.push(blast);
//         this.parent.add(blast);
//       }
//     }
  
//     getExplosionLocations() {
//       const x = this.gridPos.x;
//       const y = this.gridPos.y;
//       const points = {
//         left: [],
//         right: [],
//         up: [],
//         down: []
//       };
//       const obstructed = {
//         left: false,
//         right: false,
//         up: false,
//         down: false
//       }
  
//       // Jesus, these explosion routines... gotta fix these :(
//       for (let w = 1; w < this.size; w++) {
//         let entity;
//         if (!obstructed.right) {
//           entity = this.grid.getAt(x + w, y);
//           if (!entity || entity.blastThrough) {
//             points.right.push(new Phaser.Geom.Point(x + w, y));
//           }
//           else {
//             obstructed.right = true;
//             if (entity && entity instanceof Entity) {
//               entity.kill();
//             }
//           }
//         }
  
//         if (!obstructed.left) {
//           entity = this.grid.getAt(x - w, y);
//           if (!entity || entity.blastThrough) {
//             points.left.push(new Phaser.Geom.Point(x - w, y));
//           }
//           else {
//             obstructed.left = true;
//             if (entity && entity instanceof Entity) {
//               entity.kill();
//             }
//           }
//         }
  
//         if (!obstructed.down) {
//           entity = this.grid.getAt(x, y + w);
//           if (!entity || entity.blastThrough) {
//             points.down.push(new Phaser.Geom.Point(x, y + w));
//           }
//           else {
//             obstructed.down = true;
//             if (entity && entity instanceof Entity) {
//               entity.kill();
//             }
//           }
//         }
  
//         if (!obstructed.up) {
//           entity = this.grid.getAt(x, y - w);
//           if (!entity || entity.blastThrough) {
//             points.up.push(new Phaser.Geom.Point(x, y - w));
//           }
//           else {
//             obstructed.up = true;
//             if (entity && entity instanceof Entity) {
//               entity.kill();
//             }
//           }
//         }
//       }
//       return points;
//     }
  
//     destroy() {
//         this.scene.time.removeEvent(this.decayTimer)
//         for (let i = 0; i < this.blast.length; i++) {
//             this.blast[i].destroy();
//         }
//         const tween = this.scene.add.tween({target:this, key:{alpha:0}, duration:300, loop: 0}) 
//         tween.on('complete', () => {
//             super.destroy()
//         })
//     }
    
//     kill() {
//       // cannot be killed
//     }
//   }

//   class Blast extends Entity {
//     frame
//     slack;
//     blastThrough;
//     constructor(game, x, y, grid, owner) {
//         super(game, x, y, grid, 4);
//         //   this.body.moves = false;
//         this.body.immovable = true;
//         this.slack = 18;
//         this.body.setSize(32 - this.slack, 32 - this.slack)
//         this.blastThrough = true;
//     }
    
//     kill() {
//       // cannot be killed
//     }
    
//     destroy() {
//       this.body.enable = false;
//       const tween = this.scene.add.tween({target:this, key:{alpha:0}, duration:300, loop: 0}) 
//         tween.on('complete', () => {
//             super.destroy()
//         })
//     }
//   }

//   class Grid {
//     width
//     height
//     size
//     items
//     constructor(width, height, size = 32) {
//         this.width = width;
//         this.height = height;
//         this.size = size;
//         this.items = [];
//     }
  
//     add(item) {
//       this.items.push(item);
//       item.gridPos = this.screenToGrid(item.x, item.y, 0);
//     }
  
//     remove(item) {
//       if (this.items.indexOf(item) !== -1) {
//         this.items.splice(this.items.indexOf(item), 1);
//       }
//     }
  
//     getAt(x, y, ignore) {
//       if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
//         for (let i = 0; i < this.items.length; i++) {
//           let item = this.items[i];
//           if (item !== ignore && item.gridPos.x === x && item.gridPos.y === y) {
//             return item;
//           }
//         }
//         return null;
//       }
//       return -1;
//     }
  
//     screenToGrid(x, y, point) {
//       if (point) {
//         point.x = Math.round(x / this.size);
//         point.y = Math.round(y / this.size);
//         return point;
//       }
//       return new Phaser.Geom.Point(Math.round(x / this.size), Math.round(y / this.size));
//     }
  
//     gridToScreen(x, y, point) {
//       if (point) {
//         point.x = x * this.size;
//         point.y = y * this.size;
//         return point;
//       }
//       return new Phaser.Geom.Point(x * this.size, y * this.size);
//     }
//   }
