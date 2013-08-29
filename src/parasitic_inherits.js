module.exports = parasiticInherits;

function parasiticInherits(Base, Super) {
  Object.keys(Super.prototype).forEach(function(method) {
    if (!Base.prototype[method]) Base.prototype[method] = Super.prototype[method];
  });
}
