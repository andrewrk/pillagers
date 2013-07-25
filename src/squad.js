var chem = require('chem');
var v = chem.vec2d;

module.exports = Squad;

function Squad(dest) {
  this.dest = dest;
  this.avgPos = v();
  this.units = [];
}

Squad.prototype.add = function(ship) {
  this.units.push(ship);
  this.avgPos.add(ship.pos);
};

Squad.prototype.calculate = function() {
  var dest = this.dest;
  this.avgPos.scale(1 / this.units.length);
  this.direction = this.dest.minus(this.avgPos).normalize();
  // figure out max radius
  var maxRadius = 0;
  this.units.forEach(function(unit) {
    if (unit.radius > maxRadius) maxRadius = unit.radius;
  });
  var unitCountY = Math.floor(Math.sqrt(this.units.length));
  var unitCountX = unitCountY * unitCountY === this.units.length ? unitCountY : unitCountY + 1;
  // sort units by rankOrder and then distance from target point
  this.units.sort(function(a, b) {
    var rankOrderDelta = a.rankOrder - b.rankOrder;
    if (rankOrderDelta !== 0) return rankOrderDelta;
    return a.pos.distanceSqrd(dest) - b.pos.distanceSqrd(dest);
  });
  // create the unaligned positions
  var positions = new Array(this.units.length);
  var destRelCenter = v();
  var i, x, pt;
  for (i = 0, x = 0; i < this.units.length; x += 1) {
    for (var y = 0; y < unitCountY; y += 1, i += 1) {
      pt = v(x * maxRadius * 2, y * maxRadius * 2);
      positions[i] = pt;
      destRelCenter.add(pt);
    }
  }
  destRelCenter.scale(1 / this.units.length);

  for (i = 0; i < positions.length; i += 1) {
    // shift so that 0, 0 is in the center
    positions[i] = destRelCenter.minus(positions[i]);
    // rotate about 0, 0 to align with direction
    positions[i].rotate(this.direction);
    // translate to dest
    positions[i].add(dest);
  }

  this.positions = positions;
};
