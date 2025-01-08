import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ResetPasswordDto } from '../dto/password-reset.dto';
import { MailService } from '../../mail/mail.service';

@Controller('users')
export class UsersController {

  constructor(
    private usersService: UsersService,
    private mailService: MailService
  ) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.usersService.remove(id);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    const resetToken = await this.usersService.createPasswordResetToken(email);
    await this.mailService.sendPasswordReset(email, resetToken);
    
    return { message: 'Reset instructions sent to email' };
  }
  
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.usersService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
    
    return { message: 'Password successfully reset' };
  }

}