import Utility from './Utility';

class Marker {
  constructor(id, position, type, isEndMarker, sourceType) {
    this.id = id;
    this.isEndMarker = isEndMarker;
    this.type = type;
    this.position = position;
    this.sourceType = sourceType;
  }

  bindToId(bindingId) //type = src, dst
  {
    this.bind = bindingId;
  }

  generateTag() {
    if (this.isEndMarker) {
      return '</span>';
    } else {
      if (this.bind != null) {
        var bindingId = Utility.getOpponent(this.sourceType) + this.bind;
        return `<span data-sourcetype="${this.sourceType}" data-boundto="${bindingId}" class="${this.type} scriptmarker" id="${this.sourceType}${this.id}">`;
      } else {
        return `<span class="${this.type} scriptmarker"  id="${this.sourceType}${this.id}">`;
      }

    }
  }
}
export default Marker;
