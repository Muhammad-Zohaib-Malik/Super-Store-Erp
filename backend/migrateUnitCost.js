import dns from "node:dns";

// Configure public DNS resolvers first to prevent querySrv ECONNREFUSED
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Ignore in case restricted
}

import mongoose from "mongoose";
import Sale from "./src/models/sale.model.js";
import Product from "./src/models/product.model.js";

const migrateUnitCost = async () => {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    console.log("Fetching all sales...");
    const sales = await Sale.find();
    console.log(`Found ${sales.length} sales to process.`);

    let updatedCount = 0;

    for (const sale of sales) {
      let needsUpdate = false;

      for (const item of sale.items) {
        // If unitCost is not set or is 0
        if (!item.unitCost || item.unitCost === 0) {
          const product = await Product.findById(item.productId);

          item.unitCost = product && product.costPrice ? product.costPrice : 0;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        // Use markModified since we are mutating an array of subdocuments
        sale.markModified("items");
        await sale.save();
        updatedCount++;
      }
    }

    console.log(`\n✅ Migration completed!`);
    console.log(`Updated ${updatedCount} sales with historical unitCost.`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
};

migrateUnitCost();
