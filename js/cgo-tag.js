(function () {
  'use strict';
  window.cgotag = {};

  cgotag.tracks = [];

  function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }

  function generateArray(columns, data) {
    var array = [];
    for (var i=0;i<data.length;i++) {
      var obj = {};
      var items = data[i].split(",");
      if (items.length <= 1)
        break;

      for(var z = 0; z < columns.length; z++) 
        obj[columns[z]] = items[z];

      obj.lat = parseFloat(obj.lat) / 10000000;
      obj.lon = parseFloat(obj.lon) / 10000000;
      obj.speed = parseFloat(obj.speed);
      obj.angle = parseFloat(obj.angle);
      obj.alt = parseFloat(obj.alt);
      obj.time = moment(obj.time, ["YYYYMMDD hh:mm:ss"]);

      array.push(obj);
    }
    return array;
  }

  function processData(f) {
    var reader = new FileReader();
    if (f.name.indexOf(".csv") > -1) {
        //  GPS Track Data
      reader.onload = (function(theFile) { return function(e) {
        /*
          ,lon,lat,alt,accuracy,speed,angle
          20140120 15:30:55:565,-4.672305679321289E8,-2.3559959411621094E8,762.4846,160.0,0.4733725,160.0
          20140120 15:30:55:735,-4.672305679321289E8,-2.3559959411621094E8,762.4846,160.0,0.4733725,160.0
        */
        var lines = e.target.result.split("\n");
        var columns = "time" + lines.splice(0,1);
        columns = columns.split(",");
        var data = generateArray(columns, lines);
        cgotag.tracks = data;
        cgotag.addLines(data);
      };})(f);
      reader.readAsText(f);   

    } else if (f.name.indexOf(".jpg") > -1 || f.name.indexOf(".JPG") > -1) {
      reader.onload = function(e) {
        var imageData = e.target.result;
        var imageExif = piexif.load(imageData);
        var dateTime = moment(imageExif.Exif[piexif.ExifIFD.DateTimeOriginal], ["YYYY:MM:DD hh:mm:ss"]);
        console.log("Picture Time: "+dateTime.format());
        var otrack = null;
        for (var i=0;i<cgotag.tracks.length-1;i++) {
          var a = cgotag.tracks[i];
          var b = cgotag.tracks[i+1];

          otrack = cgotag.checkCoord(dateTime, a, b);
          if (otrack !== null)
            break;

        }
        if (otrack !== null) {
          var myLatLng = {lat: otrack.lat, lng: otrack.lon};
          cgotag.map.setCenter(myLatLng);

          var marker = new google.maps.Marker({
            position: myLatLng,
            map: cgotag.map,
            title: f.name
          });

          console.log("Injecting GPS Info");
          var coord = cgotag.coordToWGS84(otrack);
          var gps = {};
          gps[piexif.GPSIFD.GPSVersionID] = [2, 3, 0, 0];
          gps[piexif.GPSIFD.GPSLongitudeRef] = coord.lonRef;
          gps[piexif.GPSIFD.GPSLatitudeRef] = coord.latRef;
          gps[piexif.GPSIFD.GPSAltitudeRef] = coord.altRef;
          gps[piexif.GPSIFD.GPSLatitude] = coord.lat;
          gps[piexif.GPSIFD.GPSLongitude] = coord.lon;
          gps[piexif.GPSIFD.GPSAltitude] = coord.alt;
          gps[piexif.GPSIFD.GPSMeasureMode] = 3;
          gps[piexif.GPSIFD.GPSMapDatum] = "WGS-84";
          gps[piexif.GPSIFD.GPSDateStamp] = otrack.time.format("YYYY:MM:DD hh:mm:ss");

          imageExif.GPS = gps;

          if (!imageExif.hasOwnProperty("thumbnail") || imageExif.thumbnail === "") {
            delete(imageExif["1st"]);
            delete(imageExif.thumbnail);
          }
          console.log(imageExif);
           
          var newJpeg = piexif.insert(piexif.dump(imageExif), imageData);
          var image = new Image();
          image.src = newJpeg;
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

    /*
    var file = evt.target.files[0];
    console.log(evt);
    var reader = new FileReader();
    reader.onload = function(e) {
      var x = piexif.load(e.target.result);
      console.log(x);
    };
    reader.readAsDataURL(file);
    */
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