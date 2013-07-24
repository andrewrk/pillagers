
var teamCount = 0;
var colors = [
  "#1400FF",
  "#FF001E",
  "#29CF3C",
  "#C7CB65",
  "#CB65BE",
];
var teams = [];

module.exports = Team;

function Team(color) {
  this.number = teamCount++;
  this.color = colors[this.number];
  if (! this.color) throw new Error("out of team colors");
  teams.push(this);
}

Team.get = function(index) {
  return teams[index];
};
