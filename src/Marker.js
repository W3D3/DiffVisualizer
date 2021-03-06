/**
 * @file Marker Object representing start/endpoints of codebits
 * @author Christoph Wedenig <christoph@wedenig.org>
 */

import Utility from './Utility';

class Marker {
    constructor(id, position, type, isEndMarker, sourceType) {
        this.id = id;
        this.isEndMarker = isEndMarker;
        this.type = type;
        this.position = position;
        this.sourceType = sourceType;
        this.metaDataMarkup = '';
    }

    bindToId(bindingId) {
        // type = src, dst
        this.bind = bindingId;
    }

    addMetaData(title, content) {
        this.metaDataMarkup = `data-title="${title}" data-metadata="${content}"`;
    }

    setIsEndMarker(isEndMarker) {
        this.isEndMarker = isEndMarker;
    }

    createEndMarker(newpos) {
        const endmarker = new Marker(this.id, this.position, this.type, true, this.sourceType);
        endmarker.position = newpos;
        endmarker.bind = this.bind;
        endmarker.metaDataMarkup = this.metaDataMarkup;
        return endmarker;
    }

    generateTag() {
        if (this.isEndMarker) {
            return '</span>';
        }
        if (this.bind != null) {
            const bindingId = Utility.getOpponent(this.sourceType) + this.bind;
            return `<span data-sourcetype="${this.sourceType}" data-boundto="${bindingId}" data-type="${this.type}" \
            class="${this.type} scriptmarker" id="${this.sourceType}${this.id}" ${this.metaDataMarkup}>`;
        }
        return `<span class="${this.type} scriptmarker" id="${this.sourceType}${this.id}" ${this.metaDataMarkup}>`;
    }

    isValid() {
        if (this.position.line < 0 || this.position.offset < 0) {
            return false;
        }
        return true;
    }
}
export default Marker;
