const LIFESPAN = 4000;
const FLUIDITY = 2;

class Canvas {
  constructor() {
    this.canvas = document.createElement('canvas');

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.ctx = this.canvas.getContext('2d');

    document.body.appendChild(this.canvas);

    this.points = [];

    let lastPoint;

    ['mouseover', 'mousemove', 'touchstart', 'touchmove'].forEach(event =>
      document.addEventListener(event, e => {
        const x = e.clientX || e.touches[0].clientX;
        const y = e.clientY || e.touches[0].clientY;

        const point = {
          x,
          y,
          date: Date.now(),
          direction: [null, null],
          magnitude: null,
          radius: null,
          opacity: null,
        };

        if (lastPoint) {
          const dX = point.x - lastPoint.x;
          const dY = point.y - lastPoint.y;

          const magnitude = Math.sqrt(Math.pow(dX, 2) + Math.pow(dY, 2));

          point.direction = [dX / magnitude || 0, dY / magnitude || 0];
          point.magnitude = magnitude;

          this.points.push(point);
        }

        lastPoint = Object.assign({}, point);
      })
    );
  }

  update() {
    const time = Date.now();

    this.points.forEach((point, index) => {
      const progress = (time - point.date) / LIFESPAN;

      this.points[index].x += FLUIDITY * point.direction[0];
      this.points[index].y += FLUIDITY * point.direction[1];
      this.points[index].radius = 60 + 40 * progress;
      this.points[index].opacity = 1 - progress;

      if (progress > 1) {
        this.points.splice(index, 1);
      }
    });
  }

  draw() {
    this.ctx.fillStyle = 'rgb(126, 126, 126)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.points.forEach(({ x, y, direction, radius, opacity }) => {
      const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
      const rgb = [126 - 126 * direction[0], 126 - 126 * direction[1], 255];

      gradient.addColorStop(
        0,
        `rgba(${rgb[0]},${rgb[1]},${rgb[2]}, ${opacity})`
      );
      gradient.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]}, 0)`);

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    });
  }
}

export default Canvas;
