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

Bullet.prototype.update = function (dt, dx, state) {
  this.pos.add(this.vel);
  this.sprite.pos = this.pos;
  if (state.isOffscreen(this.pos)) {
    this.sprite.delete();
    state.deletePhysicsObject(this);
  }
}
