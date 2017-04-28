//example data
var editorSrc = ace.edit('editor');
editorSrc.setTheme('ace/theme/monokai');
editorSrc.getSession().setMode('ace/mode/java');
editorSrc.$blockScrolling = Infinity

var editorDst = ace.edit('editorDst');
editorDst.setTheme('ace/theme/monokai');
editorDst.getSession().setMode('ace/mode/java');
editorDst.$blockScrolling = Infinity

var mysrc = Base64.decode('cGFja2FnZSBjb20udGVzdDsNCg0KcHVibGljIGNsYXNzIFRlc3RDbGFzcyBleHRlbmRzIFN1cGVyQ2xhc3Mgew0KDQogIHB1YmxpYyBUZXN0Q2xhc3MoKQ0KICB7DQogICAgaW50IHZhciA9IDEyMzsNCiAgICBpbnQgdG9CZURlbGV0ZWQgPSA1NjY3Ow0KICB9DQoNCiAgcHJpdmF0ZSB2b2lkIGxvbCgpDQogIHsNCiAgICBTeXN0ZW0ub3V0LnByaW50bG4oIm5peCIpOw0KICB9DQp9DQo=');
var mydst = Base64.decode('cGFja2FnZSBjb20udGVzdDsNCg0KcHVibGljIGNsYXNzIFRlc3RDbGFzcyBleHRlbmRzIFN1cGVyQ2xhc3Mgew0KDQogIHB1YmxpYyBTdHJpbmcgbmV3VmFyID0gInNvIG5ldyI7DQoNCiAgcHJpdmF0ZSB2b2lkIGxvbCgpDQogIHsNCiAgICBTeXN0ZW0ub3V0LnByaW50bG4oIm5peCIpOw0KICB9DQoNCiAgcHVibGljIFRlc3RDbGFzcygpDQogIHsNCiAgICBpbnQgdmFyVXBkID0gNDQ0NDMyMTsNCiAgfQ0KfQ0K=');

var dv = new DiffVisualizer(mysrc, mydst);
dv.visualizeChanges(mysrc, mydst);

//register clickhandler
$('#saveSource').click(function() {
  dv.setSource(editorSrc.getValue());
  dv.setDestination(editorDst.getValue());
  dv.visualizeChanges();
});
