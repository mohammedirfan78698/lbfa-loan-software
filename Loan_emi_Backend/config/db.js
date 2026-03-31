import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ Mongo Connected");
    console.log("📂 Database Name:", conn.connection.name);
    console.log("🔗 Full URI:", process.env.MONGO_URI);

  } catch (error) {
    console.error("DB Error:", error);
    process.exit(1);
  }
};

export default connectDB;
