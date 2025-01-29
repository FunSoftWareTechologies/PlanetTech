import * as THREE from 'three'


export class EventManager {
    constructor() {
      this.eventHandlers = new Map(); 
      this.valueCallbacks = new Map(); 
    }
  
    on(event, handler) {
      if (!this.eventHandlers.has(event)) {
        this.eventHandlers.set(event, []);
      }
      this.eventHandlers.get(event).push(handler);
    }
  
    trigger(event, ...args) {
      if (this.eventHandlers.has(event)) {
        this.eventHandlers.get(event).forEach((handler) => handler(...args));
      }
    }
  
  }
  