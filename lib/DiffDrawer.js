/* global $ hljs */
import Marker from './Marker';
import Utility from './Utility';

import axios from 'axios';
import Base64 from 'js-base64/Base64';
var base64 = Base64.Base64; //very nice packaging indeed.
import _ from 'lodash';
//import hljs from 'highlightjs/highlight.pack.js';
//import hljs from 'highlightjs-line-numbers/dist/highlightjs-line-numbers';

class DiffDrawer {
	constructor(src, dst)
  {
		this.src = src;
		this.dst = dst;

    //set default base URL
    this.DIFF_API = axios.create({
      baseURL: 'http://swdyn.isys.uni-klu.ac.at:5000/v1/',
    });
	}


  setEditorTheme(theme)
  {
    this.editorSrc.setTheme(`ace/theme/${theme}`);
    this.editorDst.setTheme(`ace/theme/${theme}`);
  }

	setBaseUrl(newBase) {
		this.DIFF_API = axios.create({
			baseURL: newBase,
		});
	}

	setSource(newSrc) {
		this.src = newSrc;
	}

  getSource() {
    console.log(this.src);
		return this.src;
	}

	setDestination(newDst) {
		this.dst = newDst;
	}

  getDestination() {
		return this.dst;
	}

	static insertMarkers(markersSorted, codeString) {
		var lastClosed = [];

		markersSorted.forEach(function(marker) {
			if (marker.isEndMarker) {
				var range = Utility.splitValue(codeString, marker.position);
				codeString = range[0] + marker.generateTag() + range[1];
        //fill the opening Marker into the last closed array for faster opening
				lastClosed.push(new Marker(marker.id, marker.position, marker.type, false));
			} else {
        //startmarker
				if (lastClosed.length > 0 && lastClosed[lastClosed.length - 1].id === marker.id) {
          //can be inserted
					lastClosed.pop();
					range = Utility.splitValue(codeString, marker.position);
					codeString = range[0] + marker.generateTag() + range[1];

				} else {
					var markerNotYetOpened = false;
					lastClosed.forEach(function(startmarker) {
						if (startmarker.id == marker.id) {
							markerNotYetOpened = true;
						}
					});
					if (markerNotYetOpened) {
						var openingMarker = lastClosed.pop();
						while (openingMarker.id <= marker.id) {
							range = Utility.splitValue(codeString, marker.position);
							codeString = range[0] + marker.generateTag() + range[1];
							if (lastClosed.length > 0 && lastClosed[lastClosed.length - 1].id <= marker.id) {
								openingMarker = lastClosed.pop();
							} else {
								break;
							}
						}
					}
				}
			}
		});
    //formatted string
		return codeString;
	}

	visualizeChanges() {

		if (this.src == null || this.dst == null) {
			console.error('src and dst must be set for changes to appear.');
			return;
		}

		const LINE_SEPARATOR = '\r\n';
		var srcString = this.src.replace(new RegExp('(\\r)?\\n', 'g'), LINE_SEPARATOR);
		var dstString = this.dst.replace(new RegExp('(\\r)?\\n', 'g'), LINE_SEPARATOR);

    this.src = srcString;
    this.dst = dstString;
		//this.editorSrc.setValue(srcString);
		//this.editorDst.setValue(dstString);

		this.DIFF_API.post('/changes', {
			'src': base64.encode(srcString),
			'dst': base64.encode(dstString),
			'matcher': 1
		})
    .then(function(response) {
      $('.time').text(response.data.metrics.matchingTime + ' ms to match, ' + response.data.metrics.classificationTime + ' ms to classify');

      var changes = response.data.results;
      var dstMarkers = new Array();
      var srcMarkers = new Array();

      changes.forEach(function(entry) {

		if (entry.actionType == 'INSERT') {
			dstMarkers.push(new Marker(entry.dstId, entry.dstPos, 'INSERT', false, 'dst'));
			dstMarkers.push(new Marker(entry.dstId, entry.dstPos + entry.dstLength, 'INSERT', true, 'dst'));
		}

		if (entry.actionType == 'MOVE') {

			srcMarkers.push(new Marker(entry.srcId, entry.srcPos, 'MOVE', false, 'src'));
			srcMarkers.push(new Marker(entry.srcId, entry.srcPos + entry.srcLength, 'MOVE', true, 'src'));

			dstMarkers.push(new Marker(entry.dstId, entry.dstPos, 'MOVE', false, 'dst'));
			dstMarkers.push(new Marker(entry.dstId, entry.dstPos + entry.dstLength, 'MOVE', true, 'dst'));
		}

		if (entry.actionType == 'UPDATE') {

      var updateStartingMarker = new Marker(entry.srcId, entry.srcPos, 'UPDATE', false, 'src');
      updateStartingMarker.bindToId(entry.dstId); //bind to destination
			srcMarkers.push(updateStartingMarker);
			srcMarkers.push(new Marker(entry.srcId, entry.srcPos + entry.srcLength, 'UPDATE', true, 'src'));

			dstMarkers.push(new Marker(entry.dstId, entry.dstPos, 'UPDATE', false, 'dst'));
			dstMarkers.push(new Marker(entry.dstId, entry.dstPos + entry.dstLength, 'UPDATE', true));
		}

		if (entry.actionType == 'DELETE') {

			srcMarkers.push(new Marker(entry.srcId, entry.srcPos, 'DELETE', false, 'src'));
			srcMarkers.push(new Marker(entry.srcId, entry.srcPos + entry.srcLength, 'DELETE', true));
		}

	});

  //markers are now full, sort them
	var dstMarkersSorted = _(dstMarkers).chain()
          .sortBy('id')
          .sortBy('position')
          .reverse()
          .value();

	var srcMarkersSorted = _(srcMarkers).chain()
          .sortBy('id')
          .sortBy('position')
          .reverse()
          .value();

	dstString = DiffDrawer.insertMarkers(dstMarkersSorted, dstString);
	srcString = DiffDrawer.insertMarkers(srcMarkersSorted, srcString);

	$('#dst').html(dstString);
	$('#src').html(srcString);

	$('pre code').each(function(i, block) {
		hljs.highlightBlock(block);
	});

	$('code.hljs-line-numbers').remove();

	$('code.hljs#src').each(function(i, block) {
		hljs.lineNumbersBlock(block);
	});
	$('code.hljs#dst').each(function(i, block) {
		hljs.lineNumbersBlock(block);
	});


})
.catch(function(error) {
	console.log(error);
});
	}
}
export default DiffDrawer;
