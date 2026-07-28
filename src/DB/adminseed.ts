import bcrypt from "bcrypt";
import { closePool } from "./client.js";
import { createAdminAccount, findAdminByEmail } from "./admin.js";

const SALT_ROUNDS = 12;

async function run(): Promise<void> {
  const email =
    process.env.SEED_SUPERADMIN_EMAIL ?? process.env.SUPERADMIN_EMAIL;
  const password =
    process.env.SEED_SUPERADMIN_PASSWORD ?? process.env.SUPERADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set SEED_SUPERADMIN_EMAIL and SEED_SUPERADMIN_PASSWORD before running the seed",
    );
  }

  const existing = await findAdminByEmail(email);

  if (existing) {
    console.log("Superadmin already exists.");
    return;
  }

  const passwordHashed = await bcrypt.hash(password, SALT_ROUNDS);

  await createAdminAccount({
    email,
    passwordHashed,
    role: "superadmin",
  });

  console.log("Superadmin created.");
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
