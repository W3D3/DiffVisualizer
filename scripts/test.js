// THIS IS JUST FOR PROTOTYPING
// DO NOT USE IN PRODUCTION

function Marker(id, position, type, isEndMarker) {
  this.id = id;
  this.isEndMarker = isEndMarker;
  this.type = type;
  this.position = position;

  this.generateTag = function() { // it can access private members
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

function insertMarkers(markersSorted, codeString) {
  var stack = [];
  var lastClosed = [];

  markersSorted.forEach(function(marker) {
    if (marker.isEndMarker) {
      var range = splitValue(codeString, marker.position);
      codeString = range[0] + marker.generateTag() + range[1];
      lastClosed.push(marker.id);
    } else {
      //startmarker
      if (lastClosed[lastClosed.length - 1] === marker.id) {
        lastClosed.pop();
        //just close it
        var range = splitValue(codeString, marker.position);
        codeString = range[0] + marker.generateTag() + range[1];
        stkMarker = stack.pop();
        while (stkMarker != undefined) {
          var range = splitValue(codeString, stkMarker.position);
          codeString = range[0] + stkMarker.generateTag() + range[1];
          console.log(stkMarker.generateTag());
          stkMarker = stack.pop();
        }
      } else {
        stack.push(marker);
      }
    }
  });
  stkMarker = stack.pop();
  while (stkMarker != undefined)
  {
    var range = splitValue(codeString, stkMarker.position);
    codeString = range[0] + stkMarker.generateTag() + range[1];
    console.log(stkMarker.generateTag());
    stkMarker = stack.pop();
  }

  return codeString;
}

const DIFF_API = axios.create({
  baseURL: `http://localhost:8080/v1/`,
});

DIFF_API.get('/matchers')
  .then(function(response) {
    console.log(response);
  })
  .catch(function(error) {
    console.log(error);
  });

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

DIFF_API.post('/changes', {
    "src": this.src,
    "dst": this.dst,
    "matcher": 1
  })
  .then(function(response) {
    $(".time").text(response.data.metrics.matchingTime + " ms to match");

    var changes = response.data.results;
    var dstMarkers = new Array();
    var srcMarkers = new Array();

    changes.forEach(function(entry) {
      console.log(entry);
      if (entry.actionType == "INSERT") {
        var range = splitRange(dstString, entry.dstPos, entry.dstLength);
        range[0] += '<span style="background-color:green; padding: 2px">';
        range[2] = '</span>' + range[2];
        console.log(range[1]);


        dstMarkers.push(new Marker(entry.dstId, entry.dstPos, "INSERT", false));
        dstMarkers.push(new Marker(entry.dstId, entry.dstPos + entry.dstLength, "INSERT", true));
        //dstString = range[0]+range[1]+range[2]
        //$("#dst").html(dstString);
        //console.log(splitValue(splitValue(dstString, entry.dstPos)[1], entry.dstPos+entry.dstLength)[0]);
      }

      if (entry.actionType == "MOVE") {
        // var range = splitRange(dstString, entry.dstPos, entry.dstLength);
        // range[0] += '<span style="background-color:green; padding: 2px">';
        // range[2] = '</span>' + range[2];
        console.log(splitRange(srcString, entry.srcPos, entry.srcLength)[1]);
        console.log(splitRange(dstString, entry.dstPos, entry.dstLength)[1]);

        srcMarkers.push(new Marker(entry.srcId, entry.srcPos, "MOVE", false));
        srcMarkers.push(new Marker(entry.srcId, entry.srcPos + entry.srcLength, "MOVE", true));

        dstMarkers.push(new Marker(entry.dstId, entry.dstPos, "MOVE", false));
        dstMarkers.push(new Marker(entry.dstId, entry.dstPos + entry.dstLength, "MOVE", true));
      }

      if (entry.actionType == "UPDATE") {

        console.log(splitRange(srcString, entry.srcPos, entry.srcLength)[1]);
        console.log(splitRange(dstString, entry.dstPos, entry.dstLength)[1]);

        srcMarkers.push(new Marker(entry.srcId, entry.srcPos, "UPDATE", false));
        srcMarkers.push(new Marker(entry.srcId, entry.srcPos + entry.srcLength, "UPDATE", true));

        dstMarkers.push(new Marker(entry.dstId, entry.dstPos, "UPDATE", false));
        dstMarkers.push(new Marker(entry.dstId, entry.dstPos + entry.dstLength, "UPDATE", true));
      }

      if (entry.actionType == "DELETE") {

        console.log(splitRange(srcString, entry.srcPos, entry.srcLength)[1]);

        srcMarkers.push(new Marker(entry.srcId, entry.srcPos, "DELETE", false));
        srcMarkers.push(new Marker(entry.srcId, entry.srcPos + entry.srcLength, "DELETE", true));
      }

    });

    //markers are now full, sort them
    var dstMarkersSorted = _(dstMarkers).chain()
      .sortBy('id')
      .sortBy('position')
      .reverse()
      .value();

    var srcMarkersSorted = _(srcMarkers).chain()
      .sortBy('id')
      .sortBy('position')
      .reverse()
      .value();

    console.log(srcMarkersSorted);
    console.log(dstMarkersSorted);


    dstString = insertMarkers(dstMarkersSorted, dstString)
    srcString = insertMarkers(srcMarkersSorted, srcString)

    $("#dst").html(dstString);
    $("#src").html(srcString);

    $("pre code").each(function(i, block) {
      hljs.highlightBlock(block);
    });


    // $(document).ready(function() {
    //   $('pre code').each(function(i, block) {
    //     hljs.highlightBlock(block);
    //   });
    // });

  })
  .catch(function(error) {
    console.log(error);
  });
