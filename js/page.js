(function () {
  'use strict';
  function processData(f) {
    var reader = new FileReader();
    if (f.name.indexOf(".csv") > -1) {
        //  GPS Track Data
      reader.onload = (function(theFile) { return function(e) {
        var lines = e.target.result.split("\n");
        var columns = "time" + lines.splice(0,1);
        columns = columns.split(",");
        var data = cgotag.generateArray(columns, lines);
        cgotag.tracks = data;
        cgotag.addLines(data);
      };})(f);
      reader.readAsText(f);   

    } else if (f.name.indexOf(".jpg") > -1 || f.name.indexOf(".JPG") > -1) {
      reader.onload = function(e) {
        var imageData = e.target.result;
        var data = cgotag.loadImage(e.target.result);
        var imageExif = data.exif;
        var dateTime = data.dateTime;
        console.log("Picture Time: "+dateTime.format());
        var otrack = cgotag.checkTracks(dateTime);
        if (otrack !== null) {
          var myLatLng = {lat: otrack.latitude, lng: otrack.longitude};
          cgotag.map.setCenter(myLatLng);

          var marker = new google.maps.Marker({
            position: myLatLng,
            map: cgotag.map,
            title: f.name
          });

          var newJpeg = cgotag.tagger(otrack, imageExif, imageData);

          var image = new Image();
          image.src = newJpeg;
          image.width = 320;

          var el = $("<div></div>").append(image);
          $("#data").prepend(el);

        } else {
          alert("Cannot find picture in track!");
        }
      };
      reader.readAsDataURL(f);      
    }
  }

  function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.dataTransfer.files; // FileList object.
    for (var i = 0; i<files.length; i++) {
      processData(files[i]);
    }
  }

  function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }

  window.init = function() {
    var dropZone = document.getElementById('drop_zone');
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleFileSelect, false);
    dropZone.addEventListener('change', handleFileSelect, false);


    cgotag.mapCanvas = document.getElementById('map');
    var mapOptions = {
      center: new google.maps.LatLng(37.772, -122.214),
      zoom: 8,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    cgotag.map = new google.maps.Map(cgotag.mapCanvas, mapOptions);
  };
}());