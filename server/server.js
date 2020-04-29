// This file is to run a server in localhost:3000
// Code to handle annotations is in annotationHandler.js

const express = require('express');
const bodyParser = require('body-parser');
const annotationHandler = require('./annotationHandler');

const app = express();

app.use(bodyParser.text());
// app.use('/client', express.static('client')); // For statically serving 'client' folder at '/'

annotationHandler(app);

// Run server
app.listen(8080, '0.0.0.0', (err) => {
	if (err) {
		console.error(err);
	} else {
    console.info(`Server is listening at http://localhost:8080/`);
  }
});
