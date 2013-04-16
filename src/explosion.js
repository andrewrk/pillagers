//depend "uuid"
//depend "chem/sprite"
var SS = window.SS
  , Chem = window.Chem
  , v = Chem.Vec2d
  , createId = SS.createId

SS.Explosion = Explosion;

function Explosion(pos, vel) {
  this.pos = pos;
  this.vel = vel;
  this.sprite = new Chem.Sprite('boom');
  this.timeLeft = 1;
  this.id = createId();
  this.boomSfx = new Chem.Sound('sfx/boom.ogg');
  this.boomSfx.play();
}

Explosion.prototype.update = function(dt, dx, state) {
  this.pos.add(this.vel.scaled(dx));
  this.sprite.pos = this.pos.floored();
  this.timeLeft -= dt;
  if (this.timeLeft <= 0) {
    state.deleteExplosion(this);
  }
};

Explosion.prototype.delete = function() {
  this.sprite.delete();
}
