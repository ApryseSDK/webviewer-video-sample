const path = require('path');
const fs = require('fs');

module.exports = (app) => {
  // Create xfdf folder if it doesn't exist
  // if (!fs.existsSync('server/xfdf')) {
  //   fs.mkdirSync('server/xfdf');
  // }

  // Handle POST request sent to '/server/annotationHandler.js'
  app.post('/server/annotationHandler.js', (request, response) => {
    const xfdfFile = path.resolve(__dirname, `./xfdf/${request.query.documentId}.xfdf`);

    try {
      // Write XFDF string into an XFDF file
      response.status(200).send(fs.writeFileSync(xfdfFile, request.body));
    } catch(e) {
      response.status(500).send(`Error writing xfdf data to ${xfdfFile}`);
    }
    response.end();
  });

  // Handle GET request sent to '/server/annotationHandler.js'
  app.get('/server/annotationHandler.js', (request, response) => {
    const xfdfFile = path.resolve(__dirname, `./xfdf/${request.query.documentId}.xfdf`);

    if (fs.existsSync(xfdfFile)) {
      response.header('Content-Type', 'text/xml');
      // Read from the XFDF file and send the string as a response
      response.status(200).send(fs.readFileSync(xfdfFile));
    } else {
      response.status(204).send(`${xfdfFile} is not found.`);
    }
    response.end();
  });
}
