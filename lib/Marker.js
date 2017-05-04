class Marker {
	constructor(id, position, type, isEndMarker) {
		this.id = id;
		this.isEndMarker = isEndMarker;
		this.type = type;
		this.position = position;
	}

	generateTag() {
		if (this.isEndMarker) {
			return '</span>';
		} else {
			return `<span class="${this.type} ${this.id}">`;
		}
	}
}
export default Marker;
