import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryService } from './services/category.service';
import { CategoryController } from './controllers/category.controller';
import { BlogController } from './controllers/blog.controller';
import { BlogAnalyzerService } from './services/blog.analyzer.service';
import { BlogService } from './services/blog.service';
import { BlogPost } from './entities/post.entity';
import { JwtModule } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from './guards/auth.guard';
import { Category } from './entities/category.enitity';

@Module({
    imports: [
      TypeOrmModule.forFeature([BlogPost, User, Category]),
      JwtModule.registerAsync({
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          secret: configService.get('JWT_SECRET'),
          signOptions: {
            expiresIn: '1h',
          },
        }),
        inject: [ConfigService],
      }),
    ],
    controllers: [BlogController, CategoryController],
    providers: [BlogService, CategoryService, BlogAnalyzerService, AuthGuard],
    exports: [BlogService, CategoryService],
  })
  export class BlogModule {}