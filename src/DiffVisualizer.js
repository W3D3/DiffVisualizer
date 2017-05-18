/* global $ ace */
import DiffDrawer from './DiffDrawer';
import Loader from './Loader';
// import Base64 from 'js-base64/Base64';
import Utility from './Utility';
import axios from 'axios';
import NProgress from 'nprogress';
import _ from 'lodash';
//var base64 = Base64.Base64; //very nice packaging indeed.

var editorSrc = ace.edit('editorSrc');
editorSrc.setTheme('ace/theme/monokai');
editorSrc.getSession().setMode('ace/mode/java');
editorSrc.resize();
editorSrc.$blockScrolling = Infinity;

var editorDst = ace.edit('editorDst');
editorDst.setTheme('ace/theme/monokai');
editorDst.getSession().setMode('ace/mode/java');
editorDst.$blockScrolling = Infinity;

//register clickhandler
$('#saveSource').click(function() {
  dv.setSource(editorSrc.getValue());
  dv.setDestination(editorDst.getValue());
  dv.visualizeChanges();
  dv.filterBy(options);
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

//TODO (christoph) remove test data!
//var mysrc = base64.decode('cGFja2FnZSBjb20udGVzdDsNCg0KcHVibGljIGNsYXNzIFRlc3RDbGFzcyBleHRlbmRzIFN1cGVyQ2xhc3Mgew0KDQogIHB1YmxpYyBUZXN0Q2xhc3MoKQ0KICB7DQogICAgaW50IHZhciA9IDEyMzsNCiAgICBpbnQgdG9CZURlbGV0ZWQgPSA1NjY3Ow0KICB9DQoNCiAgcHJpdmF0ZSB2b2lkIGxvbCgpDQogIHsNCiAgICBTeXN0ZW0ub3V0LnByaW50bG4oIm5peCIpOw0KICB9DQp9DQo=');
//var mydst = base64.decode('cGFja2FnZSBjb20udGVzdDsNCg0KcHVibGljIGNsYXNzIFRlc3RDbGFzcyBleHRlbmRzIFN1cGVyQ2xhc3Mgew0KDQogIHB1YmxpYyBTdHJpbmcgbmV3VmFyID0gInNvIG5ldyI7DQoNCiAgcHJpdmF0ZSB2b2lkIGxvbCgpDQogIHsNCiAgICBTeXN0ZW0ub3V0LnByaW50bG4oIm5peCIpOw0KICB9DQoNCiAgcHVibGljIFRlc3RDbGFzcygpDQogIHsNCiAgICBpbnQgdmFyVXBkID0gNDQ0NDMyMTsNCiAgfQ0KfQ0K=');

var dv = new DiffDrawer();
//dv.visualizeChanges();

var lastSelectedThis;
var lastSelectedBound;

//register clickhandler for all the UPDATEs and MOVEs
$('body').on('click', 'span[data-boundto]', function() {
  //reset old selected nodes
  $('.codebox').find('*').removeClass('selected');

  if (lastSelectedThis == $(this).attr('id') || lastSelectedBound == $(this).attr('id')) {
    lastSelectedThis = null;
    lastSelectedBound = null;
    return false;
  }

  //console.log('clicked ' + $(this).text() + ' which is bound to ' + $(this).data('boundto'));
  lastSelectedBound = $(this).data('boundto');
  var boundElem = $('#' + $(this).data('boundto'));
  lastSelectedThis = $(this).attr('id');

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

  var config = {
    onUploadProgress: progressEvent => {
      //TODO (christoph) make sure this gets run
      let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
      NProgress.set(percentCompleted);
    }
  };
  //Loading div from proxy
  NProgress.configure({
    parent: '#codeView'
  });
  NProgress.start();
  axios.get(srcUrl, config)
    .then(function(src) {
      dv.setSource(src.data);
      NProgress.set(0.5);
      axios.get(dstUrl, config)
        .then(function(dst) {
          dv.setDestination(dst.data);
          dv.setFilter(options);
          dv.visualizeChanges();
          //Utility.showMessage(options.join());
          NProgress.done();
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
