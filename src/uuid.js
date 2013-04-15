//depend "ss"
window.SS.createId = createId;

var nextId = 0;
function createId() {
  return (nextId++).toString();
}
