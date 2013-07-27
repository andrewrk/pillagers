exports.get = get;

var teamCount = 0;
var colors = [
  "#1400FF",
  "#FF001E",
  "#29CF3C",
  "#FF2FD1",
];
var teams = [];

function Team() {
  this.number = teamCount++;
  this.color = colors[this.number];
  if (! this.color) throw new Error("out of team colors");
}

function get(index) {
  while (index >= teams.length) addTeam();
  return teams[index];
}

function addTeam() {
  teams.push(new Team());
}
