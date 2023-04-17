var Events = require('events');
var Util = require('util');
const WebSocket = require('ws-https-browserify');

module.exports = WebsocketWrapper;

Util.inherits(WebsocketWrapper, Events.EventEmitter);
function WebsocketWrapper(
  host /*: string*/,
  port /*: number*/,
  endpoint /*: string*/,
  ssl /*: boolean*/
) {
  Events.EventEmitter.call(this);

  this._opened = false;
  this._readQueue = [];

  let proto = 'ws://';
  if (ssl) {
    proto = 'wss://';
  }

  this._ws = new WebSocket(proto + host + ':' + port + '/' + endpoint);
  this._ws.binaryType = 'arraybuffer';

  this._ws.onopen = this._handleOpen.bind(this);
  this._ws.onmessage = this._handleMessage.bind(this);
  this._ws.onerror = this._handleError.bind(this);
  this._ws.onclose = this._handleClose.bind(this);
}

WebsocketWrapper.prototype._handleOpen = function _handleOpen(evt /*: Event*/) {
  this.emit('open', evt);
  this.emit('connect', evt); // ADDED THIS
  this._opened = true;
  this._flushQueue();
};

WebsocketWrapper.prototype._flushQueue = function _flushQueue() {
  if (this._opened) {
    while (this._readQueue.length > 0) {
      this.emit('data', this._readQueue.shift());
    }
  }
};

WebsocketWrapper.prototype._flushQueue = function _flushQueue() {
  if (this._opened) {
    while (this._readQueue.length > 0) {
      this.emit('data', this._readQueue.shift());
    }
  }
};

WebsocketWrapper.prototype._handleMessage = function _handleMessage(evt /*: MessageEvent*/) {
  if (!(evt.data instanceof ArrayBuffer)) {
    throw new Error('Expected to receive ArrayBuffer from websocket');
  }
  if (!this._opened || this._readQueue.length > 0) {
    this._readQueue.push(Buffer.from(evt.data));
    this._flushQueue();
  } else {
    this.emit('data', Buffer.from(evt.data));
    this.dest.write(Buffer.from(evt.data));
  }
};

WebsocketWrapper.prototype._handleError = function _handleError(evt /*: Event*/) {
  console.log('error here', evt);
  return this.emit('error', evt);
};
WebsocketWrapper.prototype._handleClose = function _handleClose(evt /*: CloseEvent*/) {
  return this.emit('end', evt);
};

WebsocketWrapper.prototype.write = function write(data /*: Uint8Array*/) {
  return this._ws.send(data);
};
WebsocketWrapper.prototype.destroy = function destroy() {
  return this._ws.close();
};
WebsocketWrapper.prototype.end = function end() {
  return this._ws.close();
};

WebsocketWrapper.prototype.pipe = function pipe(dest) {
  this.dest = dest; // bad pipe function - we just set up dest (since pipe is only called once this works...)
};

// Not Implemented
WebsocketWrapper.prototype.pause = function pause() {};
WebsocketWrapper.prototype.resume = function resume() {};
WebsocketWrapper.prototype.setTimeout = function setTimeout() {};
