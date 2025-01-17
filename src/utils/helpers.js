import { BatchedPrimitive } from "../engine/primitives.js"
import { Planet } from "../components/bodies/planet.js"

export function createPrimitive(type,controllerParams,primitiveParams){

    let primitive = new type(primitiveParams)
    
    primitive.controller.config.lodDistanceOffset = controllerParams.offset
  
    primitive.createQuadTree({levels:controllerParams.levels})
  
    primitive.createMeshNodes()
  
    primitive.createDimensions()
  
    return primitive
  }
  
  
  
  
  export function createBatchPrimitive(type,controllerParams,primitiveParams){
  
    let primitive = new BatchedPrimitive(type,primitiveParams)

    primitive.controller.config.lodDistanceOffset = controllerParams.offset

    primitive.createQuadTree({levels:controllerParams.levels})
  
    primitive.createMeshNodes()
  
    primitive.createDimensions()
  
    return primitive
  }
  
  

  export class PlanetGenerator{

    constructor( ){

        this.planets = []

     }

     createPlanet(planet,data){

        planet.setCallBacks(data.callBacks)

        planet.createSphere()

        this.planets.push(planet)

    }

    createPlanets(planetData){

        planetData.forEach(data => {
            
            this.createPlanet(new Planet(data.initilaztionParams,data.planetaryPhysics) , data)

        })

    }
}