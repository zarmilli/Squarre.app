// supabase.js
document.addEventListener("DOMContentLoaded", () => {
  const supabaseUrl = "https://suwiamrsjmbvhceqxchp.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1d2lhbXJzam1idmhjZXF4Y2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NDM4MDEsImV4cCI6MjA4MDUxOTgwMX0.4V8Ec8pvDYZyM0WYO3ePMa7yrHTuvbVdoCK9eYhH6zk";

  if (!window.supabase) {
    console.error("❌ Supabase library NOT loaded!");
    return;
  }

  // Create client
  window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

  console.log("✅ Supabase initialized:", window.supabaseClient);
});
