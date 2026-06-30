import { VirtualTexture as _ } from "@funsoftware/virtualtexture";
import { CubemapTileProvider } from "@funsoftware/virtualtexture";

export class VirtualTextureCube extends _{
    constructor(renderer,params){
        const cubeProvider = new CubemapTileProvider(params)
        super(renderer,cubeProvider)
    }
}

 