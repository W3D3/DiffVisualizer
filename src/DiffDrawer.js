/* global $ */
/**
 * @file Represents and draws Diffs
 * @author Christoph Wedenig <christoph@wedenig.org>
 */

import axios from 'axios';
import _ from 'lodash';
import NProgress from 'nprogress';
import hash from 'object-hash';
import Base64 from 'js-base64/base64';

import Marker from './Marker';
import Utility from './Utility';
import Diff from './Diff';
import GUI from './GUI';
import {
    client,
} from '../config/default.json';

const base64 = Base64.Base64; // very nice packaging indeed.
/**
 * Used to fetch diff data from a webservice and show it on screen
 * @example var dd = new DiffDrawer(mySrc, myDst); dd.diffAndDraw();
 * @constructor
 * @param {string} src - source code string
 * @param {string} dst - destination code string
 */
class DiffDrawer {
    constructor(src, dst) {
        this.LINE_SEPARATOR = '\r\n';

        this.src = src;
        this.dst = dst;

        this.srcMarkersSorted = {};
        this.dstMarkersSorted = {};

        this.filterArray = ['INSERT', 'DELETE', 'UPDATE', 'MOVE'];

        this.matcherID = 0;
        this.matcherName = 'NONE';

        // set default base URL
        this.DIFF_API = axios.create();
        this.setBaseUrl(client.apibase);

        this.enableMinimap = true;
        this.diff = new Diff();

        this.metadata = [];
        this.edited = false;
    }

    checkAPIState() {
        return this.DIFF_API.get('/matchers');
    }

    get jobId() {
        if (!this._jobId) {
            return hash(base64.encode(this.src) + base64.encode(this.dst) + this.matcherID + this.edited);
        }
        return this._jobId;
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

    setDiff(diff) {
        this.diff = diff;
    }

    getDiff() {
        return this.diff;
    }

    diffHash() {
        if (this.diff) {
            return hash(`${JSON.stringify(this.diff.toJSON())}edited:${this.edited}`);
        }
        return '';
    }

    getDiffId() {
        if (this.diff) {
            return this.diff.id;
        }
        return this.jobId;
    }

    setAsCurrentJob() {
        DiffDrawer.currentJobId = this.jobId;
    }

    // setJobId(id) {
    //     if (id === null) {
    //         this.jobId = base64.encode(this.src) + base64.encode(this.dst) + this.matcherID + this.edited;
    //     } else {
    //         this.jobId = hash(id + 'm' + this.matcherID);
    //     }
    // }

    setBaseUrl(newBase) {
        this.DIFF_API.defaults.baseURL = newBase;
    }

    getBaseUrl() {
        return this.DIFF_API.defaults.baseURL;
    }

    set src(val) {
        if (val == null) {
            this._src = '';
        } else {
            this._src = val.replace(new RegExp('(\\r)?\\n', 'g'), this.LINE_SEPARATOR);
        }
    }

    get src() {
        return this._src;
    }

    set dst(val) {
        if (val == null) {
            this._src = '';
        } else {
            this._dst = val.replace(new RegExp('(\\r)?\\n', 'g'), this.LINE_SEPARATOR);
        }
    }

    get dst() {
        return this._dst;
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
            name: this.matcherName,
        };
    }

    getMatcherID() {
        return this.matcherID;
    }

    /**
    * Checks if current job is indeed this job.
    */
    checkIfCurrentJob() {
        if (this.jobId === DiffDrawer.currentJobId) {
            // this is the current job
            return true;
        }
        // console.log(`This job (${this.jobId}) is not supposed to be worked on anymore and should terminate. currentJobId: (${DiffDrawer.currentJobId})`);
        return false;
    }

    /**
    * Takes existing changes in srcMarkersSorted and dstMarkersSorted and prints them on the screen.
    */
    showChanges() {
        if (this.srcMarkersSorted === null || this.srcMarkersSorted === null) {
            Utility.showError('There are no changes to show');
            return false;
        }

        const linesSrc = this.src.split('\r\n');
        const linesDst = this.dst.split('\r\n');

        for (let i = 0; i < linesSrc.length; i++) {
            // line numbers are indexed starting at 1 (human readable), so add 1 here
            if (this.srcMarkersSorted[i + 1]) {
                linesSrc[i] = DiffDrawer.insertMarkers(this.srcMarkersSorted[i + 1], linesSrc[i]);
            } else {
                linesSrc[i] = _.escape(linesSrc[i]);
            }
        }

        for (let i = 0; i < linesDst.length; i++) {
            if (this.dstMarkersSorted[i + 1]) {
                linesDst[i] = DiffDrawer.insertMarkers(this.dstMarkersSorted[i + 1], linesDst[i]);
            } else {
                linesDst[i] = _.escape(linesDst[i]);
            }
        }

        if (this.checkIfCurrentJob()) { // only show if this is the current Job!
            $('#dst').html(linesDst.join('\n'));
            $('#src').html(linesSrc.join('\n'));
            GUI.enableSyntaxHighlighting();
            this.filter();

            if (this.enableMinimap) {
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
        const $src = $('.src');
        const $dst = $('.dst');

        const minimapHeight = $('.codebox').css('height');
        const minimapTop = $('#codeboxTitle').css('height');
        $('.minimap').css('height', minimapHeight);
        $('.minimap').css('top', minimapTop + 20);

        const right = parseInt(`${$('.dst').innerWidth() + 3}px`, 10);
        $('.srcminimap').css('right', right);
        $('.dstminimap').css('right', '1px');

        $('.minimap-viewport').remove();
        $('.srcminimap').minimap($src);
        $('.dstminimap').minimap($dst);
    }


    /**
   * Takes a codestring and their already sorted markers and generates a string with all the inserted markers added.
   * @param {Marker[]} markersSorted - Sorted marker array of the given code string.
   * @param {string} codeString - Code string to be used, contained html tags will be escaped.
   * @returns {string} - Code string with all the markers added as span tags.
   */
    static insertMarkers(markersSorted, codeString) {
        let escapeUntilPos = codeString.length;
        markersSorted.forEach((marker) => {
            // Before inserting marker, escape everything up to this point
            codeString = Utility.escapeSubpart(codeString, marker.position.offset, escapeUntilPos);
            escapeUntilPos = marker.position.offset;

            const range = Utility.splitValue(codeString, marker.position.offset);
            codeString = range[0] + marker.generateTag() + range[1];
        });
        // after all markers, escape the rest of the string
        codeString = Utility.escapeSubpart(codeString, 0, escapeUntilPos);
        // formatted string
        return codeString;
    }

    static fixSequencing(markers) {
        const markersSorted = _(markers).chain()
            .sortBy('id')
            .sortBy('position.offset')
            .sortBy('position.line')
            .reverse()
            .value();


        const lastClosed = [];
        const markersFixed = [];

        markersSorted.forEach((marker) => {
            if (marker.isEndMarker) {
                // is endmarker and always fits there
                markersFixed.push(marker);

                // fill the opening Marker into the last closed array for faster opening
                const closingMarker = marker.createEndMarker(marker.position);
                closingMarker.isEndMarker = false;
                lastClosed.push(closingMarker);
            } else if (lastClosed.length > 0 && lastClosed[lastClosed.length - 1].id === marker.id) {
                // is startmarker
                // can be inserted
                lastClosed.pop();
                markersFixed.push(marker);
            } else {
                let markerNotYetOpened = false;
                lastClosed.forEach((startmarker) => {
                    if (startmarker.id == marker.id) {
                        markerNotYetOpened = true;
                    }
                });
                if (markerNotYetOpened) {
                    let openingMarker = lastClosed.pop();
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
        });
        return markersFixed;
    }

    /**
   * Takes src and dst and send them to the webservice to get diffing information.
   * This also calls @see showChanges to show the generated data right after fetching.
   * This is the only method you have to execute from outside this class.
   * @param {function} callback - Function to execute after successfully displaying content.
   * @param {function} err - Function to execute if something goes wrong, gets passed the error object.
   */
    diffAndDraw(callback, err) {
        if (this.src == null || this.dst == null) {
            NProgress.done();
            return;
        }

        const me = this;
        if (!me.checkIfCurrentJob()) {
            // console.log('Aborted Operation wiht id ' + DiffDrawer.currentJobId);
            NProgress.done();
            return;
        }
        const payload = {
            src: base64.encode(this.src),
            dst: base64.encode(this.dst),
            matcher: this.getMatcherID(),
        };
        this.DIFF_API.post('/changes', payload)
            .then((response) => {
                $('.time').text(`${response.data.metrics.matchingTime} ms to match, ${response.data.metrics.classificationTime} ms to classify using matcher ${me.matcherName}`);

                const changes = response.data.results;
                const dstMarkers = [];
                const srcMarkers = [];

                changes.forEach((entry) => {
                    let startPosition;
                    let endPosition;
                    let startMarker;
                    let closingMarker;

                    if (entry.actionType == 'INSERT') {
                        startPosition = {
                            line: entry.dstStartLine,
                            offset: entry.dstStartLineOffset,
                            absolute: entry.dstPos,
                        };
                        startMarker = new Marker(entry.dstId, startPosition, entry.actionType, false, 'dst');

                        me.metadata.push(entry.metadata);
                        startMarker.addMetaData(`INSERT ${entry.dstId}`, me.metadata.length - 1);

                        endPosition = {
                            line: entry.dstEndLine,
                            offset: entry.dstEndLineOffset,
                            absolute: entry.dstPos + entry.dstLength,
                        };
                        closingMarker = startMarker.createEndMarker(endPosition);

                        if (!startMarker.isValid()) {
                            err(`<pre>${JSON.stringify(startMarker, undefined, 2)}</pre>Marker is invalid and cannot be displayed. This is likely an error with the diff webservice.`);
                        }
                        dstMarkers.push(startMarker);
                        dstMarkers.push(closingMarker);
                    }

                    if (entry.actionType === 'UPDATE' || entry.actionType === 'MOVE') {
                        // SRCMARKER
                        startPosition = {
                            line: entry.srcStartLine,
                            offset: entry.srcStartLineOffset,
                            absolute: entry.srcPos,
                        };
                        startMarker = new Marker(entry.srcId, startPosition, entry.actionType, false, 'src');
                        startMarker.bindToId(entry.dstId);

                        me.metadata.push(entry.metadata);
                        startMarker.addMetaData(`${entry.actionType} (Source) ${entry.srcId}`, me.metadata.length - 1);

                        endPosition = {
                            line: entry.srcEndLine,
                            offset: entry.srcEndLineOffset,
                            absolute: entry.srcPos + entry.srcLength,
                        };
                        closingMarker = startMarker.createEndMarker(endPosition);

                        if (!startMarker.isValid()) {
                            err(`<pre>${JSON.stringify(startMarker, undefined, 2)}</pre>Marker is invalid and cannot be displayed. This is likely an error with the diff webservice.`);
                        }
                        srcMarkers.push(startMarker);
                        srcMarkers.push(closingMarker);

                        // DSTMARKER
                        startPosition = {
                            line: entry.dstStartLine,
                            offset: entry.dstStartLineOffset,
                            absolute: entry.dstPos,
                        };
                        const dstStartMarker = new Marker(entry.dstId, startPosition, entry.actionType, false, 'dst');
                        dstStartMarker.bindToId(entry.srcId);

                        dstStartMarker.addMetaData(`${entry.actionType} (Destination) ${entry.dstId}`, me.metadata.length - 1);
                        // dstMarker.addMetaData('dst' + entry.dstId, 'This is a ' + entry.actionType);
                        // startMarker.addMetaData('dst' + entry.dstId, 'FROM ' + entry.dstPos + ' LENGTH ' + entry.dstLength);
                        endPosition = {
                            line: entry.dstEndLine,
                            offset: entry.dstEndLineOffset,
                            absolute: entry.dstPos + entry.dstLength,
                        };
                        const dstClosingMarker = dstStartMarker.createEndMarker(endPosition);

                        if (!dstStartMarker.isValid()) {
                            err(`<pre>${JSON.stringify(dstStartMarker, undefined, 2)}</pre>Marker is invalid and cannot be displayed. This is likely an error with the diff webservice.`);
                        }
                        dstMarkers.push(dstStartMarker);
                        dstMarkers.push(dstClosingMarker);
                    }

                    if (entry.actionType === 'DELETE') {
                    // SRCMARKER
                        startPosition = {
                            line: entry.srcStartLine,
                            offset: entry.srcStartLineOffset,
                            absolute: entry.srcPos,
                        };
                        startMarker = new Marker(entry.srcId, startPosition, entry.actionType, false, 'src');
                        // startMarker.bindToId(entry.dstId);

                        me.metadata.push(entry.metadata);
                        startMarker.addMetaData(`DELETE ${entry.srcId}`, me.metadata.length - 1);
                        // startMarker.addMetaData('src' + entry.srcId, 'FROM ' + entry.srcPos + ' LENGTH ' + entry.srcLength);

                        endPosition = {
                            line: entry.srcEndLine,
                            offset: entry.srcEndLineOffset,
                            absolute: entry.srcPos + entry.srcLength,
                        };
                        closingMarker = startMarker.createEndMarker(endPosition);

                        if (!startMarker.isValid()) {
                            err(`<pre>${JSON.stringify(startMarker, undefined, 2)}</pre>Marker is invalid and cannot be displayed. This is likely an error with the diff webservice.`);
                        }
                        srcMarkers.push(startMarker);
                        srcMarkers.push(closingMarker);
                    }
                });

                // markers are now full, sort and fix them
                const fixedSrcMarkers = DiffDrawer.fixSequencing(srcMarkers);
                me.srcMarkersSorted = _.groupBy(fixedSrcMarkers, (item) => {
                    return item.position.line;
                });

                const fixedDstMarkers = DiffDrawer.fixSequencing(dstMarkers);
                me.dstMarkersSorted = _.groupBy(fixedDstMarkers, (item) => {
                    return item.position.line;
                });


                if (!me.checkIfCurrentJob()) {
                    return false;
                }

                if (me.showChanges()) {
                    callback();
                }
                return true;
            })
            .catch((error) => {
                // make sure we don't throw errors for old jobs!
                if (me.checkIfCurrentJob()) {
                    if (error.response) {
                        err(`${error} (using matcher ${me.matcherName})<pre>${JSON.stringify(error.response.data, undefined, 2)}</pre>`);
                        return;
                    }
                    err(`${error} (using matcher ${me.matcherName})`);
                    // console.error(error);
                }
            });
    }

    // status
    // -2 aborted
    // -1 error
    // 0 = in progress
    // 1 = done
    generateTitle(status) {
        let titlestring = '';
        if (this.diff == null) {
            titlestring = `<span class="label label-info" id="currentMatcher">${this.matcherName}</span>`;
        } else {
            titlestring = `<span class="label label-default id-expand" data-id="${this.diff.id}">${this.diff.shortId}</span>\
            <span class="label label-info" id="currentMatcher">${this.matcherName}</span>`;
        }

        if (status === 0) {
            titlestring += ' <span class="label label-primary">IN PROGRESS</span>';
        } else if (status === -1) {
            titlestring += ' <span class="label label-danger">ERROR</span>';
        } else if (status === -2) {
            titlestring += ' <span class="label label-danger">ABORTED</span>';
        }
        if (this.diff != null) {
            titlestring += ` <b>${this.diff.title}</b> `;
            if (this.edited) {
                titlestring += ' (Edited) ';
            }

            if (this.srcUrl) {
                titlestring += `<a href="${this.srcUrl}" target="src"><span class="badge"><i class="fa fa-file-text-o"></i> SRC</span></a> `;
            }
            if (this.dstUrl) {
                titlestring += `<a href="${this.dstUrl}" target="dst"><span class="badge"><i class="fa fa-file-text"></i> DST</span></a> `;
            }

            if (this.diff.commitUrl) {
                titlestring += `<a href="${this.diff.commitUrl}" target="${this.diff.id}"><span class="badge"><i class="fa fa-github"></i> Commit</span></a> `;
            }
        } else {
            titlestring += ' <b>Editor Input</b> ';
        }
        return titlestring;
    }

    filter() {
        const allTypes = ['INSERT', 'DELETE', 'UPDATE', 'MOVE'];
        allTypes.forEach((type) => {
            if (!this.filterArray.includes(type)) {
                const typedMarkers = $('#codeContent').find(`.${type}`);
                typedMarkers.removeClass(type);
                typedMarkers.removeClass('scriptmarker');
                typedMarkers.addClass(`${type}-hidden`);
            } else {
                const hiddenMarkers = $('#codeContent').find(`.${type}-hidden`);
                hiddenMarkers.removeClass(`${type}-hidden`);
                hiddenMarkers.addClass('scriptmarker');
                hiddenMarkers.addClass(type);
            }
        });
    }
}
export default DiffDrawer;
