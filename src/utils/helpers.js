import { BatchedPrimitive } from "../engine/primitives.js"
import { Planet } from "../components/bodies/celestialBody.js"

  export class PlanetGenerator{

    constructor( ){

        this.planets = []

     }

     createPlanet(planet,data){

        planet.createSphere(data.shpereData,data.callBacks)

        this.planets.push(planet)

    }

    createPlanets(planetData){

        planetData.forEach(data => {
            
            this.createPlanet(new Planet(data.planetData) , data)

        })

    }
}