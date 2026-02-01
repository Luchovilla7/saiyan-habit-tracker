
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vwbeqvvjwevnocepkllb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3YmVxdnZqd2V2bm9jZXBrbGxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODg1ODMsImV4cCI6MjA4NTQ2NDU4M30.VaXPEqOOaXxsBcuRiieAcQ8u_6AVhRXD0qJOVrN891o';

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
