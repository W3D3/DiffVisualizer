/* global $ bootbox */
/**
 * @file Main file that acts as the entry point
 * @author Christoph Wedenig <christoph@wedenig.org>
 */

import axios from 'axios';
import NProgress from 'nprogress';
import _ from 'lodash';

import DiffDrawer from './DiffDrawer';
import Loader from './Loader';
import Utility from './Utility';
import GUI from './GUI';
import Settings from './Settings';
import SearchController from './SearchController';
import GitHubWizard from './GitHubWizard';

import {
    version,
} from '../package.json';

// global variables
let gui;
let dv;
let sc;
let gw;
let matchers;

// start unfiltered
let filter = ['INSERT', 'DELETE', 'UPDATE', 'MOVE'];

/**
 * This sets up all handlers and
 * initializes the DiffVisualizer application.
 */
$(document).ready(() => {
    gui = new GUI();
    GUI.setVersion(version);
    NProgress.configure({trickle: false});

    Settings.initDefaults();

    $('#accordion').collapse().height('auto');

    // if(navigator.userAgent.indexOf('AppleWebKit') != -1) {
    //     // this is webkit, use custom scrollbars because we hide the default ones
    //     $('.scrollbar-chrome').perfectScrollbar();
    // }

    sc = new SearchController({
        focusChangeEvent: 'mouseover',
        globalScope: '#codeContent',
    });
    sc.addContainer($('.src'));
    sc.addContainer($('.dst'));
    sc.disable(); // disable search until switchToViewer

    // create first DiffDrawer object to work on
    dv = new DiffDrawer();
    dv.diff = null;

    dv.checkAPIState().then(() => {
        // working as expected
    }).catch((error) => {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            Utility.showError(`${dv.getBaseUrl()} is down. Status: ${error.response.status} ${error.response.statusText}`);
        } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            Utility.showError(`${dv.getBaseUrl()} did not answer to request.`);
        } else {
            // Something happened in setting up the request that triggered an Error
            Utility.showError(`Cannot connect to ${dv.getBaseUrl()} with request ${error.request}`);
        }
    });

    new Loader();

    // setup clickhandlers for showing / hiding monaco
    editorSetup();

    // setup on change and fill with all available matchers
    matcherChangerSetup();

    // setup style changer
    styleChangerSetup();

    // initialize clickhandler and filter on the sidebar diff list
    diffListSetup();

    // initializes INSERT/UPDATE/DELETE/MOVE filter
    filterSetup();

    // enables clickhandler on bound markers inside codeboxes
    clickBoundMarkersSetup();

    // enables jumping to lines
    jumptToLineSetup();

    // register hover handler for all the UPDATEs and MOVEs
    GUI.setHoverEffect('.codebox', '.scriptmarker');

    // create new GitHubWizard
    gw = new GitHubWizard({
        wizardElement: $('#githubwizard'),
        finish(diffObject) {
            Loader.createDiffList([diffObject], true); // true to append to list
        },
    });
    gw.updateOptions();

    // hide monaco minimaps when wizard is open, z-index too high...
    $('#githubImportButton').click(() => {
        $('#wizard').modal('show');
        GUI.setMonacoMinimapsVisibility(false);
    });
    $('#wizard').on('hidden.bs.modal', () => {
        GUI.setMonacoMinimapsVisibility(true);
    });
});

/**
 * This sets up click handlers for hiding/showing the monaco editor.
 */
function editorSetup() {
    $('#changeSource').hide();

    // register clickhandler on Save
    $('#saveSource').click(() => {
        sc.enable();

        GUI.switchToViewer();
        const oldJob = dv.jobId;
        dv.src = window.editorSrc.getValue();
        dv.dst = window.editorDst.getValue();
        dv.setFilter(filter);
        if (dv.jobId !== oldJob) {
            dv.edited = true;
            dv.setAsCurrentJob();
        } else {
            return;
        }
        NProgress.start();

        dv.diffAndDraw(() => {
            $('#codeboxTitle').html(dv.generateTitle(1));
            $('#changeSource').show();
            DiffDrawer.refreshMinimap();
        }, (msg) => {
            $('#codeboxTitle').html(dv.generateTitle(-1));
            Utility.showError(msg);
            NProgress.done();
        });
    });

    // register clickhandler on discard
    $('#discardSource').click(() => {
        sc.enable();

        GUI.switchToViewer();
    });

    // clickhandler for edit Source button
    $('#changeSource').click(() => {
        sc.disable();
        const srcLinesScrolled = Math.ceil((($('.src').scrollTop() - 5) / 20) + 1);
        const dstLinesScrolled = Math.ceil((($('.dst').scrollTop() - 5) / 20) + 1);
        GUI.switchToEditor();

        // if we have a viewer active
        if (dv) {
            window.editorSrc.setValue(dv.src);
            window.editorDst.setValue(dv.dst);

            GUI.srcEditorScrollTop(srcLinesScrolled);
            GUI.dstEditorScrollTop(dstLinesScrolled);
        }
    });
}

/**
 * This fills the dropdown box with the available diff algorithms (here called matchers).
 * Also it sets the selected one in the Settings.
 */
function matcherChangerSetup() {
    // fill dropdown box with available matchers
    dv.getAvailableMatchers().then((response) => {
        gui.setMatcherSelectionSource(response.data.matchers);
        matchers = response.data.matchers;
        Settings.saveSetting('matcher', matchers[0]);

        if (Settings.loadSetting('matcher')) {
            gui.setSelectedMatcher(Settings.loadSetting('matcher').id);
        }

        dv.setMatcher(Settings.loadSetting('matcher'));
    });

    // matcher on change
    gui.setMatcherChangeHandler(function handler() {
        NProgress.start();
        GUI.clearMarkers();
        $('.minimap').hide();
        Settings.saveSetting('matcher', matchers[this.value - 1]);

        const changedDv = new DiffDrawer();
        Object.assign(changedDv, dv);

        changedDv.setMatcher(Settings.loadSetting('matcher'));
        changedDv.setAsCurrentJob();

        Utility.showMessage(`Matcher changed to ${$('option:selected', this).text()}`);
        $('#codeboxTitle').html(changedDv.generateTitle(0));

        changedDv.diffAndDraw(() => {
            $('#codeboxTitle').html(changedDv.generateTitle(1));
            dv = changedDv;
        }, (msg) => {
            // on error
            $('#codeboxTitle').html(changedDv.generateTitle(-1));
            Utility.showError(msg);
            NProgress.done();
        });
    });
}

/**
 * This sets up handlers for changing the style of the codebox.
 */
function styleChangerSetup() {
    // matcher on change
    gui.setStyleChangeHandler(function handler() {
        Utility.changeCodeStyle(this.value, $(this).find(':selected').data('dark'), $(this).find(':selected').data('custom'));
        Settings.saveSettingPersistent('codestyle', this.value);
    });

    if (Settings.loadSettingPersistent('codestyle')) {
        gui.setSelectedStyle(Settings.loadSettingPersistent('codestyle'));
    }
}

/**
 * Helper function that loads the content of 2 urls into the given viewer.
 * @param {String} srcUrl Source url of the raw input for the source data.
 * @param {String} dstUrl Source url of the raw input for the destination data.
 * @param {DiffDrawer} viewer Viewer to render the two inputs.
 */
function loadIntoViewer(srcUrl, dstUrl, viewer) {
    viewer.setSrcUrl(srcUrl);
    viewer.setDstUrl(dstUrl);

    const configSrc = {
        onDownloadProgress: (progressEvent) => {
            const sourceWork = Math.floor((progressEvent.loaded * 100) / progressEvent.total) / 3;
            NProgress.set(sourceWork / 100);
        },
    };
    const configDst = {
        onDownloadProgress: (progressEvent) => {
            const destinationWork = Math.floor((progressEvent.loaded * 100) / progressEvent.total) / 3;
            NProgress.set(0.33 + (destinationWork / 100));
        },
    };

    NProgress.configure({
        parent: '#codeView',
    });
    NProgress.start();

    $('.minimap').hide();
    $('#codeboxTitle').html(viewer.generateTitle(0));
    sc.hideAll();

    /**
     * Axios function to download the source file.
     */
    function getSrcFile() {
        return axios.get(srcUrl, configSrc).catch((error) => {
            Utility.showError(`${srcUrl} - ${error}`);
            NProgress.done();
        });
    }

    /**
     * Axios function to download the destination file.
     */
    function getDstFile() {
        return axios.get(dstUrl, configDst).catch((error) => {
            Utility.showError(`${dstUrl} - ${error}`);
            NProgress.done();
        });
    }

    axios.all([getSrcFile(), getDstFile()])
        .then(axios.spread((src, dst) => {
            // Both requests are now complete

            viewer.src = src.data;
            viewer.dst = dst.data;
            viewer.setFilter(filter);

            const avg = (src.data.split(/\r\n|\r|\n/).length + dst.data.split(/\r\n|\r|\n/).length) / 2;

            if (avg > 32000) {
                bootbox.confirm({
                    title: 'Warning',
                    closeButton: false,
                    message: `You are about to load a huge file with ${avg} LOC on average. This could cause the browser to hang, do you want to continue?`,
                    buttons: {
                        confirm: {
                            label: 'Yes',
                            className: 'btn-success',
                        },
                        cancel: {
                            label: 'No',
                            className: 'btn-danger',
                        },
                    },
                    callback(accepted) {
                        if (accepted) {
                            // TODO remove duplicate code smell
                            viewer.setEnableMinimap(false); // temporarily disable minimap for huge file
                            viewer.setAsCurrentJob();
                            dv = viewer;
                            GUI.switchToViewer();
                            viewer.diffAndDraw(() => {
                                // success
                                $('#codeboxTitle').html(dv.generateTitle(1));
                            }, (msg) => {
                                // error
                                $('#codeboxTitle').html(dv.generateTitle(-1));
                                Utility.showError(msg);
                                NProgress.done();
                            });
                        } else {
                            NProgress.done();
                            $('#codeboxTitle').html(dv.generateTitle(-2));
                        }
                    },
                });
            } else {
                viewer.setAsCurrentJob();
                dv = viewer;
                GUI.switchToViewer();
                viewer.diffAndDraw(() => {
                    // success
                    $('#codeboxTitle').html(dv.generateTitle(1));
                }, (msg) => {
                    // error
                    $('#codeboxTitle').html(dv.generateTitle(-1));
                    Utility.showError(msg);
                    NProgress.done();
                });
            }
        }));

    // stop propagation by returning
    return false;
}

/**
 * Sets up sidebar and clickhandler for the diff pair list.
 */
function diffListSetup() {
    // register clickhandler for all diffItems
    $('body').on('click', '#diffItem', _.debounce(function loadDiff() {
        const selectedDiff = Loader.loadedDiffObjects[$(this).data('index')];
        const viewer = new DiffDrawer();
        viewer.setDiff(selectedDiff);

        // take the matcher from our Settings
        if (Settings.loadSetting('matcher')) {
            viewer.setMatcher(Settings.loadSetting('matcher'));
        }

        if (dv.diffHash() === viewer.diffHash()) {
            // this is the same diff pair
            Utility.showWarning('Not loading same file with same matcher again');
            return;
        }

        // reset codebox
        $('code').html('');
        $('.codebox').scrollTo(0);
        $(this).parents().children().removeClass('active');
        $(this).addClass('active');

        const srcUrl = selectedDiff.rawSrcUrl;
        const dstUrl = selectedDiff.rawDstUrl;
        loadIntoViewer(srcUrl, dstUrl, viewer);
    }, 1000, {
        leading: true,
        trailing: false,
    }));

    // filter diff list on keyup
    $('#listFilterText').keyup(_.debounce(() => {
        const filterText = $('#listFilterText').val().toLowerCase();
        const $list = $('#diffsList #diffItem');

        $('#listFilterText').tooltip('destroy');

        $list.hide();
        $list.filter(function filterList() {
            let currentObject;

            if (filterText === '') {
                return true;
            }

            if (filterText.length < 4 && filterText.length > 0) {
                // won't filter whole text , just look into ids
                $('#listFilterText').tooltip({
                    title: 'Filter input is too short, just searching IDs',
                }).tooltip('show');
                currentObject = `${$(this).data('id')}`;
            } else {
                currentObject = $(this).data('id') + $(this).find('b').text().toLowerCase() + $(this).find('small').text().toLowerCase();
            }

            return _.includes(currentObject, filterText);
        }).show();
        $('#diffsList').scrollTo(0);
    }, 300));

    $('#filterListClear').click(() => {
        $('#listFilterText').val('');
        $('#listFilterText').keyup(); // simulate searching for nothing
        $('#diffsList').scrollTo(0); // scrolling back up
    });

    // export loaded diff pairs as JSON
    $('#downloadDiffs').click(() => {
        Utility.startJSONDownload(`diffs-${Date.now()}`, Loader.loadedDiffObjects);
    });
}

/**
 * Initialized handlers for jumping to lines.
 */
function jumptToLineSetup() {
    // initialize from Settings
    if (Settings.loadSetting('jumpToSource') !== false) {
        $('#jumpToLineSelector').bootstrapToggle('on');
    } else {
        $('#jumpToLineSelector').bootstrapToggle('off');
    }

    // register clickhandler
    $('#jump').click(() => {
        let selector;
        if (Settings.loadSetting('jumpToSource') !== false) {
            selector = '.src';
        } else {
            selector = '.dst';
        }
        Utility.jumpToLine($('#lineNumberInput').val(), $(selector));
    });

    // map submit to just clicking the jump button
    $('#lineNumberForm').submit((event) => {
        $('#jump').click();
        event.preventDefault();
    });

    $('#jumpToLineSelector').change(function updateJumpSettings() {
        Settings.saveSetting('jumpToSource', $(this).prop('checked'));
    });
}

/**
 * Sets up filter and adds handlers to buttons.
 */
function filterSetup() {
    let lastFiltered = filter.slice(0);

    // filter on click
    $('.dropdown-menu a').on('click', (event) => {
        // user pressed apply
        if ($(event.currentTarget).attr('id') === 'applyFilter') {
            filter = _.sortBy(filter);
            lastFiltered = _.sortBy(lastFiltered);

            if (dv.getDiff() === null) {
                lastFiltered = filter.slice(0);
                Utility.showWarning('No Diff loaded');
                return true;
            }
            if (_.isEqual(lastFiltered, filter)) {
                Utility.showMessage('Already filtered');
                return true;
            }

            dv.setFilter(filter);
            dv.showChanges();
            lastFiltered = filter.slice(0);
            const filterNodes = filter.map((filtertype) => {
                return `<span class="${filtertype}">${filtertype}</span>`;
            });
            Utility.showMessage(`Now showing: ${filterNodes.join(', ')}`);
        } else {
            // user pressed any of the toggle buttons
            const $target = $(event.currentTarget);
            const val = $target.attr('data-value');
            const $inp = $target.find('input');
            const idx = filter.indexOf(val);
            if (idx > -1) {
                filter.splice(idx, 1);
                setTimeout(() => {
                    $inp.prop('checked', false);
                }, 0);
            } else {
                filter.push(val);
                setTimeout(() => {
                    $inp.prop('checked', true);
                }, 0);
            }

            $(event.target).blur();
            return false;
        }
        return true;
    });
}

/**
 * Sets click and doubleclick on markers.
 */
function clickBoundMarkersSetup() {
    // register clickhandler for all the UPDATEs and MOVEs
    $('#codeContent').on('click', '.scriptmarker', function handleScriptMarkerClick() {
        // reset old selected nodes
        $('.codebox').find('.scriptmarker').removeClass('selected');

        const boundSelector = `#${$(this).data('boundto')}.${$(this).data('type')}`;
        const boundCodeboxSelector = `.codebox.${Utility.getOpponent($(this).data('sourcetype'))}`;
        // set style
        const boundElem = $(boundCodeboxSelector).find(boundSelector).first();
        $(boundElem).addClass('selected');
        $(this).addClass('selected');

        const boundCodebox = $(boundCodeboxSelector);
        const localOffset = $(this).offset().top;

        // scroll the other view to the same height
        $(boundCodebox).scrollTo(boundElem, 300, {
            offset: ($('.codebox.src').offset().top - localOffset),
        });

        // stop propagation by returning
        return false;
    });

    $('#codeView').on('dblclick', 'span[data-metadata]', function showMetaData() {
        GUI.deselect();

        const title = $(this).data('title');
        const content = dv.metadata[$(this).data('metadata')];

        let stringContent = `<pre><code class="metadatacode">${$(this).html()}</code></pre><br/> \
                            <table class="table table-striped"><thead><tr><th>Property</th><th>Value</th></tr></thead> \
                            <tbody>`;

        Object.entries(content).forEach(([key, value]) => {
            if (value === null) {
                return;
            }

            if (key === 'nodeType') {
                stringContent += `<tr><td>${GUI.makeHumanReadable(key)}</td><td><span class="label label-inverted">${value.id}</span> ${GUI.makeHumanReadable(value.name)} </td></tr>`;
                return;
            }

            stringContent += `<tr><td>${GUI.makeHumanReadable(key)}</td><td><code>${value}</code></td></tr>`;
        });
        stringContent += '</tbody>';

        GUI.showMetaData(title, stringContent);

        // stop propagation by returning
        return false;
    });
}
