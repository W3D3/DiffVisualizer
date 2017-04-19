function Marker (position, type, isEndMarker) {
  this.isEndMarker = isEndMarker;
  this.type = type;
  this.position = position;

  this.generateTag = function () { // it can access private members
    if (isEndMarker) {
      return "</span>"
    }
    else {
      return '<span class="change '+type+'">'
    }
  };
}

var mk = new Marker(5, "INSERT",false);
console.log(mk.generateTag());
console.log(mk.position);
