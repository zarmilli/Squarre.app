document.addEventListener("DOMContentLoaded", async () => {
  const supabase = window.supabaseClient;
  if (!supabase) return;

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session) {
    window.location.href = "login.html";
    return;
  }

  const user = sessionData.session.user;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, membership_tier")
    .eq("user_id", user.id)
    .single();

  if (profile) {
    document.getElementById("user-name").textContent = profile.full_name;
    document.getElementById("membership-chip").textContent =
      profile.membership_tier;
  }

  const sitesContainer = document.getElementById("sites-container");

  const { data: sites } = await supabase
    .from("user_sites")
    .select("id, site_name, updated_at, is_published")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (!sites) return;

  sites.forEach(site => {
    const card = document.createElement("div");
    card.className = "site-card";

    const date = site.updated_at
      ? new Date(site.updated_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        })
      : "—";

    card.innerHTML = `
      <div class="site-name">${site.site_name}</div>
      <div class="site-meta">edited: ${date}</div>

      <div class="status-chip ${site.is_published ? "published" : ""}">
        ${site.is_published ? "Published" : "Not published"}
      </div>

      <button class="open-btn">Open editor</button>
    `;

    card.querySelector(".open-btn").onclick = () => {
      window.location.href = `editor.html?site=${site.id}`;
    };

    sitesContainer.appendChild(card);
  });

  document.getElementById("collapse-btn")?.addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("collapsed");
  });

  document.getElementById("logout-btn").onclick = async () => {
    await supabase.auth.signOut();
    window.location.href = "index.html";
  };
});
