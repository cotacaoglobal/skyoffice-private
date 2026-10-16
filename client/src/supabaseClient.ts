import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qwnhaheojetsecmqrxea.supabase.co'
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3bmhhaGVvamV0c2VjbXFyeGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5OTYwNTIsImV4cCI6MjEwNzU3MjA1Mn0.RhqWnCJUKQkT-HLxcOtZUtGfrUC-IxtKnsd5NMkaIk4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
