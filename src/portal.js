var createId = require('./uuid').createId;
var chem = require('chem');
var v = chem.vec2d;

module.exports = Portal;

function Portal(state, o) {
  this.state = state;
  this.pos = o.pos;
  this.sprite = new chem.Sprite('portal');
  this.sprite.pos = this.pos.floored();
  this.state.batch.add(this.sprite);
  this.id = createId();
  this.canCauseCollision = false;
  this.canBeStruck = false;
}

Portal.prototype.draw = function(context) {}

Portal.prototype.update = function(dt, dx) {
  // http://25.media.tumblr.com/tumblr_m4hi5ygdtg1qa491po1_1280.jpg
  this.sprite.rotation = Math.random() * Math.PI * 2
};

Portal.prototype.delete = function() {
  this.sprite.delete();
}
