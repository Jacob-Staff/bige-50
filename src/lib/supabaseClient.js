import { createClient } from '@supabase/supabase-js'

// We are hardcoding the URL you gave me earlier to bypass the .env error
const supabaseUrl = 'https://vdeilevfstruwvssqjuq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZWlsZXZmc3RydXd2c3NxanVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTk0NjIsImV4cCI6MjA4Mzg5NTQ2Mn0.LM-oPK4DdIhjb1qO_KDFNhEtRi9giuxu9TxaWYSsqK8' // 👈 Paste your long key here

export const supabase = createClient(supabaseUrl, supabaseKey)