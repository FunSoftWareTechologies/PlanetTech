 
import { NormalizedQuadGeometry,QuadGeometry } from './geometry.js'
import { ThreadController } from './webWorker/threading.js'
 
import * as _THREE from 'three'
import * as TSL from 'three/tsl'
import * as WG from 'three/webgpu'

const THREE = {..._THREE,...TSL,...WG}

export const project=( normalizedCenter, radius, center )=>{
    let W = new THREE.Vector3()
    normalizedCenter.sub(center).normalize()
    W.copy(normalizedCenter)
    normalizedCenter.multiplyScalar(radius)
    normalizedCenter.add(center).add(W)
}

export const createLocations = (size, offset, axis) => {
  const halfSize = size;
  let points;

  switch (axis) {
    case 'z':
      points = [
        [ halfSize + offset[0],  halfSize + offset[1], offset[2]], // A
        [-halfSize + offset[0],  halfSize + offset[1], offset[2]], // B
        [ halfSize + offset[0], -halfSize + offset[1], offset[2]], // C
        [-halfSize + offset[0], -halfSize + offset[1], offset[2]], // D
      ];
      break;

    case 'x':
      points = [
        [offset[0],  halfSize + offset[1],  halfSize + offset[2]], // A
        [offset[0],  halfSize + offset[1], -halfSize + offset[2]], // B
        [offset[0], -halfSize + offset[1],  halfSize + offset[2]], // C
        [offset[0], -halfSize + offset[1], -halfSize + offset[2]], // D
      ];
      break;

    case 'y':
      points = [
        [ halfSize + offset[0], offset[1],  halfSize + offset[2]], // A
        [-halfSize + offset[0], offset[1],  halfSize + offset[2]], // B
        [ halfSize + offset[0], offset[1], -halfSize + offset[2]], // C
        [-halfSize + offset[0], offset[1], -halfSize + offset[2]], // D
      ];
      break;

    default:
      return [];
  }

  const [A, B, C, D] = points;

  // Compute the averages
  const averages = [
    [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2], // A and B
    [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2, (A[2] + C[2]) / 2], // A and C
    [(C[0] + D[0]) / 2, (C[1] + D[1]) / 2, (C[2] + D[2]) / 2], // C and D
    [(D[0] + B[0]) / 2, (D[1] + B[1]) / 2, (D[2] + B[2]) / 2], // D and B
  ];

  return {
    points,
    averages,
  };
};

 
 export const cordinate = (idx) => ['NE','NW','SE','SW'][idx]

 export const isWithinBounds = (distance, primitive,size) => {
   return ( (distance) < (primitive.controller.config.lodDistanceOffset * size) && size > primitive.controller.config.minLevelSize )
  };

export const generateKey = node => `${node.params.index}_${node.params.direction}_${node.position.x}_${node.position.y}_${node.params.size}`

export const createTexture = (imageBitmap) =>{
 
  if(imageBitmap){
    
    const map = new THREE.CanvasTexture(imageBitmap)

    map.needsUpdate = true
    
    map.onUpdate = function() {

      imageBitmap.close();
   
   };

   return map
  }

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


const initializationData = (i_, j_, k) =>{
  return  [
      {offset: [i_, -j_,   k], direction:'+z', matrixRotationData: {propMehtod:'',input:0}},
      {offset: [i_, -j_,  -k], direction:'-z', matrixRotationData: {propMehtod:'makeRotationY', input: Math.PI   }},
      {offset: [k,  -j_, -i_], direction:'+x', matrixRotationData: {propMehtod:'makeRotationY', input: Math.PI/2 }},
      {offset: [-k, -j_, -i_], direction:'-x', matrixRotationData: {propMehtod:'makeRotationY', input:-Math.PI/2 }},
      {offset: [i_,  k,   j_], direction:'+y', matrixRotationData: {propMehtod:'makeRotationX', input:-Math.PI/2 }},
      {offset: [i_, -k,   j_], direction:'-y', matrixRotationData: {propMehtod:'makeRotationX', input: Math.PI/2 }}
    ]
}

//todo
export const createDimensions = ( params ) => {
 
  for (let i = 0; i < 6; i++) { createDimension(params, i) }
  
}

//todo
export const createDimension = ( params, idx = 0 ) => {

  let { i_, j_, k, _index, primitive } = params

  let initData = initializationData(i_, j_, k)

  const {offset,direction,matrixRotationData} = initData[idx];

  let quadTreeNode = primitive.createQuadTreeNode({ 
    matrixRotationData , 
    offset ,
    index:_index,
    direction ,
  })

  primitive.createSpatialNode(quadTreeNode)
  primitive.quadTree.rootNodes.push(quadTreeNode)
  primitive._createMeshNodes({quadTreeNode})
  primitive.addNode(quadTreeNode.getSpatialNode().nodekey,quadTreeNode)
}


export const box3Mesh = (boundingBox, color) => new THREE.Box3Helper( boundingBox, color)

export function norm(val, max, min) { return (val - min) / (max - min); }

export function createUVObject() {
  return {
    uv: THREE.uv(), // Store the UV value

    update: function (node) {
      let maxLevelSize = node.params.controller.config.maxLevelSize;

      const w = node.params.size;
      const d = node.params.controller.config.dimensions;
      const testscaling = w / (maxLevelSize * d);
      const halfScale = testscaling / 2;
      const position = node.localToWorld(new THREE.Vector3());

      const nxj = norm(position.x, (maxLevelSize * d) / 2, -(maxLevelSize * d) / 2);
      const nyj = norm(position.y, (maxLevelSize * d) / 2, -(maxLevelSize * d) / 2);
      const offSets = new THREE.Vector2(nxj - halfScale, nyj - halfScale);
      this.uv = this.uv.mul(testscaling).add(offSets);

      return this ;
    },

    scale:function ( scaleValue = 1 ) {
      this.uv = this.uv.sub(0.5).div(scaleValue).add(0.5);
      return this ;
    },

    offset:function ( offsetValueX = 0, offsetValueY = 0 ) {
      this.uv = this.uv.sub(THREE.vec2(offsetValueX,offsetValueY))
      return this ;
    },

    getUV:function () { return this.uv  }
  };
}


export const createCallBackPayload = (params) => {
  let { meshNode, imageBitmap } = params

  const uv  = createUVObject().update(meshNode)
  const map = createTexture(imageBitmap)

  return{
    uv,
    map
  }
}