import { createClient } from '@supabase/supabase-js'

// Extract project reference from the backend URL pattern
const supabaseUrl = 'https://kqfhewdqqezpyynbxlcy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZmhld2RxcWV6cHl5bmJ4bGN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NDU4OTEsImV4cCI6MjA3MTUyMTg5MX0.HFU_haVNlwEnp-VoTzKuf6Mivd6nfYGsmJIdwywQaP8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)