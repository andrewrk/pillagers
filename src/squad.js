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
  this.avgPos.scale(1 / this.units.length);
  this.direction = this.dest.minus(this.avgPos).normalize();

  // sort units by rankOrder and then radius
  this.units.sort(function(a, b) {
    var rankOrderDelta = b.rankOrder - a.rankOrder;
    if (rankOrderDelta !== 0) return rankOrderDelta;
    return b.radius - a.radius;
  });

  // divide into sub-groups
  var currentRadius = null;
  var groups = [];
  var currentGroup = null;
  var i, unit;
  for (i = 0; i < this.units.length; i += 1) {
    unit = this.units[i];
    if (unit.radius !== currentRadius) {
      groups.push(currentGroup = []);
    }
    currentRadius = unit.radius;
    currentGroup.push(unit);
  }

  // create the unaligned positions
  var positions = {}; // indexed by ship id
  var destRelCenter = v();
  var nextPos = v();
  var groupMins = [];
  var groupMaxs = [];
  var groupIndex, group;
  for (groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    group = groups[groupIndex];
    var groupMin = v();
    var groupMax = v();
    var unitCountX = Math.floor(Math.sqrt(group.length));
    var unitCountY = unitCountX * unitCountX === group.length ? unitCountX : unitCountX + 1;
    var radius = group[0].radius;
    var y = 0;
    for (i = 0; i < group.length; i += 1) {
      unit = group[i];
      positions[unit.id] = nextPos.clone();
      destRelCenter.add(nextPos);
      groupMin.boundMax(nextPos.offset(-radius, -radius));
      groupMax.boundMin(nextPos.offset(radius, radius));
      nextPos.y += radius * 2;
      y += 1;
      if (y >= unitCountY) {
        y = 0;
        nextPos.y = 0;
        nextPos.x -= radius;
        if (i + 1 < group.length) {
          // for the next ship in the same group
          nextPos.x -= radius;
        }
      }
    }
    nextPos.y = 0;
    if (groupIndex + 1 < groups.length) {
      nextPos.x -= radius + groups[groupIndex + 1][0].radius;
    }
    groupMins[groupIndex] = groupMin;
    groupMaxs[groupIndex] = groupMax;
  }
  destRelCenter.scale(1 / this.units.length);

  // vertically center the groups
  var targetCenter;
  for (groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    var min = groupMins[groupIndex];
    var max = groupMaxs[groupIndex];
    var size = max.minus(min);
    var center = min.plus(size.scaled(0.5));
    if (groupIndex === 0) {
      targetCenter = center;
      continue;
    }
    group = groups[groupIndex];
    var deltaY = targetCenter.y - center.y;
    for (i = 0; i < group.length; i += 1) {
      unit = group[i];
      positions[unit.id].y += deltaY;
    }
  }

  for (var id in positions) {
    var position = positions[id];
    // shift so that 0, 0 is in the center
    position = destRelCenter.minus(position);
    // rotate about 0, 0 to align with direction
    position.rotate(this.direction);
    // translate to dest
    position.add(this.dest);

    positions[id] = position;
  }
  this.positions = positions;
};
