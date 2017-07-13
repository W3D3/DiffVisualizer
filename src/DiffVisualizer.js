/* global $ ace */
import DiffDrawer from './DiffDrawer';
import Loader from './Loader';
import Utility from './Utility';
import axios from 'axios';
import NProgress from 'nprogress';
import _ from 'lodash';
import {version} from '../package.json';

$('.versionNumber').text('v'+version);

var editorSrc = ace.edit('editorSrc');
editorSrc.setTheme('ace/theme/monokai');
editorSrc.getSession().setMode('ace/mode/java');
editorSrc.resize();
editorSrc.$blockScrolling = Infinity;

var editorDst = ace.edit('editorDst');
editorDst.setTheme('ace/theme/monokai');
editorDst.getSession().setMode('ace/mode/java');
editorDst.$blockScrolling = Infinity;

$('#metaDataPanel').hide();

$( '#listFilterText' ).keyup(_.debounce(function () {
  var filterText = $( '#listFilterText' ).val().toLowerCase();
  $( '#listFilterText' ).css('border', '');
  $('#listFilterText').tooltip('destroy');

  var $list = $('#diffsList #diffItem');
  if(filterText.length < 4 && filterText.length > 0 && !$.isNumeric(filterText))
  {
    //won't filter when text is this short, alert user
    $( '#listFilterText' ).css('border', 'red 1px solid');
    $('#listFilterText').tooltip({
      'title' : 'Filter input is too short'
    }).tooltip('show');
    return;
  }
  $list.hide();
  $list.filter(function() {
    var currentObject;
    if(filterText == '')
      return true;
    if($.isNumeric(filterText)){
      currentObject = $( this ).data( 'id' ) + ''; //adding empty string so it can be substring searched
    }
    else {

      currentObject = $( this ).find( 'b' ).text().toLowerCase() + $( this ).find( 'small' ).text().toLowerCase() ;
    }

    return _.includes(currentObject, filterText);
  })
  .show();
}, 300));

$( '#filterListClear' ).click(function(){
  $( '#listFilterText' ).val('');
  $( '#listFilterText' ).keyup();
});

// totally not an easter egg
$('.navbar-brand').dblclick(function(){
  $( 'body' ).toggleClass('rainbowwrapper');
  $( '.badge' ).toggleClass('rainbowwrapper');
  $( '.btn-primary' ).toggleClass('rainbowwrapper');
});

//register clickhandler
$('#jumpSrc').click(function() {
  Utility.jumpToLine($('#lineNumberInput').val(), $('.src'));
});

$('#jumpDst').click(function() {
  Utility.jumpToLine($('#lineNumberInput').val(), $('.dst'));
});

//register clickhandler
$('#saveSource').click(function() {
  dv.setSource(editorSrc.getValue());
  dv.setDestination(editorDst.getValue());
  dv.setFilter(options);
  dv.setAsCurrentJob();
  dv.diffAndDraw();
});

$('#changeSource').click(function() {
  editorSrc.setValue(dv.getSource());
  editorDst.setValue(dv.getDestination());
});

$('#toggleSidebar').click(function() {
  //TODO (christoph) animate this, add more state visuals to #toggleSidebar content
  $('#accordion').toggle();
  // $('.sidebar').toggleClass('col-sm-3');
  // $('.sidebar').toggleClass('col-sm-1')
  $('#codeView').toggleClass('col-sm-9');
  $('#codeView').toggleClass('col-sm-12');
});

//enables uploading json files
new Loader();

var dv = new DiffDrawer('th','as');
dv.getAvailableMatchers().then(response => {
  for (let item of response.data.matchers) {
    $('#matcherID')
         .append($('<option></option>')
                    .attr('value',item.id)
                    .text(item.name));
  }
});


var lastSelectedThis;
var lastSelectedBound;

//register clickhandler for all the UPDATEs and MOVEs
$('body').on('click', 'span[data-boundto]', function() {
  //reset old selected nodes
  $('.codebox').find('*').removeClass('selected');

  if (lastSelectedThis == $(this).data('type')+$(this).attr('id') || lastSelectedBound == $(this).data('type')+$(this).attr('id')) {
    lastSelectedThis = null;
    lastSelectedBound = null;
    return false;
  }

  var type = $(this).data('type');
  lastSelectedBound = type + $(this).data('boundto');
  lastSelectedThis = type + $(this).attr('id');

  var boundElem = $('#' + $(this).data('boundto')+'.'+type);


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
      NProgress.set(percentCompleted/100);
    }
  };
  var configDst = {
    onDownloadProgress: progressEvent => {
      let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total) / 3;
      NProgress.set(0.33+percentCompleted/100);
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
          viewer.setFilter(options);
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

//start unfiltered
var options = ['INSERT', 'DELETE', 'UPDATE', 'MOVE'];

//filter on click
$('.dropdown-menu a').on('click', function(event) {
  if ($(event.currentTarget).attr('id') == 'applyFilter') {
    //clear last selected
    lastSelectedThis = null;
    lastSelectedBound = null;
    dv.setFilter(options);
    dv.showChanges();
    Utility.showSuccess('Now only showing nodes of type: ' + options.join(', '));
  } else {
    var $target = $(event.currentTarget),
      val = $target.attr('data-value'),
      $inp = $target.find('input'),
      idx;

    if ((idx = options.indexOf(val)) > -1) {
      options.splice(idx, 1);
      setTimeout(function() {
        $inp.prop('checked', false);
      }, 0);
    } else {
      options.push(val);
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

// machter on change
$('#matcherID').on('change', function() {
  NProgress.start();
  dv.clear();
  dv.setMatcher(this.value);
  Utility.showMessage('Matcher changed to ' + $('option:selected', this).text());
  dv.diffAndDraw();
});

//register clickhandler for all the UPDATEs and MOVEs
$('.codebox')
  .on('mouseover', '.scriptmarker', function(e) {
    // console.log( 'mouse over ' + $(this).attr('id'));
    $(this).focus();
    $(this).css('border','black 1px dashed');
    $(this).addClass('hovered');
    $(this).find('.scriptmarker').addClass('subnode');
    e.stopPropagation();
  }).on('mouseout', '.scriptmarker', function(e) {
    // console.log( 'mouse out ' + $(this).attr('id'));
    $(this).css('border','');
    $(this).removeClass('hovered');
    $(this).find('.scriptmarker').removeClass('subnode');
    e.stopPropagation();
  });
