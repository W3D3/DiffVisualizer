// THIS IS JUST FOR PROTOTYPING
// DO NOT USE IN PRODUCTION

function Marker(id, position, type, isEndMarker) {
    this.id = id;
    this.isEndMarker = isEndMarker;
    this.type = type;
    this.position = position;

    this.generateTag = function () { // it can access private members
        if (isEndMarker) {
            return "</span>";
        } else {
            return '<span class="change ' + type + ' ' + id + '">';
        }
    };
}
function splitValue(value, index) {
    var arr = [value.substring(0, index), value.substring(index)];
    return arr;
}

function splitRange(value, start, length) {
    var arr = [value.substring(0, start), value.substring(start, start + length), value.substring(start + length)];
    return arr;
}

//sample data
var src = "cGFja2FnZSBjb20udGVzdDsNCg0KcHVibGljIGNsYXNzIFRlc3RDbGFzcyBleHRlbmRzIFN1cGVyQ2xhc3Mgew0KDQogIHB1YmxpYyBUZXN0Q2xhc3MoKQ0KICB7DQogICAgaW50IHZhciA9IDEyMzsNCiAgICBpbnQgdG9CZURlbGV0ZWQgPSA1NjY3Ow0KICB9DQoNCiAgcHJpdmF0ZSB2b2lkIGxvbCgpDQogIHsNCiAgICBTeXN0ZW0ub3V0LnByaW50bG4oIm5peCIpOw0KICB9DQp9DQo=";
var dst = "cGFja2FnZSBjb20udGVzdDsNCg0KcHVibGljIGNsYXNzIFRlc3RDbGFzcyBleHRlbmRzIFN1cGVyQ2xhc3Mgew0KDQogIHB1YmxpYyBTdHJpbmcgbmV3VmFyID0gInNvIG5ldyI7DQoNCiAgcHJpdmF0ZSB2b2lkIGxvbCgpDQogIHsNCiAgICBTeXN0ZW0ub3V0LnByaW50bG4oIm5peCIpOw0KICB9DQoNCiAgcHVibGljIFRlc3RDbGFzcygpDQogIHsNCiAgICBpbnQgdmFyVXBkID0gNDQ0NDMyMTsNCiAgfQ0KfQ0K="

var srcString = Base64.decode(src);
var dstString = Base64.decode(dst);

const LINE_SEPARATOR = "\r\n";
var srcString = Base64.decode(src).replace(new RegExp("(\\r)?\\n", "g"), LINE_SEPARATOR);
var dstString = Base64.decode(dst).replace(new RegExp("(\\r)?\\n", "g"), LINE_SEPARATOR);

$("#src").text(srcString);
$("#dst").text(dstString);

$("#markRange").click(function () {
  var length = $("#to").val()-$("#from").val();
  console.log(length);
  var toarr = splitValue(dstString, $("#to").val());
  var newString  = toarr[0] + '</span>' + toarr[1];
  var fromarr = splitValue(newString, $("#from").val());
  newString = fromarr[0] + '<span class="INSERT">' + fromarr[1];

  $("#dst").html(newString);
  console.log(newString);
})

$("#markRangeSrc").click(function () {
  var length = $("#to").val()-$("#from").val();
  console.log(length);
  var toarr = splitValue(srcString, $("#to").val());
  var newString  = toarr[0] + '</span>' + toarr[1];
  var fromarr = splitValue(newString, $("#from").val());
  newString = fromarr[0] + '<span class="INSERT">' + fromarr[1];

  $("#src").html(newString);
  console.log(newString);
})


$("#dst").html(dstString);
$("#src").html(srcString);
