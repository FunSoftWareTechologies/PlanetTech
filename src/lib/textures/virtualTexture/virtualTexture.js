import { VirtualTexture as _ } from "@funsoftware/virtualtexture";
import { ProceduralTileProvider } from "@funsoftware/virtualtexture";

export class CubemapTileProvider extends ProceduralTileProvider {
  constructor(config) {
    super(config);
    this.cache = new Map();
  }

  getTile(mip, x, y) {
    const key = `${mip}-${x}-${y}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = this.config.SLOT_W;
    canvas.height = this.config.SLOT_H;
    const ctx = canvas.getContext('2d');
    
    const hue = Math.floor((mip * 137.5 + x * 73 + y * 31) % 360);
    const darkColor = `hsl(${hue}, 40%, 15%)`;
    const baseColor = `hsl(${hue}, 50%, 25%)`;

    const tilesPerFace = 1 << (this.config.MAX_MIP - mip);
    const faceCol = Math.floor(x / tilesPerFace);
    const faceRow = Math.floor(y / tilesPerFace);
    const faceIndex = faceRow * 4 + faceCol;

    const localX = x % tilesPerFace;
    const localY = y % tilesPerFace;

    ctx.fillStyle = darkColor;
    ctx.fillRect(0, 0, this.config.SLOT_W, this.config.SLOT_H);

    ctx.save();
    ctx.translate(this.config.PADDING / 2, this.config.PADDING / 2);

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, this.config.PAGE_W, this.config.PAGE_H);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, this.config.PAGE_W, this.config.PAGE_H);

    ctx.translate(-localX * this.config.PAGE_W, -localY * this.config.PAGE_H);
    ctx.scale(tilesPerFace, tilesPerFace);

    ctx.lineWidth = Math.max(2, this.config.PAGE_W * 0.01);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';

    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(this.config.PAGE_W, this.config.PAGE_H);
    ctx.moveTo(this.config.PAGE_W, 0); ctx.lineTo(0, this.config.PAGE_H);
    
    ctx.moveTo(this.config.PAGE_W / 2, 0); ctx.lineTo(this.config.PAGE_W / 2, this.config.PAGE_H);
    ctx.moveTo(0, this.config.PAGE_H / 2); ctx.lineTo(this.config.PAGE_W, this.config.PAGE_H / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.config.PAGE_W / 2, this.config.PAGE_H / 2, this.config.PAGE_W * 0.4, 0, Math.PI * 2);
    ctx.arc(this.config.PAGE_W / 2, this.config.PAGE_H / 2, this.config.PAGE_W * 0.25, 0, Math.PI * 2);
    ctx.stroke();

    if (faceIndex < 6) {
      ctx.save();
      ctx.translate(this.config.PAGE_W / 2, this.config.PAGE_H / 2);
      ctx.scale(1, -1);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${this.config.PAGE_W * 0.4}px "Courier New", monospace`;
      ctx.fillText(`${faceIndex}`, 0, 0);
      ctx.restore();
    }

    ctx.restore();

    this.cache.set(key, canvas);
    return canvas;
  }
}

export class VirtualTexture extends _{
    constructor(...args){
        super(...args)
    }
}

 