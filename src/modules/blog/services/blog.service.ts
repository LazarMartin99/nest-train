import { Injectable, BadRequestException, ConflictException, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost } from '../entities/post.entity';
import { CreatePostDto } from '../dto/create.post.dto';
import { UpdatePostDto } from '../dto/update.post.dto';
import { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class BlogService{
    constructor(
        @InjectRepository(BlogPost)
        private blogPostRepository: Repository<BlogPost>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
      ) {}

    async create(createPostDto: CreatePostDto, userId: number)
    {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
          throw new NotFoundException('User not found');
        }

        //Title uniqueness check
        const existingPost = await this.findByTitle(createPostDto.title);

        if(existingPost)
        {
            throw new ConflictException('Title is already exists!');
        }

        const blogPost = this.blogPostRepository.create({
            ...createPostDto,
            author: user
        });
        return this.blogPostRepository.save(blogPost);
    }

    async findByTitle(title: string)
    {
        return this.blogPostRepository.findOne({where: {title}});
    }

    async findAll()
    {
        return this.blogPostRepository.find({
            relations: ['author'],
            select: ['id', 'title', 'content', 'published', 'createdAt']
        });
    }

    async findOne(id: number)
    {
        const blogPost = await this.blogPostRepository.findOneBy({id});

        if(!blogPost)
        {
            throw new NotFoundException('Blogpost not found!');
        }

        return blogPost;
    }

    async update(id:number, updateUserDto: UpdatePostDto)
    {
        const blogPost = await this.findOne(id);
        await this.blogPostRepository.update(id, updateUserDto);
        return this.findOne(id);
    }

    async remove(id:number)
    {
        const blogPost = await this.findOne(id);
        return this.blogPostRepository.remove(blogPost);
    }

}
