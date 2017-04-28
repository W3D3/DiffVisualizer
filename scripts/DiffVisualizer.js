function Marker(id, position, type, isEndMarker) {
  this.id = id;
  this.isEndMarker = isEndMarker;
  this.type = type;
  this.position = position;

  this.generateTag = function() { // it can access private members
    if (isEndMarker) {
      return '</span>';
    } else {
      return '<span class="' + type + ' ' + id + '">';
    }
  };
}

function DiffVisualizer(src, dst) {
  this.src = src;
  this.dst = dst;

  //set default base URL
  this.DIFF_API = axios.create({
    baseURL: 'http://swdyn.isys.uni-klu.ac.at:5000/v1/',
  });

  this.setBaseUrl = function(newBase) {
    this.DIFF_API = axios.create({
      baseURL: newBase,
    });
  }

  this.setSource = function(newSrc) {
    this.src = newSrc;
  }

  this.setDestination = function(newDst) {
    this.dst = newDst;
  }

  //utility functions
  function splitValue(value, index) {
    var arr = [value.substring(0, index), value.substring(index)];
    return arr;
  }

  function splitRange(value, start, length) {
    var arr = [value.substring(0, start), value.substring(start, start + length), value.substring(start + length)];
    return arr;
  }

  function insertMarkers(markersSorted, codeString) {
    var lastClosed = [];

    markersSorted.forEach(function(marker) {
      if (marker.isEndMarker) {
        var range = splitValue(codeString, marker.position);
        codeString = range[0] + marker.generateTag() + range[1];
        //fill the opening Marker into the last closed array for faster opening
        lastClosed.push(new Marker(marker.id, marker.position, marker.type, false));
      } else {
        //startmarker
        if (lastClosed.length > 0 && lastClosed[lastClosed.length - 1].id === marker.id) {
          //can be inserted
          lastClosed.pop();
          var range = splitValue(codeString, marker.position);
          codeString = range[0] + marker.generateTag() + range[1];

        } else {
          var markerNotYetOpened = false;
          lastClosed.forEach(function(startmarker) {
            if (startmarker.id == marker.id) {
              markerNotYetOpened = true;
            }
          });
          if (markerNotYetOpened) {
            var openingMarker = lastClosed.pop();
            while (openingMarker.id <= marker.id) {
              var range = splitValue(codeString, marker.position);
              codeString = range[0] + marker.generateTag() + range[1];
              if (lastClosed.length > 0 && lastClosed[lastClosed.length - 1].id <= marker.id) {
                openingMarker = lastClosed.pop();
              } else {
                break;
              }

            }
          }
        }
      }
    });
    //formatted string
    return codeString;
  }

  this.visualizeChanges = function() {

    const LINE_SEPARATOR = '\r\n';
    var srcString = this.src.replace(new RegExp('(\\r)?\\n', 'g'), LINE_SEPARATOR);
    var dstString = this.dst.replace(new RegExp('(\\r)?\\n', 'g'), LINE_SEPARATOR);

    editorSrc.setValue(srcString);
    editorDst.setValue(dstString);

    this.DIFF_API.post('/changes', {
        'src': Base64.encode(srcString),
        'dst': Base64.encode(dstString),
        'matcher': 1
      })
      .then(function(response) {
        $('.time').text(response.data.metrics.matchingTime + ' ms to match, ' + response.data.metrics.classificationTime + ' ms to classify');

        var changes = response.data.results;
        var dstMarkers = new Array();
        var srcMarkers = new Array();

        changes.forEach(function(entry) {

          if (entry.actionType == 'INSERT') {
            dstMarkers.push(new Marker(entry.dstId, entry.dstPos, 'INSERT', false));
            dstMarkers.push(new Marker(entry.dstId, entry.dstPos + entry.dstLength, 'INSERT', true));
          }

          if (entry.actionType == 'MOVE') {

            srcMarkers.push(new Marker(entry.srcId, entry.srcPos, 'MOVE', false));
            srcMarkers.push(new Marker(entry.srcId, entry.srcPos + entry.srcLength, 'MOVE', true));

            dstMarkers.push(new Marker(entry.dstId, entry.dstPos, 'MOVE', false));
            dstMarkers.push(new Marker(entry.dstId, entry.dstPos + entry.dstLength, 'MOVE', true));
          }

          if (entry.actionType == 'UPDATE') {

            srcMarkers.push(new Marker(entry.srcId, entry.srcPos, 'UPDATE', false));
            srcMarkers.push(new Marker(entry.srcId, entry.srcPos + entry.srcLength, 'UPDATE', true));

            dstMarkers.push(new Marker(entry.dstId, entry.dstPos, 'UPDATE', false));
            dstMarkers.push(new Marker(entry.dstId, entry.dstPos + entry.dstLength, 'UPDATE', true));
          }

          if (entry.actionType == 'DELETE') {

            srcMarkers.push(new Marker(entry.srcId, entry.srcPos, 'DELETE', false));
            srcMarkers.push(new Marker(entry.srcId, entry.srcPos + entry.srcLength, 'DELETE', true));
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

        dstString = insertMarkers(dstMarkersSorted, dstString);
        srcString = insertMarkers(srcMarkersSorted, srcString);

        $('#dst').html(dstString);
        $('#src').html(srcString);

        $('pre code').each(function(i, block) {
          hljs.highlightBlock(block);
        });

        $('code.hljs-line-numbers').remove();

        $('code.hljs#src').each(function(i, block) {
          hljs.lineNumbersBlock(block);
        });
        $('code.hljs#dst').each(function(i, block) {
          hljs.lineNumbersBlock(block);
        });


      })
      .catch(function(error) {
        console.log(error);
      });
  };
}
