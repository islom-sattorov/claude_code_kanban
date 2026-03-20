import { EventEmitter } from 'events';
import { Response } from 'express';

class SSEEmitter extends EventEmitter {
  private clients: Set<Response> = new Set();

  addClient(res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    // Send initial connection event
    this.sendToClient(res, { type: 'connected', payload: { message: 'SSE connected' } });

    this.clients.add(res);

    res.on('close', () => {
      this.clients.delete(res);
    });
  }

  private sendToClient(res: Response, data: unknown): void {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  broadcast(event: { type: string; payload: unknown }): void {
    const data = JSON.stringify(event);
    for (const client of this.clients) {
      client.write(`data: ${data}\n\n`);
    }
    this.emit(event.type, event.payload);
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const sseEmitter = new SSEEmitter();
