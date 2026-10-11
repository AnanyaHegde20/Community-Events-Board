import bcrypt from "bcryptjs";

async function main() {
  const password = process.argv[2];

  if (!password) {
    console.error('Usage: npm run hash:password -- "your-admin-password"');
    process.exit(1);
  }

  const rounds = 10;
  const hash = await bcrypt.hash(password, rounds);
  // Next.js env parsing treats "$" as a variable reference, so escape each
  // "$" as "\$" for ADMIN_PASSWORD_HASH in .env.local.
  const escaped = hash.replace(/\$/g, "\\$");

  console.log(escaped);
  console.log("");
  console.log("Copy the line above into .env.local as ADMIN_PASSWORD_HASH=...");
  console.log("(The leading backslashes are required so Next.js reads the hash correctly.)");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to hash password: ${message}`);
  process.exitCode = 1;
});
