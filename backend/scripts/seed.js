const { sequelize, YarnBrand, YarnLine, PatternCategory, PatternDesigner } = require('../models');
const { logger } = require('../middleware/errorHandler');
require('dotenv').config();

// Sample data for seeding
const sampleBrands = [
  { name: 'Bernat', manufacturer: 'Spinrite', website: 'https://www.bernat.com' },
  { name: 'Red Heart', manufacturer: 'Coats & Clark', website: 'https://www.redheart.com' },
  { name: 'Lion Brand', manufacturer: 'Lion Brand Yarn Company', website: 'https://www.lionbrand.com' },
  { name: 'Patons', manufacturer: 'Spinrite', website: 'https://www.patons.com' },
  { name: 'Caron', manufacturer: 'Spinrite', website: 'https://www.caron.com' },
  { name: 'Cascade Yarns', manufacturer: 'Cascade Yarns', website: 'https://www.cascadeyarns.com' },
  { name: 'Malabrigo', manufacturer: 'Malabrigo Yarn', website: 'https://malabrigoyarn.com' },
  { name: 'Debbie Bliss', manufacturer: 'Designer Yarns', website: 'https://www.debbieblissonline.com' }
];

const sampleYarnLines = [
  { brand: 'Bernat', name: 'Super Value', fiber_content: '100% Acrylic', weight_category: 'Worsted', weight_grams: 141, yardage_per_skein: 426 },
  { brand: 'Red Heart', name: 'Super Saver', fiber_content: '100% Acrylic', weight_category: 'Worsted', weight_grams: 141, yardage_per_skein: 364 },
  { brand: 'Lion Brand', name: 'Wool-Ease', fiber_content: '80% Acrylic, 20% Wool', weight_category: 'Worsted', weight_grams: 85, yardage_per_skein: 197 },
  { brand: 'Patons', name: 'Classic Wool', fiber_content: '100% Wool', weight_category: 'Worsted', weight_grams: 100, yardage_per_skein: 210 },
  { brand: 'Caron', name: 'Simply Soft', fiber_content: '100% Acrylic', weight_category: 'Worsted', weight_grams: 141, yardage_per_skein: 315 },
  { brand: 'Cascade Yarns', name: '220 Wool', fiber_content: '100% Wool', weight_category: 'Worsted', weight_grams: 100, yardage_per_skein: 220 },
  { brand: 'Malabrigo', name: 'Worsted', fiber_content: '100% Merino Wool', weight_category: 'Worsted', weight_grams: 100, yardage_per_skein: 210 },
  { brand: 'Debbie Bliss', name: 'Baby Cashmerino', fiber_content: '55% Merino Wool, 33% Microfiber, 12% Cashmere', weight_category: 'Sport', weight_grams: 50, yardage_per_skein: 137 }
];

const sampleCategories = [
  { name: 'Sweaters', icon: 'sweater', sort_order: 1 },
  { name: 'Cardigans', icon: 'cardigan', sort_order: 2 },
  { name: 'Hats', icon: 'hat', sort_order: 3 },
  { name: 'Scarves', icon: 'scarf', sort_order: 4 },
  { name: 'Mittens & Gloves', icon: 'gloves', sort_order: 5 },
  { name: 'Socks', icon: 'socks', sort_order: 6 },
  { name: 'Shawls', icon: 'shawl', sort_order: 7 },
  { name: 'Blankets', icon: 'blanket', sort_order: 8 },
  { name: 'Baby Items', icon: 'baby', sort_order: 9 },
  { name: 'Toys', icon: 'toy', sort_order: 10 },
  { name: 'Home Decor', icon: 'home', sort_order: 11 },
  { name: 'Bags & Purses', icon: 'bag', sort_order: 12 }
];

const sampleDesigners = [
  { name: 'Norah Gaughan', website: 'https://www.norahgaughan.com' },
  { name: 'Ysolda Teague', website: 'https://www.ysolda.com' },
  { name: 'Joji Locatelli', website: 'https://www.jojilocatelli.com' },
  { name: 'Andrea Mowry', website: 'https://dreareneeknits.com' },
  { name: 'Stephen West', website: 'https://www.westknits.com' },
  { name: 'Isabell Kraemer', website: 'https://isabellkraemer.com' },
  { name: 'Martin Storey', website: 'https://www.martinstorey.com' },
  { name: 'Debbie Bliss', website: 'https://www.debbieblissonline.com' }
];

async function seedDatabase() {
  try {
    logger.info('🌱 Starting database seeding...');
    
    // Connect to database
    await sequelize.authenticate();
    logger.info('✅ Database connection established');

    // Seed yarn brands
    logger.info('🏷️ Seeding yarn brands...');
    for (const brandData of sampleBrands) {
      await YarnBrand.findOrCreate({
        where: { name: brandData.name },
        defaults: brandData
      });
    }
    logger.info(`✅ Seeded ${sampleBrands.length} yarn brands`);

    // Seed yarn lines
    logger.info('🧶 Seeding yarn lines...');
    for (const lineData of sampleYarnLines) {
      const brand = await YarnBrand.findOne({ where: { name: lineData.brand } });
      if (brand) {
        await YarnLine.findOrCreate({
          where: { name: lineData.name, brand_id: brand.id },
          defaults: {
            ...lineData,
            brand_id: brand.id
          }
        });
      }
    }
    logger.info(`✅ Seeded ${sampleYarnLines.length} yarn lines`);

    // Seed pattern categories
    logger.info('📁 Seeding pattern categories...');
    for (const categoryData of sampleCategories) {
      await PatternCategory.findOrCreate({
        where: { name: categoryData.name },
        defaults: categoryData
      });
    }
    logger.info(`✅ Seeded ${sampleCategories.length} pattern categories`);

    // Seed pattern designers
    logger.info('👨‍🎨 Seeding pattern designers...');
    for (const designerData of sampleDesigners) {
      await PatternDesigner.findOrCreate({
        where: { name: designerData.name },
        defaults: designerData
      });
    }
    logger.info(`✅ Seeded ${sampleDesigners.length} pattern designers`);

    logger.info('🎉 Database seeding completed successfully!');
    
    // Display summary
    const brandCount = await YarnBrand.count();
    const lineCount = await YarnLine.count();
    const categoryCount = await PatternCategory.count();
    const designerCount = await PatternDesigner.count();
    
    logger.info('📊 Database summary:');
    logger.info(`   - Yarn brands: ${brandCount}`);
    logger.info(`   - Yarn lines: ${lineCount}`);
    logger.info(`   - Pattern categories: ${categoryCount}`);
    logger.info(`   - Pattern designers: ${designerCount}`);

  } catch (error) {
    logger.error('❌ Seeding failed:', error);
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
Usage: npm run seed [options]

Options:
  --help, -h     Show this help message
  --clear        Clear existing data before seeding (DESTRUCTIVE)

Examples:
  npm run seed
  npm run seed -- --clear
  `);
  process.exit(0);
}

if (args.includes('--clear')) {
  logger.warn('⚠️  CLEAR MODE: This will remove existing sample data!');
  // Add clearing logic here if needed
}

seedDatabase();