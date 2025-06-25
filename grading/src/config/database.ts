import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import path from 'path';

export const AppDataSource = new DataSource({
	type: 'sqlite',
	database: path.join(__dirname, '../../database.db'),
	synchronize: true, // Auto-create tables (use with caution in production)
	logging: process.env.NODE_ENV === 'development',
	entities: [User],
	migrations: [],
	subscribers: [],
});

export default AppDataSource;
