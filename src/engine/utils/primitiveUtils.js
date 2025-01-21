import { createUVObject,createTexture } from "./textureUtils.js"


export const initializationData = (i_, j_, k) =>{
    return  [
        {offset: [i_, -j_,  k ], direction:'+z', matrixRotationData: {propMehtod:'',input:0}},
        {offset: [i_, -j_, -k ], direction:'-z', matrixRotationData: {propMehtod:'makeRotationY', input: Math.PI   }},
        {offset: [k,  -j_, -i_], direction:'+x', matrixRotationData: {propMehtod:'makeRotationY', input: Math.PI/2 }},
        {offset: [-k, -j_, -i_], direction:'-x', matrixRotationData: {propMehtod:'makeRotationY', input:-Math.PI/2 }},
        {offset: [i_,  k,   j_], direction:'+y', matrixRotationData: {propMehtod:'makeRotationX', input:-Math.PI/2 }},
        {offset: [i_, -k,   j_], direction:'-y', matrixRotationData: {propMehtod:'makeRotationX', input: Math.PI/2 }}
      ]
  }

//todo
export const createDimensions = ( params ) => {  for (let i = 0; i < 6; i++) { createDimension(params, i) } }

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


export const isSphere = (primitive) => primitive.constructor.__type === 'Sphere'

export const isCube   = (primitive) => primitive.constructor.__type === 'Cube'

export const whichDimensionFn  = (primitive) => {

  if(isSphere(primitive) || isCube(primitive)){
    return createDimensions
  }else{
    return createDimension
  }

}

export const createCallBackPayload = (params) => {
    const { meshNode, imageBitmap } = params;
    const uv = createUVObject().update(meshNode);
    const map = createTexture(imageBitmap);
    return { uv, map };
  };