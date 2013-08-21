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
  this.resistShieldTeamSwitch = false;
  this.team = o.team;
  this.damageAmount = o.damageAmount;
  this.life = o.life;
  this.density = o.density || 0.002;
  this.radius = o.radius || 2;
  this.canHitShield = o.canHitShield == null ? true : o.canHitShield;
  this.surviveHit = !!o.surviveHit;
  this.canBeStruck = !!o.canBeStruck;
  this.canBeShot = !!o.canBeShot;
  this.collisionDamping = o.collisionDamping || 1;
  var animationName = o.animationName || 'bullet/circle';
  this.sprite = new chem.Sprite(ani[animationName]);
  this.updateRotation();
  this.state.batch.add(this.sprite);
  this.canGoOffscreen = true;
}

Bullet.prototype.delete = function() {
  if (this.deleted) return;
  this.sprite.delete();
  this.deleted = true;
  this.state.deletePhysicsObject(this);
};

Bullet.prototype.updateRotation = function() {
  this.sprite.rotation = this.vel.angle() + Math.PI / 2;
};

Bullet.prototype.update = function (dt, dx) {
  PhysicsObject.prototype.update.apply(this, arguments);

  this.updateRotation();
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
    if (obj.pos.distanceSqrd(this.pos) < obj.radius * obj.radius + this.radius * this.radius) {
      if (!this.surviveHit) {
        this.delete();
        sfx.weakHit();
      }
      obj.collide(this);
      obj.damage(this.damageAmount, "explosion");
      return;
    }
  }
}

Bullet.prototype.hitShield = function(shieldObject) {
  if (!this.resistShieldTeamSwitch) this.team = shieldObject.team;
};

