/* global $ hljs */
import Marker from './Marker';
import Utility from './Utility';
import axios from 'axios';
import Base64 from 'js-base64/Base64';
var base64 = Base64.Base64; //very nice packaging indeed.
import _ from 'lodash';

class DiffDrawer {
  constructor(src, dst) {
    this.src = src;
    this.dst = dst;

    this.srcMarkersSorted = [];
    this.dstMarkersSorted = [];

    //set default base URL
    this.DIFF_API = axios.create({
      baseURL: 'http://swdyn.isys.uni-klu.ac.at:5000/v1/',
    });
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
    return this.src;
  }

  setDestination(newDst) {
    this.dst = newDst;
  }

  getDestination() {
    return this.dst;
  }

  filterBy(filterArray) {
    if (this.srcMarkersSorted == null || this.dstMarkersSorted == null) {
      console.error('call visualizeChanges first before setting a filter!');
      //return;
    }

    var filteredSrcMarkers;
    var filteredDstMarkers;

    if (filterArray.length < 4) {
      filteredSrcMarkers = _.filter(this.srcMarkersSorted, function(o) {
        return filterArray.includes(o.type);
      });
      filteredDstMarkers = _.filter(this.dstMarkersSorted, function(o) {
        return filterArray.includes(o.type);
      });
    } else {
      filteredSrcMarkers = this.srcMarkersSorted;
      filteredDstMarkers = this.dstMarkersSorted;
    }

    //redraw
    let srcString = DiffDrawer.insertMarkers(filteredSrcMarkers, this.src);
    let dstString = DiffDrawer.insertMarkers(filteredDstMarkers, this.dst);

    $('#dst').html(dstString);
    $('#src').html(srcString);
    this.enableSyntaxHighlighting();
  }

  enableSyntaxHighlighting() {
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
  }

  static insertMarkers(markersSorted, codeString) {
    var lastClosed = [];
    var escapeUntilPos = codeString.length;

    markersSorted.forEach(function(marker) {
      //Before inserting marker, escape everything up to this point
      codeString = Utility.escapeSubpart(codeString, marker.position, escapeUntilPos);
      escapeUntilPos = marker.position;

      if (marker.isEndMarker) {
        var range = Utility.splitValue(codeString, marker.position);
        codeString = range[0] + marker.generateTag() + range[1];
        //fill the opening Marker into the last closed array for faster opening
        var closingMarker = new Marker(marker.id, marker.position, marker.type, false, marker.sourceType);
        if (marker.bind)
          closingMarker.bindToId(marker.bind);
        lastClosed.push(closingMarker);
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
              codeString = range[0] + openingMarker.generateTag() + range[1];
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
    //after all markers, escape the rest of the string
    codeString = Utility.escapeSubpart(codeString, 0, escapeUntilPos);
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

    var diffdrawer = this;
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

          if (entry.actionType == 'UPDATE' || entry.actionType == 'MOVE') {

            var srcMarker = new Marker(entry.srcId, entry.srcPos, entry.actionType, false, 'src');
            srcMarker.bindToId(entry.dstId); //bind to destination
            srcMarkers.push(srcMarker);
            //add closing tag
            var srcClosing = new Marker(entry.srcId, entry.srcPos + entry.srcLength, entry.actionType, true, 'src');
            srcClosing.bindToId(entry.dstId);
            srcMarkers.push(srcClosing);

            var dstMarker = new Marker(entry.dstId, entry.dstPos, entry.actionType, false, 'dst');
            dstMarker.bindToId(entry.srcId);
            dstMarkers.push(dstMarker);

            var dstClosing = new Marker(entry.dstId, entry.dstPos + entry.dstLength, entry.actionType, true, 'dst');
            dstClosing.bindToId(entry.srcId);
            dstMarkers.push(dstClosing);
          }

          if (entry.actionType == 'DELETE') {

            srcMarkers.push(new Marker(entry.srcId, entry.srcPos, 'DELETE', false, 'src'));
            srcMarkers.push(new Marker(entry.srcId, entry.srcPos + entry.srcLength, 'DELETE', true, 'src'));
          }

        });

        //markers are now full, sort them
        diffdrawer.dstMarkersSorted = _(dstMarkers).chain()
          .sortBy('id')
          .sortBy('position')
          .reverse()
          .value();

        diffdrawer.srcMarkersSorted = _(srcMarkers).chain()
          .sortBy('id')
          .sortBy('position')
          .reverse()
          .value();

        dstString = DiffDrawer.insertMarkers(diffdrawer.dstMarkersSorted, dstString);
        srcString = DiffDrawer.insertMarkers(diffdrawer.srcMarkersSorted, srcString);

        $('#dst').html(dstString);
        $('#src').html(srcString);

        diffdrawer.enableSyntaxHighlighting();
      })
      .catch(function(error) {
        console.error(error);
      });
  }
}
export default DiffDrawer;
