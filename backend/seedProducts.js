import dns from "node:dns";

// Configure public DNS resolvers first to prevent querySrv ECONNREFUSED
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Ignore in case restricted
}

import mongoose from "mongoose";
import Product from "./src/models/product.model.js";
import Supplier from "./src/models/supplier.model.js";
import User from "./src/models/user.model.js";
import Role from "./src/models/role.model.js";

const sampleProducts = [
  // --- Groceries ---
  {
    name: "Basmati Super Kernel Rice 5kg",
    sku: "GROC-RICE-5KG",
    description: "Aged long grain premium fragrant basmati rice",
    category: "Groceries",
    unit: "Kilogram (kg)",
    costPrice: 1800,
    sellingPrice: 2200,
    supplierKeyword: "Shan & National",
  },
  {
    name: "Mezan Canola Cooking Oil 5L Tin",
    sku: "GROC-MEZ-5L",
    description: "Triple refined canola oil with vitamins A, D and E",
    category: "Groceries",
    unit: "Liter (L)",
    costPrice: 2450,
    sellingPrice: 2850,
    supplierKeyword: "Mezan & Habib",
  },
  {
    name: "Dal Chana Premium 1kg",
    sku: "GROC-DAL-1KG",
    description: "Clean sorted yellow split chickpeas pulse",
    category: "Groceries",
    unit: "Kilogram (kg)",
    costPrice: 230,
    sellingPrice: 280,
    supplierKeyword: "Shan & National",
  },
  {
    name: "National Iodized Himalayan Pink Salt 800g",
    sku: "GROC-SALT-800G",
    description: "Pure mineral rich iodized pink table salt",
    category: "Groceries",
    unit: "Piece",
    costPrice: 85,
    sellingPrice: 110,
    supplierKeyword: "Shan & National",
  },
  {
    name: "Shan Special Bombay Biryani Masala 50g",
    sku: "GROC-SHAN-BIR",
    description: "Authentic recipe mix for aromatic Bombay biryani",
    category: "Groceries",
    unit: "Piece",
    costPrice: 115,
    sellingPrice: 145,
    supplierKeyword: "Shan & National",
  },
  {
    name: "White Refined Granulated Sugar 1kg",
    sku: "GROC-SUGAR-1KG",
    description: "Triple refined sweet white table sugar",
    category: "Groceries",
    unit: "Kilogram (kg)",
    costPrice: 140,
    sellingPrice: 165,
    supplierKeyword: "Shan & National",
  },

  // --- Dairy & Eggs ---
  {
    name: "Nestlé MilkPak UHT Milk 1L",
    sku: "DAIRY-MILK-1L",
    description: "Pure standardized 100% wholesome dairy milk",
    category: "Dairy & Eggs",
    unit: "Liter (L)",
    costPrice: 275,
    sellingPrice: 310,
    supplierKeyword: "Nestlé",
  },
  {
    name: "Olper's Full Cream Milk 1L",
    sku: "DAIRY-OLP-1L",
    description: "Rich and creamy wholesome full cream UHT milk",
    category: "Dairy & Eggs",
    unit: "Liter (L)",
    costPrice: 280,
    sellingPrice: 315,
    supplierKeyword: "Engro Foods",
  },
  {
    name: "Farm Fresh Large Brown Eggs (Tray 30s)",
    sku: "DAIRY-EGG-30S",
    description: "Freshly collected organic graded brown eggs",
    category: "Dairy & Eggs",
    unit: "Box",
    costPrice: 660,
    sellingPrice: 780,
    supplierKeyword: "Engro Foods",
  },
  {
    name: "Adams Pure Cheddar Cheese Slices 200g",
    sku: "DAIRY-CHED-200G",
    description: "Rich creamy cheddar cheese slices for burgers and toast",
    category: "Dairy & Eggs",
    unit: "Piece",
    costPrice: 540,
    sellingPrice: 650,
    supplierKeyword: "Engro Foods",
  },
  {
    name: "Nurpur Pure Dairy Butter 200g",
    sku: "DAIRY-BUT-200G",
    description: "Traditional salted pure pasteurized milk butter",
    category: "Dairy & Eggs",
    unit: "Piece",
    costPrice: 390,
    sellingPrice: 460,
    supplierKeyword: "Engro Foods",
  },

  // --- Bakery ---
  {
    name: "Dawn Plain White Sandwich Bread Large",
    sku: "BAKE-BRD-LRG",
    description: "Soft fresh sliced white loaf bread for breakfast",
    category: "Bakery",
    unit: "Piece",
    costPrice: 180,
    sellingPrice: 220,
    supplierKeyword: "Dawn Fresh",
  },
  {
    name: "Dawn Crispy Sweet Tea Rusk 350g",
    sku: "BAKE-RUSK-350",
    description: "Traditional crispy double baked sweet tea rusk",
    category: "Bakery",
    unit: "Piece",
    costPrice: 160,
    sellingPrice: 195,
    supplierKeyword: "Dawn Fresh",
  },
  {
    name: "Dawn Jumbo Sesame Burger Buns (Pack of 4)",
    sku: "BAKE-BUN-4S",
    description: "Soft fluffy sesame sprinkled premium burger buns",
    category: "Bakery",
    unit: "Box",
    costPrice: 150,
    sellingPrice: 190,
    supplierKeyword: "Dawn Fresh",
  },

  // --- Frozen Foods ---
  {
    name: "K&N's Harabisa Chicken Nuggets 900g",
    sku: "FRZN-KN-NUG900",
    description: "Crispy crumb coated tender chicken breast nuggets",
    category: "Frozen Foods",
    unit: "Box",
    costPrice: 1550,
    sellingPrice: 1850,
    supplierKeyword: "K&N's",
  },
  {
    name: "K&N's Chicken Seekh Kabab 515g",
    sku: "FRZN-KN-KB515",
    description: "Flame grilled spiced minced chicken seekh kababs",
    category: "Frozen Foods",
    unit: "Box",
    costPrice: 1100,
    sellingPrice: 1350,
    supplierKeyword: "K&N's",
  },
  {
    name: "Dawn Crispy Potato French Fries 1kg",
    sku: "FRZN-DWN-FRIES",
    description: "Golden restaurant style pre-cut crispy potato fries",
    category: "Frozen Foods",
    unit: "Kilogram (kg)",
    costPrice: 720,
    sellingPrice: 890,
    supplierKeyword: "Dawn Fresh",
  },

  // --- Beverages ---
  {
    name: "Pepsi Cola 1.5L Bottle",
    sku: "BEV-PEP-15L",
    description: "Chilled sparkling carbonated cola soft drink",
    category: "Beverages",
    unit: "Piece",
    costPrice: 165,
    sellingPrice: 200,
    supplierKeyword: "PepsiCo",
  },
  {
    name: "Aquafina Purified Mineral Water 1.5L",
    sku: "BEV-AQUA-15L",
    description: "7-step reverse osmosis purified bottled drinking water",
    category: "Beverages",
    unit: "Piece",
    costPrice: 80,
    sellingPrice: 110,
    supplierKeyword: "PepsiCo",
  },
  {
    name: "Nestlé Fruita Vitals Chaunsa Mango Nectar 1L",
    sku: "BEV-NEST-MANGO",
    description: "Rich sweet Pakistani Chaunsa mango fruit nectar",
    category: "Beverages",
    unit: "Liter (L)",
    costPrice: 290,
    sellingPrice: 340,
    supplierKeyword: "Nestlé",
  },
  {
    name: "Tapal Danedar Black Tea 450g",
    sku: "BEV-TAPAL-450",
    description: "Strong aromatic blended premium black leaf tea",
    category: "Beverages",
    unit: "Piece",
    costPrice: 680,
    sellingPrice: 790,
    supplierKeyword: "Shan & National",
  },

  // --- Snacks ---
  {
    name: "Lay's French Cheese Potato Chips 65g",
    sku: "SNAK-LAYS-CHZ",
    description: "Crispy ridged potato crisps seasoned with French cheese",
    category: "Snacks",
    unit: "Piece",
    costPrice: 85,
    sellingPrice: 100,
    supplierKeyword: "PepsiCo",
  },
  {
    name: "Kurkure Chutney Chatpata 85g",
    sku: "SNAK-KURK-CHAT",
    description: "Spicy and tangy crispy crunchy corn puffs",
    category: "Snacks",
    unit: "Piece",
    costPrice: 85,
    sellingPrice: 100,
    supplierKeyword: "PepsiCo",
  },
  {
    name: "Cadbury Dairy Milk Chocolate Bar 70g",
    sku: "SNAK-CAD-70G",
    description: "Smooth creamy classic milk chocolate bar",
    category: "Snacks",
    unit: "Piece",
    costPrice: 190,
    sellingPrice: 230,
    supplierKeyword: "Nestlé",
  },

  // --- Household Essentials ---
  {
    name: "Surf Excel Quick Wash Detergent Powder 1kg",
    sku: "HOUS-SURF-1KG",
    description: "Tough stain removing fragrant laundry detergent powder",
    category: "Household Essentials",
    unit: "Kilogram (kg)",
    costPrice: 580,
    sellingPrice: 690,
    supplierKeyword: "Unilever",
  },
  {
    name: "Vim Concentrated Dishwashing Gel 500ml",
    sku: "HOUS-VIM-500",
    description: "Tough grease cutting lemon formula dishwashing liquid",
    category: "Household Essentials",
    unit: "ml",
    costPrice: 340,
    sellingPrice: 420,
    supplierKeyword: "Unilever",
  },

  // --- Health & Beauty ---
  {
    name: "Lifebuoy Total 10 Antibacterial Soap 115g",
    sku: "HLTH-LIFE-115",
    description: "Advanced formula active germ protection bath soap",
    category: "Health & Beauty",
    unit: "Piece",
    costPrice: 130,
    sellingPrice: 160,
    supplierKeyword: "Unilever",
  },
  {
    name: "Sunsilk Black Shine Shampoo 360ml",
    sku: "HLTH-SUNS-360",
    description: "Infused with Amla Pearl complex for shiny silky hair",
    category: "Health & Beauty",
    unit: "ml",
    costPrice: 590,
    sellingPrice: 720,
    supplierKeyword: "Unilever",
  },
  {
    name: "Colgate Total Pro-Clean Toothpaste 140g",
    sku: "HLTH-COLG-140",
    description: "12-hour antibacterial protection for teeth and gums",
    category: "Health & Beauty",
    unit: "Gram (g)",
    costPrice: 280,
    sellingPrice: 340,
    supplierKeyword: "Unilever",
  },

  // --- Baby Items ---
  {
    name: "Shield Soft & Gentle Baby Wet Wipes (Pack of 72)",
    sku: "BABY-WIPE-72",
    description: "Alcohol free moisturizing aloe vera gentle baby wipes",
    category: "Baby Items",
    unit: "Box",
    costPrice: 320,
    sellingPrice: 400,
    supplierKeyword: "Shield Baby",
  },
  {
    name: "Pampers Baby Dry Diapers Medium Size 3 (Pack of 46)",
    sku: "BABY-PAMP-M46",
    description: "Extra absorb channels for up to 12 hours dryness",
    category: "Baby Items",
    unit: "Box",
    costPrice: 2650,
    sellingPrice: 3100,
    supplierKeyword: "Shield Baby",
  },
];

async function seedProducts() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;

  if (!uri) {
    console.error(
      "❌ MONGODB_URI or MONGODB_URL is missing in environment variables.",
    );
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB Atlas with DNS resolver configured...");
    await mongoose.connect(uri);
    console.log("✅ MongoDB Connected Successfully:", mongoose.connection.host);

    // 1. Resolve Creator User
    let systemUser = await User.findOne();
    if (!systemUser) {
      console.log("No existing user found. Creating default Admin user...");
      let adminRole = await Role.findOne({ name: "Admin" });
      if (!adminRole) {
        adminRole = await Role.create({
          name: "Admin",
          description: "System Administrator",
          permissions: ["all"],
        });
      }

      systemUser = await User.create({
        name: "Admin",
        email: "admin@superstore.com",
        password: "adminpassword123",
        role: adminRole._id,
        permissions: ["all"],
      });
      console.log(
        "✅ Created Admin user for product associations:",
        systemUser.email,
      );
    }

    // 2. Fetch All Existing Suppliers
    const allSuppliers = await Supplier.find();
    if (allSuppliers.length === 0) {
      console.error(
        "❌ No suppliers found in the database. Please run seedSuppliers.js first!",
      );
      process.exit(1);
    }

    const defaultSupplier = allSuppliers[0];
    console.log(`Found ${allSuppliers.length} suppliers in database.`);

    console.log("\n--- Seeding Superstore Products ---");
    let createdCount = 0;
    let updatedCount = 0;

    for (const prod of sampleProducts) {
      // Find matching supplier by keyword, or fallback to default
      const matchedSupplier =
        allSuppliers.find((s) =>
          s.name.toLowerCase().includes(prod.supplierKeyword.toLowerCase()),
        ) || defaultSupplier;

      let existing = await Product.findOne({ sku: prod.sku });

      if (!existing) {
        await Product.create({
          name: prod.name,
          sku: prod.sku,
          description: prod.description,
          category: prod.category,
          unit: prod.unit,
          costPrice: prod.costPrice,
          sellingPrice: prod.sellingPrice,
          supplierId: matchedSupplier._id,
          createdBy: systemUser._id,
          isActive: true,
        });
        console.log(
          `✅ Created [${prod.category}] ${prod.name} | SKU: ${prod.sku} | Price: Rs. ${prod.sellingPrice}`,
        );
        createdCount++;
      } else {
        existing.name = prod.name;
        existing.description = prod.description;
        existing.category = prod.category;
        existing.unit = prod.unit;
        existing.costPrice = prod.costPrice;
        existing.sellingPrice = prod.sellingPrice;
        existing.supplierId = matchedSupplier._id;
        existing.updatedBy = systemUser._id;
        await existing.save();
        console.log(`ℹ️ Updated product: ${prod.name} (${prod.sku})`);
        updatedCount++;
      }
    }

    console.log(
      `\n🎉 Superstore products seeding completed! Created: ${createdCount}, Updated: ${updatedCount}`,
    );
  } catch (error) {
    console.error("❌ Product seeding failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
    process.exit(0);
  }
}

seedProducts();
