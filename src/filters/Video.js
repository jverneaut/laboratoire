class Video {
  constructor(videoHTMLElement) {
    this.stream = null;
    this.videoHTMLElement = videoHTMLElement;

    this.video.setAttribute('autoplay', '');
    this.video.setAttribute('muted', '');
    this.video.setAttribute('playsinline', '');
  }

  async getStream() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
    }
  }

  async play() {
    this.videoHTMLElement.srcObject = this.stream;
    await this.videoHTMLElement.play();
  }

  draw(ctx, dimensions) {
    const ratio =
      dimensions.x /
      dimensions.y /
      (this.videoHTMLElement.videoWidth / this.videoHTMLElement.videoHeight);

    ctx.save();
    ctx.translate(dimensions.x, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(
      this.videoHTMLElement,
      0.5 * (1 - ratio) * this.videoHTMLElement.videoWidth,
      0,
      ratio * this.videoHTMLElement.videoWidth,
      this.videoHTMLElement.videoHeight,
      0,
      0,
      dimensions.x,
      dimensions.y
    );
    ctx.restore();
  }
}

export default Video;
