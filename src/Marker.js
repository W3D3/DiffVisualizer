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
    if(this.sourceType == 'src') {
      this.bind = 'dst'+bindingId;
    }
    else if (this.sourceType == 'dst'){
      this.bind = 'src'+bindingId;
    }
    else {
      console.error('Invalid sourceType for marker!');
    }
  }

	generateTag() {
		if (this.isEndMarker) {
			return '</span>';
		} else {
      if(this.bind != null) {
        return `<span data-sourcetype="${this.sourceType}" data-boundto="${this.bind}" class="${this.type}" id="${this.sourceType}${this.id}">`;
      }
      else {
        return `<span class="${this.type}"  id="${this.sourceType}${this.id}">`;
      }

		}
	}
}
export default Marker;
