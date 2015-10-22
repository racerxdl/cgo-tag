(function () {
  'use strict';
  var coordToWGS84 = function(coord) {
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


  var addLines = function(lines) {
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

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports.cgotag.coordToWGS84 = coordToWGS84;
    // No add lines for nodejs
  } else {
    cgotag.coordToWGS84 = coordToWGS84;
    cgotag.addLines = addLines;
  }
}());