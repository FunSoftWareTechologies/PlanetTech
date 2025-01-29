import * as THREE from 'three'
import { Primitive } from "./primitive.js"

export class BatchedPrimitive extends Primitive{
    static __type = 'BatchedPrimitive'
  
    constructor(primitive,params){
      
      super(params)
  
       this.constructor.__type = primitive.__type // dont like the idea this redefines what the actual type is
  
      if(isSphere(this)) this.levelArchitecture.config.radius = params.radius
      
    }
  
    createDimensions(){
  
      let batchedMesh = new THREE.BatchedMesh(0,0,0, new THREE.MeshStandardMaterial())
  
      this._transferGeometry(batchedMesh)
  
      super.createDimensions()
  
      let promises = []
  
      this.quadTreeCollections.forEach((quadTreeNode) => {promises.push(quadTreeNode.getMeshNode()) })
  
      this.batchedMesh = Promise.all(promises).then( _ => {
  
        this.add(batchedMesh)
  
        return batchedMesh
      
      })
  
    }
  
    _transferGeometry(batchedMesh){
  
      let polyPerLevel = this.levelArchitecture.config.levels.polyPerLevel
  
      this.levelArchitecture.on('afterMeshCreation', ( node, payload ) => {
   
        const parent = node.parent;
  
        parent.remove( node );
  
        const geometry  = node.mesh().geometry 
  
        const depth     = node.params.depth 
  
        const vertex    = polyPerLevel[depth] 
  
        const vertexCount = ( ( vertex + 1 ) * ( vertex + 1 ) )
  
        const indexCount  = ( ( vertex**2  ) * 6 )
  
        const maxInstanceCount = batchedMesh.maxInstanceCount + 1
  
        const maxVertexCount   = batchedMesh._maxVertexCount  + vertexCount // doc shows _maxVertexCount without the undscore
  
        const maxIndexCount    = batchedMesh._maxIndexCount   + indexCount // doc shows _maxIndexCount without the undscore
  
        batchedMesh.setInstanceCount( maxInstanceCount )
  
        batchedMesh.setGeometrySize ( maxVertexCount, maxIndexCount )
  
        const geometryId = batchedMesh.addGeometry( geometry );
        
        const id = batchedMesh.addInstance( geometryId );
  
        const matrix = new THREE.Matrix4();
  
        matrix.premultiply(new THREE.Matrix4().makeTranslation(...parent.position.toArray()));
  
        batchedMesh.setMatrixAt( id, matrix );
  
        batchedMesh.setColorAt ( id, new THREE.Color( Math.random() * 0xffffff ) )
  
      }) 
  
    }
  
  }
  