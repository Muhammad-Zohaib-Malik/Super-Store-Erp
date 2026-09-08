import dns from "node:dns";

// Configure public DNS resolvers first to prevent querySrv ECONNREFUSED
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Ignore in case restricted
}

import mongoose from "mongoose";
import Customer from "./src/models/customer.model.js";
import User from "./src/models/user.model.js";
import Role from "./src/models/role.model.js";

const superstoreCustomers = [
  {
    name: "Walk-in Retail Customer",
    phone: "03000000000",
    email: "walkin@superstore.com",
    address: "POS Checkout Counter 01, Superstore",
  },
  {
    name: "Hamza Tariq",
    phone: "03001122334",
    email: "hamza.tariq@gmail.com",
    address: "House 24, Street 8, Sector F-7/2, Islamabad",
  },
  {
    name: "Ayesha Malik",
    phone: "03215544332",
    email: "ayesha.malik@yahoo.com",
    address: "Apartment 4B, Silver Oaks, Sector F-10, Islamabad",
  },
  {
    name: "Muhammad Rizwan",
    phone: "03137788990",
    email: "rizwan.grocers@gmail.com",
    address: "Shop 15, Civic Center, Bahria Town, Rawalpindi",
  },
  {
    name: "Sara Khan",
    phone: "03339900112",
    email: "sara.khan@hotmail.com",
    address: "House 12, Street 3, Sector G-11/3, Islamabad",
  },
  {
    name: "Bilal Ahmed",
    phone: "03451234567",
    email: "bilal.ahmed99@gmail.com",
    address: "House 55, Block B, Gulberg III, Lahore",
  },
  {
    name: "Fatima Noor",
    phone: "03017766554",
    email: "fatima.noor@outlook.com",
    address: "B-12, Phase 5, DHA, Lahore",
  },
  {
    name: "Zain Ul Abideen",
    phone: "03154433221",
    email: "zain.abideen@gmail.com",
    address: "Street 4, Sector I-8/2, Islamabad",
  },
  {
    name: "Mariam Sohail",
    phone: "03228877665",
    email: "mariam.sohail@gmail.com",
    address: "House 89, Block C, Askari 10, Lahore",
  },
  {
    name: "Usman Ghani",
    phone: "03345566778",
    email: "usman.ghani@yahoo.com",
    address: "Commercial Market, Satellite Town, Rawalpindi",
  },
];

async function seedCustomers() {
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

    // Find or create an admin user for the required `createdBy` reference
    let systemUser = await User.findOne();
    if (!systemUser) {
      console.log(
        "No existing user found. Finding or creating Admin role & user...",
      );
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
        "✅ Created default Admin user for customer associations:",
        systemUser.email,
      );
    }

    console.log("\n--- Seeding Superstore Customers ---");
    let createdCount = 0;
    let updatedCount = 0;

    for (const cust of superstoreCustomers) {
      let existing = await Customer.findOne({ phone: cust.phone });

      if (!existing) {
        await Customer.create({
          ...cust,
          createdBy: systemUser._id,
        });
        console.log(
          `✅ Created customer: ${cust.name} | Phone: ${cust.phone} | Address: ${cust.address}`,
        );
        createdCount++;
      } else {
        existing.name = cust.name;
        existing.email = cust.email;
        existing.address = cust.address;
        existing.updatedBy = systemUser._id;
        await existing.save();
        console.log(
          `ℹ️ Updated existing customer: ${cust.name} (${cust.phone})`,
        );
        updatedCount++;
      }
    }

    console.log(
      `\n🎉 Customer seeding completed! Created: ${createdCount}, Updated: ${updatedCount}`,
    );
  } catch (error) {
    console.error("❌ Customer seeding failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
    process.exit(0);
  }
}

seedCustomers();
