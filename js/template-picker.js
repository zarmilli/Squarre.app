document.addEventListener("DOMContentLoaded", async () => {
  const supabase = window.supabaseClient;
  const grid = document.getElementById("template-grid");
  let templates = [];

  /* ─────────────────────────────
     1️⃣ FETCH USER + PLAN
  ───────────────────────────── */
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session) {
    window.location.href = "login.html";
    return;
  }

  const user = session.session.user;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("membership_tier")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    alert("Unable to load membership tier.");
    return;
  }

  const userPlan = profile.membership_tier; // free | basic | pro
  const planRank = { free: 1, basic: 2, pro: 3 };

  /* ─────────────────────────────
     2️⃣ FETCH TEMPLATES
  ───────────────────────────── */
  const { data, error } = await supabase
    .from("templates")
    .select("id, name, template_slug, category, availability, thumbnail_url, preview_url");

  if (error) {
    console.error("Error loading templates:", error);
    return;
  }

  // Sort: free templates first for free users
  templates = data.sort((a, b) => {
    if (userPlan === "free") {
      return planRank[a.availability] - planRank[b.availability];
    }
    return 0;
  });

  renderTemplates("all");

  /* ─────────────────────────────
     3️⃣ CATEGORY FILTERS
  ───────────────────────────── */
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document
        .querySelector(".filter-chip.active")
        ?.classList.remove("active");

      chip.classList.add("active");
      renderTemplates(chip.dataset.category);
    });
  });

  /* ─────────────────────────────
     4️⃣ RENDER GRID
  ───────────────────────────── */
  function renderTemplates(category) {
    grid.innerHTML = "";

    const filtered =
      category === "all"
        ? templates
        : templates.filter(t => t.category === category);

    filtered.forEach((t) => {
      const card = document.createElement("div");
      card.className = "template-card";

      card.innerHTML = `
        <h3>${t.name}</h3>

        <div class="thumbnail-wrapper">
          <img src="${t.thumbnail_url}" class="template-thumb">

          ${
            t.availability !== "free"
              ? `<div class="availability-chip">${t.availability}</div>`
              : ""
          }
        </div>

        <div class="btn-row">
          <button
            class="primary-btn"
            data-template-id="${t.id}"
            data-template-slug="${t.slug}"
            data-plan="${t.availability}">
            Choose Theme
          </button>

          <button
            class="secondary-btn"
            onclick="window.open('${t.preview_url}', '_blank')">
            Demo
          </button>
        </div>
      `;

      grid.appendChild(card);
    });

    bindChooseButtons();
  }

  /* ─────────────────────────────
     5️⃣ BIND CHOOSE BUTTONS
  ───────────────────────────── */
  function bindChooseButtons() {
    document.querySelectorAll(".primary-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const templateId = btn.dataset.templateId;
        const templateSlug = btn.dataset.templateSlug;
        const templatePlan = btn.dataset.plan;

        // Plan gate
        if (planRank[templatePlan] > planRank[userPlan]) {
          window.location.href = "pricing.html";
          return;
        }

        await createSite(templateId, templateSlug);
      });
    });
  }

  /* ─────────────────────────────
     6️⃣ CREATE SITE + REDIRECT
  ───────────────────────────── */
  async function createSite(templateId, templateSlug) {
    const siteName = localStorage.getItem("site_name_draft");

    if (!siteName) {
      alert("Site name not found. Please go back.");
      return;
    }

    const { data: created, error } = await supabase
      .from("user_sites")
      .insert({
        user_id: user.id,
        template_id: templateId, // ✅ CORRECT COLUMN
        site_name: siteName,
        is_published: false
      })
      .select()
      .single();

    if (error || !created) {
      console.error(error);
      alert("Failed to create site.");
      return;
    }

    // Cleanup draft
    localStorage.removeItem("site_name_draft");

    // Redirect → editor (slug used for local template loading)
    window.location.href =
      `editor.html?site=${created.id}&template=${templateSlug}`;
  }
});
