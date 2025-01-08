import { IsString, IsBoolean, IsNumber } from 'class-validator';

export class CreatePostDto {
    @IsString()
    title: string;

    @IsString()
    content: string;

    @IsBoolean()
    published: boolean;

}