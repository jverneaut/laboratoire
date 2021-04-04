import * as faceapi from 'face-api.js';

const sunglasses = document.querySelector('.sunglasses');

class FaceDetection {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');

    this.modelsLoaded = false;

    this.face = null;
    this.landmarks = null;
  }

  async loadModels() {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models');

    console.log('Model loaded');

    this.modelsLoaded = true;
  }

  async detectFace() {
    if (!this.modelsLoaded) return;

    const face = await faceapi.detectSingleFace(
      this.canvas,
      new faceapi.TinyFaceDetectorOptions()
    );

    if (face) {
      this.face = face;
    }
  }

  async detectLandmarks() {
    if (!this.face) return;

    const faceCanvas = await faceapi.extractFaces(this.canvas, [this.face]);

    const landmarks = await faceapi.detectFaceLandmarksTiny(faceCanvas[0]);

    if (landmarks) {
      const positionedLandmarks = new faceapi.FaceLandmarks68(
        landmarks.relativePositions,
        {
          width: landmarks.imageWidth,
          height: landmarks.imageHeight,
        },
        new faceapi.Point(this.face.box.left, this.face.box.top)
      );

      this.landmarks = positionedLandmarks;
    }
  }

  draw() {
    if (!this.landmarks) return;

    const eyesBoundaries = {
      left: this.landmarks.positions[37 - 1],
      right: this.landmarks.positions[46 - 1],
    };

    const eyesAngle = this.getAngleBetweenTwoPointsInRadians(
      eyesBoundaries.left,
      eyesBoundaries.right
    );

    const eyesCenter = this.getPointsAverage([
      eyesBoundaries.left,
      eyesBoundaries.right,
    ]);

    const eyesWidth = this.getDistanceBetweenTwoPoints(
      eyesBoundaries.left,
      eyesBoundaries.right
    );

    // this.drawAngledRect(
    //   eyesCenter.x - 0.5 * (eyesBoundaries.right.x - eyesBoundaries.left.x),
    //   eyesCenter.y - 0.5 * 4,
    //   eyesWidth,
    //   4,
    //   eyesAngle
    // );

    const sunglassesWidth = eyesWidth * 1.65;
    const sunglassesHeight =
      (sunglasses.height * sunglassesWidth) / sunglasses.width;

    // this.drawAngledImage(
    //   sunglasses,
    //   eyesCenter.x - 0.5 * sunglassesWidth,
    //   eyesCenter.y - 0.5 * sunglassesHeight,
    //   sunglassesWidth,
    //   sunglassesHeight,
    //   eyesAngle
    // );

    faceapi.draw.drawFaceLandmarks(this.canvas, this.landmarks);
  }

  getAngleBetweenTwoPointsInRadians(a, b) {
    return Math.atan2(b.y - a.y, b.x - a.x);
  }

  getDistanceBetweenTwoPoints(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }

  getPointsAverage(points) {
    return points.reduce(
      (acc, curr) => ({
        ...acc,
        x: acc.x + curr.x * (1 / points.length),
        y: acc.y + curr.y * (1 / points.length),
      }),
      { x: 0, y: 0 }
    );
  }

  drawAngledRect(x, y, width, height, angle) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(angle);

    this.ctx.fillRect(0, 0, width, height);

    this.ctx.restore();
  }

  drawAngledImage(img, x, y, width, height, angle) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(angle);

    this.ctx.drawImage(img, 0, 0, width, height);

    this.ctx.restore();
  }
}

export default FaceDetection;
