// js/editor.js

let SITE_CONTENT = {}; // ✅ Single source of truth

document.addEventListener("DOMContentLoaded", async () => {
  const supabase = window.supabaseClient;
  if (!supabase) return;

  /* ───────── AUTH ───────── */
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session) {
    window.location.href = "login.html";
    return;
  }

  const user = sessionData.session.user;

  /* ───────── PARAMS ───────── */
  const siteId = new URLSearchParams(window.location.search).get("site");
  if (!siteId) return;

  /* ───────── LOAD SITE ───────── */
  const { data: site } = await supabase
    .from("user_sites")
    .select("site_name, template_id, content")
    .eq("id", siteId)
    .eq("user_id", user.id)
    .single();

  document.getElementById("site-name").textContent = site.site_name;

  SITE_CONTENT = site.content || {}; // ✅ initialize editor state

  /* ───────── TEMPLATE SLUG ───────── */
  const { data: template } = await supabase
    .from("templates")
    .select("template_slug")
    .eq("id", site.template_id)
    .single();

  const templateSlug = template.template_slug;

  /* ───────── LOAD TEMPLATE ───────── */
  const iframe = document.getElementById("site-preview");
  iframe.src = `/public/templates/${templateSlug}/index.html`;

  iframe.onload = async () => {
    const editables = await loadEditables(templateSlug);
    buildAccordion(editables, iframe, user.id, siteId);
    applySavedContent(iframe, SITE_CONTENT);
  };

  /* ───────── ACTIONS ───────── */
  bindAction("back-btn", async () => {
    await persist(siteId);
    window.location.href = "dashboard.html";
  });

  bindAction("save-btn", async () => {
    await persist(siteId);
    alert("Saved");
  });

  bindAction("publish-btn", async () => {
    await persist(siteId, true);
    alert("Published");
  });
});

/* ───────── UTIL ───────── */
function bindAction(id, fn) {
  const el = document.getElementById(id);
  if (el) el.onclick = fn;
}

/* ───────── LOAD EDITABLES ───────── */
async function loadEditables(slug) {
  const res = await fetch(`/public/templates/${slug}/editables.json`);
  if (!res.ok) throw new Error("editables.json not found");
  return await res.json();
}

/* ───────── BUILD ACCORDION ───────── */
function buildAccordion(editables, iframe, userId, siteId) {
  const container = document.getElementById("editor-fields");
  container.innerHTML = "";

  Object.entries(editables).forEach(([key, field]) => {
    const acc = document.createElement("div");
    acc.className = "accordion";

    acc.innerHTML = `
      <div class="accordion-header">
        <span>${field.label}</span>
      </div>
      <div class="accordion-body"></div>
    `;

    const body = acc.querySelector(".accordion-body");

    /* ───── IMAGE FIELD ───── */
    if (field.type === "image") {
      const upload = document.createElement("div");
      upload.className = "upload-container";

      const inputId = `file-${key}`;
      const existingUrl = SITE_CONTENT[key];

      upload.innerHTML = `
        <div class="upload-header">
          <p>Browse file to upload</p>
        </div>

        <label class="upload-footer" for="${inputId}">
          <p class="file-name">
            ${existingUrl ? "Image uploaded" : "No selected file"}
          </p>
        </label>

        <input id="${inputId}" class="upload-input" type="file" accept="image/*">
      `;

      const fileInput = upload.querySelector("input");
      const fileName = upload.querySelector(".file-name");

      if (existingUrl) {
        applyImageToIframe(iframe, key, existingUrl);
      }

      fileInput.onchange = async () => {
        const file = fileInput.files[0];
        if (!file) return;

        fileName.textContent = "Uploading...";

        const url = await uploadImage(file, userId, siteId);
        SITE_CONTENT[key] = url; // ✅ persist to state

        fileName.textContent = file.name;
        applyImageToIframe(iframe, key, url);
      };

      body.appendChild(upload);
      acc.querySelector(".accordion-header").onclick = () =>
        acc.classList.toggle("open");

      container.appendChild(acc);
      return;
    }

    /* ───── STANDARD FIELDS ───── */
    let input;

    switch (field.type) {
      case "text":
      case "url":
        input = document.createElement("input");
        input.type = "text";
        input.value = SITE_CONTENT[key] || "";
        break;

      case "longtext":
        input = document.createElement("textarea");
        input.rows = 4;
        input.value = SITE_CONTENT[key] || "";
        break;

      case "boolean":
        input = document.createElement("input");
        input.type = "checkbox";
        input.checked = !!SITE_CONTENT[key];
        break;

      default:
        return;
    }

    input.className = "input";

    bindLiveEditing(input, key, field.type, iframe);

    body.appendChild(input);

    acc.querySelector(".accordion-header").onclick = () =>
      acc.classList.toggle("open");

    container.appendChild(acc);
  });
}

/* ───────── IMAGE UPLOAD ───────── */
async function uploadImage(file, userId, siteId) {
  const supabase = window.supabaseClient;
  const path = `${userId}/${siteId}/images/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("site-assets")
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage
    .from("site-assets")
    .getPublicUrl(path);

  return data.publicUrl;
}

/* ───────── APPLY SAVED CONTENT ───────── */
function applySavedContent(iframe, content) {
  const doc = iframe.contentDocument;

  Object.entries(content).forEach(([key, value]) => {
    const el = doc.querySelector(`[data-edit="${key}"]`);
    if (!el) return;

    if (el.tagName === "IMG") {
      el.src = value;
    } else {
      el.textContent = value;
    }
  });
}

/* ───────── IMAGE APPLY ───────── */
function applyImageToIframe(iframe, key, url) {
  const el = iframe.contentDocument.querySelector(`[data-edit="${key}"]`);
  if (el) el.src = url;
}

/* ───────── LIVE EDITING ───────── */
function bindLiveEditing(input, key, type, iframe) {
  const handler = () => {
    const el = iframe.contentDocument.querySelector(`[data-edit="${key}"]`);
    if (!el) return;

    if (type === "boolean") {
      SITE_CONTENT[key] = input.checked;
      el.style.display = input.checked ? "" : "none";
    } else {
      SITE_CONTENT[key] = input.value;
      el.textContent = input.value;
    }
  };

  input.addEventListener(type === "boolean" ? "change" : "input", handler);
}

/* ───────── SAVE ───────── */
async function persist(siteId, publish = false) {
  const supabase = window.supabaseClient;

  await supabase
    .from("user_sites")
    .update({
      content: SITE_CONTENT, // ✅ save entire state
      updated_at: new Date().toISOString(),
      ...(publish && { is_published: true })
    })
    .eq("id", siteId);
}
