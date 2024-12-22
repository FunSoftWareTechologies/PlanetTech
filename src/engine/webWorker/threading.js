
export class ThreadController {
    constructor(_worker) {
      this.worker = _worker
    }
    
    setPayload( payload ) {
       
      let transferable = []

       if (payload.textures){ 

        payload.offscreenCanvas = new OffscreenCanvas(0,0)

        transferable.push(payload.offscreenCanvas)

       } 
         
       
      this.worker.postMessage(payload,transferable)
    }
  
    getPayload( callBack ){
      this.worker.onmessage =(payload)=>{
        callBack(payload)
       }
    }
  }
  