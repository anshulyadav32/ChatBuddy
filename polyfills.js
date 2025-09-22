// Polyfills for Node.js modules in React Native Web
import 'react-native-url-polyfill/auto';

// Buffer polyfill
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// Process polyfill
if (typeof global.process === 'undefined') {
  global.process = require('process/browser');
}

// Util polyfill with proper inherits function
if (typeof global.util === 'undefined') {
  const util = require('util');
  global.util = util;
  
  // Ensure util.inherits is properly defined
  if (!util.inherits) {
    util.inherits = function(ctor, superCtor) {
      if (ctor === undefined || ctor === null)
        throw new TypeError('The constructor to "inherits" must not be null or undefined');
      
      if (superCtor === undefined || superCtor === null)
        throw new TypeError('The super constructor to "inherits" must not be null or undefined');
      
      if (superCtor.prototype === undefined)
        throw new TypeError('The super constructor to "inherits" must have a prototype');
      
      ctor.super_ = superCtor;
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
    };
  }
}

// Crypto polyfill
if (typeof global.crypto === 'undefined') {
  global.crypto = require('crypto-browserify');
}

// Stream polyfill
if (typeof global.stream === 'undefined') {
  global.stream = require('stream-browserify');
}