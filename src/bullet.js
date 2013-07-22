var chem = require('chem');
var createId = require('./uuid').createId;

module.exports = Bullet;

function Bullet(pos, vel, team) {
  this.pos = pos;
  this.vel = vel;
  this.team = team;
  this.id = createId();
  this.sprite = new chem.Sprite('bullet');
  this.radius = 2;
}

Bullet.prototype.delete = function(state) {
  this.sprite.delete();
  state.deletePhysicsObject(this);
};

Bullet.prototype.update = function (dt, dx, state) {
  this.pos.add(this.vel);
  this.sprite.pos = this.pos;
  if (state.isOffscreen(this.pos)) {
    this.delete(state);
    return;
  }
  // collision detection with ships
  for (var id in state.aiObjects) {
    var ai = state.aiObjects[id];
    if (ai.ship.pos.distance(this.pos) < ai.ship.radius) {
      this.delete(state);
      ai.hit(state);
      return;
    }
  }
}
