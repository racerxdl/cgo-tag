(function () {
  'use strict';

  var inNode = (typeof module !== 'undefined' && typeof module.exports !== 'undefined'); 

  if (inNode) {
    var piexif = require("piexifjs");
    var moment = require("../3rdparty/moment/moment.js");
  }

  var cgotag = {};

  cgotag.tracks = [];

  cgotag.generateArray = function(columns, data) {
    var array = [];
    for (var i=0;i<data.length;i++) {
      var obj = {};
      var items = data[i].split(",");
      if (items.length <= 1)
        break;

      for(var z = 0; z < columns.length; z++) 
        obj[columns[z]] = items[z];

      obj.latitude = obj.lat === undefined ? parseFloat(obj.latitude) : parseFloat(obj.lat) / 10000000;
      obj.longitude = obj.lon === undefined ? parseFloat(obj.longitude) : parseFloat(obj.lon) / 10000000;
      obj.roll = parseFloat(obj.roll);
      obj.pitch = parseFloat(obj.pitch);
      obj.yaw = parseFloat(obj.yaw);
      obj.altitude = obj.alt === undefined ? parseFloat(obj.altitude) : parseFloat(obj.alt);
      obj.time = moment(obj.time, ["YYYYMMDD hh:mm:ss"]);
      if (obj.latitude !== 0 && obj.longitude !== 0)
        array.push(obj);
    }
    return array;
  }


  cgotag.coordToWGS84 = function(coord) {
    var wgs_coord = {
      "latitudeRef" : coord.latitude > 0 ? "N" : "S",
      "latitude" : [[Math.floor(Math.abs(coord.latitude)),1]],
      "longitudeRef" : coord.longitude > 0 ? "E" : "W",
      "longitude": [[Math.floor(Math.abs(coord.longitude)),1]],
      "altitudeRef" : 0,
      "altitude" : [coord.altitude, 1]
    };

    var tmp = (Math.abs(coord.latitude) - wgs_coord.latitude[0][0]) * 60;

    wgs_coord.latitude.push( 
      [
        Math.floor(tmp),
        1
      ]
    );

    wgs_coord.latitude.push(
      [
        Math.floor( (tmp - wgs_coord.latitude[1][0]) * 6000 ),
        100
      ]
    );

    tmp = (Math.abs(coord.longitude) - wgs_coord.longitude[0][0]) * 60;
    wgs_coord.longitude.push( 
      [
        Math.floor(tmp),
        1
      ]
    );

    wgs_coord.longitude.push(
      [
        Math.floor( (tmp - wgs_coord.longitude[1][0]) * 6000 ),
        100
      ]
    );

    return wgs_coord;
  };

  cgotag.checkCoord = function(time, a, b) {
    if (time.isSame(a.time))
      return a;

    if (time.isSame(b.time))
      return b;

    if (time.isAfter(a.time) && time.isBefore(b.time)) {
      var newgps = JSON.parse(JSON.stringify(a));
      newgps.time = time;
      newgps.latitude = ( a.latitude + b.latitude ) / 2;
      newgps.longitude = ( a.longitude + b.longitude ) / 2;
      newgps.altitude = ( a.altitude + b.altitude ) / 2;
      newgps.speed = ( a.speed + b.speed ) / 2;
      return newgps;
    }
    return null;
  };

  cgotag.addLines = function(lines) {
    var path  = [];

    var max = { lat: null, lng: null }; 
    var min = { lat: null, lng: null };

    for (var i in lines) {
      path.push({
        lat: lines[i].latitude,
        lng: lines[i].longitude
      });

      max.lat = max.lat === null ? lines[i].latitude : Math.max(max.lat, lines[i].latitude);
      max.lng = max.lng === null ? lines[i].longitude : Math.max(max.lng, lines[i].longitude);

      min.lat = min.lat === null ? lines[i].latitude : Math.min(min.lat, lines[i].latitude);
      min.lng = min.lng === null ? lines[i].longitude : Math.min(min.lng, lines[i].longitude);
    }

    var flightPath = new google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 2
    });

    flightPath.setMap(cgotag.map);
    var bounds = new google.maps.LatLngBounds();
    flightPath.getPath().forEach(function(latLng) {
      bounds.extend(latLng);
    });
    cgotag.map.fitBounds(bounds);  
    cgotag.map.setCenter({
      lat: (max.lat + min.lat) / 2,
      lng: (max.lng + min.lng) / 2
    });
  };


  cgotag.loadImage = function(imageData) {
    var imageExif = piexif.load(imageData);
    var dateTime = moment(imageExif.Exif[piexif.ExifIFD.DateTimeOriginal], ["YYYY:MM:DD hh:mm:ss"]);

    return {
      exif: imageExif,
      dateTime: dateTime
    };
  };

  cgotag.checkTracks = function(dateTime) {
    for (var i=0;i<cgotag.tracks.length-1;i++) {
      var a = cgotag.tracks[i];
      var b = cgotag.tracks[i+1];

      var otrack = cgotag.checkCoord(dateTime, a, b);
      if (otrack !== null)
        return otrack;
    }
    return null;
  };

  cgotag.tagger = function(otrack, imageExif, imageData) {
    console.log("Injecting GPS Info");
    var coord = cgotag.coordToWGS84(otrack);
    var gps = {};
    gps[piexif.GPSIFD.GPSVersionID] = [2, 3, 0, 0];
    gps[piexif.GPSIFD.GPSLongitudeRef] = coord.longitudeRef;
    gps[piexif.GPSIFD.GPSLatitudeRef] = coord.latitudeRef;
    gps[piexif.GPSIFD.GPSAltitudeRef] = coord.altitudeRef;
    gps[piexif.GPSIFD.GPSLatitude] = coord.latitude;
    gps[piexif.GPSIFD.GPSLongitude] = coord.longitude;
    gps[piexif.GPSIFD.GPSAltitude] = coord.altitude;
    gps[piexif.GPSIFD.GPSMeasureMode] = 3;
    gps[piexif.GPSIFD.GPSMapDatum] = "WGS-84";
    gps[piexif.GPSIFD.GPSDateStamp] = otrack.time.format("YYYY:MM:DD hh:mm:ss");

    imageExif.GPS = gps;

    if (!imageExif.hasOwnProperty("thumbnail") || imageExif.thumbnail === "") {
      delete(imageExif["1st"]);
      delete(imageExif.thumbnail);
    }
     
    return piexif.insert(piexif.dump(imageExif), imageData);
  };

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports.cgotag = cgotag;
  else
    window.cgotag = cgotag;

}());