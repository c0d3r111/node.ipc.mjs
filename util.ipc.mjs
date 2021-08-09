import net      from 'net';
import fs       from 'fs';
import Emitter  from './util.events.mjs';

export class Registrar  {
	constructor (socket)   {
		this.sockets = {};
		this.socket  = socket;

		void this.init();
	}
	connect     (socket)   {
		const sockets = this.sockets;

		void socket.on('data', data => {
			let registered;
			let name;
			let sock;

			try   { [name, sock] = JSON.parse(data) }
			catch { void 0 }

			if (sock && name) {
				if (!sockets[name]) {
					sockets[name] = new Set();
				} 

				void sockets[name].add(sock);
				void (registered = true);
			}
			
			return void socket.end(registered ? 'registered' : '');
		});
	}
	del         (socket)   {
		return void fs.unlink(socket, () => {
			void fs.rm(socket, () => null);
		});
	}
	get         (name)     {
		let target  = this.sockets[name];

		if (!target) return null;
		
		let index   = Math.floor(Math.random() * target.size);
		let current = 0;

		for (const socket of target) {
			if (current === index) {
				return socket
			}

			current++;
		}

		return null;
	}
	query       (name, data, timeout) {
		const register = this;

		return new Promise(resolve => {
			let socket = register.get(name);

			if (!socket) return null;

			let hasData    = false;
			let connection = net.createConnection(socket, () => {
				void connection.write(JSON.stringify(data));
				void connection.on('data', response => {
					void (hasData = true);
					void resolve(response);
				});
			});

			void connection.on('error', async e => {
				void (hasData = true);
				void register.del(socket);
				void register.sockets[name].delete(socket);

				return register.sockets[name].size
					? void resolve(register.query(name, data, timeout))
					: void resolve(null);
			});			
			void setTimeout(() => {
				if (!hasData) {
					void connection.destroy();
					void resolve(null);
				}
			}, timeout || 3e4);
		});
	}
	init        () {
		void fs.unlink(this.socket, e => {;		
			void fs.rmSync(this.socket, {force: true});

			this.server = net.createServer();

			void this.server.on('connection', this.connect.bind(this));
			void this.server.on('error', e => {
				void console.error(e);
				void this.init();
			});
			void this.server.listen(this.socket);
		});
	}
}
export class Processer  {
	constructor (config) {
		this.socket      = config.socket;
		this.name        = config.name;
		this.emitter     = new Emitter();
		this.connections = new Set();

		void this.init();
	}
	broadcast   (server) {
		const connection = net.createConnection(
			server, 
			() => {
				void connection.write(JSON.stringify([this.name, this.socket]));
				void connection.on('data', data => {
					if (data.toString() === 'registered') {
						void this.connections.add(server);
					}
				});
			}
		);

		void connection.on('close', () => this.connections.has(server)
			? void 0
			: void setTimeout(() => this.broadcast(server), 5e3));
		void connection.on('error', e => {
			throw e;
		});
	}
	connect     (socket) {
		const uid = String(Math.random());

		void socket.on('data', data => {
			void this.emitter.on(uid, response => socket.destroyed
				? void 0
				: void socket.end(JSON.stringify(response)));
			void this.emitter.emit('request', {data, uid});
		});
	}
	emit        (name, data) {
		return void this.emitter.emit(name, data);
	}
	init        () {
		void fs.unlink(this.socket, e => {;		
			void fs.rmSync(this.socket, {force: true});

			this.server = net.createServer();

			void this.server.on('connection', this.connect.bind(this));
			void this.server.on('error', e => {
				void console.error(e);
				void this.init();
			});
			void this.server.listen(this.socket);
		});
	}
	on          (name, data, context) {
		return void this.emitter.on(name, context ? method.bind(context) : method);
	}
	once        (name, data) {
		return void this.emitter.once(name, data);
	}
	uid         (size = 8) {
        let carr = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
        let len  = carr.length - 1;
        let str  = '';
    
        while (str.length < size) {
            str += carr[Math.floor(Math.random() * len)];
        }
    
        return str;
    }
}


