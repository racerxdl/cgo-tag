(function () {
  'use strict';

  cgotag.coordToWGS84 = function(coord) {
    var wgs_coord = {
      "latRef" : coord.lat > 0 ? "N" : "S",
      "lat" : [[Math.floor(Math.abs(coord.lat)),1]],
      "lonRef" : coord.lon > 0 ? "E" : "W",
      "lon": [[Math.floor(Math.abs(coord.lon)),1]],
      "altRef" : 0,
      "alt" : [coord.alt, 1]
    };

    var tmp = (Math.abs(coord.lat) - wgs_coord.lat[0][0]) * 60;

    wgs_coord.lat.push( 
      [
        Math.floor(tmp),
        1
      ]
    );

    wgs_coord.lat.push(
      [
        Math.floor( (tmp - wgs_coord.lat[1][0]) * 6000 ),
        100
      ]
    );

    tmp = (Math.abs(coord.lon) - wgs_coord.lon[0][0]) * 60;
    wgs_coord.lon.push( 
      [
        Math.floor(tmp),
        1
      ]
    );

    wgs_coord.lon.push(
      [
        Math.floor( (tmp - wgs_coord.lon[1][0]) * 6000 ),
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
      newgps.lat = ( a.lat + b.lat ) / 2;
      newgps.lon = ( a.lon + b.lon ) / 2;
      newgps.alt = ( a.alt + b.alt ) / 2;
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
        lat: lines[i].lat,
        lng: lines[i].lon
      });

      max.lat = max.lat === null ? lines[i].lat : Math.max(max.lat, lines[i].lat);
      max.lng = max.lng === null ? lines[i].lon : Math.max(max.lng, lines[i].lon);

      min.lat = min.lat === null ? lines[i].lat : Math.min(min.lat, lines[i].lat);
      min.lng = min.lng === null ? lines[i].lon : Math.min(min.lng, lines[i].lon);
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

}());