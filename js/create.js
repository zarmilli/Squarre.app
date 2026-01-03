document.addEventListener("DOMContentLoaded", async () => {
  const supabase = window.supabaseClient;

  if (!supabase) {
    console.error("Supabase not ready");
    return;
  }

  // 1️⃣ Redirect to login if user is not logged in
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    window.location.href = "login.html";
    return;
  }

  // 2️⃣ Handle form submission
  const form = document.getElementById("create-site-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const siteName = document.getElementById("site-name").value.trim();

    // Save to localStorage until final creation
    localStorage.setItem("site_name_draft", siteName);

    // Move to step 2 (template picker)
    window.location.href = "template-picker.html";
  });
});
