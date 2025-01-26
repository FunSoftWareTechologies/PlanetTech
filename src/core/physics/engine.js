
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';
//https://sbedit.net/f06b5aef06fb48c2777501f643dfa21f765c9485#L273-L281

export class Physics {

    constructor(gravity){ 
        
        this.world  = RAPIER.init().then( _ => {

            let world = new RAPIER.World(gravity);

            return world 
        })

        this.engine = RAPIER 
    }
}


export class PrimitiveMechanics{

    constructor( physicsEngine ){

        this.physicsEngine = physicsEngine

     }


     setPrimitiveRigidBody( node ){ 

        return this.physicsEngine.world.then(world=>{
           
            const parent = node.parent;

            const mesh   = node.mesh();

            const quadBody  = world.createRigidBody(this.physicsEngine.engine.RigidBodyDesc.fixed().setTranslation(...parent.position.toArray()))

            const vertices  = new Float32Array(mesh.geometry.attributes.position.array)

            const indices   = new Uint32Array(mesh.geometry.index.array)

            const quadShape = this.physicsEngine.engine.ColliderDesc.trimesh(vertices, indices)

            world.createCollider(quadShape, quadBody)

            return world

        })
     }

 
}