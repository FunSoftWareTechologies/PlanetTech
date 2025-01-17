
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';
 

export class PhysicsEngine {
    constructor(gravity){ 
        
        this.world  = RAPIER.init().then( () => {
            let world = new RAPIER.World(gravity);
            return world 
        })

        this.engine = RAPIER 
    }
}


export class PlanetaryPhysics{

    constructor( physicsEngine ){

        this.physicsEngine = physicsEngine

     }


     setRigidBody( node ){/*
        const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(50, 1, 50), new THREE.MeshPhongMaterial())
        floorMesh.receiveShadow = true
        floorMesh.position.y = -1
        scene.add(floorMesh)
        const floorBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -1, 0))
        const floorShape = RAPIER.ColliderDesc.cuboid(25, 0.5, 25)
        world.createCollider(floorShape, floorBody)


        const torusKnotMesh = new THREE.Mesh(new THREE.TorusKnotGeometry(), new THREE.MeshNormalMaterial())
        torusKnotMesh.castShadow = true
        scene.add(torusKnotMesh)
        const torusKnotBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(5, 5, 0))
        const vertices = new Float32Array(torusKnotMesh.geometry.attributes.position.array)
        let indices = new Uint32Array(torusKnotMesh.geometry.index.array)
        const torusKnotShape = RAPIER.ColliderDesc.trimesh(vertices, indices).setMass(1).setRestitution(0.5)
        world.createCollider(torusKnotShape, torusKnotBody)
        dynamicBodies.push([torusKnotMesh, torusKnotBody])
        */

        this.physicsEngine.then(world=>{

            const parent = node.parent;

            const mesh = node.mesh();

            const quadBody = world.createRigidBody(this.physicsEngine.RAPIER.RigidBodyDesc.fixed().setTranslation(...parent.position.toArray()))

            const vertices = new Float32Array(mesh.geometry.attributes.position.array)

            let indices = new Uint32Array(mesh.geometry.index.array)

            const quadShape = RAPIER.ColliderDesc.trimesh(vertices, indices)

            world.createCollider(quadShape, quadBody)

        })
     }

 
}