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

        this.srcMarkersSorted = {};
        this.dstMarkersSorted = {};

        this.filterArray = ['INSERT', 'DELETE', 'UPDATE', 'MOVE'];

        this.matcherID = 1; //default to first matcher (ClassicGumtree)
        this.matcherName = 'ClassicGumtree'; //TODO fetch

        //set default base URL
        this.DIFF_API = axios.create();
        this.setBaseUrl(client.apibase);

        this.jobId = hash(base64.encode(this.src) + base64.encode(this.dst) + this.matcherID);

        this.enableMinimap = true;
    }

    checkAPIState()
    {
        return this.DIFF_API.get('/matchers');
    }

    setSrcUrl(value) {
        this.srcUrl = value;
    }

    setDstUrl(value) {
        this.dstUrl = value;
    }

    setEnableMinimap(value) {
        this.enableMinimap = value;
    }

    setIdAndFilname(id, filename) {
        this.id = id;
        this.filename = filename;
    }

    getFilename() {
        return this.filename;
    }

    generateHash() {
        return hash(base64.encode(this.src) + base64.encode(this.dst) + this.matcherID);
    }

    generateHashWithoutData() {
        return hash(this.id + this.filename + this.matcherID);
    }

    getDiffId() {
        return this.id;
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
        //TODO update jobId if needed
    }

    getSource() {
        return this.src;
    }

    setDestination(newDst) {
        this.dst = newDst;
        //TODO update jobId if needed
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
        if (this.srcMarkersSorted == null || this.srcMarkersSorted == null) {
            Utility.showError('There are no changes to show');
            return false;
        }

        var linesSrc = this.getSource().split('\r\n');
        var linesDst = this.getDestination().split('\r\n');

        for (var i = 0; i < linesSrc.length; i++) {
            //line numbers are indexed starting at 1 (human readable), so add 1 here
            if(this.srcMarkersSorted[i+1]) {
                linesSrc[i] = DiffDrawer.insertMarkers(this.srcMarkersSorted[i+1], linesSrc[i]);
            } else {
                linesSrc[i] = _.escape(linesSrc[i]);
            }
        }

        for (i = 0; i < linesDst.length; i++) {
            if(this.dstMarkersSorted[i+1]) {
                linesDst[i] = DiffDrawer.insertMarkers(this.dstMarkersSorted[i+1], linesDst[i]);
            } else {
                linesDst[i] = _.escape(linesDst[i]);
            }
        }

        if (this.checkIfCurrentJob()) { //only show if this is the current Job!
            $('#dst').html(linesDst.join('\n'));
            $('#src').html(linesSrc.join('\n'));
            this.enableSyntaxHighlighting();
            this.filter();

            if(this.enableMinimap) {
                DiffDrawer.refreshMinimap();
                $('.minimap').show();

                $(window).resize(_.debounce(DiffDrawer.refreshMinimap, 150));
            }

            NProgress.done();
            return true;
        }
        return false;

    }

    static refreshMinimap() {
        var $src = $('.src');
        var $dst = $('.dst');

        var minimapHeight = $('.codebox').css('height');
        var minimapTop = $('#codeboxTitle').css('height');
        $('.minimap').css('height', minimapHeight);
        $('.minimap').css('top', minimapTop+20);

        var right = parseInt($('.dst').innerWidth() + 3 + 'px');
        $('.srcminimap').css('right', right);
        $('.dstminimap').css('right', '1px');

        $('.minimap-viewport').remove();
        $('.srcminimap').minimap($src);
        $('.dstminimap').minimap($dst);
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
        var escapeUntilPos = codeString.length;
        markersSorted.forEach(function(marker) {
            //Before inserting marker, escape everything up to this point
            codeString = Utility.escapeSubpart(codeString, marker.position.offset, escapeUntilPos);
            escapeUntilPos = marker.position.offset;

            var range = Utility.splitValue(codeString, marker.position.offset);
            codeString = range[0] + marker.generateTag() + range[1];
        });
        //after all markers, escape the rest of the string
        codeString = Utility.escapeSubpart(codeString, 0, escapeUntilPos);
        //formatted string
        return codeString;
    }

    static fixSequencing(markers) {
        var markersSorted = _(markers).chain()
          .sortBy('id')
          .sortBy('position.absolute')
          .reverse()
          .value();

        var lastClosed = [];
        var markersFixed = [];

        markersSorted.forEach(function(marker) {
            if (marker.isEndMarker) {
                  //is endmarker and always fits there
                markersFixed.push(marker);

                  //fill the opening Marker into the last closed array for faster opening
                var closingMarker = marker.createEndMarker(marker.position);
                closingMarker.isEndMarker = false;
                lastClosed.push(closingMarker);
            } else {
                  //startmarker
                if (lastClosed.length > 0 && lastClosed[lastClosed.length - 1].id === marker.id) {
                      //can be inserted
                    lastClosed.pop();
                    markersFixed.push(marker);
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
                            openingMarker.position = marker.position;
                            markersFixed.push(openingMarker);

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
        return markersFixed;
    }

  /**
   * Takes src and dst and send them to the webservice to get diffing information
   * This also calls @see showChanges to show the generated data right after fetching
   * This is the only method you have to execute from outside this class
   * @param {Marker[]} markersSorted - sorted marker array of the given code string
   * @param {string} codeString - code string to be used, contained html tags will be escaped
   */
    diffAndDraw(callback, err) {

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
        var payload = {
            'src': base64.encode(srcString),
            'dst': base64.encode(dstString),
            'matcher': this.getMatcherID()
        };
        this.DIFF_API.post('/changes', payload)
        .then(function(response) {

            $('.time').text(response.data.metrics.matchingTime + ' ms to match, ' + response.data.metrics.classificationTime + ' ms to classify using matcher ' + diffdrawer.matcherName);

            var changes = response.data.results;
            var dstMarkers = new Array();
            var srcMarkers = new Array();

            changes.forEach(function(entry) {
                var startPosition;
                var endPosition;
                var startMarker;
                var closingMarker;

                if (entry.actionType == 'INSERT') {

                    startPosition = {
                        line: entry.dstStartLine,
                        offset: entry.dstStartLineOffset,
                        absolute: entry.dstPos
                    };
                    startMarker = new Marker(entry.dstId, startPosition, entry.actionType, false, 'dst');
                    endPosition = {
                        line: entry.dstEndLine,
                        offset: entry.dstEndLineOffset,
                        absolute: entry.dstPos + entry.dstLength
                    };
                    closingMarker = startMarker.createEndMarker(endPosition);

                    dstMarkers.push(startMarker);
                    dstMarkers.push(closingMarker);
                }

                if (entry.actionType == 'UPDATE' || entry.actionType == 'MOVE') {
                    //SRCMARKER
                    startPosition = {
                        line: entry.srcStartLine,
                        offset: entry.srcStartLineOffset,
                        absolute: entry.srcPos
                    };
                    startMarker = new Marker(entry.srcId, startPosition, entry.actionType, false, 'src');
                    startMarker.bindToId(entry.dstId);
                    //startMarker.addMetaData('src' + entry.srcId, 'FROM ' + entry.srcPos + ' LENGTH ' + entry.srcLength);

                    endPosition = {
                        line: entry.srcEndLine,
                        offset: entry.srcEndLineOffset,
                        absolute: entry.srcPos + entry.srcLength
                    };
                    closingMarker = startMarker.createEndMarker(endPosition);

                    srcMarkers.push(startMarker);
                    srcMarkers.push(closingMarker);

                    //DSTMARKER
                    startPosition = {
                        line: entry.dstStartLine,
                        offset: entry.dstStartLineOffset,
                        absolute: entry.dstPos
                    };
                    var dstStartMarker = new Marker(entry.dstId, startPosition, entry.actionType, false, 'dst');
                    dstStartMarker.bindToId(entry.srcId);
                    //dstMarker.addMetaData('dst' + entry.dstId, 'This is a ' + entry.actionType);
                    //startMarker.addMetaData('dst' + entry.dstId, 'FROM ' + entry.dstPos + ' LENGTH ' + entry.dstLength);
                    endPosition = {
                        line: entry.dstEndLine,
                        offset: entry.dstEndLineOffset,
                        absolute: entry.dstPos + entry.dstLength
                    };
                    var dstClosingMarker = dstStartMarker.createEndMarker(endPosition);

                    dstMarkers.push(dstStartMarker);
                    dstMarkers.push(dstClosingMarker);
                }

                if (entry.actionType == 'DELETE') {
                    //SRCMARKER
                    startPosition = {
                        line: entry.srcStartLine,
                        offset: entry.srcStartLineOffset,
                        absolute: entry.srcPos
                    };
                    startMarker = new Marker(entry.srcId, startPosition, entry.actionType, false, 'src');
                    startMarker.bindToId(entry.dstId);
                    //startMarker.addMetaData('src' + entry.srcId, 'FROM ' + entry.srcPos + ' LENGTH ' + entry.srcLength);

                    endPosition = {
                        line: entry.srcEndLine,
                        offset: entry.srcEndLineOffset,
                        absolute: entry.srcPos + entry.srcLength
                    };
                    closingMarker = startMarker.createEndMarker(endPosition);

                    srcMarkers.push(startMarker);
                    srcMarkers.push(closingMarker);
                }

            });

            //markers are now full, sort and fix them
            var fixedSrcMarkers = DiffDrawer.fixSequencing(srcMarkers);
            diffdrawer.srcMarkersSorted = _.groupBy(fixedSrcMarkers, function (item) {
                return item.position.line;
            });

            var fixedDstMarkers = DiffDrawer.fixSequencing(dstMarkers);
            diffdrawer.dstMarkersSorted = _.groupBy(fixedDstMarkers, function (item) {
                return item.position.line;
            });


            if (!diffdrawer.checkIfCurrentJob()) {
                return false;
            }

            if(diffdrawer.showChanges()) {
                callback();
            }

        })
      .catch(function(error) {

          //make sure we don't throw errors for old jobs!
          if (diffdrawer.checkIfCurrentJob()) {
              if (error.response) {
                  err(error + ' (using matcher ' + diffdrawer.matcherName + ')<pre>' + JSON.stringify(error.response.data, undefined, 2)  + '</pre>');
                  return;
              }
              err(error + ' (using matcher ' + diffdrawer.matcherName + ')');
              //console.error(error);
          }
      });
    }

      //status
      // -2 aborted
      // -1 error
      // 0 = in progress
      // 1 = done
    generateTitle(status) {
        if(this.id == null)
        {
            return '';
        }
        var titlestring = `<span class="label label-default">${this.id}</span><span class="label label-info" id="currentMatcher">${this.matcherName}</span>`;

        if(status === 0) {
            titlestring += '<span class="label label-primary">IN PROGRESS</span>';
        }
        else if(status === -1) {
            titlestring += '<span class="label label-danger">ERROR</span>';
        }
        else if(status === -2) {
            titlestring += '<span class="label label-danger">ABORTED</span>';
        }
        titlestring += ` <b>${this.filename}</b> `;

        if(this.srcUrl) titlestring += `<a href="${this.srcUrl}" target="src"><span class="badge"><i class="fa fa-github"></i> SRC</span></a>`;
        if(this.dstUrl) titlestring += `<a href="${this.dstUrl}" target="dst"><span class="badge"><i class="fa fa-github"></i> DST</span>`;

        if(this.commit) titlestring += '<a href="#"><span class="badge"><i class="fa fa-info"></i> Commit</span>';
        return titlestring;
    }

    filter()
    {
        var allTypes = ['INSERT', 'DELETE', 'UPDATE', 'MOVE'];
        allTypes.forEach(type => {
            if(!this.filterArray.includes(type))
            {
                var typedMarkers = $('#codeContent').find('.'+type);
                typedMarkers.removeClass(type);
                typedMarkers.removeClass('scriptmarker');
                typedMarkers.addClass(type+'-hidden');
            }else {

                var hiddenMarkers = $('#codeContent').find('.'+type+'-hidden');
                hiddenMarkers.removeClass(type+'-hidden');
                hiddenMarkers.addClass('scriptmarker');
                hiddenMarkers.addClass(type);

            }
        });

    }
}
export default DiffDrawer;
