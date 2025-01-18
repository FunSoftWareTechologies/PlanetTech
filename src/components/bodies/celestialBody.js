 
import * as _THREE from 'three'
import * as TSL from 'three/tsl'
import * as WG from 'three/webgpu'
import { Sphere } from '../../engine/primitives.js'
import { PhysicsEngine,PlanetaryPhysics } from '../../core/physics/engine.js'
const THREE = {..._THREE,...TSL,...WG}


const setRigidBodyCallBack = ( node, primitive, planetaryPhysics )=>{

    const currentDepth = node.params.depth 
    
    const maxDepth     = primitive.architecture.config.levels.levelsArray.length-1 

    if( currentDepth === maxDepth ) planetaryPhysics.setRigidBody(node)  

 }


export class CelestialBody extends THREE.Object3D{
    constructor(params){
        super()
        this.primitive     = null
        this.physicsEngine = null
        this.bodyData      = params    
    }

    enablePhysics( gravity ){

        this.physicsEngine = new PlanetaryPhysics(new PhysicsEngine( gravity ))

        let prevAfterMeshCreation = this.primitive.architecture.config.callBacks.afterMeshCreation 

        /*
        if( this.primitive ){

            this.primitive.quadTreeCollections.forEach( quadTreeNode => {
 
                quadTreeNode.getMeshNode().then( meshNode => setRigidBodyCallBack( meshNode, this.primitive,  this.physicsEngine ))
                
            });

        }
        */

        this.primitive.architecture.config.callBacks.afterMeshCreation = ( node, payload ) => {

            setRigidBodyCallBack ( node, this.primitive, this.physicsEngine )

            prevAfterMeshCreation( node, payload )

        }

    }

} 



export class Planet extends CelestialBody{

    constructor(params){
        super(params)
    }

 
    createSphere( primitiveData, callBacks ){

        let primitive = new Sphere(primitiveData)
    
        primitive.architecture.config.lodDistanceOffset = primitiveData.offset   

        primitive.architecture.setCallBacks({ ...callBacks  })

        primitive.createQuadTree({levels:primitiveData.levels})
      
        primitive.createMeshNodes()
      
        primitive.createDimensions()
      
        this.primitive = primitive

        this.add(this.primitive)

    }
}


/*
    setCallBacks( callBacks  ){

        const afterMeshCreation = (node,payload) =>{

            if ( this.planetaryPhysics ){
        
                const depth = node.params.depth 
        
                const maxDepth = this.sphere.architecture.config.levels.levelsArray.length-1 
        
                if( depth === maxDepth){
        
                    console.log(this.planetaryPhysics)
        
                    this.planetaryPhysics.setRigidBody(node)
        
                }
            }
        }
        
        callBackReplacer([afterMeshCreation],callBacks).forEach(element => {
            this.callBacks[[element.name]] = element
        });

 
    }

*/