import Marker from './Marker';

class BlockMarker extends Marker {

    constructor(id, blockName, position) {
        super();
        this.id = id;
        this.blockName = blockName;
        this.position = position;
        this.isEndMarker = false;
    }

    generateTag() {
        if (this.isEndMarker) {
            return '</span>';
        } else {
            return '<span class="blockmarker" data-blockid="${this.id}">';
        }
    }

    createEndMarker(length) {
        var endmarker = new BlockMarker(this.id, this.blockName, this.position + length);
        endmarker.setIsEndMarker(true);

        return endmarker;
    }

} export default BlockMarker;
