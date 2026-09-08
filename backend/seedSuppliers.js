import dns from "node:dns";

// Configure public DNS resolvers first to prevent querySrv ECONNREFUSED
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Ignore in case restricted
}

import mongoose from "mongoose";
import Supplier from "./src/models/supplier.model.js";

const superstoreSuppliers = [
  {
    name: "Nestlé FMCG & Nutrition Distributors",
    personName: "Shahid Rafiq",
    email: "orders@nestle-distributors.pk",
    phone: "03008451234",
    address: "Plot 45, Quaid-e-Azam Industrial Estate, Lahore",
    isActive: true,
  },
  {
    name: "Engro Foods & Dairy Wholesale",
    personName: "Mian Kamran",
    email: "supply@engrofoods-wholesale.com",
    phone: "03219874561",
    address: "National Highway, Landhi Industrial Area, Karachi",
    isActive: true,
  },
  {
    name: "Shan & National Foods Spice Logistics",
    personName: "Zubair Hashmi",
    email: "zubair@shannational-supply.pk",
    phone: "03124567890",
    address: "Sector 23, Korangi Industrial Area, Karachi",
    isActive: true,
  },
  {
    name: "Dawn Fresh Bakery & Confectionery",
    personName: "Usman Tariq",
    email: "distribution@dawnbakery.pk",
    phone: "03335551234",
    address: "Industrial Triangle, Kahuta Road, Islamabad",
    isActive: true,
  },
  {
    name: "K&N's Poultry & Frozen Foods Supply",
    personName: "Adnan Qureshi",
    email: "coldchain@kns-poultrysupply.pk",
    phone: "03456789123",
    address: "Raiwind Road, Industrial Area, Lahore",
    isActive: true,
  },
  {
    name: "Unilever Household & Personal Care",
    personName: "Farhan Siddiqui",
    email: "farhan.fmcg@unilever-pk.com",
    phone: "03017778899",
    address: "Avari Plaza, Fatima Jinnah Road, Karachi",
    isActive: true,
  },
  {
    name: "Mezan & Habib Cooking Oil Distributors",
    personName: "Bilal Ahmad",
    email: "bilal@mezanoil-supply.pk",
    phone: "03159994433",
    address: "Main G.T. Road, Gujranwala",
    isActive: true,
  },
  {
    name: "PepsiCo & Snacks Beverages Hub",
    personName: "Khurram Shahzad",
    email: "orders@pepsico-fmcg.pk",
    phone: "03224445566",
    address: "Hattar Industrial Estate, Haripur, KPK",
    isActive: true,
  },
  {
    name: "Farm Fresh Produce & Fruits Co.",
    personName: "Abdul Rehman",
    email: "freshfarm@produce-hub.pk",
    phone: "03348889900",
    address: "Fruit & Vegetable Market, I-11, Islamabad",
    isActive: true,
  },
  {
    name: "Shield Baby Care & Hygiene Products",
    personName: "Asif Mehmood",
    email: "sales@shield-babycare.pk",
    phone: "03023332211",
    address: "S.I.T.E. Industrial Area, Karachi",
    isActive: true,
  },
];

async function seedSuppliers() {
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

    console.log("\n--- Seeding Superstore Suppliers ---");
    let createdCount = 0;
    let updatedCount = 0;

    for (const sup of superstoreSuppliers) {
      const existing = await Supplier.findOne({
        $or: [{ name: sup.name }, { email: sup.email }],
      });

      if (!existing) {
        await Supplier.create(sup);
        console.log(
          `✅ Created supplier: ${sup.name} | Phone: ${sup.phone} | Contact: ${sup.personName}`,
        );
        createdCount++;
      } else {
        existing.personName = sup.personName;
        existing.phone = sup.phone;
        existing.address = sup.address;
        existing.isActive = sup.isActive;
        await existing.save();
        console.log(`ℹ️ Updated existing supplier: ${sup.name}`);
        updatedCount++;
      }
    }

    console.log(
      `\n🎉 Superstore supplier seeding completed! Created: ${createdCount}, Updated: ${updatedCount}`,
    );
  } catch (error) {
    console.error("❌ Supplier seeding failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
    process.exit(0);
  }
}

seedSuppliers();
