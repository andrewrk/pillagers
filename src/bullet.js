var chem = require('chem');
var ani = chem.resources.animations;
var sfx = require('./sfx');
var PhysicsObject = require('./physics_object');
var util = require('util');

module.exports = Bullet;

util.inherits(Bullet, PhysicsObject);
function Bullet(state, o) {
  PhysicsObject.apply(this, arguments);
  o = o || {};
  this.team = o.team;
  this.damage = o.damage;
  this.life = o.life;
  this.sprite = new chem.Sprite(ani[o.animationName || 'bullet/circle']);
  this.sprite.rotation = this.vel.angle() + Math.PI / 2;
  this.state.batch.add(this.sprite);
  this.radius = 2;
  this.canGoOffscreen = true;
}

Bullet.prototype.delete = function() {
  if (this.deleted) return;
  this.sprite.delete();
  this.deleted = true;
  this.state.deletePhysicsObject(this);
};

Bullet.prototype.update = function (dt, dx) {
  PhysicsObject.prototype.update.apply(this, arguments);

  this.sprite.pos = this.pos;
  this.life -= dt;
  if (this.state.isOffscreen(this.pos) || this.life <= 0) {
    this.delete();
    return;
  }
  // collision detection
  for (var i = 0; i < this.state.physicsObjects.length; i += 1) {
    var obj = this.state.physicsObjects[i];
    if (obj.deleted) continue;
    if (! obj.canBeShot || obj.team === this.team) continue;
    if (obj.pos.distanceSqrd(this.pos) < obj.radius * obj.radius) {
      this.delete();
      obj.hit(this.damage, "explosion");
      sfx.weakHit();
      return;
    }
  }
}
