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

/**
 * Migration Script: Populate Supplier.products[] from existing Product.supplierId
 *
 * Before this change, each Product had a supplierId reference.
 * Now, each Supplier has a products[] array.
 * This script reads all products with a supplierId and adds them to the
 * corresponding supplier's products array with their existing costPrice.
 *
 * Run once: node migrateSupplierProducts.js
 */
async function migrate() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;

  if (!uri) {
    console.error(
      "❌ MONGODB_URI or MONGODB_URL is missing in environment variables.",
    );
    process.exit(1);
  }

  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("✅ Connected:", mongoose.connection.host);

    // 1. Load all products that have a supplierId set
    const products = await Product.find({ supplierId: { $exists: true, $ne: null } });
    console.log(`\n📦 Found ${products.length} products with a supplierId`);

    if (products.length === 0) {
      console.log("ℹ️  No products to migrate. Done.");
      return;
    }

    // 2. Group products by supplierId
    const supplierMap = new Map(); // supplierId (string) → [{ productId, costPrice, isAvailable }]
    for (const product of products) {
      const suppKey = product.supplierId.toString();
      if (!supplierMap.has(suppKey)) {
        supplierMap.set(suppKey, []);
      }
      supplierMap.get(suppKey).push({
        productId: product._id,
        costPrice: product.costPrice || 0,
        isAvailable: true,
      });
    }

    console.log(`\n🏢 Migrating products across ${supplierMap.size} suppliers...\n`);

    let totalAdded = 0;
    let totalSkipped = 0;

    // 3. For each supplier, merge products into their products[] array
    for (const [supplierId, newProducts] of supplierMap) {
      const supplier = await Supplier.findById(supplierId);
      if (!supplier) {
        console.warn(`  ⚠️  Supplier ${supplierId} not found — skipping ${newProducts.length} products`);
        totalSkipped += newProducts.length;
        continue;
      }

      // Get existing productIds already in supplier.products to avoid duplicates
      const existingProductIds = new Set(
        supplier.products.map((sp) => sp.productId.toString()),
      );

      const toAdd = newProducts.filter(
        (np) => !existingProductIds.has(np.productId.toString()),
      );
      const skipped = newProducts.length - toAdd.length;

      if (toAdd.length > 0) {
        supplier.products.push(...toAdd);
        await supplier.save();
        console.log(
          `  ✅ ${supplier.name}: added ${toAdd.length} product(s)${skipped > 0 ? `, skipped ${skipped} (already present)` : ""}`,
        );
        totalAdded += toAdd.length;
      } else {
        console.log(`  ℹ️  ${supplier.name}: all ${skipped} product(s) already present`);
      }
      totalSkipped += skipped;
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`   ✅ Products added to suppliers: ${totalAdded}`);
    console.log(`   ⏭️  Products already present (skipped): ${totalSkipped}`);
    console.log(
      "\n💡 Tip: You can now manage each supplier's product list and prices from the Suppliers page.",
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\nMongoDB connection closed.");
    process.exit(0);
  }
}

migrate();
