# WebViewer Video

[WebViewer](https://www.pdftron.com/documentation/web/) is a powerful JavaScript-based Library that's part of the [PDFTron SDK](https://www.pdftron.com). It allows you to view and annotate various file formats (PDF, MS Office, images, videos) on your web app with a fully customizable UI.

This sample uses the [video addon](https://www.npmjs.com/package/@pdftron/webviewer-video) for WebViewer. It allows the loading of HTML5 videos (.mp4, ogg, webm) so that their frames can be annotated. For more information, see this [guide](https://www.pdftron.com/documentation/web/get-started/manually-video/).

[Watch a video](https://youtu.be/d_yIN8aZE6Y) that highlights new features included in 3.0 release.

![WebViewer](https://pdftron.s3.amazonaws.com/custom/websitefiles/wv-video.png)

Let me know how you are planning to use WebViewer Video or if you have any feedback on any feature missing. You can [email me](mailto:andrey@pdftron.com) directly.

This repo is specifically designed for any users interested in integrating WebViewer into React project. This project was generated with Create React App. See Create React App documentation for more information.

## Demo

You can explore all of the functionality in our [showcase](https://www.pdftron.com/samples/web/samples/advanced/video/).

## Initial setup

Before you begin, make sure your development environment includes [Node.js and npm](https://www.npmjs.com/get-npm).

## Install

```
git clone https://github.com/PDFTron/webviewer-video-sample.git
cd webviewer-video-sample
npm install
```

## Run

```
npm start
```

## Build

Run `npm run build` to build the project. The build artifacts will be stored in the `build/` directory. See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

To test the build directory locally you can use [serve](https://www.npmjs.com/package/serve) or [http-server](https://www.npmjs.com/package/http-server). In case of serve, by default it strips the .html extension stripped from paths. We added serve.json configuration to disable cleanUrls option.

## Documentation

[API documentation](https://www.pdftron.com/api/video/)

## WebViewer APIs

See @pdftron/webviewer [API documentation](https://www.pdftron.com/documentation/web/guides/ui/apis).

## License

WebViewer Video will run in trial mode until a license is provided. For more information on licensing, please visit our [website](https://www.pdftron.com/licensing/)
