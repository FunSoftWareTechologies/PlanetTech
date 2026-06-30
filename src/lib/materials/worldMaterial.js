import {SphereMaterial} from '@funsoftware/spatialprimitives'
import {QuadMaterial} from '@funsoftware/spatialprimitives'

const vertexShader =`

uniform sampler2D u_FaceIndexTexture;

vec2 batchedPrimitiveUV(){
    int instanceIndex = int(getIndirectIndex(gl_DrawID));
    float faceIdxF = texelFetch(u_FaceIndexTexture, ivec2(instanceIndex, 0), 0).r;
    int faceIdx = int(faceIdxF + 0.5);
    float col = float(faceIdx % 4);
    float row = floor(float(faceIdx) / 4.0);
    vec2 uv_ = vec2((col + uv.x) * 0.25, (row + uv.y) * 0.5);
    return clamp(uv_, 0.00001, 0.99999);
}

//inject usersMainPT

void main(){
    usersMainPT();
}

`

const fragmentShader =`

//inject usersMainPT

void main(){
    usersMainPT();
}
`

export class WorldMaterial extends SphereMaterial{

    constructor(params){

        const _vUsers = params.vertexShader.replace('main','usersMainPT')

        const _fUsers = params.fragmentShader.replace('main','usersMainPT')

        const _v = vertexShader.replace('//inject usersMainPT',_vUsers)

        const _f = fragmentShader.replace('//inject usersMainPT',_fUsers)

        super({fragmentShader:_f,vertexShader:_v,uniforms:params.uniforms}) 

        this._params = params
        
    }
}


export class QWorldMaterial extends QuadMaterial{

    constructor(params){

        const _vUsers = params.vertexShader.replace('main','usersMainPT')

        const _fUsers = params.fragmentShader.replace('main','usersMainPT')

        const _v = vertexShader.replace('//inject usersMainPT',_vUsers)

        const _f = fragmentShader.replace('//inject usersMainPT',_fUsers)

        super({fragmentShader:_f,vertexShader:_v,uniforms:params.uniforms}) 

        this._params = params
        
    }
}