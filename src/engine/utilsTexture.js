
// Load the image

export async function imageReader(payload){

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