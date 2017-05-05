/* global $ ace */
import DiffDrawer from './DiffDrawer';
import Base64 from 'js-base64/Base64';
import Utility from './Utility';
var base64 = Base64.Base64; //very nice packaging indeed.

var editorSrc = ace.edit('editor');
editorSrc.setTheme('ace/theme/monokai');
editorSrc.getSession().setMode('ace/mode/java');
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
});

$('#filter').click(function() {
  dv.filterBy(['DELETE']);
});

var mysrc = base64.decode('cGFja2FnZSBjb20udGVzdDsNCg0KcHVibGljIGNsYXNzIFRlc3RDbGFzcyBleHRlbmRzIFN1cGVyQ2xhc3Mgew0KDQogIHB1YmxpYyBUZXN0Q2xhc3MoKQ0KICB7DQogICAgaW50IHZhciA9IDEyMzsNCiAgICBpbnQgdG9CZURlbGV0ZWQgPSA1NjY3Ow0KICB9DQoNCiAgcHJpdmF0ZSB2b2lkIGxvbCgpDQogIHsNCiAgICBTeXN0ZW0ub3V0LnByaW50bG4oIm5peCIpOw0KICB9DQp9DQo=');
var mydst = base64.decode('cGFja2FnZSBjb20udGVzdDsNCg0KcHVibGljIGNsYXNzIFRlc3RDbGFzcyBleHRlbmRzIFN1cGVyQ2xhc3Mgew0KDQogIHB1YmxpYyBTdHJpbmcgbmV3VmFyID0gInNvIG5ldyI7DQoNCiAgcHJpdmF0ZSB2b2lkIGxvbCgpDQogIHsNCiAgICBTeXN0ZW0ub3V0LnByaW50bG4oIm5peCIpOw0KICB9DQoNCiAgcHVibGljIFRlc3RDbGFzcygpDQogIHsNCiAgICBpbnQgdmFyVXBkID0gNDQ0NDMyMTsNCiAgfQ0KfQ0K=');

var dv = new DiffDrawer(mysrc, mydst);
dv.visualizeChanges();
editorSrc.setValue(dv.getSource());
editorDst.setValue(dv.getDestination());



var lastSelectedThis;
var lastSelectedBound;
//register clickhandler for all the UPDATEs and MOVEs
$('body').on('click', 'span[data-boundto]', function() {
  //reset old selected node
    $('#'+lastSelectedThis).removeClass('selected');
    $('#'+lastSelectedBound).removeClass('selected');

    if(lastSelectedThis == $(this).attr('id') || lastSelectedBound == $(this).attr('id'))
    {
      lastSelectedThis = null;
      lastSelectedBound = null;
      return false;
    }

    //console.log('clicked ' + $(this).text() + ' which is bound to ' + $(this).data('boundto'));
    lastSelectedBound = $(this).data('boundto');
    var boundElem = $('#'+$(this).data('boundto'));
    lastSelectedThis = $(this).attr('id');

    //set style
    boundElem.addClass('selected');
    $(this).addClass('selected');

    var boundCodebox;
    if($(this).data('sourcetype') == 'src') { //this is a src element
      boundCodebox = $('.codebox.dst');
    }
    else if($(this).data('sourcetype') == 'dst') { //this is a src element
      boundCodebox = $('.codebox.src');
    }
    Utility.scrollToElementRelativeTo(boundElem, boundCodebox);

    //stop propagation by returning
    return false;
});

//start unfiltered
var options = ['INSERT', 'DELETE', 'UPDATE', 'MOVE'];

$( '.dropdown-menu a' ).on( 'click', function( event ) {

  if($( event.currentTarget ).attr('id') == 'applyFilter')
  {
    //clear last selected
    lastSelectedThis = null;
    lastSelectedBound = null;
    dv.filterBy(options);
  }
  else {
    var $target = $( event.currentTarget ),
        val = $target.attr( 'data-value' ),
        $inp = $target.find( 'input' ),
        idx;

    if ( ( idx = options.indexOf( val ) ) > -1 ) {
       options.splice( idx, 1 );
       setTimeout( function() { $inp.prop( 'checked', false ); }, 0);
    } else {
       options.push( val );
       setTimeout( function() { $inp.prop( 'checked', true ); }, 0);
    }

    $( event.target ).blur();
    lastSelectedThis = null;
    lastSelectedBound = null;
    dv.filterBy(options);
    return false;
  }
});
