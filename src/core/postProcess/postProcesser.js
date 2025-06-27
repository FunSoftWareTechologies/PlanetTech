import * as THREE from 'three/webgpu'
import { texture } from 'three/tsl';

export class postProcesser  {

    constructor(scene, camera, renderer){
        this.scene    = scene 
        this.camera   = camera  
        this.renderer = renderer

        const depthTexture = new THREE.DepthTexture();
		depthTexture.type  = THREE.FloatType;

		this.renderTarget = new THREE.RenderTarget( window.innerWidth , window.innerHeight  );
		this.renderTarget.depthTexture = depthTexture;

		const materialFX = new THREE.MeshBasicNodeMaterial();
		materialFX.colorNode = texture( this.renderTarget.texture );

		this.quad = new THREE.QuadMesh( materialFX );
    }

    render(){
        this.renderer.setRenderTarget( this.renderTarget );
		this.renderer.render( this.scene, this.camera );

		this.renderer.setRenderTarget( null );
		this.quad.render( this.renderer );
    }
}

