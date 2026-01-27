import { defineEnv, z } from "nviron";
import "dotenv/config"

export const env = defineEnv({
  PORT: z.string().default(5004),
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  JWT_SECRET: z.string(),
})