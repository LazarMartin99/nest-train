import { Entity, PrimaryGeneratedColumn, Column, OneToMany  } from "typeorm"
import { BlogPost } from "../../blog/entities/post.entity"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    username: string;

    @Column({ length: 255, unique: true })
    email: string;

    @Column()
    password: string;

    @Column({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ nullable: true })
    passwordResetToken: string;

    @Column({ nullable: true })
    passwordResetExpires: Date;

    @OneToMany(() => BlogPost, post => post.author)
    posts: BlogPost[];
}