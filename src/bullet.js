//depend "chem"
//depend "uuid"
//depend "chem/sprite"

var SS = window.SS
  , Chem = window.Chem
  , v = Chem.Vec2d
  , createId = SS.createId

SS.Bullet = Bullet;

function Bullet(pos, vel, team) {
  this.pos = pos;
  this.vel = vel;
  this.team = team;
  this.id = createId();
  this.sprite = new Chem.Sprite('bullet');
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
    if (ai.ship.team !== this.team && ai.ship.pos.distanceTo(this.pos) < 18) {
      this.delete(state);
      ai.hit(state);
      return;
    }
  }
}
