import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('WebSocketGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): void {
    this.logger.log(`Message from ${client.id}: ${JSON.stringify(data)}`);
    client.emit('message', { received: true, data });
  }

  @SubscribeMessage('broadcast')
  handleBroadcast(@MessageBody() data: any): void {
    this.server.emit('broadcast', data);
  }

  // Метод для отправки сообщения всем клиентам из других сервисов
  sendToAll(event: string, data: any): void {
    this.server.emit(event, data);
  }

  // Метод для отправки сообщения конкретному клиенту
  sendToClient(clientId: string, event: string, data: any): void {
    this.server.to(clientId).emit(event, data);
  }
}
