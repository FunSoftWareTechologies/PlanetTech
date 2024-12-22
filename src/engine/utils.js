import * as THREE from 'three/tsl'
import { NormalizedQuadGeometry,QuadGeometry } from './geometry.js'
import { ThreadController } from './webWorker/threading.js'
 
export const project=( normalizedCenter, radius, center )=>{
    let W = new THREE.Vector3()
    normalizedCenter.sub(center).normalize()
    W.copy(normalizedCenter)
    normalizedCenter.multiplyScalar(radius)
    normalizedCenter.add(center).add(W)
}

export const createLocations = ( size, offset, axis ) => {
    const halfSize = size 
    switch (axis) {
     case 'z':
       return [
         [ halfSize + offset[0],  halfSize + offset[1], offset[2]],
         [-halfSize + offset[0],  halfSize + offset[1], offset[2]],
         [ halfSize + offset[0], -halfSize + offset[1], offset[2]],
         [-halfSize + offset[0], -halfSize + offset[1], offset[2]],
       ];
     case 'x':
       return [
         [offset[0],  halfSize + offset[1],  halfSize + offset[2]],
         [offset[0],  halfSize + offset[1], -halfSize + offset[2]],
         [offset[0], -halfSize + offset[1],  halfSize + offset[2]],
         [offset[0], -halfSize + offset[1], -halfSize + offset[2]],
       ];
     case 'y':
       return [
         [ halfSize + offset[0], offset[1],  halfSize + offset[2]],
         [-halfSize + offset[0], offset[1],  halfSize + offset[2]],
         [ halfSize + offset[0], offset[1], -halfSize + offset[2]],
         [-halfSize + offset[0], offset[1], -halfSize + offset[2]],
       ];
     default:
       return [];
   }
 };
 
 export const cordinate = (idx) => ['NE','NW','SE','SW'][idx]

 export const isWithinBounds = (distance, primitive,size) => {
   return ( (distance) < (primitive.controller.config.lodDistanceOffset * size) && size > primitive.controller.config.minLevelSize )
  };

export const generateKey = node => `${node.params.index}_${node.params.direction}_${node.position.x}_${node.position.y}_${node.params.size}`

export const createCanvasTexture = (setTextures,material,imageBitmap) =>{

    const map = new THREE.CanvasTexture()

    map.image =  imageBitmap

    map.needsUpdate = true
    
    map.onUpdate = function() {

      imageBitmap.close();
   
   };

   if (setTextures) material.map = map

}

export const bufferInit = ( geometryData, geometryClass )=>{

      // Initialize SharedArrayBuffers
      const sharedArrayUv       = new SharedArrayBuffer( geometryData.byteLengthUv);
      const sharedArrayIndex    = new SharedArrayBuffer( geometryData.byteLengthIndex);
      const sharedArrayPosition = new SharedArrayBuffer( geometryData.byteLengthPosition);
      const sharedArrayNormal   = new SharedArrayBuffer( geometryData.byteLengthNormal);
      
      // Include direction vectors buffer for specific geometry if needed
      const sharedArrayDirVect = geometryClass === NormalizedQuadGeometry ? new SharedArrayBuffer(geometryData.byteLengthNormal) : null;
  
      const positionBuffer = new Float32Array(sharedArrayPosition);
      const normalBuffer   = new Float32Array(sharedArrayNormal);
      const uvBuffer       = new Float32Array(sharedArrayUv);
      const indexBuffer    = new Uint32Array(sharedArrayIndex);
      const dirVectBuffer  = sharedArrayDirVect ? new Float32Array(sharedArrayDirVect) : null;

      return{
        
        buffers:{
          sharedArrayUv,
          sharedArrayIndex,
          sharedArrayPosition,
          sharedArrayNormal,
          sharedArrayDirVect,
        },

        views:{
          positionBuffer,
          normalBuffer,
          uvBuffer,
          indexBuffer,
          dirVectBuffer,
        }
      }
    }

export const threadingInit = ( geometryClass, workersSRC ) => {

  const blob = new Blob(
    [workersSRC(geometryClass.name, [QuadGeometry, (geometryClass === QuadGeometry) ? '' : geometryClass ] )],
    { type: 'application/javascript' }
  );
  const threadController = new ThreadController(new Worker(URL.createObjectURL(blob), { type: 'module' }));

  return threadController
  
}


export const geometryInit = (params) =>{

  let {size, resolution, additionalPayload, geometryClass, views } = params

  const geometry = new geometryClass(size, size, resolution, resolution, ...Object.values(additionalPayload));

  geometry.setIndex(Array.from( views.indexBuffer));

  geometry.setAttribute('position', new THREE.Float32BufferAttribute( views.positionBuffer, 3));

  geometry.setAttribute('normal', new THREE.Float32BufferAttribute( views.normalBuffer, 3));

  geometry.setAttribute('uv', new THREE.Float32BufferAttribute( views.uvBuffer, 2));

  if (views.dirVectBuffer) { geometry.setAttribute('directionVectors', new THREE.Float32BufferAttribute( views.dirVectBuffer, 3)); }

  return geometry
}


export const meshInit = (geometry, material,centerdPosition ) => {

  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(...centerdPosition );

  return mesh
}