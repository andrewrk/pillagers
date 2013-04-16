//depend "uuid"
//depend "chem/sprite"
var SS = window.SS
  , Chem = window.Chem
  , v = Chem.Vec2d
  , createId = SS.createId

SS.Ship = Ship;

var ROTATION_SPEED = Math.PI * 0.04;
var THRUST_AMT = 0.1;
var RECHARGE_AMT = 0.20;

function Ship(o) {
  o = o || {};
  this.vel = o.vel || v();
  this.pos = o.pos || v();
  this.rotation = o.rotation == null ? Math.PI / 2 : o.rotation;
  this.id = createId();
  var spriteName = o.spriteName || 'ship';
  this.sprite = new Chem.Sprite(spriteName);
  this.thrustInput = 0;
  this.rotateInput = 0;
  this.shootInput = 0;
  this.recharge = 0;
  this.team = o.team == null ? 0 : o.team;
}

Ship.prototype.update = function(dt, dx, state) {
  this.pos.add(this.vel.scaled(dx));
  this.rotation += this.rotateInput * ROTATION_SPEED * dx;
  var thrust = v(Math.cos(this.rotation), Math.sin(this.rotation));
  this.vel.add(thrust.scaled(this.thrustInput * THRUST_AMT * dx));

  this.sprite.rotation = this.rotation + Math.PI / 2;
  this.sprite.pos = this.pos.floored();

  this.recharge -= dt;
  if (this.shootInput && this.recharge <= 0) {
    this.recharge = RECHARGE_AMT;
    // create projectile
    state.createBullet(this.pos.clone(), unitFromAngle(this.rotation), this.team);
  }
};

function unitFromAngle(angle) {
  return v(Math.cos(angle), Math.sin(angle));
}
