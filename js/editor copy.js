// js/editor.js

document.addEventListener("DOMContentLoaded", async () => {
  const supabase = window.supabaseClient;

  if (!supabase) {
    console.error("Supabase client not initialized");
    return;
  }

  /* ─────────────────────────────
     1️⃣ AUTH CHECK
  ───────────────────────────── */
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session) {
    window.location.href = "login.html";
    return;
  }

  const user = sessionData.session.user;

  /* ─────────────────────────────
     2️⃣ URL PARAMS
  ───────────────────────────── */
  const params = new URLSearchParams(window.location.search);
  const siteId = params.get("site");

  if (!siteId) {
    console.error("Missing site ID");
    return;
  }

  /* ─────────────────────────────
     3️⃣ LOAD SITE
  ───────────────────────────── */
  const { data: site, error: siteError } = await supabase
    .from("user_sites")
    .select("site_name, template_id")
    .eq("id", siteId)
    .eq("user_id", user.id)
    .single();

  if (siteError || !site) {
    console.error("Failed to load site:", siteError);
    return;
  }

  document.getElementById("site-name").textContent = site.site_name;

  /* ─────────────────────────────
     4️⃣ RESOLVE TEMPLATE SLUG
  ───────────────────────────── */
  const { data: template, error: templateError } = await supabase
    .from("templates")
    .select("template_slug")
    .eq("id", site.template_id)
    .single();

  if (templateError || !template?.template_slug) {
    console.error("Failed to resolve template slug:", templateError);
    return;
  }

  const templateSlug = template.template_slug;

  /* ─────────────────────────────
     5️⃣ LOAD TEMPLATE
  ───────────────────────────── */
  loadTemplate(templateSlug);

  /* ─────────────────────────────
   6️⃣ LOAD EDITABLES + BUILD UI
      ───────────────────────────── */
      try {
        const editables = await loadEditables(templateSlug);
        buildAccordion(editables);
      } catch (err) {
        console.error("Failed to load editables:", err);
      }

  /* ─────────────────────────────
     7️⃣ ACTIONS
  ───────────────────────────── */
  const backBtn = document.getElementById("back-btn");
  const saveBtn = document.getElementById("save-btn");
  const publishBtn = document.getElementById("publish-btn");

  if (backBtn) {
    backBtn.onclick = async () => {
      await persist(siteId);
      window.location.href = "dashboard.html";
    };
  }

  if (saveBtn) {
    saveBtn.onclick = async () => {
      await persist(siteId);
      alert("Saved");
    };
  }

  if (publishBtn) {
    publishBtn.onclick = async () => {
      await persist(siteId, true);
      alert("Published");
    };
  }
});

/* ─────────────────────────────
   LOAD TEMPLATE
───────────────────────────── */
function loadTemplate(templateSlug) {
  const iframe = document.getElementById("site-preview");
  iframe.src = `/public/templates/${templateSlug}/index.html`;
}

/* ─────────────────────────────
   LOAD EDITABLES.JSON
───────────────────────────── */
async function loadEditables(templateSlug) {
  const res = await fetch(
    `/public/templates/${templateSlug}/editables.json`
  );

  if (!res.ok) {
    throw new Error("editables.json not found");
  }

  return await res.json();
}


/* ─────────────────────────────
   ACCORDION UI
───────────────────────────── */
function buildAccordion(editables) {
  const container = document.getElementById("editor-fields");
  container.innerHTML = "";

  Object.entries(editables).forEach(([fieldKey, field]) => {
    const acc = document.createElement("div");
    acc.className = "accordion";

    acc.innerHTML = `
      <div class="accordion-header">
        <span>${field.label}</span>
      </div>
      <div class="accordion-body"></div>
    `;

    const body = acc.querySelector(".accordion-body");

    // ── FIELD TYPES ───────────────────
    switch (field.type) {
      case "text": {
        const input = document.createElement("input");
        input.className = "input";
        input.dataset.field = fieldKey;
        body.appendChild(input);
        break;
      }

      case "longtext": {
        const textarea = document.createElement("textarea");
        textarea.className = "textarea";
        textarea.rows = 4;
        textarea.dataset.field = fieldKey;
        body.appendChild(textarea);
        break;
      }

      case "image":
      case "file": {
        body.innerHTML = `
          <div class="upload-box">
            <p>${field.label}</p>
          </div>
        `;
        break;
      }

      case "boolean": {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.dataset.field = fieldKey;
        body.appendChild(checkbox);
        break;
      }

      case "repeat": {
        const repeatBox = document.createElement("div");
        repeatBox.className = "repeat-group";
        repeatBox.dataset.field = fieldKey;

        Object.entries(field.fields).forEach(([subKey, subField]) => {
          const input = document.createElement("input");
          input.placeholder = subField.label;
          input.dataset.field = `${fieldKey}.${subKey}`;
          repeatBox.appendChild(input);
        });

        body.appendChild(repeatBox);
        break;
      }
    }

    acc.querySelector(".accordion-header").onclick = () => {
      acc.classList.toggle("open");
    };

    container.appendChild(acc);
  });
}


/* ─────────────────────────────
   SAVE
───────────────────────────── */
async function persist(siteId, publish = false) {
  const supabase = window.supabaseClient;

  await supabase
    .from("user_sites")
    .update({
      updated_at: new Date().toISOString(),
      ...(publish && { is_published: true })
    })
    .eq("id", siteId);
}
