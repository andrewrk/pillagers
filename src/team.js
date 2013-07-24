
var teamCount = 0;
var colors = [
  "#5962D5",
  "#E25E4B",
  "#29CF3C",
  "#C7CB65",
  "#CB65BE",
];

exports.Team = Team;
exports.PLAYER = new Team("
module.exports = Team;
function Team(color) {
  this.number = teamCount++;
  this.color = color;
}
