# WebViewer Audio

[WebViewer](https://www.pdftron.com/documentation/web/) is a powerful JavaScript-based PDF Library that's part of the [PDFTron PDF SDK](https://www.pdftron.com). It allows you to view and annotate PDF files on your web app with a fully customizable UI.

This sample uses the [audio addon](https://www.npmjs.com/package/@pdftron/webviewer-audio) for WebViewer. It allows the loading of media elements (.mp3, .mp4, ogg, webm, etc.), so that their audio tracks can annotated and redacted.

![WebViewer](https://pdftron.s3.amazonaws.com/custom/websitefiles/wv-audio.png)

This repo is specifically designed for any users interested in integrating WebViewer into React project. This project was generated with Create React App. See Create React App documentation for more information.

## Initial setup

Before you begin, make sure your development environment includes [Node.js and npm](https://www.npmjs.com/get-npm).

## Install

```
git clone https://github.com/PDFTron/webviewer-audio-sample.git
cd webviewer-audio-sample
npm install
```

## Run

```
npm start
npm run start-server
```

`npm run start-server` is required for saving of annotations.

## Build

Run `npm run build` to build the project. The build artifacts will be stored in the `build/` directory. See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

To test the build directory locally you can use [serve](https://www.npmjs.com/package/serve) or [http-server](https://www.npmjs.com/package/http-server). In case of serve, by default it strips the .html extension stripped from paths. We added serve.json configuration to disable cleanUrls option.

## WebViewer APIs

See @pdftron/webviewer [API documentation](https://www.pdftron.com/documentation/web/guides/ui/apis).<br/>
See @pdftron/webviewer-audio [API documentation](https://webviewer-audio.web.app/doc/).

## Contributing

See [contributing](./CONTRIBUTING.md).

## License

See [license](./LICENSE).
