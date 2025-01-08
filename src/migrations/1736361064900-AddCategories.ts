import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategories1736361064900 implements MigrationInterface {
    name = 'AddCategories1736361064900'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Kategória tábla létrehozása
        await queryRunner.query(`CREATE TABLE \`category\` (
            \`id\` int NOT NULL AUTO_INCREMENT, 
            \`name\` varchar(100) NOT NULL, 
            \`description\` varchar(255) NULL, 
            \`isActive\` tinyint NOT NULL DEFAULT 1, 
            \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), 
            \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), 
            UNIQUE INDEX \`IDX_23c05c292c439d77b0de816b50\` (\`name\`), 
            PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB`);

        // Kapcsolótábla létrehozása
        await queryRunner.query(`CREATE TABLE \`blog_posts_categories\` (
            \`post_id\` int NOT NULL, 
            \`category_id\` int NOT NULL, 
            INDEX \`IDX_a2b76678db1607f0ea83149ea6\` (\`post_id\`), 
            INDEX \`IDX_b6eab84b4c3e20428c8c00782d\` (\`category_id\`), 
            PRIMARY KEY (\`post_id\`, \`category_id\`)
        ) ENGINE=InnoDB`);

        // Külső kulcs kapcsolatok hozzáadása
        await queryRunner.query(`ALTER TABLE \`blog_posts_categories\` 
            ADD CONSTRAINT \`FK_a2b76678db1607f0ea83149ea66\` 
            FOREIGN KEY (\`post_id\`) REFERENCES \`blog_post\`(\`id\`) 
            ON DELETE CASCADE ON UPDATE CASCADE`);

        await queryRunner.query(`ALTER TABLE \`blog_posts_categories\` 
            ADD CONSTRAINT \`FK_b6eab84b4c3e20428c8c00782d4\` 
            FOREIGN KEY (\`category_id\`) REFERENCES \`category\`(\`id\`) 
            ON DELETE CASCADE ON UPDATE CASCADE`);

        // Alapértelmezett kategóriák beszúrása
        await queryRunner.query(`
            INSERT INTO \`category\` (\`name\`, \`description\`) VALUES
            ('Technology', 'Posts about technology, programming, and software development'),
            ('Lifestyle', 'Posts about life, health, and wellness'),
            ('Business', 'Posts about business, entrepreneurship, and finance'),
            ('Science', 'Posts about scientific discoveries and research'),
            ('AI & ML', 'Articles about Artificial Intelligence and Machine Learning'),
            ('Web Development', 'Content related to web technologies and development'),
            ('Mobile Development', 'Posts about mobile app development'),
            ('Data Science', 'Articles about data analysis and science'),
            ('DevOps', 'Content about DevOps practices and tools'),
            ('Security', 'Posts about cybersecurity and information security')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`blog_posts_categories\` DROP FOREIGN KEY \`FK_b6eab84b4c3e20428c8c00782d4\``);
        await queryRunner.query(`ALTER TABLE \`blog_posts_categories\` DROP FOREIGN KEY \`FK_a2b76678db1607f0ea83149ea66\``);
        await queryRunner.query(`DROP INDEX \`IDX_b6eab84b4c3e20428c8c00782d\` ON \`blog_posts_categories\``);
        await queryRunner.query(`DROP INDEX \`IDX_a2b76678db1607f0ea83149ea6\` ON \`blog_posts_categories\``);
        await queryRunner.query(`DROP TABLE \`blog_posts_categories\``);
        await queryRunner.query(`DROP INDEX \`IDX_23c05c292c439d77b0de816b50\` ON \`category\``);
        await queryRunner.query(`DROP TABLE \`category\``);
    }
}