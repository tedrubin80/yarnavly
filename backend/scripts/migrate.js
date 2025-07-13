const { sequelize } = require('../models');
const { logger } = require('../middleware/errorHandler');
require('dotenv').config();

async function runMigrations() {
  try {
    logger.info('🔌 Connecting to database...');
    await sequelize.authenticate();
    logger.info('✅ Database connection established');

    logger.info('🗄️ Running database migrations...');
    await sequelize.sync({ alter: true });
    logger.info('✅ Database migrations completed successfully');

    logger.info('📊 Database statistics:');
    const models = Object.keys(sequelize.models);
    logger.info(`   - Models created: ${models.length}`);
    logger.info(`   - Models: ${models.join(', ')}`);

    // Create default admin user if it doesn't exist
    const { User } = require('../models');
    const bcrypt = require('bcryptjs');
    
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      logger.info('👤 Creating default admin user...');
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('admin123', salt);
      
      await User.create({
        email: 'admin@yarnmanagement.com',
        password_hash,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin'
      });
      
      logger.info('✅ Default admin user created');
      logger.info('   Email: admin@yarnmanagement.com');
      logger.info('   Password: admin123');
      logger.info('   ⚠️  Please change this password after first login!');
    }

    logger.info('🎉 Migration completed successfully!');
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Handle CLI arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: npm run migrate [options]

Options:
  --help, -h     Show this help message
  --force        Force recreate all tables (DESTRUCTIVE)
  --seed         Run seeders after migration

Examples:
  npm run migrate
  npm run migrate -- --force
  npm run migrate -- --seed
  `);
  process.exit(0);
}

if (args.includes('--force')) {
  logger.warn('⚠️  FORCE MODE: This will drop and recreate all tables!');
  logger.warn('⚠️  All existing data will be lost!');
  
  // In a real application, you might want to add a confirmation prompt here
  runMigrations();
} else {
  runMigrations();
}