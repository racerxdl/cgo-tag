#!/usr/bin/nodejs 

var cgotag = require("./lib/cgo-tag.js").cgotag;
var fs = require("fs");


if (process.argv.length > 3) {
  if (process.argv[2].indexOf(".csv") === -1) {
    console.error(process.argv[2]+" is not a CSV file.");
    process.exit();
  }

  var lines = fs.readFileSync(process.argv[2]).toString().split("\n");

  var columns = "time" + lines.splice(0,1);
  columns = columns.split(",");
  var data = cgotag.generateArray(columns, lines);
  cgotag.tracks = data;

  console.log(cgotag.tracks.length + " tracks loaded from "+process.argv[2]+"!");

  for (var i=3;i<process.argv.length;i++) {
    var imageFile = process.argv[i];
    console.log("Processing "+imageFile);

    var imageData = fs.readFileSync(imageFile).toString("binary");
    var data = cgotag.loadImage(imageData);
    var imageExif = data.exif;
    var dateTime = data.dateTime;
    console.log(" - Picture Time: "+dateTime.format());
    var otrack = cgotag.checkTracks(dateTime);
    if (otrack !== null) {
      console.log(" - Picture Latitude: "+otrack.latitude);
      console.log(" - Picture Longitude: "+otrack.longitude);
      console.log(" - Picture Altitude: "+otrack.altitude+"m");
      var newJpeg =  new Buffer(cgotag.tagger(otrack, imageExif, imageData), "binary");
      fs.writeFileSync(imageFile, newJpeg);
    } else {
      console.error("Cannot find position for "+imageFile+"!");
    }
  }

  console.log("Done!");
} else {
  console.error("Usage: nodejs cgo-tag.js TelemetryXXXX.csv image0.jpg image1.jpg ...");
}