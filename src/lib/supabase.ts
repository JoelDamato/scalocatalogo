import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://erpmlplzdvesedkgbuzb.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycG1scGx6ZHZlc2Vka2didXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzOTMwNTksImV4cCI6MjA3Mzk2OTA1OX0.sXrmcf2HoY1R2yLGzWnSf6BQdMgL2fLG7XOlVuhRaAw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
