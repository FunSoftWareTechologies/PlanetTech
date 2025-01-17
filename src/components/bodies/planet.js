 
import * as _THREE from 'three'
import * as TSL from 'three/tsl'
import * as WG from 'three/webgpu'
import { Sphere } from '../../engine/primitives.js'

const THREE = {..._THREE,...TSL,...WG}


export class Planet extends THREE.Object3D {

    constructor(planetData,planetaryPhysics){
        super()
        this.sphere = null
        this.planetData = planetData
        this.callBacks = {}
        this.planetaryPhysics = planetaryPhysics
    }

    setCallBacks(callBacks={}){

        Object.entries(callBacks).forEach(keyValue=>{

            let key   = keyValue[0]

            let value = keyValue[1]
            
            if (key){

                if(key === 'afterMeshCreation'){

                    callBacks[key] = ( node, payload )=>{
                        
                        if ( this.planetaryPhysics ){

                            const depth = node.params.depth 

                            const maxDepth = this.sphere.controller.config.levels.levelsArray.length-1 

                            if( depth === maxDepth){

                                this.planetaryPhysics.setRigidBody(node)

                            }
                        }

                        value( node, payload )

                    }

                }
            }

        })

        this.callBacks = Object.assign(this.callBacks,callBacks) 
    }

    createSphere( ){

        let primitive = new Sphere(this.planetData)
    
        primitive.controller.config.lodDistanceOffset = this.planetData.offset   
        
        primitive.controller.setCallBacks({ ...this.callBacks  })
      
        primitive.createQuadTree({levels:this.planetData.levels})
      
        primitive.createMeshNodes()
      
        primitive.createDimensions()
      
        this.sphere = primitive

        this.add(this.sphere)

    }
}