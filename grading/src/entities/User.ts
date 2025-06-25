import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: 'varchar', unique: true })
	username!: string;

	@Column({ type: 'varchar', nullable: true })
	nickname?: string;

	@Column({ type: 'varchar' })
	password_hash!: string;

	@Column({ type: 'varchar', nullable: true })
	avatar_url?: string;

	@Column({ type: 'varchar', nullable: true })
	qwen_api_key?: string;

	@Column({ type: 'varchar', nullable: true })
	siliconflow_api_key?: string;

	@CreateDateColumn()
	created_at!: Date;

	@UpdateDateColumn()
	updated_at!: Date;
}
