//depend "uuid"
//depend "chem/sprite"
var SS = window.SS
  , Chem = window.Chem
  , v = Chem.Vec2d
  , createId = SS.createId

SS.Ship = Ship;

var ROTATION_SPEED = Math.PI * 0.04;
var THRUST_AMT = 0.1;

function Ship(name) {
  this.vel = v();
  this.pos = v(200, 200);
  this.rotation = Math.PI / 2;
  this.id = createId();
  this.sprite = new Chem.Sprite('ship');
  this.thrustInput = 0;
  this.rotateInput = 0;
}

Ship.prototype.update = function(dt, dx) {
  this.pos.add(this.vel);
  this.rotation += this.rotateInput * ROTATION_SPEED * dx;
  var thrust = v(Math.cos(this.rotation - Math.PI / 2), Math.sin(this.rotation - Math.PI / 2));
  this.vel.add(thrust.scaled(this.thrustInput * THRUST_AMT * dx));

  this.sprite.rotation = this.rotation;
  this.sprite.pos = this.pos;
};
