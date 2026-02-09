import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { isValidObjectId, Model, Types } from 'mongoose';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  async getProfileInfo(userId: string) {
    if (!isValidObjectId(userId)) {
      throw new UnauthorizedException()
    }

    const profile = await this.userModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(userId),
        },
      }
    ])

    if (profile.length === 0) {
      throw new UnauthorizedException()
    }

    return profile[0]
  }

  // async updateHotWord(userId: string, hotWord: string[]) {
//   if (!isValidObjectId(userId)) {
//     throw new UnauthorizedException();
//   }
//   const user = await this.userModel.findByIdAndUpdate(
//     userId,
//     { hotWord },
//     { new: true, runValidators: true }
//   );
//
//   if (!user) {
//     throw new NotFoundException('Пользователь не найден');
//   }
//
//   return {
//     success: true,
//     hotWord: user.hotWord,
//   };
// }
}
