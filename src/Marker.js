import Utility from './Utility';

class Marker {
  constructor(id, position, type, isEndMarker, sourceType) {
    this.id = id;
    this.isEndMarker = isEndMarker;
    this.type = type;
    this.position = position;
    this.sourceType = sourceType;
    this.toolTipMarkup = '';
  }

  bindToId(bindingId) //type = src, dst
  {
    this.bind = bindingId;
  }

  addToolTip(title, content)
  {
    this.toolTipMarkup = `data-toggle="popover" title="${title}" data-content="${content}" data-container="#${this.sourceType}"`;
  }

  setIsEndMarker(isEndMarker)
  {
    this.isEndMarker = isEndMarker;
  }

  createEndMarker(length)
  {
    var endmarker = new Marker(this.id, this.position, this.type, true, this.sourceType);
    endmarker.position = endmarker.position + length;
    endmarker.bind = this.bind;
    endmarker.toolTipMarkup = this.toolTipMarkup;
    return endmarker;
  }

  generateTag() {
    if (this.isEndMarker) {
      return '</span>';
    } else {
      if (this.bind != null) {
        var bindingId = Utility.getOpponent(this.sourceType) + this.bind;
        return `<span data-sourcetype="${this.sourceType}" data-boundto="${bindingId}" class="${this.type}" id="${this.sourceType}${this.id}" ${this.toolTipMarkup}>`;
      } else {
        return `<span class="${this.type} scriptmarker"  id="${this.sourceType}${this.id}">`;
      }

    }
  }
}
export default Marker;
