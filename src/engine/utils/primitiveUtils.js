export const initializationData = (i_, j_, k) =>{
  return  [
      {pos: new THREE.Vector3(i_, -j_,  k) , direction:'+z', rot: new THREE.Euler(0, 0, 0)},
      {pos: new THREE.Vector3(i_, -j_, -k ), direction:'-z', rot: new THREE.Euler(0, Math.PI, 0)},
      {pos: new THREE.Vector3(k,  -j_, -i_), direction:'+x', rot: new THREE.Euler(0,  Math.PI / 2, 0)},
      {pos: new THREE.Vector3(-k, -j_, -i_), direction:'-x', rot: new THREE.Euler(0, -Math.PI / 2, 0)},
      {pos: new THREE.Vector3(i_,  k,   j_), direction:'+y', rot: new THREE.Euler(-Math.PI / 2, 0, 0)},
      {pos: new THREE.Vector3(i_, -k,   j_), direction:'-y', rot: new THREE.Euler( Math.PI / 2, 0, 0)}
    ]
}

//todo
export const createDimensions = ( params ) => {  for (let i = 0; i < 6; i++) { createDimension(params, i) } }

//todo
export const createDimension = ( params, idx = 0 ) => {

  let { i_, j_, k, _index, primitive } = params

  let initData = initializationData(i_, j_, k)

  const {pos, direction, rot} = initData[idx];

  const matrix     = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion().setFromEuler(rot);
  matrix.compose(pos, quaternion, new THREE.Vector3(1, 1, 1));

  const rootBounds = new THREE.Box3(
      new THREE.Vector3(-k, -k, 0),
      new THREE.Vector3( k,  k, 0)
  );

  primitive._createQuadTreeNode(rootBounds, primitive.parameters.level, matrix)

/*let quadTreeNode = primitive.createQuadTreeNode({ 
  matrixRotationData : rot, 
  offset : pos,
  index:_index,
  direction ,
})

primitive.createSpatialNode(quadTreeNode)
primitive.quadTree.rootNodes.push(quadTreeNode)
primitive._createMeshNodes({quadTreeNode})
primitive.addNode(quadTreeNode.getSpatialNode().nodekey,quadTreeNode)*/
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