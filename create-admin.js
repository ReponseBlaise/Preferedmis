const axios = require("axios");

const createAdmin = async () => {
  try {
    const response = await axios.post(
      "http://localhost:5000/api/auth/register-admin",
      {
        email: "admin@preferred.rw",
        password: "Admin@123",
        full_name: "Admin User",
        phone: "+250788000000",
        role: "manager",
      },
    );

    console.log("✅ Admin user created successfully!");
    console.log("User:", response.data.user);
    console.log("\nYou can now login with:");
    console.log("Email: admin@preferred.rw");
    console.log("Password: Admin@123");
  } catch (error) {
    console.error(
      "❌ Error creating admin:",
      error.response?.data || error.message,
    );
  }
};

createAdmin();
