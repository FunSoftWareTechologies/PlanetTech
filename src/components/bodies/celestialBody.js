 
import * as THREE from 'three'


import { PhysicsEngine,PlanetaryPhysics } from '../../core/physics/engine.js'
 


const setRigidBodyCallBack = ( node, primitive, planetaryPhysics )=>{

    const currentDepth = node.params.depth 
    
    const maxDepth     = primitive.levelArchitecture.config.levels.levelsArray.length-1 

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

        let prevAfterMeshCreation = this.primitive.levelArchitecture.trigger('afterMeshCreation') 

        this.primitive.levelArchitecture.on('afterMeshCreation', ( node, payload ) => {

            setRigidBodyCallBack ( node, this.primitive, this.physicsEngine )

            prevAfterMeshCreation( node, payload )

        } )

    }

} 


/*
    setCallBacks( callBacks  ){

        const afterMeshCreation = (node,payload) =>{

            if ( this.planetaryPhysics ){
        
                const depth = node.params.depth 
        
                const maxDepth = this.sphere.levelArchitecture.config.levels.levelsArray.length-1 
        
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