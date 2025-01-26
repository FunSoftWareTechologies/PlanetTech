import * as THREE from 'three'
import {CelestialBody} from './celestialBody.js' 
import { Sphere } from '../../engine/primitives.js'


export class Planet extends CelestialBody{
    static __type = 'Planet'

    constructor(params){
        super(params)
     }

 
    initSphere( primitiveData ){

        this.primitive = new Sphere(primitiveData)
    
        this.primitive.levelArchitecture.config.lodDistanceOffset = primitiveData.offset 
        
        this.primitive.createQuadTree({levels:primitiveData.levels})
      
        this.primitive.createMeshNodes()

    }


    setEvents(name, eventHandlers){

        if( Array.isArray(eventHandlers) ){ 
            eventHandlers.forEach(fn => { this.primitive.levelArchitecture.on(name,fn)  });
        }else{
            this.primitive.levelArchitecture.onValue( name, eventHandlers)
        }

    }

 
    create(){

        this.primitive.createDimensions()
      
        this.add(this.primitive)

    }
}
