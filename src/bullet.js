var chem = require('chem');
var createId = require('./uuid').createId;

module.exports = Bullet;

function Bullet(state, o) { //pos, vel, team, damage) {
  o = o || {};
  this.state = state;
  this.pos = o.pos;
  this.vel = o.vel;
  this.team = o.team;
  this.damage = o.damage;
  this.id = createId();
  this.sprite = new chem.Sprite('bullet/circle');
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
  if (this.state.isOffscreen(this.pos)) {
    this.delete();
    return;
  }
  // collision detection
  for (var id in this.state.physicsObjects) {
    var obj = this.state.physicsObjects[id];
    if (! obj.canBeShot) continue;
    if (obj.pos.distance(this.pos) < obj.radius) {
      this.delete();
      obj.hit(this);
      return;
    }
  }
}
