import mongoose from "mongoose";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

import User from "./src/models/user.model.js";
import Role from "./src/models/role.model.js";

class Database {
  constructor() {
    if (!Database.instance) {
      this.isConnected = false;
      Database.instance = this;
    }

    return Database.instance;
  }

  async connect() {
    if (this.isConnected) {
      console.log("Using existing database connection");
      return;
    }

    const uri = process.env.MONGODB_URI;

    if (typeof uri !== "string" || uri.trim().length === 0) {
      throw new Error(
        "MongoDB connection string is missing. Set MONGODB_URI in your .env file.",
      );
    }

    try {
      /*
       * First try the normal DNS resolver.
       */
      try {
        await mongoose.connect(uri);
      } catch (error) {
        const isSrvDnsError =
          error?.code === "ECONNREFUSED" && error?.syscall === "querySrv";

        if (!isSrvDnsError) {
          throw error;
        }

        console.log("Default DNS resolver refused SRV lookup.");

        /*
         * Use public DNS resolvers.
         */
        dns.setServers(["8.8.8.8", "1.1.1.1"]);

        console.log(
          "Retrying MongoDB connection using public DNS resolvers...",
        );

        /*
         * Retry MongoDB connection.
         */
        await mongoose.connect(uri);
      }

      this.isConnected = true;

      console.log("MongoDB Connected Successfully:", mongoose.connection.host);
    } catch (error) {
      console.error("MongoDB Database Connection Failed:", error);

      throw error;
    }
  }

  async seedDatabase() {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      let adminRole = await Role.findOne({ name: "Admin" });
      if (!adminRole) {
        adminRole = await Role.create({
          name: "Admin",
          description: "Full access to the ERP",
          permissions: ["*"],
        });
        console.log("✅ Created Admin role.");
      }

      console.log("\n--- Seeding Admin User ---");

      const adminEmail = "zohaibadmin@store.com";

      let adminUser = await User.findOne({
        email: adminEmail,
      });

      if (!adminUser) {
        await User.create({
          name: "Zohaib",
          email: adminEmail,
          password: "zohaib123",
          role: adminRole._id,
        });

        console.log("✅ Admin user created successfully!");
      } else {
        adminUser.role = adminRole._id;
        await adminUser.save();

        console.log("ℹ️ Admin user already exists, updated role.");
      }

      console.log("\n🎉 Database seeding completed successfully!");
    } catch (error) {
      console.error("❌ Database seeding failed:", error);

      throw error;
    }
  }

  async connectDB() {
    return this.connect();
  }

  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();

      this.isConnected = false;

      console.log("MongoDB Disconnected Successfully");
    } catch (error) {
      console.error("MongoDB Disconnection Failed:", error);
    }
  }
}

const instance = new Database();

instance
  .seedDatabase()
  .then(async () => {
    await instance.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("❌ Error seeding database:", err);
    await instance.disconnect();
    process.exit(1);
  });

export default instance;
