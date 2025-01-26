import * as THREE from 'three';
import { NormalizedQuadGeometry } from './../geometry.js';
 

export const bufferInit = (geometryData, geometryClass) => {
  const sharedArrayUv       = new SharedArrayBuffer(geometryData.byteLengthUv);
  const sharedArrayIndex    = new SharedArrayBuffer(geometryData.byteLengthIndex);
  const sharedArrayPosition = new SharedArrayBuffer(geometryData.byteLengthPosition);
  const sharedArrayNormal   = new SharedArrayBuffer(geometryData.byteLengthNormal);
  const sharedArrayDirVect  = geometryClass === NormalizedQuadGeometry ? new SharedArrayBuffer(geometryData.byteLengthNormal) : null;

  const positionBuffer = new Float32Array(sharedArrayPosition);
  const normalBuffer   = new Float32Array(sharedArrayNormal);
  const uvBuffer       = new Float32Array(sharedArrayUv);
  const indexBuffer    = new Uint32Array(sharedArrayIndex);
 //const dirVectBuffer = sharedArrayDirVect ? new Float32Array(sharedArrayDirVect) : null;

  return {
    buffers: {
      sharedArrayUv,
      sharedArrayIndex,
      sharedArrayPosition,
      sharedArrayNormal,
      sharedArrayDirVect,
    },
    views: {
      positionBuffer,
      normalBuffer,
      uvBuffer,
      indexBuffer,
      //dirVectBuffer,
    },
  };
};

export const geometryInit = (params) => {
  let { size, resolution, additionalPayload, geometryClass, views } = params;

  const geometry = new geometryClass(size, size, resolution, resolution, ...Object.values(additionalPayload));

  geometry.setIndex(Array.from(views.indexBuffer));
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(views.positionBuffer, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(views.normalBuffer, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(views.uvBuffer, 2));

  //`if (views.dirVectBuffer) { geometry.setAttribute('directionVectors', new THREE.Float32BufferAttribute(views.dirVectBuffer, 3))}

  return geometry;
};

export const meshInit = (geometry, material, centeredPosition) => {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...centeredPosition);
  return mesh;
};