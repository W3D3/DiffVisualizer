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
        if (this.srcMarkersSorted == null || this.dstMarkersSorted == null) {
            Utility.showError('There are no changes to show');
            return false;
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

            if(this.enableMinimap)
      {
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
        $('.minimap').css('top', minimapTop);

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
                    {closingMarker.bindToId(marker.bind);}
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
        //console.log(JSON.stringify(payload));
        this.DIFF_API.post('/changes', payload)
        .then(function(response) {

            $('.time').text(response.data.metrics.matchingTime + ' ms to match, ' + response.data.metrics.classificationTime + ' ms to classify using matcher ' + diffdrawer.matcherName);

            var changes = response.data.results;
            var dstMarkers = new Array();
            var srcMarkers = new Array();

            var srcStartLines = _.groupBy(changes, 'srcStartLine');
            var changesStartLine = _.groupBy(changes, 'srcEndLine');

            changes.forEach(function(entry) {
                var startPosition;
                var endPosition;
                var startMarker;
                var closingMarker;

                if (entry.actionType == 'INSERT') {

                    startPosition = {
                        line: entry.dstStartLine,
                        offset: entry.dstStartLineOffset
                    };
                    startMarker = new Marker(entry.dstId, startPosition, entry.actionType, false, 'dst');
                    endPosition = {
                        line: entry.dstEndLine,
                        offset: entry.dstEndLineOffset
                    };
                    closingMarker = startMarker.createEndMarker(endPosition);

                    dstMarkers.push(startMarker);
                    dstMarkers.push(closingMarker);
                }

                if (entry.actionType == 'UPDATE' || entry.actionType == 'MOVE') {
                    //SRCMARKER
                    startPosition = {
                        line: entry.srcStartLine,
                        offset: entry.srcStartLineOffset
                    };
                    startMarker = new Marker(entry.srcId, startPosition, entry.actionType, false, 'src');
                    startMarker.bindToId(entry.dstId);
                    //startMarker.addMetaData('src' + entry.srcId, 'FROM ' + entry.srcPos + ' LENGTH ' + entry.srcLength);

                    endPosition = {
                        line: entry.srcEndLine,
                        offset: entry.srcEndLineOffset
                    };
                    closingMarker = startMarker.createEndMarker(endPosition);

                    srcMarkers.push(startMarker);
                    srcMarkers.push(closingMarker);

                    //DSTMARKER
                    startPosition = {
                        line: entry.dstStartLine,
                        offset: entry.dstStartLineOffset
                    };
                    var dstStartMarker = new Marker(entry.dstId, startPosition, entry.actionType, false, 'dst');
                    dstStartMarker.bindToId(entry.srcId);
                    //dstMarker.addMetaData('dst' + entry.dstId, 'This is a ' + entry.actionType);
                    //startMarker.addMetaData('dst' + entry.dstId, 'FROM ' + entry.dstPos + ' LENGTH ' + entry.dstLength);
                    endPosition = {
                        line: entry.dstEndLine,
                        offset: entry.dstEndLineOffset
                    };
                    var dstClosingMarker = dstStartMarker.createEndMarker(endPosition);

                    dstMarkers.push(dstStartMarker);
                    dstMarkers.push(dstClosingMarker);
                }

                if (entry.actionType == 'DELETE') {
                    //SRCMARKER
                    startPosition = {
                        line: entry.srcStartLine,
                        offset: entry.srcStartLineOffset
                    };
                    startMarker = new Marker(entry.srcId, startPosition, entry.actionType, false, 'src');
                    startMarker.bindToId(entry.dstId);
                    //startMarker.addMetaData('src' + entry.srcId, 'FROM ' + entry.srcPos + ' LENGTH ' + entry.srcLength);

                    endPosition = {
                        line: entry.srcEndLine,
                        offset: entry.srcEndLineOffset
                    };
                    closingMarker = startMarker.createEndMarker(endPosition);

                    srcMarkers.push(startMarker);
                    srcMarkers.push(closingMarker);
                }

            });

            //console.log(srcMarkers);
            console.log(_.groupBy(srcMarkers, function (item) {
                return item.position.line;
            })
            );

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
}
export default DiffDrawer;
