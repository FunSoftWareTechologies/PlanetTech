
export function workersSRC(currentGeometry,params){
    return `
    import * as THREE from 'https://unpkg.com/three@0.169/build/three.module.js';
    //todo: add the ability for dynamic imports like (params.map)


    ${params.map(code=>{
        return code.toString().replaceAll('three__WEBPACK_IMPORTED_MODULE_1__','THREE')
    }).join('\n')}

    
    async function imageReader(payload){

        // Load the image

        let direction  = payload.direction

        const response = await fetch(payload.textures[direction] );

        const blob     = await response.blob();

        const imageBitmap = await createImageBitmap(blob);

        const canvas  = payload.offscreenCanvas

        canvas.width  = imageBitmap.width;

        canvas.height = imageBitmap.height;

        const ctx = canvas.getContext("2d");

        ctx.drawImage(imageBitmap,0,0);

        const imageBitmapResult = canvas.transferToImageBitmap();

        return imageBitmapResult

    }


    async function init( payload ){

        let imageBitmapResult

        let transferable = []

        if (payload.textures){ 
            
            imageBitmapResult = await imageReader(payload)

            transferable.push(imageBitmapResult)
            
            }


        const positionBuffer = new Float32Array(payload.sharedArrayPosition );
        const normalBuffer   = new Float32Array(payload.sharedArrayNormal   );
        const uvBuffer       = new Float32Array(payload.sharedArrayUv       );
        const indexBuffer    = new Uint32Array (payload.sharedArrayIndex    );
        //const dirVectBuffer  = (payload.sharedArrayDirVect === undefined) ? undefined : new Float32Array(payload.sharedArrayDirVect  );

        let geometry = new ${currentGeometry}( payload.size, payload.size, payload.resolution, payload.resolution, payload.radius)

        let matrix  = payload.matrixRotationData.propMehtod ? new THREE.Matrix4()[[payload.matrixRotationData.propMehtod]](payload.matrixRotationData.input) : new THREE.Matrix4() 

        geometry._setMatrix({ matrix })

        geometry._setOffset({ offset: payload.offset })

        geometry._threadingBuild({
            positionBuffer,
            normalBuffer,
            uvBuffer,
            indexBuffer,
            //dirVectBuffer
        })

        let centerdPosition = new THREE.Vector3()
        
        //geometry._restGeometry(centerdPosition)

        //positionBuffer.set(geometry.attributes.position.array)

        //geometry.computeVertexNormals()

        //normalBuffer.set(geometry.attributes.normal.array)

        return{
            centerdPosition:centerdPosition.toArray(),
            imageBitmapResult,
            transferable,
        }
    }
        
    self.onmessage = async function(msg) {
        const payload = msg.data
        let outputBuffers = await init(payload)
        self.postMessage({
            centerdPosition: outputBuffers.centerdPosition,
            imageBitmapResult: outputBuffers.imageBitmapResult
        }, outputBuffers.transferable)
    }
    `
}