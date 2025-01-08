import { Injectable, NotFoundException, ConflictException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Category } from '../entities/category.enitity';
import { CreateCategoryDto } from '../dto/create.category.dto';
import { UpdateCategoryDto } from '../dto/update.category.dto';

@Injectable()
export class CategoryService {
    constructor(
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>
    ) {}

    async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
        const existingCategory = await this.categoryRepository.findOne({
            where: { name: createCategoryDto.name }
        });

        if (existingCategory) {
            throw new ConflictException('Category with this name already exists');
        }

        const category = this.categoryRepository.create(createCategoryDto);
        return this.categoryRepository.save(category);
    }

    async findAll(): Promise<Category[]> {
        return this.categoryRepository.find({
            where: { isActive: true },
            relations: ['posts'],
            select: ['id', 'name', 'description', 'createdAt']
        });
    }

    async findOne(id: number): Promise<Category> {
        const category = await this.categoryRepository.findOne({
            where: { id, isActive: true },
            relations: ['posts']
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        return category;
    }

    async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
        const category = await this.findOne(id);

        if (updateCategoryDto.name) {
            const existingCategory = await this.categoryRepository.findOne({
                where: { name: updateCategoryDto.name, id: Not(id) }
            });

            if (existingCategory) {
                throw new ConflictException('Category with this name already exists');
            }
        }

        await this.categoryRepository.update(id, updateCategoryDto);
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        const category = await this.findOne(id);
        await this.categoryRepository.update(id, { isActive: false });
    }

    async restore(id: number): Promise<Category> {
        const category = await this.categoryRepository.findOne({
            where: { id }
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        await this.categoryRepository.update(id, { isActive: true });
        return this.findOne(id);
    }
}