# node.ipc.mjs
A flexible node.js IPC module


```javascript

// This is a registrar: processers module. 
// The registrar sends and receieves data

//registrar.mjs

import {Registrar} from './util.ipc.mjs';

const registrar = new Registrar('path/to/socket')


// processer.mjf

import {Processer} from './util.ipc.mjs';

const processer = new Processer({
    name   : 'processer',
    socket : 'path/to/process.socket
});


```
