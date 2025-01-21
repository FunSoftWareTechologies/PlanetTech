import * as THREE from 'three';
import {norm} from './boundingBoxUtils.js'  
  export const createTexture = (imageBitmap) => {
    if (imageBitmap) {
      const map = new THREE.CanvasTexture(imageBitmap);
      map.needsUpdate = true;
      map.onUpdate = function () {
        imageBitmap.close();
      };
      return map;
    }
  };
  
  export const createUVObject = () => {
    let uv = { scale: 1, offset: new THREE.Vector2(0, 0) };
  
    return {
      update: function (node, scale = 1, Offset = new THREE.Vector2(0, 0)) {
        const { offSets, testscaling } = calculateUV(node, scale, Offset);
        uv.scale = testscaling;
        uv.offset = uv.offset.copy(offSets);
        return this;
      },
  
      getScale: function () { return uv.scale; },
  
      getOffset: function () { return uv.offset; },
  
      setScaleForTexture: function (texture) { texture.repeat.set(this.getScale(), this.getScale()); },
  
      setOffsetForTexture: function (texture) { texture.offset.copy(this.getOffset()); },
    };
  };
  
  export const calculateUV = (node, scale, Offset) => {
    let maxLevelSize = node.params.levelArchitecture.config.maxLevelSize;
    const w = node.params.size;
    const d = node.params.levelArchitecture.config.dimensions * scale;
    const testscaling = w / (maxLevelSize * d);
  
    const halfScale = testscaling / 2;
    const position = new THREE.Vector3(...node.params.offset);
  
    const nxj = norm(position.x, (maxLevelSize * d) / 2, -(maxLevelSize * d) / 2);
    const nyj = norm(position.y, (maxLevelSize * d) / 2, -(maxLevelSize * d) / 2);
    const offSets = new THREE.Vector2(nxj - halfScale, nyj - halfScale).sub(Offset);
  
    return { offSets, testscaling };
  };