import { Injectable } from '@nestjs/common'
import axios from 'axios'

@Injectable()
export class WhatsappService {
  async sendMessage(phone: string, message: string, channelId: string = 'ee62907b-5a35-44ca-a6e1-e02a3d2ebb55'): Promise<any> {
    try {
      return await axios
        .post(
          'https://api.wazzup24.com/v3/message',
          {
            chatType: 'whatsapp',
            chatId: phone.replace('+', ''),
            text: message,
            channelId: channelId,
          },
          {
            headers: {
              'Authorization': 'Bearer ' + '08597f6db7504fa8a6dae6e52d8fc753',
              'Content-Type': 'application/json',
            },
          }
        )
        .then((data) => {
          if (data.data.messageId) {
            return {
              isSend: true,
              messageId: data.data.messageId,
            }
          }

          // console.log(data.data)

          return {
            isSend: false,
          }
        })
        .catch((err) => {
          // console.log(err.response.data)
          console.error('[!]' + ' whatsapp.sarvice ' + ' | ' + new Date() + ' | ' + '\n' + err.response.data)
          return {
            isSend: false,
          }
        })
    } catch (e) {
      console.error('[!]' + ' whatsapp.sarvice ' + ' | ' + new Date() + ' | ' + '\n' + e)
      return {
        isSend: false,
      }
    }
  }

  async sendImageWithContentUri(phone: string, contentUri: string): Promise<any> {
    try {
      return await axios
        .post(
          'https://api.wazzup24.com/v3/message',
          {
            chatType: 'whatsapp',
            chatId: phone.replace('+', ''),
            contentUri,
            channelId: '55381da7-c316-4f26-94d0-a88cff7373fe',
          },
          {
            headers: {
              'Authorization': 'Bearer ' + '08597f6db7504fa8a6dae6e52d8fc753',
              'Content-Type': 'application/json',
            },
          }
        )
        .then((data) => {
          if (data.data.messageId) {
            return {
              isSend: true,
              messageId: data.data.messageId,
            }
          }

          return {
            isSend: false,
          }
        })
        .catch((err) => {
          // console.log(err.response.data)
          console.log('[^]' + ' whatsapp.sarvice ' + ' | ' + new Date() + ' | ' + '\n' + err.response.data)
          return {
            isSend: false,
          }
        })
    } catch (e) {
      console.log('[^]' + ' whatsapp.sarvice ' + ' | ' + new Date() + ' | ' + '\n' + e)
      return {
        isSend: false,
      }
    }
  }
}
