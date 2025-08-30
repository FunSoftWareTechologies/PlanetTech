import * as THREE from 'three'
import { Primitive } from "./primitive.js"
import { isSphere }  from './../utils/primitiveUtils.js'

export class BatchedPrimitive extends Primitive{
    static __type = 'BatchedPrimitive'
  
    constructor(type,params){
      
      super(params)

      this.constructor.__type = type // dont like the idea this redefines what the actual type is / hardcode for now
  
      if(isSphere(this)) this.infrastructure.config.radius = params.radius
      
    }
  
    createDimensions(){
  
      let batchedMesh = new THREE.BatchedMesh(1,1,1, this.infrastructure.config.material)
  
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
  
      let polyPerLevel = this.infrastructure.config.levels.polyPerLevel
  
      this.infrastructure.events.on('afterMeshCreation', ( node, payload ) => {
   
        const parent = node.parent;
  
        parent.remove( node );
  
        const geometry  = node.mesh().geometry 

        const material  = node.mesh().material 

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

        geometry.dispose() // might need this when phyics engine works
        
        material.dispose()
  
      }) 
    }
  }
  
//example usage
  /*
  let planet2  = new BatchedPrimitive(122,{
  offset:1/0.5 ,
  levels:1,
  size:1,
  radius:10.0,
  resolution:50,
  dimension:10
})
planet2.infrastructure.config.lodDistanceOffset = 1
planet2.createQuadTree({levels:1})
      
 planet2.createMeshNodes()

planet2.createDimensions()
  */