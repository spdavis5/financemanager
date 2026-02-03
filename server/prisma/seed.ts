import prisma from "../src/lib/prisma";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

async function main() {
  // Check if user already exists
  const existingUser = await prisma.user.findFirst();

  if (existingUser) {
    console.log("User already exists, skipping seed.");
    return;
  }

  // Create default user with hashed password
  const hashedPassword = await bcrypt.hash("babygirl123", SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      username: "spemily",
      password: hashedPassword,
    },
  });

  console.log(`Created user: ${user.username}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
