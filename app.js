const $ = s => document.querySelector(s);
const app = $("#app");

const HALLS = {
  Physics: ["Physics", "Mechanics, waves, electricity, optics and modern physics."],
  Chemistry: ["Chemistry", "Physical, organic and inorganic chemistry."],
  Mathematics: ["Mathematics", "Algebra, calculus, coordinate geometry and more."]
};
const SUBJ = Object.keys(HALLS);
const ICON = { Physics: "⚛️", Chemistry: "🧪", Mathematics: "📐", Other: "📖" };

let BOOKS = [], ERR = null, PAGE = 24, admin = null;
let SAVED = new Set(JSON.parse(localStorage.getItem("fbhy_saved") || "[]"));

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

const subj = b => SUBJ.includes(b.subject) ? b.subject : "Other";
const ic = b => ICON[subj(b)];
const call = (b, i) => subj(b).slice(0, 3).toUpperCase() + "-" + String(i + 1).padStart(3, "0");
const live = () => BOOKS.filter(b => b.published !== false);
const byNew = (a, b) => String(b.added).localeCompare(String(a.added));

const isRecent = d => {
  if (!d) return false;
  const diff = (Date.now() - new Date(d).getTime()) / 86400000;
  return diff >= 0 && diff <= 14;
};

function saveBookmarks() {
  try { localStorage.setItem("fbhy_saved", JSON.stringify([...SAVED])); } catch (e) {}
}

function toggleBookmark(id) {
  if (SAVED.has(id)) {
    SAVED.delete(id);
    toast("Removed from saved books");
  } else {
    SAVED.add(id);
    toast("Saved to reading list ★");
  }
  saveBookmarks();
  render();
}

function toast(m, err) {
  const t = $("#toast");
  t.textContent = m;
  t.className = "on" + (err ? " err" : "");
  clearTimeout(toast.h);
  toast.h = setTimeout(() => (t.className = ""), 4200);
}

function cover(b) {
  return b.cover
    ? `<img class="cover" src="${esc(b.cover)}" alt="Cover of ${esc(b.title)}" loading="lazy">`
    : `<div class="cover ph"><span>${esc(b.title)}</span></div>`;
}

function row(b) {
  const f = (b.editions || []).find(e => e && e.file);
  const isSaved = SAVED.has(b.id);
  const badge = isRecent(b.added) ? `<span class="new-badge">NEW</span>` : "";
  return `<div class="it">
    <a class="t" href="#/book/${encodeURIComponent(b.id)}">${esc(b.title)}${badge}</a>
    <span class="d">${esc([b.author, b.category].filter(Boolean).join(" · ") || b.description || "")}</span>
    <span class="tag">${ic(b)} ${esc(b.subject || "")}</span>
    <button class="bm ${isSaved ? "saved" : ""}" data-bm="${esc(b.id)}" title="${isSaved ? "Remove bookmark" : "Save book"}" aria-label="Bookmark">${isSaved ? "★" : "☆"}</button>
    <button class="cp" data-copy="${esc(b.id)}" title="Copy share link" aria-label="Copy share link">🔗</button>
    ${f ? `<a class="q" href="${esc(f.file)}" target="_blank" rel="noopener noreferrer">⬇ Download</a>` : `<span class="q off">Soon</span>`}
  </div>`;
}

const FAV = document.querySelector("link[rel=icon]").href;
const BASE = () => location.origin + location.pathname.replace(/[^\/]*$/, "");
const shareUrl = b => b.share ? BASE() + "b/" + encodeURIComponent(b.id) + ".html" : BASE() + "#/book/" + encodeURIComponent(b.id);

async function copy(t) {
  try {
    await navigator.clipboard.writeText(t);
    toast("Link copied 🔗");
  } catch (e) {
    prompt("Copy this link:", t);
  }
}

function stub(b) {
  const base = BASE(), id = encodeURIComponent(b.id), u = base + "b/" + id + ".html", img = base + "b/" + id + ".png";
  const t = b.title + " · Free JEE book";
  const d = (b.description || [b.subject, b.category, b.author].filter(Boolean).join(" · ") || "Free JEE book") + " Free download, no sign-up.";
  const e = esc;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(t)}</title><meta name="description" content="${e(d)}"><link rel="icon" href="${e(FAV)}"><meta name="theme-color" content="#7bc5e4"><meta property="og:type" content="website"><meta property="og:site_name" content="Freebooks Hell Yeah"><meta property="og:title" content="${e(t)}"><meta property="og:description" content="${e(d)}"><meta property="og:url" content="${e(u)}"><meta property="og:image" content="${e(img)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta http-equiv="refresh" content="0;url=../#/book/${id}"></head><body><p><a href="../#/book/${id}">Open ${e(b.title)}</a></p><script>location.replace("../#/book/${id}")<\/script></body></html>`;
}

async function ogPng(b) {
  try { await document.fonts.ready; } catch (e) {}
  const c = document.createElement("canvas");
  c.width = 1200; c.height = 630;
  const x = c.getContext("2d");
  x.fillStyle = "#1b1b1f"; x.fillRect(0, 0, 1200, 630);
  x.fillStyle = "#7bc5e4"; x.fillRect(0, 0, 18, 630);
  x.font = "120px sans-serif"; x.fillText(ic(b), 80, 190);
  x.fillStyle = "#7bc5e4"; x.font = "600 30px 'JetBrains Mono',monospace";
  x.fillText((b.subject || "Book") + (b.category ? "  ·  " + b.category : ""), 80, 252);
  x.fillStyle = "#fff"; x.font = "700 66px Inter,sans-serif";
  let ln = [], cur = "";
  for (const w of String(b.title).split(" ")) {
    if (x.measureText((cur + " " + w).trim()).width > 1040 && cur) {
      ln.push(cur); cur = w;
    } else cur = (cur + " " + w).trim();
  }
  ln.push(cur);
  ln.slice(0, 3).forEach((l, i) => x.fillText(i == 2 && ln.length > 3 ? l + "…" : l, 80, 340 + i * 80));
  x.fillStyle = "#98989f"; x.font = "500 34px Inter,sans-serif"; x.fillText(b.author || "", 80, 556);
  x.fillStyle = "#7bc5e4"; x.font = "600 26px Inter,sans-serif"; x.fillText("Freebooks Hell Yeah  ·  free download, no sign-up", 80, 600);
  return new Promise(r => c.toBlob(r, "image/png"));
}

async function shareOn(b) {
  const p = "b/" + b.id;
  await putFile(p + ".png", await b64(await ogPng(b)), "Share card " + b.id);
  await putFile(p + ".html", u8(stub(b)), "Share page " + b.id);
}

async function shareOff(id) {
  for (const e of ["png", "html"]) {
    const p = "b/" + id + "." + e, ex = await gh("GET", p);
    if (ex) await gh("DELETE", p, { message: "Remove " + p, sha: ex.sha });
  }
}

async function load() {
  try {
    const r = await fetch("books.yaml?" + Date.now());
    if (!r.ok) throw new Error("books.yaml returned " + r.status);
    const d = jsyaml.load(await r.text());
    BOOKS = ((d && d.books) || []).filter(b => b && b.title).map((b, i) => ({
      ...b, id: String(b.id || ("book-" + i))
    }));
    ERR = null;
  } catch (e) {
    ERR = e.message === "Failed to fetch"
      ? "Couldn’t read books.yaml. Open this site through a web server, not by double-clicking the file."
      : e.message;
  }
}

function goRandomBook() {
  const L = live();
  if (!L.length) return toast("No books available yet.");
  const pick = L[Math.floor(Math.random() * L.length)];
  location.hash = "#/book/" + encodeURIComponent(pick.id);
}

/* ---------- Views ---------- */
const BOOKSVG = `<svg viewBox="0 0 200 200" fill="none" aria-hidden="true"><rect x="30" y="128" width="140" height="28" rx="4" fill="var(--brand)"/><rect x="42" y="96" width="120" height="28" rx="4" fill="var(--brand)" opacity=".7"/><rect x="26" y="64" width="128" height="28" rx="4" fill="var(--brand)" opacity=".45"/><path d="M56 140h46M66 108h50M48 76h40" stroke="var(--bg)" stroke-width="5" stroke-linecap="round"/></svg>`;

function home() {
  const L = live(), recent = [...L].sort(byNew).slice(0, 8);
  return `<section class="hero">
    <div>
      <a class="pill" href="${recent[0] ? "#/book/" + encodeURIComponent(recent[0].id) : "#/stacks"}">
        ${recent[0] ? "🆕 Latest: " + esc(recent[0].title) : "✨ Library opening soon"}
      </a>
      <h1>Freebooks Hell Yeah!</h1>
      <p class="tg">Free books for JEE Physics, Chemistry and Mathematics.</p>
      <p class="ab">${L.length} ${L.length == 1 ? "book" : "books"} so far. Download any of them, no account needed.</p>
      <div class="acts">
        <a class="b brand" href="#/stacks">📚 Browse all books</a>
        <button class="b alt" id="hs">🔎 Search</button>
        <button class="b alt" id="rnd">🎲 Surprise me</button>
      </div>
    </div>
    <div class="hi">${BOOKSVG}</div>
  </section>
  <p class="sm">Or browse by subject ✨</p>
  <div class="feat">
    ${SUBJ.map(s => {
      const c = L.filter(b => b.subject === s).length;
      return `<a class="fc" href="#/stacks?s=${s}"><b>${ICON[s]} ${HALLS[s][0]}</b><p>${HALLS[s][1]}</p><em>${c} ${c == 1 ? "book" : "books"}</em></a>`;
    }).join("")}
  </div>
  <div class="rec">
    <h2>🆕 Recently added</h2>
    ${recent.length ? `<div class="list">${recent.map(row).join("")}</div>` : `<div class="empty"><h3>📭 No books yet</h3><p>${ERR ? esc(ERR) : "Books will show up here as soon as they are added."}</p></div>`}
  </div>`;
}

function stacks(q) {
  const s = q.get("s") || "";
  const savedOnly = q.get("saved") === "1";
  const t = (q.get("q") || "").trim().toLowerCase();

  const L = live().filter(b =>
    (!s || b.subject === s) &&
    (!savedOnly || SAVED.has(b.id)) &&
    (!t || [b.title, b.author, b.publisher, b.category, b.description].join(" ").toLowerCase().includes(t))
  ).sort(byNew);

  const shown = L.slice(0, PAGE), g = {};
  shown.forEach(b => (g[b.category || "Other"] = g[b.category || "Other"] || []).push(b));
  const cats = Object.keys(g).sort(), slug = c => "c-" + c.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const body = !shown.length
    ? `<div class="empty"><h3>${ERR ? "Couldn’t load the library" : (savedOnly ? "No saved books yet" : (live().length ? "Nothing matches that" : "This section is empty"))}</h3><p>${ERR ? esc(ERR) : (savedOnly ? "Click the ☆ star icon next to any book to save it here for quick access." : (live().length ? "Try fewer words or pick another subject." : "Books will appear here as soon as they are published."))}</p></div>`
    : cats.map(c => `<h2 id="${slug(c)}">${esc(c)}</h2><div class="list">${g[c].map(row).join("")}</div>`).join("");

  return `<div class="page">
    <div class="doc">
      <h1>${savedOnly ? "★ Saved books" : (s ? ICON[s] + " " + HALLS[s][0] : "📚 All books")}</h1>
      <p class="lead">${savedOnly ? "Your personal reading list stored locally in this browser." : (s ? HALLS[s][1] : "Every published book, newest first within each category.")}</p>
      <div class="tools">
        <input id="q" type="search" placeholder="Filter by title, author, topic…" value="${esc(q.get("q") || "")}" autocomplete="off">
        <div class="chips">
          <button data-s="" data-saved="0" class="${!s && !savedOnly ? "on" : ""}">📚 All</button>
          ${SUBJ.map(x => `<button data-s="${x}" data-saved="0" class="${s == x && !savedOnly ? "on" : ""}">${ICON[x]} ${x}</button>`).join("")}
          <button data-saved="1" class="${savedOnly ? "on" : ""}">★ Saved (${SAVED.size})</button>
        </div>
      </div>
      <p class="note">${L.length} ${L.length == 1 ? "book" : "books"}${t ? " matching “" + esc(t) + "”" : ""}</p>
      ${body}
      ${L.length > PAGE ? `<div class="more"><button id="more">Show more (${L.length - PAGE} left)</button></div>` : ""}
    </div>
    <nav class="outline">
      <b>On this page</b>
      ${cats.map(c => `<a href="#" data-go="${slug(c)}">${esc(c)}</a>`).join("")}
    </nav>
  </div>`;
}

function bookPage(id) {
  const i = BOOKS.findIndex(b => b.id === id), b = BOOKS[i];
  if (!b || (b.published === false && !admin)) {
    return `<div class="doc" style="max-width:760px;margin:0 auto"><h1>🔍 Book not found</h1><p class="lead">It may have been removed, or the link is wrong.</p><a class="btn" href="#/stacks">Back to all books</a></div>`;
  }
  const eds = (b.editions || []).filter(e => e && e.file);
  const more = live().filter(x => x.subject === b.subject && x.id !== b.id).slice(0, 6);
  const isSaved = SAVED.has(b.id);

  const linkVal = (val, query) => val ? `<a href="#/stacks?q=${encodeURIComponent(query)}">${esc(val)}</a>` : "";
  const r = (k, v, raw) => v ? `<tr><td>${k}</td><td>${raw ? v : esc(v)}</td></tr>` : "";

  return `<div class="page">
    <div class="doc">
      <div class="crumb"><a href="#/stacks">Library</a> / <a href="#/stacks${b.subject ? "?s=" + b.subject : ""}">${esc(b.subject || "Books")}</a></div>
      <div class="bk">
        ${cover(b)}
        <div>
          <h1>${esc(b.title)}</h1>
          <p class="lead">${esc([b.author, b.publisher].filter(Boolean).join(" · "))}</p>
          ${b.published === false
            ? `<div class="blk"><b>Unpublished</b><p>Only you can see this book.</p></div>`
            : `<div class="blk"><b>Free to download</b><p>No account, no sign-up.</p></div>`}
        </div>
      </div>
      <h2 id="details">📋 Details</h2>
      <table>
        ${r("Author", linkVal(b.author, b.author), true)}
        ${r("Publisher", b.publisher)}
        ${r("Subject", b.subject)}
        ${r("Category", linkVal(b.category, b.category), true)}
        ${r("Added", b.added)}
        ${r("Reference", call(b, i))}
      </table>
      <h2 id="download">⬇️ Download</h2>
      <div class="ed">
        ${eds.length
          ? eds.map(e => `<a class="b brand dlb" href="${esc(e.file)}" target="_blank" rel="noopener noreferrer">⬇ Download ${esc(e.name || "book")}</a>`).join("")
          : `<span class="note">The file hasn’t been added yet.</span>`}
        <button class="b alt" data-bm="${esc(b.id)}">${isSaved ? "★ Saved" : "☆ Save book"}</button>
        <button class="b alt" data-copy="${esc(b.id)}">🔗 Copy share link</button>
      </div>
      ${b.description ? `<h2 id="about">📖 About this book</h2><p>${esc(b.description)}</p>` : ""}
      ${more.length ? `<h2 id="more">${ic(b)} More in ${esc(b.subject)}</h2><div class="list">${more.map(row).join("")}</div>` : ""}
    </div>
    <nav class="outline">
      <b>On this page</b>
      <a href="#" data-go="details">Details</a>
      <a href="#" data-go="download">Download</a>
      ${b.description ? `<a href="#" data-go="about">About</a>` : ""}
      ${more.length ? `<a href="#" data-go="more">More in ${esc(b.subject)}</a>` : ""}
    </nav>
  </div>`;
}

/* ---------- Keeper (Admin) ---------- */
const gh = async (m, p, body) => {
  const c = admin;
  const r = await fetch(`https://api.github.com/repos/${c.repo}/contents/${p}${m === "GET" ? "?ref=" + c.branch + "&t=" + Date.now() : ""}`, {
    method: m,
    headers: { Authorization: "Bearer " + c.token, Accept: "application/vnd.github+json" },
    body: body ? JSON.stringify({ branch: c.branch, ...body }) : undefined
  });
  if (m === "GET" && r.status === 404) return null;
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || ("GitHub said " + r.status));
  return r.json();
};
const b64 = f => new Promise((ok, no) => {
  const r = new FileReader();
  r.onload = () => ok(r.result.split(",")[1]);
  r.onerror = no;
  r.readAsDataURL(f);
});
const u8 = s => btoa(unescape(encodeURIComponent(s)));

async function putFile(path, b64data, msg) {
  const ex = await gh("GET", path);
  await gh("PUT", path, { message: msg, content: b64data, sha: ex?.sha });
}

async function mutate(fn, msg) {
  const cur = await gh("GET", "books.yaml");
  let d = { books: [] };
  if (cur) d = jsyaml.load(decodeURIComponent(escape(atob(cur.content.replace(/\n/g, ""))))) || { books: [] };
  d.books = d.books || [];
  fn(d.books);
  const head = "# Freebooks Hell Yeah library. Managed from the Admin page.\n";
  await gh("PUT", "books.yaml", {
    message: msg,
    content: u8(head + jsyaml.dump(d, { lineWidth: -1, skipInvalid: true })),
    sha: cur?.sha
  });
  BOOKS = d.books.filter(b => b && b.title).map(b => ({ ...b, id: String(b.id) }));
}

function keeper() {
  if (!admin) {
    const s = JSON.parse(sessionStorage.getItem("keeper") || "{}");
    return `<div class="doc" style="max-width:760px;margin:0 auto">
      <h1>Admin</h1>
      <p class="note" style="max-width:60ch">Only the keeper has the key. This site lives on GitHub Pages, so the key is a GitHub access token for your repository. It stays in this browser tab and is never sent anywhere except GitHub.</p>
      <form class="f" id="kf">
        <div class="row">
          <div><label>Repository (owner/name)</label><input name="repo" required placeholder="you/jee-library" value="${esc(s.repo || "")}"></div>
          <div><label>Branch</label><input name="branch" value="${esc(s.branch || "main")}"></div>
        </div>
        <div><label>Fine-grained token (Contents: read &amp; write on that repo only)</label><input name="token" type="password" required autocomplete="off"></div>
        <div><button class="btn" id="unlock">Unlock</button></div>
      </form>
      <p class="note" style="margin-top:34px;max-width:60ch">Not on GitHub? You can still edit <b>books.yaml</b> by hand and upload your files anywhere. The format is documented at the top of that file.</p>
    </div>`;
  }
  const rows = BOOKS.map((b, i) => `<div class="led">
    <div>${esc(b.title)}<small>${call(b, i)} · ${esc(b.subject || "no subject")} · ${b.published === false ? "unpublished" : "published"}</small></div>
    <div>
      <button class="btn" data-a="edit" data-i="${i}">Edit</button>
      <button class="btn" data-a="pub" data-i="${i}">${b.published === false ? "Publish" : "Unpublish"}</button>
      <button class="btn red" data-a="del" data-i="${i}">Delete</button>
    </div>
  </div>`).join("");

  return `<div class="doc" style="max-width:760px;margin:0 auto">
    <h2>Add or edit a book</h2>
    <p class="note">Signed in to ${esc(admin.repo)}. Changes go live once GitHub Pages rebuilds (usually under a minute).</p>
    <form class="f" id="bf">
      <input type="hidden" name="id">
      <div><label>Title</label><input name="title" required></div>
      <div class="row"><div><label>Author</label><input name="author"></div><div><label>Publisher</label><input name="publisher"></div></div>
      <div class="row"><div><label>Subject</label><select name="subject">${SUBJ.map(s => `<option>${s}</option>`).join("")}</select></div><div><label>Category (e.g. Mechanics, Organic)</label><input name="category"></div></div>
      <div><label>Description</label><textarea name="description"></textarea></div>
      <div class="row"><div><label>Uploadables.io file link</label><input type="url" name="filelink" placeholder="https://uploadables.io/..." required></div><div><label>Edition name</label><input name="edname" placeholder="e.g. PDF"></div></div>
      <p class="note">Upload the PDF to Uploadables.io first, then paste its share/download link here. Visitors are sent to that link.</p>
      <div><label>Cover image (optional, JPG or PNG)</label><input type="file" name="cov" accept="image/*"></div>
      <p class="note">✨ Saving also makes a shareable link with a preview card (Discord, WhatsApp, Telegram…).</p>
      <label><input type="checkbox" name="published" checked> Published (visible to everyone)</label>
      <div style="display:flex;gap:12px;flex-wrap:wrap"><button class="btn" id="save">Save book</button><button type="button" class="btn" id="reset">Clear form</button></div>
    </form>
    <div class="ledger">
      <h3 style="margin:34px 0 8px">The ledger (${BOOKS.length})</h3>
      ${rows || `<p class="note">Nothing shelved yet.</p>`}
      <p style="margin-top:28px;display:flex;gap:12px;flex-wrap:wrap">
        <button class="btn" id="rb">🔁 Rebuild share pages</button>
        <button class="btn" id="exp">⬇ Download books.yaml</button>
        <button class="btn" id="lock">Sign out</button>
      </p>
    </div>
  </div>`;
}

function keeperEvents() {
  const kf = $("#kf");
  if (kf) kf.onsubmit = async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(kf));
    $("#unlock").textContent = "Checking…";
    admin = { repo: f.repo.trim(), branch: f.branch.trim() || "main", token: f.token.trim() };
    try {
      const r = await fetch("https://api.github.com/repos/" + admin.repo, { headers: { Authorization: "Bearer " + admin.token } });
      if (!r.ok) throw new Error(r.status === 404 || r.status === 401 ? "That token can’t open this repository." : "GitHub said " + r.status);
      sessionStorage.setItem("keeper", JSON.stringify({ repo: admin.repo, branch: admin.branch }));
      toast("Signed in.");
      render();
    } catch (x) {
      admin = null;
      toast(x.message, 1);
      $("#unlock").textContent = "Unlock";
    }
  };

  const bf = $("#bf");
  if (!bf) return;
  const fill = i => {
    const b = BOOKS[i];
    for (const k of ["id", "title", "author", "publisher", "subject", "category", "description"]) bf.elements[k].value = b[k] || "";
    bf.elements.published.checked = b.published !== false;
    bf.elements.edname.value = b.editions?.[0]?.name || "";
    bf.elements.filelink.value = b.editions?.[0]?.file || "";
    scrollTo({ top: 0, behavior: "smooth" });
  };

  $("#reset").onclick = () => { bf.reset(); bf.elements.id.value = ""; };
  $("#lock").onclick = () => { admin = null; render(); toast("Signed out."); };
  $("#rb").onclick = async () => {
    const rb = $("#rb"); rb.disabled = true;
    try {
      const L = live();
      for (let i = 0; i < L.length; i++) {
        rb.textContent = "Building " + (i + 1) + "/" + L.length + "…";
        await shareOn(L[i]);
      }
      await mutate(D => D.forEach(x => { x.share = x.published !== false; }), "Mark share pages");
      toast("Share pages rebuilt ✨");
      render();
    } catch (x) {
      toast(x.message, 1);
      rb.disabled = false;
      rb.textContent = "🔁 Rebuild share pages";
    }
  };
  $("#exp").onclick = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([jsyaml.dump({ books: BOOKS }, { lineWidth: -1, skipInvalid: true })], { type: "text/yaml" }));
    a.download = "books.yaml";
    a.click();
  };

  document.querySelectorAll(".led .btn").forEach(btn => btn.onclick = async () => {
    const i = +btn.dataset.i, b = BOOKS[i], a = btn.dataset.a;
    if (a === "edit") return fill(i);
    try {
      if (a === "pub") {
        const on = b.published === false;
        if (on) await shareOn(b); else await shareOff(b.id);
        await mutate(L => {
          const x = L.find(y => String(y.id) === b.id);
          x.published = on; x.share = on;
        }, "Toggle " + b.id);
        toast(on ? "Published 🌐" : "Unpublished.");
      }
      if (a === "del") {
        if (!confirm("Delete “" + b.title + "” and its files? This can’t be undone.")) return;
        for (const f of [...(b.editions || []).map(e => e.file), b.cover]) {
          if (f && !/^https?:/.test(f)) {
            const ex = await gh("GET", f);
            if (ex) await gh("DELETE", f, { message: "Remove " + f, sha: ex.sha });
          }
        }
        await shareOff(b.id);
        await mutate(L => {
          const k = L.findIndex(y => String(y.id) === b.id);
          if (k > -1) L.splice(k, 1);
        }, "Delete " + b.id);
        toast("Deleted.");
      }
      render();
    } catch (x) {
      toast(x.message, 1);
    }
  });

  bf.onsubmit = async e => {
    e.preventDefault();
    const f = bf.elements, sv = $("#save");
    sv.disabled = true; sv.textContent = "Saving…";
    try {
      const title = f.title.value.trim();
      let id = f.id.value || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "book-" + Date.now();
      const old = BOOKS.find(b => b.id === id);
      const entry = {
        id, title,
        author: f.author.value.trim() || undefined,
        publisher: f.publisher.value.trim() || undefined,
        subject: f.subject.value,
        category: f.category.value.trim() || undefined,
        description: f.description.value.trim() || undefined,
        cover: old?.cover,
        added: old?.added || new Date().toISOString().slice(0, 10),
        published: f.published.checked,
        editions: old?.editions || []
      };
      const filelink = f.filelink.value.trim(), cov = f.cov.files[0];
      let parsed;
      try { parsed = new URL(filelink); } catch (_) { throw new Error("Enter a valid Uploadables.io link."); }
      if (parsed.protocol !== "https:" || (parsed.hostname !== "uploadables.io" && !parsed.hostname.endsWith(".uploadables.io"))) {
        throw new Error("Please enter an HTTPS Uploadables.io link.");
      }
      entry.editions = [{ name: f.edname.value.trim() || "PDF", file: parsed.href }];
      if (cov) {
        const p = "covers/" + id + "." + (cov.name.split(".").pop() || "jpg");
        await putFile(p, await b64(cov), "Upload " + p);
        entry.cover = p;
      }
      if (entry.published) { await shareOn(entry); entry.share = true; }
      else { await shareOff(id); entry.share = false; }

      await mutate(L => {
        const k = L.findIndex(y => String(y.id) === id);
        k > -1 ? L[k] = entry : L.unshift(entry);
      }, (old ? "Edit " : "Add ") + id);

      toast("Saved. It appears publicly once the site rebuilds.");
      render();
    } catch (x) {
      toast(x.message, 1);
      sv.disabled = false;
      sv.textContent = "Save book";
    }
  };
}

/* ---------- Router & Rendering ---------- */
const SIDE = () => {
  const L = live();
  const c = s => L.filter(b => b.subject === s).length;
  const k = h => {
    const [p, qs] = h.slice(1).split("?");
    const params = new URLSearchParams(qs || "");
    const s = params.get("s"), sv = params.get("saved");
    return p + (sv === "1" ? "?saved=1" : (s ? "?s=" + s : ""));
  };
  const cur = k(location.hash || "#/");
  const it = (n, h, cnt) => `<a href="${h}" class="${k(h) === cur ? "on" : ""}">${n}${cnt != null ? `<i>${cnt}</i>` : ""}</a>`;

  return `<h4>📚 Library</h4>
    ${it("🏠 Home", "#/")}
    ${it("📖 All books", "#/stacks", L.length)}
    ${it("★ Saved", "#/stacks?saved=1", SAVED.size)}
    <h4>🧭 Subjects</h4>
    ${SUBJ.map(s => it(ICON[s] + " " + s, "#/stacks?s=" + s, c(s))).join("")}
    <h4>🔑 Owner</h4>
    ${it("⚙️ Admin", "#/keeper")}`;
};

function render() {
  const h = location.hash.slice(1) || "/";
  const [path, qs] = h.split("?");
  const q = new URLSearchParams(qs || "");
  const seg = path.split("/");

  let html;
  if (seg[1] === "stacks") html = stacks(q);
  else if (seg[1] === "book") html = bookPage(decodeURIComponent(seg[2] || ""));
  else if (seg[1] === "keeper") html = keeper();
  else html = home();

  app.style.animation = "none";
  app.offsetWidth;
  app.style.animation = "";
  app.innerHTML = html;

  const bk = seg[1] === "book" ? BOOKS.find(b => b.id === decodeURIComponent(seg[2] || "")) : 0;
  document.title = (bk ? bk.title + " · " : "") + "FBHY · Freebooks Hell Yeah";

  $("#side").innerHTML = SIDE();
  $("#side").classList.remove("open");

  if (seg[1] === "stacks") {
    const qi = $("#q");
    let tm;
    qi.oninput = () => {
      clearTimeout(tm);
      tm = setTimeout(() => {
        PAGE = 60;
        qi.value ? q.set("q", qi.value) : q.delete("q");
        history.replaceState(null, "", "#/stacks?" + q);
        const c = qi.selectionStart;
        render();
        const n = $("#q");
        n.focus();
        n.setSelectionRange(c, c);
      }, 220);
    };
    document.querySelectorAll(".chips button").forEach(b => b.onclick = () => {
      PAGE = 60;
      if (b.dataset.saved === "1") {
        q.delete("s");
        q.set("saved", "1");
      } else {
        q.delete("saved");
        b.dataset.s ? q.set("s", b.dataset.s) : q.delete("s");
      }
      location.hash = "#/stacks?" + q;
    });
    const m = $("#more");
    if (m) m.onclick = () => { PAGE += 60; render(); };
  }

  document.querySelectorAll("[data-go]").forEach(a => a.onclick = e => {
    e.preventDefault();
    document.getElementById(a.dataset.go)?.scrollIntoView({ behavior: "smooth" });
  });
  document.querySelectorAll(".dlb,.q:not(.off)").forEach(a => a.addEventListener("click", () => toast("Download started.")));

  const hs = $("#hs"); if (hs) hs.onclick = openS;
  const rnd = $("#rnd"); if (rnd) rnd.onclick = goRandomBook;

  keeperEvents();
  if (seg[1] !== "stacks" || !qs) scrollTo(0, 0);
}

/* ---------- Delegated Actions & Search Modal ---------- */
document.addEventListener("click", e => {
  const c = e.target.closest("[data-copy]");
  if (c) {
    const b = BOOKS.find(x => x.id === c.dataset.copy);
    if (b) copy(shareUrl(b));
  }
  const bm = e.target.closest("[data-bm]");
  if (bm) toggleBookmark(bm.dataset.bm);
});

let sel = 0, res = [];
function openS() {
  $("#sv").classList.add("on");
  const i = $("#si");
  i.value = "";
  fillS();
  i.focus();
}
function closeS() { $("#sv").classList.remove("on"); }

function highlight(text, term) {
  if (!term) return esc(text);
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return esc(text);
  return esc(text.slice(0, idx)) + `<mark>${esc(text.slice(idx, idx + term.length))}</mark>` + esc(text.slice(idx + term.length));
}

function fillS() {
  const t = $("#si").value.trim().toLowerCase();
  res = live().filter(b =>
    !t || [b.title, b.author, b.publisher, b.category, b.subject, b.description].join(" ").toLowerCase().includes(t)
  ).sort(byNew).slice(0, 12);
  sel = 0;
  paintS(t);
}

function paintS(term = $("#si").value.trim()) {
  $("#sr").innerHTML = res.length
    ? res.map((b, i) => `<li><a href="#/book/${encodeURIComponent(b.id)}" class="${i == sel ? "on" : ""}"><span>${highlight(b.title, term)}</span><small>${esc(b.subject || "")}</small></a></li>`).join("")
    : `<li class="n">${live().length ? "No books match that." : "No books yet."}</li>`;
}

$("#sbtn").onclick = openS;
$("#si").oninput = fillS;
$("#sv").onclick = e => { if (e.target.id === "sv") closeS(); };
$("#sr").onclick = e => { if (e.target.closest("a")) closeS(); };

addEventListener("keydown", e => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    openS();
  } else if (e.key === "/" && !typing) {
    e.preventDefault();
    openS();
  } else if (e.key === "Escape") {
    closeS();
    $("#tm").hidden = true;
    $("#side").classList.remove("open");
  } else if ($("#sv").classList.contains("on")) {
    if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(res.length - 1, sel + 1); paintS(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); paintS(); }
    else if (e.key === "Enter" && res[sel]) { location.hash = "#/book/" + encodeURIComponent(res[sel].id); closeS(); }
  }
});

$("#kbd").textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K";

/* ---------- Theme & Scroll ---------- */
const ACC = { Sky: "#7bc5e4", Rose: "#f0a1c0", Mint: "#8fd6a6", Lilac: "#b7a4f4", Amber: "#f3c26b" };
let TH = {};
try { TH = JSON.parse(localStorage.getItem("fj") || "{}"); } catch (e) {}

function theme() {
  const m = TH.m || (matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light");
  const a = ACC[TH.a] || ACC.Sky;
  document.documentElement.dataset.theme = m;
  document.documentElement.style.setProperty("--accent", a);
  document.querySelectorAll("#tm .md button").forEach(b => b.classList.toggle("on", b.dataset.m === m));
  document.querySelectorAll("#sw button").forEach(b => b.classList.toggle("on", b.title === (TH.a || "Sky")));
  try { localStorage.setItem("fj", JSON.stringify(TH)); } catch (e) {}
}

$("#sw").innerHTML = Object.entries(ACC).map(([n, c]) => `<button title="${n}" aria-label="${n}" style="--c:${c}"></button>`).join("");
document.querySelectorAll("#sw button").forEach(b => b.onclick = () => { TH.a = b.title; theme(); });
document.querySelectorAll("#tm .md button").forEach(b => b.onclick = () => { TH.m = b.dataset.m; theme(); });
$("#tbtn").onclick = e => { e.stopPropagation(); $("#tm").hidden = !$("#tm").hidden; };
addEventListener("click", e => { if (!e.target.closest(".menu")) $("#tm").hidden = true; });
$("#burger").onclick = () => $("#side").classList.toggle("open");

const topBtn = $("#topbtn");
addEventListener("scroll", () => topBtn.classList.toggle("on", scrollY > 400), { passive: true });
topBtn.onclick = () => scrollTo({ top: 0, behavior: "smooth" });

theme();
addEventListener("hashchange", render);
load().then(render);