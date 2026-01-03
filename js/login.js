// js/login.js

document.addEventListener("DOMContentLoaded", async () => {
  const waitForSupabase = () =>
    new Promise((resolve) => {
      const check = () => {
        if (window.supabaseClient) resolve(window.supabaseClient);
        else setTimeout(check, 50);
      };
      check();
    });

  const supabase = await waitForSupabase();

  const form = document.getElementById("login-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    // Redirect on success
    window.location.href = "dashboard.html";
  });
});
