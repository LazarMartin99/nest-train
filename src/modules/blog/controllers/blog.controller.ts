import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, UseGuards, Req } from '@nestjs/common';
import { BlogService } from '../services/blog.service';
import { CreatePostDto } from '../dto/create.post.dto';
import { UpdatePostDto } from '../dto/update.post.dto';
import { AuthGuard } from '../guards/auth.guard';


@Controller('Blog')
@UseGuards(AuthGuard)
export class BlogController{
    constructor(
        private BlogSerivce: BlogService,
    ){}

    @Post()
    @HttpCode(201)  // Helyes HTTP státuszkód
    create(@Body() CreatePostDto: CreatePostDto, @Req() req){
      console.log('Request body:', CreatePostDto);  // Ellenőrizzük a bejövő adatokat
      console.log('User ID from token:', req.user.sub);  // Ellenőrizzük a user ID-t
        return this.BlogSerivce.create(CreatePostDto, req.user.sub);
    }

    @Get()
    findAll() {
      return this.BlogSerivce.findAll();
    }
  
    @Get(':id')
    findOne(@Param('id') id: number) {
      return this.BlogSerivce.findOne(id);
    }
  
    @Put(':id')
    update(@Param('id') id: number, @Body() updatePostDto: UpdatePostDto) {
      return this.BlogSerivce.update(id, updatePostDto);
    }
  
    @Delete(':id')
    remove(@Param('id') id: number) {
      return this.BlogSerivce.remove(id);
    }

}
