/* global $ hljs */
/**
 * @file Represents and draws Diffs
 * @author Christoph Wedenig <christoph@wedenig.org>
 */

import Marker from './Marker';
import Utility from './Utility';
import axios from 'axios';
import Base64 from 'js-base64/base64';
var base64 = Base64.Base64; //very nice packaging indeed.
import _ from 'lodash';
import NProgress from 'nprogress';
import hash from 'object-hash';
import {
  client
} from '../config/default.json';

/**
 * Used to fetch diff data from a webservice and show it on screen
 * @example var dd = new DiffDrawer(mySrc, myDst); dd.diffAndDraw();
 * @constructor
 * @param {string} src - source code string
 * @param {string} dst - destination code string
 */
class DiffDrawer {

  /**
   * sets up reasonable defaults for filtering and API endpoint
   * @constructor
   * @param {string} src - source code string
   * @param {string} dst - destination code string
   */
  constructor(src, dst) {
    this.src = src;
    this.dst = dst;

    this.srcMarkersSorted = [];
    this.dstMarkersSorted = [];

    this.filterArray = ['INSERT', 'DELETE', 'UPDATE', 'MOVE'];

    this.matcherID = 1; //default to first matcher (ClassicGumtree)
    this.matcherName = 'ClassicGumtree';

    //set default base URL
    this.DIFF_API = axios.create();
    this.setBaseUrl(client.apibase);

    this.jobId = hash(base64.encode(this.src) + base64.encode(this.dst) + this.matcherID);
  }

  setAsCurrentJob() {
    DiffDrawer.currentJobId = this.jobId;
  }

  setJobId(id) {
    if (id === null) {
      this.jobId = hash(base64.encode(this.src) + base64.encode(this.dst) + this.matcherID);
    } else {
      this.jobId = hash(id + 'm' + this.matcherID);
    }
  }

  setBaseUrl(newBase) {
    this.DIFF_API.defaults.baseURL = newBase;
  }

  getBaseUrl() {
    return this.DIFF_API.defaults.baseURL;
  }

  setSource(newSrc) {
    this.src = newSrc;
    //this.jobId = hash(base64.encode(this.src) + base64.encode(this.dst));
  }

  getSource() {
    return this.src;
  }

  setDestination(newDst) {
    this.dst = newDst;
    //this.jobId = hash(base64.encode(this.src) + base64.encode(this.dst));
  }

  getDestination() {
    return this.dst;
  }

  setFilter(filterarray) {
    this.filterArray = filterarray;
  }

  getFilter() {
    return this.filterArray;
  }

  getAvailableMatchers() {
    return this.DIFF_API.get('/matchers');
  }

  setMatcher(matcher) {
    this.matcherID = matcher.id;
    this.matcherName = matcher.name;
  }

  getMatcher() {
    return {
      id: this.matcherID,
      name: this.matcherName
    };
  }

  getMatcherID() {
    return this.matcherID;
  }

  clear() {
    $('span.scriptmarker', $('#src')).contents().unwrap();
    $('span.scriptmarker', $('#dst')).contents().unwrap();
  }

  /**
   * Checks if current job is indeed this job
   */
  checkIfCurrentJob() {
    if (this.jobId === DiffDrawer.currentJobId) {
      //this is the current job
      return true;
    } else {
      //console.log(`This job (${this.jobId}) is not supposed to be worked on anymore and should terminate. currentJobId: (${DiffDrawer.currentJobId})`);
      return false;
    }
  }

  /**
   * takes existing changes in srcMarkersSorted and dstMarkersSorted and prints them on the screen
   */
  showChanges() {
    if (this.srcMarkersSorted == null || this.dstMarkersSorted == null) {
      Utility.showError('There are no changes to show');
      return;
    }

    var filteredSrcMarkers;
    var filteredDstMarkers;
    var filterArray = this.filterArray;

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

    if (this.checkIfCurrentJob()) { //only show if this is the current Job!
      $('#dst').html(dstString);
      $('#src').html(srcString);
      this.enableSyntaxHighlighting();

      DiffDrawer.refreshMinimap();

      $(window).resize(_.debounce(DiffDrawer.refreshMinimap, 150));
      NProgress.done();
    }

  }

  static refreshMinimap() {
    var $src = $('.src');
    var $dst = $('.dst');
    $('.minimap-viewport').remove();
    $('.srcminimap').minimap($src);
    $('.dstminimap').minimap($dst);

    var minimapHeight = $('.codebox').css('height');
    var minimapTop = $('#codeboxTitle').css('height');
    $('.minimap').css('height', minimapHeight);
    $('.minimap').css('top', minimapTop);

    var right = parseInt($('.dst').css('width')) + 0 + 'px';
    $('.srcminimap').css('right', right);
    $('.dstminimap').css('right', '0px');
    //console.log($('.dst').css('width'));

  }



  /**
   * Enables/refreshes syntax highlighting and line numbers for all code blocks
   */
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

  /**
   * Takes a codestring and their already sorted markers and generates a string with all the inserted markers added
   * @param {Marker[]} markersSorted - sorted marker array of the given code string
   * @param {string} codeString - code string to be used, contained html tags will be escaped
   * @return {string} - code string with all the markers added as span tags
   */
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
        //TODO copy the old marker and not generate a new one!!!
        var closingMarker = new Marker(marker.id, marker.position, marker.type, false, marker.sourceType);
        closingMarker.metaDataMarkup = marker.metaDataMarkup;
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

  /**
   * Takes src and dst and send them to the webservice to get diffing information
   * This also calls @see showChanges to show the generated data right after fetching
   * This is the only method you have to execute from outside this class
   * @param {Marker[]} markersSorted - sorted marker array of the given code string
   * @param {string} codeString - code string to be used, contained html tags will be escaped
   */
  diffAndDraw() {

    if (this.src == null || this.dst == null) {
      NProgress.done();
      return;
    }

    const LINE_SEPARATOR = '\r\n';
    var srcString = this.src.replace(new RegExp('(\\r)?\\n', 'g'), LINE_SEPARATOR);
    var dstString = this.dst.replace(new RegExp('(\\r)?\\n', 'g'), LINE_SEPARATOR);

    this.src = srcString;
    this.dst = dstString;

    var diffdrawer = this;
    if (!diffdrawer.checkIfCurrentJob()) {
      //console.log('Aborted Operation wiht id ' + DiffDrawer.currentJobId);
      NProgress.done();
      return;
    }
    this.DIFF_API.post('/changes', {
        'src': base64.encode(srcString),
        'dst': base64.encode(dstString),
        'matcher': this.getMatcherID()
      })
      .then(function(response) {

        $('.time').text(response.data.metrics.matchingTime + ' ms to match, ' + response.data.metrics.classificationTime + ' ms to classify using matcher ' + diffdrawer.matcherName);

        var changes = response.data.results;
        var dstMarkers = new Array();
        var srcMarkers = new Array();

        changes.forEach(function(entry) {

          if (entry.actionType == 'INSERT') {
            dstMarkers.push(new Marker(entry.dstId, entry.dstPos, 'INSERT', false, 'dst'));
            dstMarkers.push(new Marker(entry.dstId, entry.dstPos + entry.dstLength, 'INSERT', true, 'dst'));
          }

          if (entry.actionType == 'UPDATE' || entry.actionType == 'MOVE') {
            // if (entry.srcId == 55)
            //   debugger;
            var srcMarker = new Marker(entry.srcId, entry.srcPos, entry.actionType, false, 'src');
            srcMarker.bindToId(entry.dstId); //bind to destination
            srcMarker.addMetaData('src' + entry.srcId, 'This is a ' + entry.actionType);
            srcMarkers.push(srcMarker);
            //add closing tag
            var srcClosing = srcMarker.createEndMarker(entry.srcLength);
            srcMarkers.push(srcClosing);

            var dstMarker = new Marker(entry.dstId, entry.dstPos, entry.actionType, false, 'dst');
            dstMarker.bindToId(entry.srcId);
            dstMarker.addMetaData('dst' + entry.dstId, 'This is a ' + entry.actionType);
            dstMarkers.push(dstMarker);

            var dstClosing = dstMarker.createEndMarker(entry.dstLength);
            dstMarkers.push(dstClosing);
          }

          if (entry.actionType == 'DELETE') {
            var deleteMarker = new Marker(entry.srcId, entry.srcPos, 'DELETE', false, 'src');
            srcMarkers.push(deleteMarker);
            srcMarkers.push(deleteMarker.createEndMarker(entry.srcLength));
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

        if (!diffdrawer.checkIfCurrentJob()) {
          //console.log('Aborted Operation wiht id ' + diffdrawer.currentJobId);
          return;
        }
        diffdrawer.showChanges();

      })
      .catch(function(error) {
        Utility.showError(error + '(using matcher ' + diffdrawer.matcherName + ')');
        NProgress.done();
      });
  }
}
export default DiffDrawer;
