// js/signup.js

document.addEventListener("DOMContentLoaded", async () => {
  // Wait until Supabase client is available
  const waitForSupabase = () =>
    new Promise((resolve) => {
      const check = () => {
        if (window.supabaseClient) resolve(window.supabaseClient);
        else setTimeout(check, 50);
      };
      check();
    });

  const supabase = await waitForSupabase();

  const form = document.getElementById("signup-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const full_name = document.getElementById("full_name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;

    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }

    // Create account
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name }
      }
    });

    if (error) return alert(error.message);
    if (!data.user) return alert("Sign-up failed. Please try again.");

    const user = data.user;

    // Create profile entry
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        user_id: user.id,
        full_name,
        email,
        membership_tier: "free"
      });

    if (profileError) {
      console.error(profileError);
      alert("Account created but failed to set up your profile.");
      return;
    }

    alert("Account created successfully!");
    window.location.href = "dashboard.html";
  });
});
