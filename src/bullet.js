var chem = require('chem');
var createId = require('./uuid').createId;

module.exports = Bullet;

function Bullet(state, o) {
  o = o || {};
  this.state = state;
  this.pos = o.pos;
  this.vel = o.vel;
  this.team = o.team;
  this.damage = o.damage;
  this.life = o.life;
  this.id = createId();
  this.sprite = new chem.Sprite('bullet/small');
  this.sprite.rotation = this.vel.angle() + Math.PI / 2;
  this.state.batch.add(this.sprite);
  this.radius = 2;
}

Bullet.prototype.draw = function(context) {}

Bullet.prototype.delete = function() {
  this.sprite.delete();
  this.state.deletePhysicsObject(this);
};

Bullet.prototype.update = function (dt, dx) {
  this.pos.add(this.vel);
  this.sprite.pos = this.pos;
  this.life -= dt;
  if (this.state.isOffscreen(this.pos) || this.life <= 0) {
    this.delete();
    return;
  }
  // collision detection
  for (var id in this.state.physicsObjects) {
    var obj = this.state.physicsObjects[id];
    if (! obj.canBeShot || obj.team === this.team) continue;
    if (obj.pos.distance(this.pos) < obj.radius) {
      this.delete();
      obj.hit(this);
      return;
    }
  }
}
