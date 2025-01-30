 
import * as THREE from 'three'
import { Physics, PrimitiveMechanics } from '../../core/physics/engine.js'
 

const setRigidBodyCallBack = ( node, primitive, planetaryPhysics )=>{

    const currentDepth = node.params.depth 
    
    const maxDepth     = primitive.infrastructure.config.levels.levelsArray.length-1 

    if( currentDepth === maxDepth ) planetaryPhysics.setPrimitiveRigidBody(node)  

 }


export class CelestialBody extends THREE.Object3D{
    constructor(params){
        super()
        this.type          = null
        this.primitive     = null
        this.physicsEngine = null
        this.bodyData      = params    
    }

    enablePhysics( gravity ){

        this.physicsEngine = new PrimitiveMechanics(new Physics( gravity ))

        this.primitive.infrastructure.on('afterMeshCreation', ( node, _ ) => {

            setRigidBodyCallBack ( node, this.primitive, this.physicsEngine )

        } )

    }

} 


 