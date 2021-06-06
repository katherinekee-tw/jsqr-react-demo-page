import "./App.css";
import React from "react";

import jsQR from "jsqr";

class App extends React.Component {
  constructor(props) {
    super(props);

    this.canvasElement = React.createRef();
  
    this.state = {
      loadingMessageHidden: true,
      loadingMessage:
        "🎥 Unable to access video stream (please make sure you have a webcam enabled)",
      outputData: null,
    };
  }

  componentDidMount() {
    var canvas = this.canvasElement.current.getContext("2d");
    var video = document.createElement("video");
    // Use facingMode: environment to attemt to get the front camera on phones

    function drawLine(begin, end, color) {
      canvas.beginPath();
      canvas.moveTo(begin.x, begin.y);
      canvas.lineTo(end.x, end.y);
      canvas.lineWidth = 4;
      canvas.strokeStyle = color;
      canvas.stroke();
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then(function (stream) {
        video.srcObject = stream;
        video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
        video.play();
        requestAnimationFrame(tick);
      });

    const canvasElement = this.canvasElement.current;

    const that = this;
    function tick() {
      that.setState({ loadingMessage: "⌛ Loading video..." });
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvasElement.hidden = false;
        that.setState({
          loadingMessageHidden: true,
          outputContainterHidden: false,
        });

        // draw video feed on the canvas
        canvasElement.height = video.videoHeight;
        canvasElement.width = video.videoWidth;
        canvas.drawImage(
          video,
          0,
          0,
          canvasElement.width,
          canvasElement.height
        );

        // pull image from the canvas
        // want the canvas image version so that can draw red bounding box over QR code correctly
        var imageData = canvas.getImageData(
          0,
          0,
          canvasElement.width,
          canvasElement.height
        );
        var code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        if (code) {
          // draw bounding box around QR code
          drawLine(
            code.location.topLeftCorner,
            code.location.topRightCorner,
            "#FF3B58"
          );
          drawLine(
            code.location.topRightCorner,
            code.location.bottomRightCorner,
            "#FF3B58"
          );
          drawLine(
            code.location.bottomRightCorner,
            code.location.bottomLeftCorner,
            "#FF3B58"
          );
          drawLine(
            code.location.bottomLeftCorner,
            code.location.topLeftCorner,
            "#FF3B58"
          );
          that.setState({
            outputData: code.data,
          });
        } else {
          that.setState({
            outputData: null,
          });
        }
      }
      requestAnimationFrame(tick);
    }
  }

  render() {
    return (
      <div className="App">
        <h2>Using: React + jsQR library + .getUserMedia</h2>
        <p>Wise</p>
        <div id="loadingMessage" hidden={this.state.loadingMessageHidden}>
          {this.state.loadingMessage}
        </div>
        <canvas ref={this.canvasElement} id="canvas" hidden></canvas>
        <div id="output">
          {this.state.outputData ? (
            <div>
              <b>Data:</b> <span id="outputData">{this.state.outputData}</span>
            </div>
          ) : (
            <div id="outputMessage">No QR code detected.</div>
          )}
        </div>
      </div>
    );
  }
}

export default App;
