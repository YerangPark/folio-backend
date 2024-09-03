import { MigrationInterface, QueryRunner } from "typeorm";

export class FolioMigration1725372272287 implements MigrationInterface {
    name = 'FolioMigration1725372272287'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`portfolio_skills\` DROP FOREIGN KEY \`portfolio_skills_ibfk_1\``);
        await queryRunner.query(`ALTER TABLE \`portfolio_skills\` DROP FOREIGN KEY \`portfolio_skills_ibfk_2\``);
        await queryRunner.query(`ALTER TABLE \`project_skills\` DROP FOREIGN KEY \`project_skills_ibfk_1\``);
        await queryRunner.query(`ALTER TABLE \`project_skills\` DROP FOREIGN KEY \`project_skills_ibfk_2\``);
        await queryRunner.query(`DROP INDEX \`portfolio_id\` ON \`portfolio_skills\``);
        await queryRunner.query(`DROP INDEX \`skill_id\` ON \`portfolio_skills\``);
        await queryRunner.query(`DROP INDEX \`project_id\` ON \`project_skills\``);
        await queryRunner.query(`DROP INDEX \`skill_id\` ON \`project_skills\``);
        await queryRunner.query(`ALTER TABLE \`portfolio_skills\` CHANGE \`portfolio_id\` \`portfolio_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`portfolio_skills\` CHANGE \`skill_id\` \`skill_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`project_skills\` CHANGE \`project_id\` \`project_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`project_skills\` CHANGE \`skill_id\` \`skill_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`portfolio_skills\` ADD CONSTRAINT \`FK_46f95c140ef72679a9a96d84ba4\` FOREIGN KEY (\`portfolio_id\`) REFERENCES \`portfolios\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`portfolio_skills\` ADD CONSTRAINT \`FK_e2e1b447ed0dc9e7a5170a17d26\` FOREIGN KEY (\`skill_id\`) REFERENCES \`skills\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`project_skills\` ADD CONSTRAINT \`FK_d28a809ea4c3e5d71a5679a33b4\` FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`project_skills\` ADD CONSTRAINT \`FK_903cd0ac4cc4681039d306c485e\` FOREIGN KEY (\`skill_id\`) REFERENCES \`skills\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`project_skills\` DROP FOREIGN KEY \`FK_903cd0ac4cc4681039d306c485e\``);
        await queryRunner.query(`ALTER TABLE \`project_skills\` DROP FOREIGN KEY \`FK_d28a809ea4c3e5d71a5679a33b4\``);
        await queryRunner.query(`ALTER TABLE \`portfolio_skills\` DROP FOREIGN KEY \`FK_e2e1b447ed0dc9e7a5170a17d26\``);
        await queryRunner.query(`ALTER TABLE \`portfolio_skills\` DROP FOREIGN KEY \`FK_46f95c140ef72679a9a96d84ba4\``);
        await queryRunner.query(`ALTER TABLE \`project_skills\` CHANGE \`skill_id\` \`skill_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`project_skills\` CHANGE \`project_id\` \`project_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`portfolio_skills\` CHANGE \`skill_id\` \`skill_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`portfolio_skills\` CHANGE \`portfolio_id\` \`portfolio_id\` int NULL`);
        await queryRunner.query(`CREATE INDEX \`skill_id\` ON \`project_skills\` (\`skill_id\`)`);
        await queryRunner.query(`CREATE INDEX \`project_id\` ON \`project_skills\` (\`project_id\`)`);
        await queryRunner.query(`CREATE INDEX \`skill_id\` ON \`portfolio_skills\` (\`skill_id\`)`);
        await queryRunner.query(`CREATE INDEX \`portfolio_id\` ON \`portfolio_skills\` (\`portfolio_id\`)`);
        await queryRunner.query(`ALTER TABLE \`project_skills\` ADD CONSTRAINT \`project_skills_ibfk_2\` FOREIGN KEY (\`skill_id\`) REFERENCES \`skills\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE \`project_skills\` ADD CONSTRAINT \`project_skills_ibfk_1\` FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE \`portfolio_skills\` ADD CONSTRAINT \`portfolio_skills_ibfk_2\` FOREIGN KEY (\`skill_id\`) REFERENCES \`skills\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE \`portfolio_skills\` ADD CONSTRAINT \`portfolio_skills_ibfk_1\` FOREIGN KEY (\`portfolio_id\`) REFERENCES \`portfolios\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT`);
    }

}
