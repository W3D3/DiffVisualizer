/* global $ */
import DiffDrawer from './DiffDrawer';
import Loader from './Loader';
import Utility from './Utility';
import GUI from './GUI';
import {
  version
} from '../package.json';

import axios from 'axios';
import NProgress from 'nprogress';
import _ from 'lodash';

var gui;
var dv;
var editorSrc;
var editorDst;

var lastSelectedThis;
var lastSelectedBound;

//start unfiltered
var filter = ['INSERT', 'DELETE', 'UPDATE', 'MOVE'];

/**
 * This sets up all handlers and
 * initializes the DiffVisualizer application
 */
$(document).ready(function() {
  gui = new GUI();
  gui.setVersion(version);

  //create first DiffDrawer object to work on
  dv = new DiffDrawer();

  //enables loading json files into diff list
  new Loader();

  //setup ace editor and all clickhandlers
  editorSetup();

  //setup on change and fill with all available matchers
  matcherChangerSetup();

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
});

function editorSetup() {
  editorSrc = GUI.initializeEditor('editorSrc', 'monokai', 'java');
  editorDst = GUI.initializeEditor('editorDst', 'monokai', 'java');

  //register clickhandler
  $('#saveSource').click(function() {
    dv.setSource(editorSrc.getValue());
    dv.setDestination(editorDst.getValue());
    dv.setFilter(filter);
    dv.setAsCurrentJob();
    dv.diffAndDraw();
  });

  $('#changeSource').click(function() {
    editorSrc.setValue(dv.getSource());
    editorDst.setValue(dv.getDestination());
  });
}

function matcherChangerSetup() {

  dv.getAvailableMatchers().then(response => {
    gui.setMatcherSelectionSource(response.data.matchers);
  });

  // matcher on change
  gui.setMatcherChangeHandler(function() {
    NProgress.start();
    dv.clear();
    dv.setMatcher(this.value);
    Utility.showMessage('Matcher changed to ' + $('option:selected', this).text());
    dv.diffAndDraw();
  });
}

function diffListSetup() {
  //register clickhandler for all diffItems
  $('body').on('click', '#diffItem', _.debounce(function() {
    $('code').html('');
    $('.codebox').scrollTo(0);
    $(this).parents().children().removeClass('active');
    $(this).addClass('active');
    var srcUrl = $(this).data('rawsrcurl');
    var dstUrl = $(this).data('rawdsturl');
    var diffId = $(this).data('id');

    var viewer = new DiffDrawer();
    viewer.setJobId(diffId);
    viewer.setAsCurrentJob();

    var config = {
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
    //Loading div from proxy
    NProgress.configure({
      parent: '#codeView'
    });
    NProgress.start();
    axios.get(srcUrl, config)
      .then(function(src) {
        viewer.setSource(src.data);
        axios.get(dstUrl, configDst)
          .then(function(dst) {
            viewer.setDestination(dst.data);
            viewer.setFilter(filter);
            viewer.diffAndDraw();
            dv = viewer;
          });
      });

    //stop propagation by returning
    return false;
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
        if (filterText == '')
          return true;
        if ($.isNumeric(filterText)) {
          currentObject = $(this).data('id') + ''; //adding empty string so it can be substring searched
        } else {
          currentObject = $(this).find('b').text().toLowerCase() + $(this).find('small').text().toLowerCase();
        }

        return _.includes(currentObject, filterText);
      })
      .show();
  }, 300));

  $('#filterListClear').click(function() {
    $('#listFilterText').val('');
    $('#listFilterText').keyup();
  });
}

function jumptToLineSetup() {
  //register clickhandler
  $('#jumpSrc').click(function() {
    Utility.jumpToLine($('#lineNumberInput').val(), $('.src'));
  });

  $('#jumpDst').click(function() {
    Utility.jumpToLine($('#lineNumberInput').val(), $('.dst'));
  });
}

function filterSetup() {
  //filter on click
  $('.dropdown-menu a').on('click', function(event) {
    if ($(event.currentTarget).attr('id') == 'applyFilter') {
      //clear last selected
      lastSelectedThis = null;
      lastSelectedBound = null;
      dv.setFilter(filter);
      dv.showChanges();
      Utility.showSuccess('Now only showing nodes of type: ' + filter.join(', '));
    } else {
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
      lastSelectedThis = null;
      lastSelectedBound = null;
      return false;
    }
  });
}

function clickBoundMarkersSetup() {
  //register clickhandler for all the UPDATEs and MOVEs
  $('body').on('click', 'span[data-boundto]', function() {
    //reset old selected nodes
    $('.codebox').find('span').removeClass('selected');

    if (lastSelectedThis == $(this).data('type') + $(this).attr('id') || lastSelectedBound == $(this).data('type') + $(this).attr('id')) {
      lastSelectedThis = null;
      lastSelectedBound = null;
      return false;
    }

    var type = $(this).data('type');
    lastSelectedBound = type + $(this).data('boundto');
    lastSelectedThis = type + $(this).attr('id');

    var boundElem = $('#' + $(this).data('boundto') + '.' + type);

    //set style
    boundElem.addClass('selected');
    $(this).addClass('selected');

    var boundCodebox;
    var localOffset;
    if ($(this).data('sourcetype') == 'src') { //this is a src element
      boundCodebox = $('.codebox.dst');
      localOffset = $(this).offset().top;
    } else if ($(this).data('sourcetype') == 'dst') { //this is a src element
      boundCodebox = $('.codebox.src');
      localOffset = $(this).offset().top;
    }
    //scroll the other view to the same height
    $(boundCodebox).scrollTo(boundElem, 300, {
      offset: 0 - localOffset + $('.codebox.src').offset().top
    });

    //stop propagation by returning
    return false;
  });
}
