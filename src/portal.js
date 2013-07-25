var PhysicsObject = require('./physics_object');
var util = require('util');
var chem = require('chem');
var v = chem.vec2d;

module.exports = Portal;

util.inherits(Portal, PhysicsObject);
function Portal(state, o) {
  PhysicsObject.apply(this, arguments);
  this.sprite = new chem.Sprite('portal');
  this.sprite.pos = this.pos.floored();
  this.state.batch.add(this.sprite);
  this.canBeSelected = true;
  this.radius = 64;
  this.miniMapColor = "#6A9EA8";
}

Portal.prototype.update = function(dt, dx) {
  // http://25.media.tumblr.com/tumblr_m4hi5ygdtg1qa491po1_1280.jpg
  this.sprite.rotation = Math.random() * Math.PI * 2
};

Portal.prototype.delete = function() {
  this.sprite.delete();
}
