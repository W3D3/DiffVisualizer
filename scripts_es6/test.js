// THIS IS JUST FOR PROTOTYPING
// DO NOT USE IN PRODUCTION

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
				lastClosed.forEach(function(startmarker){
					if(startmarker.id == marker.id)
          {
						markerNotYetOpened = true;
					}
				});
				if (markerNotYetOpened) {
					var openingMarker = lastClosed.pop();
					while (openingMarker.id <= marker.id) {
						var range = splitValue(codeString, marker.position);
						codeString = range[0] + marker.generateTag() + range[1];
						if(lastClosed.length > 0 && lastClosed[lastClosed.length - 1].id <= marker.id)
            {
							openingMarker = lastClosed.pop();
						}
						else {
							break;
						}

					}
				}
			}
		}
	});

	return codeString;
}

const DIFF_API = axios.create({
	baseURL: 'http://localhost:8080/v1/',
});

DIFF_API.get('/matchers')
  .then(function(response) {
	console.log(response);
})
  .catch(function(error) {
	console.log(error);
});

//sample data
//var src = "cGFja2FnZSBjb20udGVzdDsNCg0KcHVibGljIGNsYXNzIFRlc3RDbGFzcyBleHRlbmRzIFN1cGVyQ2xhc3Mgew0KDQogIHB1YmxpYyBUZXN0Q2xhc3MoKQ0KICB7DQogICAgaW50IHRvQmVEZWxldGVkID0gNTY2NzsNCiAgfQ0KfQ0K";
//var dst = "";
var src = 'cGFja2FnZSBjb20udGVzdDsNCg0KcHVibGljIGNsYXNzIFRlc3RDbGFzcyBleHRlbmRzIFN1cGVyQ2xhc3Mgew0KDQogIHB1YmxpYyBUZXN0Q2xhc3MoKQ0KICB7DQogICAgaW50IHZhciA9IDEyMzsNCiAgICBpbnQgdG9CZURlbGV0ZWQgPSA1NjY3Ow0KICB9DQoNCiAgcHJpdmF0ZSB2b2lkIGxvbCgpDQogIHsNCiAgICBTeXN0ZW0ub3V0LnByaW50bG4oIm5peCIpOw0KICB9DQp9DQo=';
var dst = 'cGFja2FnZSBjb20udGVzdDsNCg0KcHVibGljIGNsYXNzIFRlc3RDbGFzcyBleHRlbmRzIFN1cGVyQ2xhc3Mgew0KDQogIHB1YmxpYyBTdHJpbmcgbmV3VmFyID0gInNvIG5ldyI7DQoNCiAgcHJpdmF0ZSB2b2lkIGxvbCgpDQogIHsNCiAgICBTeXN0ZW0ub3V0LnByaW50bG4oIm5peCIpOw0KICB9DQoNCiAgcHVibGljIFRlc3RDbGFzcygpDQogIHsNCiAgICBpbnQgdmFyVXBkID0gNDQ0NDMyMTsNCiAgfQ0KfQ0K=';
//var dst = "cGFja2FnZSBjb20udGVzdDsNCg0KcHVibGljIGNsYXNzIFRlc3RDbGFzcyBleHRlbmRzIFN1cGVyQ2xhc3Mgew0KDQogIHB1YmxpYyBTdHJpbmcgbmV3VmFyID0gInNvIG5ldyI7DQoNCiAgcHJpdmF0ZSB2b2lkIGxvbCgpDQogIHsNCiAgICBTeXN0ZW0ub3V0LnByaW50bG4oImFzZGYiKTsNCiAgfQ0KDQogIHB1YmxpYyBUZXN0Q2xhc3MoKQ0KICB7DQogICAgaW50IHZhclVwZCA9IDQ0NDQzMjE7DQogIH0NCn0=";

var editorSrc = ace.edit('editor');
editorSrc.setTheme('ace/theme/monokai');
editorSrc.getSession().setMode('ace/mode/java');

var editorDst = ace.edit('editorDst');
editorDst.setTheme('ace/theme/monokai');
editorDst.getSession().setMode('ace/mode/java');

visualizeChanges(src, dst);

function visualizeChanges(src, dst) {

	const LINE_SEPARATOR = '\r\n';
	var srcString = Base64.decode(src).replace(new RegExp('(\\r)?\\n', 'g'), LINE_SEPARATOR);
	var dstString = Base64.decode(dst).replace(new RegExp('(\\r)?\\n', 'g'), LINE_SEPARATOR);



	editorSrc.setValue(srcString);
	editorDst.setValue(dstString);

	DIFF_API.post('/changes', {
		'src': src,
		'dst': dst,
		'matcher': 1
	})
    .then(function(response) {
	$('.time').text(response.data.metrics.matchingTime + ' ms to match, ' + response.data.metrics.classificationTime + ' ms to classify');

	var changes = response.data.results;
	var dstMarkers = new Array();
	var srcMarkers = new Array();

	changes.forEach(function(entry) {
		console.log(entry);

		if (entry.actionType == 'INSERT') {
			dstMarkers.push(new Marker(entry.dstId, entry.dstPos, 'INSERT', false));
			dstMarkers.push(new Marker(entry.dstId, entry.dstPos + entry.dstLength, 'INSERT', true));
		}

		if (entry.actionType == 'MOVE') {
			console.log(splitRange(srcString, entry.srcPos, entry.srcLength)[1]);
			console.log(splitRange(dstString, entry.dstPos, entry.dstLength)[1]);

			srcMarkers.push(new Marker(entry.srcId, entry.srcPos, 'MOVE', false));
			srcMarkers.push(new Marker(entry.srcId, entry.srcPos + entry.srcLength, 'MOVE', true));

			dstMarkers.push(new Marker(entry.dstId, entry.dstPos, 'MOVE', false));
			dstMarkers.push(new Marker(entry.dstId, entry.dstPos + entry.dstLength, 'MOVE', true));
		}

		if (entry.actionType == 'UPDATE') {

			console.log(splitRange(srcString, entry.srcPos, entry.srcLength)[1]);
			console.log(splitRange(dstString, entry.dstPos, entry.dstLength)[1]);

			srcMarkers.push(new Marker(entry.srcId, entry.srcPos, 'UPDATE', false));
			srcMarkers.push(new Marker(entry.srcId, entry.srcPos + entry.srcLength, 'UPDATE', true));

			dstMarkers.push(new Marker(entry.dstId, entry.dstPos, 'UPDATE', false));
			dstMarkers.push(new Marker(entry.dstId, entry.dstPos + entry.dstLength, 'UPDATE', true));
		}

		if (entry.actionType == 'DELETE') {

			console.log(splitRange(srcString, entry.srcPos, entry.srcLength)[1]);

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

	console.log(srcMarkersSorted);
	console.log(dstMarkersSorted);

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
}




$('#saveSource').click(function() {
	visualizeChanges(Base64.encode(editorSrc.getValue()), Base64.encode(editorDst.getValue()));
});
