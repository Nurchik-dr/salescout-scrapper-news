import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from '../user/schemas/user.schema';
import { PhoneCode, PhoneCodeSchema } from './schemas/phone-code.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    PassportModule,
    WhatsappModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: PhoneCode.name, schema: PhoneCodeSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'SECRET_KEY_HERE',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard, PassportModule, JwtModule],
})
export class AuthModule {}
