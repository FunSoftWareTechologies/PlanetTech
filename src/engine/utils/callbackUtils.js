export const callBackReplacer = (arrayA, arrayB) => {
    const arrayAMap = new Map(arrayA.map(fn => [fn.name, fn]));
  
    return arrayB.map(originalFn => {
      const name = originalFn.name;
      const replacementFn = arrayAMap.get(name);
  
      if (replacementFn) {
        const wrappedFn = function (...args) {
          replacementFn.call(this, ...args);
          originalFn.call(this, ...args);
        };
  
        Object.defineProperty(wrappedFn, 'name', { value: name, writable: false });
  
        return wrappedFn;
      }
  
      return originalFn;
    });
  };