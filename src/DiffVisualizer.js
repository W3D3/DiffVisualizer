/* global $ bootbox */
/**
 * @file Main file that acts as the entry point
 * @author Christoph Wedenig <christoph@wedenig.org>
 */

import DiffDrawer from './DiffDrawer';
import Loader from './Loader';
import Utility from './Utility';
import GUI from './GUI';
import Settings from './Settings';
import SearchController from './SearchController';
import GitHubWizard from './GitHubWizard';
import {
  version
} from '../package.json';

import axios from 'axios';
import NProgress from 'nprogress';
import _ from 'lodash';

var gui;
var dv;
var sc;
var editorSrc;
var editorDst;

//start unfiltered
var filter = ['INSERT', 'DELETE', 'UPDATE', 'MOVE'];
//var matcherID = 1;
var matchers;

var settings;

/**
 * This sets up all handlers and
 * initializes the DiffVisualizer application
 */
$(document).ready(function() {
    gui = new GUI();
    gui.setVersion(version);
    NProgress.configure({ trickle: false });

    settings = new Settings();

    $('#accordion').collapse().height('auto');

    if(navigator.userAgent.indexOf('AppleWebKit') != -1){
        //this is webkit, use custom scrollbars because we hide the default ones
        $('.scrollbar-chrome').perfectScrollbar();
    }

    sc = new SearchController({
        focusChangeEvent: 'mouseover',
        globalScope: '#codeContent'
    });
    sc.addContainer($('.src'));
    sc.addContainer($('.dst'));

    //create first DiffDrawer object to work on
    dv = new DiffDrawer();

    dv.checkAPIState().then(function() {
        //working as expected
    }).catch(function(error) {
        if (error.response) {
              // The request was made and the server responded with a status code
              // that falls out of the range of 2xx
            Utility.showError(dv.getBaseUrl() + ' is down. Status: ' + error.response.status, + ' - ' + error.response.statusText);
        } else if (error.request) {
              // The request was made but no response was received
              // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
              // http.ClientRequest in node.js
            Utility.showError(dv.getBaseUrl() + ' did not answer to request.');
        } else {
            // Something happened in setting up the request that triggered an Error
            Utility.showError('Cannot connect to ' + dv.getBaseUrl() + ' with request ' + error.request);
        }
    });

    var loader = new Loader();

    //setup ace editor and all clickhandlers
    editorSetup();

    //setup on change and fill with all available matchers
    matcherChangerSetup();

    // setup style changer
    styleChangerSetup();

    // initialize clickhandler and filter on the diff list
    diffListSetup();

    // initializes INSERT/UPDATE/DELETE/MOVE filter
    filterSetup();

    // enables clickhandler on bound markers inside codeboxes
    clickBoundMarkersSetup();

    // enables jumping to lines
    jumptToLineSetup();

    //register hover handler for all the UPDATEs and MOVEs
    gui.setHoverEffect('.codebox', '.scriptmarker');

    new GitHubWizard({
        wizardElement: $('#githubwizard'),
        finish: function(diffObject) {
            //var srcUrl =
            loader.createDiffList([diffObject], true);
            // loadIntoViewer(diffObject.srcUrl, diffObject.dstUrl, )
            console.log(loader.loadedDiffObjects);
        }
    });
    $('#githubImportButton').click(function() {
        $('#wizard').modal('show');
    });
});

function editorSetup() {
    editorSrc = GUI.initializeEditor('editorSrc', 'monokai', 'java');
    editorDst = GUI.initializeEditor('editorDst', 'monokai', 'java');

  //register clickhandler
    $('#saveSource').click(function() {
        dv.setSource(editorSrc.getValue());
        dv.setDestination(editorDst.getValue());
        dv.setFilter(filter);
        dv.setJobId(null);
        dv.setAsCurrentJob();
        dv.diffAndDraw();
    });

    $('#changeSource').click(function() {
        editorSrc.setValue(dv.getSource());
        editorDst.setValue(dv.getDestination());
    });
}

function matcherChangerSetup() {
    // fill dropdown box with available matchers
    dv.getAvailableMatchers().then(response => {
        gui.setMatcherSelectionSource(response.data.matchers);
        matchers = response.data.matchers;
        if (settings.loadSetting('matcher')) {
            gui.setSelectedMatcher(settings.loadSetting('matcher').id);
        }

    });

    // matcher on change
    gui.setMatcherChangeHandler(function() {
        NProgress.start();
        dv.clear();
        $('.minimap').hide();
        settings.saveSetting('matcher', matchers[this.value - 1]);

        var changedDv = new DiffDrawer();
        Object.assign(changedDv, dv);

        changedDv.setMatcher(settings.loadSetting('matcher'));
        changedDv.setJobId(dv.getDiffId()); //to refresh job id
        changedDv.setAsCurrentJob();

        Utility.showMessage('Matcher changed to ' + $('option:selected', this).text());
        $('#codeboxTitle').html(changedDv.generateTitle(0));

        changedDv.diffAndDraw(function() {
            $('#codeboxTitle').html(changedDv.generateTitle(1));
            dv = changedDv;
        }, function(msg) {
            $('#codeboxTitle').html(changedDv.generateTitle(-1));
            Utility.showError(msg);
            NProgress.done();
        });
    });
}

function styleChangerSetup() {

    // matcher on change
    gui.setStyleChangeHandler(function() {
        Utility.changeCodeStyle(this.value, $(this).find(':selected').data('dark'), $(this).find(':selected').data('custom'));
        Settings.saveSettingPersistent('codestyle', this.value);
    });

    if(Settings.loadSettingPersistent('codestyle')) {
        gui.setSelectedStyle(Settings.loadSettingPersistent('codestyle'));
    }
}

function loadIntoViewer(srcUrl, dstUrl, viewer) {
    viewer.setSrcUrl(srcUrl);
    viewer.setDstUrl(dstUrl);

    viewer.setAsCurrentJob();

    var configSrc = {
        onDownloadProgress: progressEvent => {
            let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total) / 3;
            NProgress.set(percentCompleted / 100);
        }
    };
    var configDst = {
        onDownloadProgress: progressEvent => {
            let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total) / 3;
            NProgress.set(0.33 + percentCompleted / 100);
        }
    };

    NProgress.configure({
        parent: '#codeView'
    });
    NProgress.start();
    $('.minimap').hide();
    $('#codeboxTitle').html(viewer.generateTitle(0));
    sc.hideAll();

    function getSrcFile() {
        return axios.get(srcUrl, configSrc);
    }

    function getDstFile() {
        return axios.get(dstUrl, configDst);
    }

    axios.all([getSrcFile(), getDstFile()])
      .then(axios.spread(function (src, dst) {
          // Both requests are now complete

          viewer.setSource(src.data);
          viewer.setDestination(dst.data);

          viewer.setFilter(filter);

          var avg = (src.data.split(/\r\n|\r|\n/).length + dst.data.split(/\r\n|\r|\n/).length) / 2;

          if(avg > 32000) {
              bootbox.confirm({
                  title: 'Warning',
                  closeButton: false,
                  message: 'You are about to load a huge file with ' + avg + ' LOC on average. This could cause the browser to hang, do you want to continue?',
                  buttons: {
                      confirm: {
                          label: 'Yes',
                          className: 'btn-success'
                      },
                      cancel: {
                          label: 'No',
                          className: 'btn-danger'
                      }
                  },
                  callback: function (accepted) {
                      if(accepted) {
                          viewer.setEnableMinimap(false); //temporarily disable minimap for huge file
                          dv = viewer;
                          viewer.diffAndDraw(function() {
                              //success
                              $('#codeboxTitle').html(dv.generateTitle(1));
                          }, function (msg) {
                              //error
                              $('#codeboxTitle').html(dv.generateTitle(-1));
                              Utility.showError(msg);
                              NProgress.done();
                          });


                      }
                      else {
                          NProgress.done();
                          $('#codeboxTitle').html(dv.generateTitle(-2));
                      }
                  }
              });
          }
          else {
              dv = viewer;
              viewer.diffAndDraw(function() {
                  //success
                  $('#codeboxTitle').html(dv.generateTitle(1));
              }, function (msg) {
                  //error
                  $('#codeboxTitle').html(dv.generateTitle(-1));
                  Utility.showError(msg);
                  NProgress.done();
              });
          }
      }));

    //stop propagation by returning
    return false;
}

function diffListSetup() {
  //register clickhandler for all diffItems
    $('body').on('click', '#diffItem', _.debounce(function() {
        var diffId = $(this).data('id');
        var fileName = $(this).find('b').text();

        var viewer = new DiffDrawer();
        viewer.setIdAndFilname(diffId, fileName);
        viewer.setJobId(diffId);
        if (settings.loadSetting('matcher')) {
            viewer.setMatcher(settings.loadSetting('matcher'));
        }
        if(dv.generateHashWithoutData() == viewer.generateHashWithoutData())
        {
            Utility.showWarning('Not loading same file with same matcher again');
            return;
        }

        $('code').html('');
        $('.codebox').scrollTo(0);
        $(this).parents().children().removeClass('active');
        $(this).addClass('active');
        var srcUrl = $(this).data('rawsrcurl');
        var dstUrl = $(this).data('rawdsturl');

        loadIntoViewer(srcUrl, dstUrl, viewer);

    }, 1000, {
        'leading': true,
        'trailing': false
    }));

    //filter diff list on keyup
    $('#listFilterText').keyup(_.debounce(function() {
        var filterText = $('#listFilterText').val().toLowerCase();
        $('#listFilterText').css('border', '');
        $('#listFilterText').tooltip('destroy');

        var $list = $('#diffsList #diffItem');
        if (filterText.length < 4 && filterText.length > 0 && !$.isNumeric(filterText)) {
            //won't filter when text is this short, alert user
            $('#listFilterText').css('border', 'red 1px solid');
            $('#listFilterText').tooltip({
                'title': 'Filter input is too short'
            }).tooltip('show');
            return;
        }
        $list.hide();
        $list.filter(function() {
            var currentObject;
            if (filterText == '') return true;

            if ($.isNumeric(filterText)) {
                currentObject = $(this).data('id') + ''; //adding empty string so it can be substring searched
            } else {
                currentObject = $(this).find('b').text().toLowerCase() + $(this).find('small').text().toLowerCase();
            }

            return _.includes(currentObject, filterText);
        }).show();
        $('#diffsList').scrollTo(0);
    }, 300));

    $('#filterListClear').click(function() {
        $('#listFilterText').val('');
        $('#listFilterText').keyup(); //listPanel
        $('#diffsList').scrollTo(0); //listPanel
    });
}

function jumptToLineSetup() {
  //initialize from settings
    if (settings.loadSetting('jumpToSource') != false) {
        $('#jumpToLineSelector').bootstrapToggle('on');
    } else {
        $('#jumpToLineSelector').bootstrapToggle('off');
    }

  //register clickhandler
    $('#jump').click(function() {
        var selector;
        if (settings.loadSetting('jumpToSource') != false) {
            selector = '.src';
        } else {
            selector = '.dst';
        }
        Utility.jumpToLine($('#lineNumberInput').val(), $(selector));
    });

    $('#lineNumberForm').submit(function(event) {
        $('#jump').click();
        event.preventDefault();
    });

    $('#jumpToLineSelector').change(function() {
        settings.saveSetting('jumpToSource', $(this).prop('checked'));
    });
}

function filterSetup() {

    var lastFiltered = filter.slice(0);

    //filter on click
    $('.dropdown-menu a').on('click', function(event) {
        //user pressed apply
        if ($(event.currentTarget).attr('id') == 'applyFilter') {

            filter = _.sortBy(filter);
            lastFiltered = _.sortBy(lastFiltered);

            if(dv.getDiffId() == null)
            {
                lastFiltered = filter.slice(0);
                Utility.showWarning('No Diff loaded');
                return;
            }
            if(_.isEqual(lastFiltered, filter))
            {
                Utility.showMessage('Already filtered');
                return;
            }

            dv.setFilter(filter);
            dv.showChanges();
            lastFiltered = filter.slice(0);
            var filterNodes = filter.map(function(filtertype) {
                return `<span class="${filtertype}">${filtertype}</span>`;
            });
            Utility.showMessage('Now showing: ' + filterNodes.join(', '));
        } else {
            //user pressed any of the toggle buttons
            var $target = $(event.currentTarget),
                val = $target.attr('data-value'),
                $inp = $target.find('input'),
                idx;

            if ((idx = filter.indexOf(val)) > -1) {
                filter.splice(idx, 1);
                setTimeout(function() {
                    $inp.prop('checked', false);
                }, 0);
            } else {
                filter.push(val);
                setTimeout(function() {
                    $inp.prop('checked', true);
                }, 0);
            }

            $(event.target).blur();
            return false;
        }
    });
}

function clickBoundMarkersSetup() {
  //register clickhandler for all the UPDATEs and MOVEs
    $('#codeView').on('click', 'span[data-boundto]', function() {
    //reset old selected nodes
        $('.codebox').find('.scriptmarker').removeClass('selected');

        var boundSelector = '#' + $(this).data('boundto') + '.' + $(this).data('type');
        var boundCodeboxSelector = '.codebox.' + Utility.getOpponent($(this).data('sourcetype'));
    //set style
        var boundElem = $(boundCodeboxSelector).find(boundSelector).first();
        $(boundElem).addClass('selected');
        $(this).addClass('selected');

        var boundCodebox = $(boundCodeboxSelector);
        var localOffset = $(this).offset().top;

    //scroll the other view to the same height
        $(boundCodebox).scrollTo(boundElem, 300, {
            offset: 0 - localOffset + $('.codebox.src').offset().top
        });

    //stop propagation by returning
        return false;
    });

    $('#codeView').on('dblclick', 'span[data-metadata]', function() {

        var title = $(this).data('title');
        var content = $(this).data('metadata');
        GUI.showMetaData(title, content);

    //stop propagation by returning
        return false;
    });
}
