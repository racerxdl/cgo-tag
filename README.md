      ____ ____  ___ _____     _____  _    ____ 
     / ___/ ___|/ _ \___ /    |_   _|/ \  / ___|
    | |  | |  _| | | ||_ \ _____| | / _ \| |  _ 
    | |__| |_| | |_| |__) |_____| |/ ___ \ |_| |
     \____\____|\___/____/      |_/_/   \_\____|
                                                

Yuneec Q500 CGO3 Camera GPS Picture Tagger
==========================================

A library to tag pictures ta runs both `nodejs` and `web app`.

Installing dependencies
=======================

This program uses `bower` and `npm` to manage dependencies. To install the stuff just run:

```bash
npm install
bower install
```

Running the WebApp
==================

For running the webapp just run at console:

```bash
sudo grunt dev
```

And load the page at `http://localhost:8082`. Then throw the `Telemetry_0002.csv` file at the box and one of the images. See the magic :D (right click in the image and save, and should be tagged).

Running Batch CLI Tagging
==========================

For batch tagging you can run the `cgo-tag.js` script at the root of this repository:

```bash
./cgo-tag.js testdata/Telemetry_0002.csv testdata/*.jpg
```

License
==========================

This code is licensed under MIT License. Please notice the dependencies license.