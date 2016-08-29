'use strict';

const express = require('express');
const cache = require('memory-cache');
const app = express();

const PageImageColorComparator = require('./lib/PageImageColorComparator');
const opts = {
  url: 'http://topodesigns.com/collections/bags',
  referenceColor: [53, 170, 78],
  colorImageSelector: 'main .color.options .color.available span',
  colorNameDataAttr: 'option-title'
};

function template(text) {
  return `
  <html>
    <head>
      <link rel="stylesheet" type="text/css" href="http://cloud.typography.com/7738032/768302/css/fonts.css">
      <style>
        body {
          text-align: center;
          background-color: #35aa4e;
          font-size: 3rem;
          margin-top: 6rem;
          color: white;
          font-family: "Whitney a", "Whitney b", "Helvetica Neue", Helvetica, arial, sans-serif;;
        }
      </style>
    </head>
    <body>${text}</body>
  </html>`;
}

function existsResponse(exists, res) {
  if (exists) {
      res.send(template('OMG OMG OMG. Finally!'));
  } else {
    res.send(template('Nope, not yet'));
  }
}

app.get('/', function (req, res) {
  const comparator = new PageImageColorComparator(opts);
  const exists = cache.get('exists');
  if (exists === null) {
    comparator.getPage()
      .then(html => comparator.getColors(html))
      .then(colors => Promise.all(colors.map(color => comparator.checkColors(color))))
      .then(dEValues => dEValues.map(dE => comparator.evaluateColorCloseness(dE)))
      .then(closenessVals => {
        const closeColorExists = closenessVals.some(exists => exists);
        cache.put('exists', closeColorExists, 240000);
        existsResponse(closeColorExists, res);
      })
      .catch(e => {
        res.status(500).send(template('Something broke!'));
      });
  } else {
    existsResponse(exists, res);
  }
});

app.listen(3000, function () {
  console.log('Listening on port 3000.');
});