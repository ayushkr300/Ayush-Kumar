/* ── HERO ANIMATION: "Pipeline" network ──
   Concept: data packets traveling along a few fixed circuit-like routes
   (echoing ERP -> AI -> Cloud data flow), plus an ambient particle field
   that drifts and links like a sparse neural net. Reacts gently to the
   pointer with a parallax-style pull, and respects reduced-motion. */
(function () {
  const canvas = document.getElementById("hero-particles");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  let W,
    H,
    dpr,
    particles = [],
    routes = [],
    packets = [],
    animId,
    t = 0;
  const COUNT = 56;
  const CONNECT_DIST = 120;
  let pointer = { x: -9999, y: -9999, active: false };

  function resize() {
    const hero = canvas.parentElement;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.offsetWidth;
    H = hero.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function themeRGB() {
    const isDark =
      document.documentElement.getAttribute("data-theme") !== "light";
    return isDark
      ? { v: [124, 58, 237], a: [245, 158, 11], e: [16, 185, 129] }
      : { v: [100, 40, 200], a: [200, 120, 10], e: [5, 140, 95] };
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function createParticle() {
    return {
      x: rand(0, W),
      y: rand(0, H),
      vx: rand(-0.18, 0.18),
      vy: rand(-0.32, -0.06),
      r: rand(1.1, 2.6),
      alpha: rand(0.25, 0.75),
      hue: pick(["v", "v", "a", "e"]),
    };
  }

  // A small set of fixed "circuit" routes that suggest a pipeline:
  // bottom-left -> mid -> top-right, etc. Built from relative (0-1) points
  // so they reflow correctly on resize.
  function buildRoutes() {
    const defs = [
      [
        [0.06, 0.82],
        [0.3, 0.82],
        [0.3, 0.4],
        [0.62, 0.4],
        [0.62, 0.14],
        [0.92, 0.14],
      ],
      [
        [0.1, 0.2],
        [0.1, 0.55],
        [0.42, 0.55],
        [0.42, 0.86],
        [0.78, 0.86],
      ],
      [
        [0.88, 0.3],
        [0.6, 0.3],
        [0.6, 0.62],
        [0.22, 0.62],
        [0.22, 0.92],
      ],
    ];
    routes = defs.map((pts, i) => ({
      points: pts.map(([x, y]) => ({ x: x * W, y: y * H })),
      hue: i === 0 ? "v" : i === 1 ? "a" : "e",
    }));
  }

  function routeLength(route) {
    let len = 0;
    for (let i = 1; i < route.points.length; i++) {
      const a = route.points[i - 1],
        b = route.points[i];
      len += Math.hypot(b.x - a.x, b.y - a.y);
    }
    return len;
  }

  function pointAtFraction(route, frac) {
    const total = route._len || (route._len = routeLength(route));
    let dist = frac * total;
    for (let i = 1; i < route.points.length; i++) {
      const a = route.points[i - 1],
        b = route.points[i];
      const segLen = Math.hypot(b.x - a.x, b.y - a.y);
      if (dist <= segLen || i === route.points.length - 1) {
        const tt = segLen === 0 ? 0 : dist / segLen;
        return { x: a.x + (b.x - a.x) * tt, y: a.y + (b.y - a.y) * tt };
      }
      dist -= segLen;
    }
    return route.points[route.points.length - 1];
  }

  function spawnPacket(routeIndex) {
    packets.push({ routeIndex, frac: 0, speed: rand(0.0026, 0.0042) });
  }

  function init() {
    particles = [];
    for (let i = 0; i < COUNT; i++) particles.push(createParticle());
    buildRoutes();
    packets = [];
    routes.forEach((_, i) => spawnPacket(i));
  }

  function drawRoutes(rgb) {
    routes.forEach((route) => {
      ctx.beginPath();
      route.points.forEach((p, i) =>
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y),
      );
      const [r, g, b] = rgb[route.hue];
      ctx.strokeStyle = `rgba(${r},${g},${b},0.10)`;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // joints
      route.points.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},0.22)`;
        ctx.fill();
      });
    });
  }

  function drawPackets(rgb) {
    packets.forEach((pk) => {
      pk.frac += pk.speed;
      if (pk.frac > 1) {
        pk.frac = 0;
      }
      const route = routes[pk.routeIndex];
      const p = pointAtFraction(route, pk.frac);
      const [r, g, b] = rgb[route.hue];

      // glowing dot
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 9);
      grad.addColorStop(0, `rgba(${r},${g},${b},0.9)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},1)`;
      ctx.fill();
    });
  }

  function draw() {
    t += 1;
    ctx.clearRect(0, 0, W, H);
    const rgb = themeRGB();

    drawRoutes(rgb);
    drawPackets(rgb);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // gentle pull toward pointer
      if (pointer.active) {
        const dx = pointer.x - p.x,
          dy = pointer.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 160 && dist > 0.01) {
          p.x += (dx / dist) * 0.18;
          p.y += (dy / dist) * 0.18;
        }
      }

      p.x += p.vx;
      p.y += p.vy;

      if (p.y < -5) {
        p.y = H + 5;
        p.x = rand(0, W);
      }
      if (p.x < -5) p.x = W + 5;
      if (p.x > W + 5) p.x = -5;

      const [r, g, b] = rgb[p.hue];
      const twinkle = 0.65 + 0.35 * Math.sin(t * 0.02 + i);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha * twinkle})`;
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x,
          dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - dist / CONNECT_DIST) * 0.14})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    animId = requestAnimationFrame(draw);
  }

  function drawStatic() {
    // Reduced-motion: render one calm frame, no animation loop.
    ctx.clearRect(0, 0, W, H);
    const rgb = themeRGB();
    drawRoutes(rgb);
    particles.forEach((p) => {
      const [r, g, b] = rgb[p.hue];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha})`;
      ctx.fill();
    });
  }

  resize();
  init();

  if (prefersReducedMotion) {
    drawStatic();
  } else {
    draw();
  }

  window.addEventListener("resize", () => {
    cancelAnimationFrame(animId);
    resize();
    init();
    if (prefersReducedMotion) drawStatic();
    else draw();
  });

  canvas.parentElement.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.active = true;
  });
  canvas.parentElement.addEventListener("mouseleave", () => {
    pointer.active = false;
  });
})();

/* ── CURSOR GLOW ── */
const glow = document.getElementById("cursor-glow");
document.addEventListener("mousemove", (e) => {
  glow.style.left = e.clientX + "px";
  glow.style.top = e.clientY + "px";
});

/* ── READING PROGRESS ── */
const bar = document.getElementById("progress-bar");
window.addEventListener("scroll", () => {
  const doc = document.documentElement;
  const pct = (doc.scrollTop / (doc.scrollHeight - doc.clientHeight)) * 100;
  bar.style.width = pct + "%";
});

/* ── THEME TOGGLE ── */
const themeBtn = document.getElementById("theme-toggle");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeBtn.innerHTML =
    theme === "dark"
      ? '<i class="fa fa-moon"></i>'
      : '<i class="fa fa-sun"></i>';
}

(function initTheme() {
  const saved = localStorage.getItem("theme");
  applyTheme(saved === "light" ? "light" : "dark");
})();

themeBtn.addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const next = isDark ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem("theme", next);
});

/* ── MOBILE NAV ── */
const hamburger = document.getElementById("hamburger");
const mobileNav = document.getElementById("mobile-nav");
hamburger.addEventListener("click", () => {
  const isOpen = mobileNav.classList.toggle("open");
  hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
});
function closeMobileNav() {
  mobileNav.classList.remove("open");
}

/* ── BACK TO TOP ── */
const backTop = document.getElementById("back-top");
window.addEventListener("scroll", () => {
  backTop.classList.toggle("visible", window.scrollY > 400);
});
backTop.addEventListener("click", () =>
  window.scrollTo({ top: 0, behavior: "smooth" }),
);

/* ── SCROLL ANIMATIONS ── */
const fadeEls = document.querySelectorAll(".fade-in,.fade-in-l,.fade-in-r");
const obs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
);
fadeEls.forEach((el) => obs.observe(el));

/* ── COUNTER ANIMATION ── */
const counters = document.querySelectorAll(".count");
const counterObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = +el.dataset.target;
      let current = 0;
      const step = target / 40;
      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          el.textContent = target;
          clearInterval(timer);
          return;
        }
        el.textContent = Math.floor(current);
      }, 40);
      counterObs.unobserve(el);
    });
  },
  { threshold: 0.5 },
);
counters.forEach((c) => counterObs.observe(c));

/* ── CASE STUDY TABS ── */
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".case-panel")
      .forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    const panel = document.getElementById("tab-" + btn.dataset.tab);
    if (panel) panel.classList.add("active");
  });
});

/* ── COMMAND PALETTE ── */
const cmdOverlay = document.getElementById("cmd-overlay");
const cmdInput = document.getElementById("cmd-input");
const cmdResults = document.getElementById("cmd-results");

const cmds = [
  { label: "About — Hero", icon: "fa-home", href: "#home", cat: "Navigation" },
  {
    label: "Work — Impact Section",
    icon: "fa-briefcase",
    href: "#impact",
    cat: "Navigation",
  },
  {
    label: "Case Studies",
    icon: "fa-folder-open",
    href: "#cases",
    cat: "Navigation",
  },
  {
    label: "Tech Stack",
    icon: "fa-layer-group",
    href: "#stack",
    cat: "Navigation",
  },
  { label: "AI Engineering", icon: "fa-robot", href: "#ai", cat: "Navigation" },
  { label: "ERP / Frappe", icon: "fa-leaf", href: "#erp", cat: "Navigation" },
  {
    label: "Industrial Automation",
    icon: "fa-industry",
    href: "#industrial",
    cat: "Navigation",
  },
  {
    label: "Journey / Timeline",
    icon: "fa-timeline",
    href: "#timeline",
    cat: "Navigation",
  },
  {
    label: "Technical Articles / Blog",
    icon: "fa-book-open",
    href: "#blog",
    cat: "Navigation",
  },
  { label: "Why Hire Me", icon: "fa-star", href: "#why", cat: "Navigation" },
  {
    label: "Contact",
    icon: "fa-envelope",
    href: "#contact",
    cat: "Navigation",
  },
  {
    label: "Download Resume",
    icon: "fa-download",
    action: "resume",
    cat: "Actions",
  },
  {
    label: "Schedule a Call",
    icon: "fa-calendar",
    href: "https://calendly.com/ayushkumar",
    ext: true,
    cat: "Actions",
  },
  {
    label: "GitHub",
    icon: "fab fa-github",
    href: "https://github.com/ayushkr300",
    ext: true,
    cat: "Links",
  },
  {
    label: "LinkedIn",
    icon: "fab fa-linkedin",
    href: "https://linkedin.com/in/ayush-kumar-07669930b",
    ext: true,
    cat: "Links",
  },
];

function renderCmds(query) {
  const filtered = query
    ? cmds.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : cmds;
  if (!filtered.length) {
    cmdResults.innerHTML =
      '<div class="cmd-item" style="color:var(--muted);justify-content:center">No results</div>';
    return;
  }

  const grouped = {};
  filtered.forEach((c) => {
    if (!grouped[c.cat]) grouped[c.cat] = [];
    grouped[c.cat].push(c);
  });

  cmdResults.innerHTML = Object.entries(grouped)
    .map(
      ([cat, items]) =>
        `<div class="cmd-section">${cat}</div>` +
        items
          .map(
            (c) =>
              `<div class="cmd-item" data-href="${c.href || ""}" data-action="${c.action || ""}" data-ext="${c.ext || ""}">
        <i class="fa ${c.icon}"></i>${c.label}
      </div>`,
          )
          .join(""),
    )
    .join("");

  cmdResults.querySelectorAll(".cmd-item").forEach((item) => {
    item.addEventListener("click", () => {
      const href = item.dataset.href;
      const action = item.dataset.action;
      if (action === "resume") downloadResume();
      else if (item.dataset.ext === "true")
        window.open(href, "_blank", "noopener,noreferrer");
      else if (href) {
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      }
      closeCmdPalette();
    });
  });
}

function openCmdPalette() {
  cmdOverlay.classList.add("open");
  cmdInput.value = "";
  renderCmds("");
  cmdInput.focus();
}
function closeCmdPalette() {
  cmdOverlay.classList.remove("open");
}

document.getElementById("open-cmd").addEventListener("click", openCmdPalette);
cmdOverlay.addEventListener("click", (e) => {
  if (e.target === cmdOverlay) closeCmdPalette();
});
cmdInput.addEventListener("input", () => renderCmds(cmdInput.value));
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    openCmdPalette();
  }
  if (e.key === "Escape") closeCmdPalette();
});

/* ── CONTACT FORM ── */
const contactForm = document.getElementById("contact-form");

if (contactForm) {
  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    let valid = true;

    const name = document.getElementById("cf-name");
    const email = document.getElementById("cf-email");
    const msg = document.getElementById("cf-msg");

    document.querySelectorAll(".form-error").forEach((el) => {
      el.style.display = "none";
    });
    [name, email, msg].forEach((el) =>
      el.setAttribute("aria-invalid", "false"),
    );

    // Validation
    if (!name.value.trim()) {
      document.getElementById("err-name").style.display = "block";
      name.setAttribute("aria-invalid", "true");
      valid = false;
    }

    if (!email.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      document.getElementById("err-email").style.display = "block";
      email.setAttribute("aria-invalid", "true");
      valid = false;
    }

    if (!msg.value.trim()) {
      document.getElementById("err-msg").style.display = "block";
      msg.setAttribute("aria-invalid", "true");
      valid = false;
    }

    if (!valid) {
      const firstInvalid = contactForm.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Loading State
    const submitBtn = this.querySelector('button[type="submit"]');

    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = "Sending...";

    try {
      await emailjs.send("service_64j4on4", "template_8sqjxyo", {
        to_email: "kunalayush30@gmail.com",
        from_name: name.value,
        from_email: email.value,
        message: msg.value,
        reply_to: email.value,
      });

      this.reset();

      this.style.display = "none";

      const success = document.getElementById("form-success");

      if (success) {
        success.style.display = "block";
      } else {
        alert("Message sent successfully!");
      }
    } catch (error) {
      console.error("Email Error:", error);

      alert("Unable to send message right now. Please try again later.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

/* ── RESUME DOWNLOAD ── */
function downloadResume() {
  const link = document.createElement("a");

  // Path to your PDF file
  link.href = "./Ayush_Kumar 2.pdf";
  // File name users will see when downloading
  link.download = "Ayush_Kumar_Resume.pdf";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
/* ── TYPING ANIMATION in terminal (subtle re-run) ── */
// Terminal is already pre-rendered for instant load; no JS needed

/* ── SMOOTH NAV ACTIVE STATE ── */
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-links a");
const navObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        navLinks.forEach((link) => {
          link.style.color =
            link.getAttribute("href") === "#" + e.target.id
              ? "var(--heading)"
              : "";
        });
      }
    });
  },
  { threshold: 0.5 },
);
sections.forEach((s) => navObs.observe(s));

/* ── DYNAMIC FOOTER YEAR ── */
const yearSpan = document.getElementById("current-year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

/* ── BLOG ARTICLES: content, modal, likes & comments ──
   Likes use localStorage (per-browser). If a public GitHub repo with
   Discussions is configured (see GISCUS_CONFIG below), real shared
   comments + reactions are loaded from Giscus; otherwise a local
   comment box (also localStorage) is shown so the page still works
   out of the box. */

const GISCUS_CONFIG = {
  enabled: false, // flip to true once the fields below are filled in
  repo: "ayushkr300/REPLACE_WITH_REPO", // "username/repo" — must be public
  repoId: "",
  category: "Announcements",
  categoryId: "",
};

const blogArticles = {
  "mcp-chatbot": {
    tag: "AI · MCP · ERPNext",
    read: "7 min read",
    date: "June 2025",
    title:
      "How I Built an AI Chatbot for ERPNext Using the Model Context Protocol",
    topics: ["Python", "MCP", "OpenAI", "Frappe"],
    body: `
      <p>Most "AI for your ERP" demos follow the same shape: bolt a chat widget onto the corner of the screen, wire it to a single API key, and call it done. It looks impressive in a five-minute demo and falls apart the moment a real user asks something the prompt wasn't written for — or worse, asks for something they don't have permission to see.</p>
      <p>When I set out to build an AI assistant for our ERPNext instance at Keepsake Automation, I wanted something closer to a real product: an assistant that could answer natural-language questions about live business data — purchase orders, stock levels, leave balances, sales figures — without ever being given a standing, unscoped door into the database.</p>
      <h3>Why not just give the LLM a database connection?</h3>
      <p>The tempting shortcut is to hand the model a SQL tool and let it write its own queries. I ruled this out almost immediately. ERPNext's permission model is woven through the framework — role-based access, user permissions, document-level restrictions — and none of that exists at the raw SQL layer. A model with direct database access would either ignore that model entirely or require me to reimplement it inside a prompt, which is exactly the kind of thing that breaks quietly in production.</p>
      <p>Instead, I built around the <strong>Model Context Protocol (MCP)</strong>, which gives the LLM a fixed set of typed tools rather than open-ended access. The model doesn't write queries — it calls <code>get_list("Sales Invoice", filters=...)</code> or <code>create_doc("ToDo", ...)</code>, and the server decides what that's allowed to mean for the logged-in user.</p>
      <h3>The architecture</h3>
      <p>The system has four single-responsibility pieces on the backend:</p>
      <ul>
        <li><strong>IntentClassifier</strong> — figures out what the user is actually asking for (a lookup, a report, a creation action) before any tool is touched.</li>
        <li><strong>EntityExtractor</strong> — pulls out the specifics: dates, document types, amounts, employee names.</li>
        <li><strong>IntentRouter</strong> — maps the classified intent to one of 120+ MCP tool categories and assembles the call.</li>
        <li><strong>ResponseFormatter</strong> — turns the raw Frappe response into something a non-technical user can read, and strips anything that looks like an internal stack trace or field name before it reaches the chat window.</li>
      </ul>
      <p>On the frontend, the widget talks to the backend over <code>frappe.realtime</code> (Socket.IO) rather than Server-Sent Events. That decision came out of a debugging session where the frontend and backend had quietly drifted apart — the UI was written assuming SSE, while the actual implementation streamed over the existing realtime layer that Frappe already runs for desk notifications. Once that mismatch was found, conversation state could live in two DocTypes, <code>Chatbot Conversation</code> and <code>Chatbot Message</code>, which made multi-turn context and per-user chat history straightforward to support.</p>
      <h3>Permission-awareness, not an afterthought</h3>
      <p>Every tool call carries the requesting user's session. If a Sales user asks for HR leave records, the MCP server's permission layer rejects the call before it ever reaches the database — the model never sees data it shouldn't, and it can't be prompted around that boundary because the boundary isn't implemented in the prompt.</p>
      <h3>What I'd do differently</h3>
      <p>I underestimated how much UX work sits on top of "the AI works." Role-aware quick actions, dark mode, voice input, dynamic autocomplete, and sanitizing raw error messages before they reach a non-technical end user all turned out to matter as much as the tool-routing logic itself. If I started over, I'd design the response-formatting layer first, not last.</p>
      <h3>Where it stands now</h3>
      <p>The assistant is live in production, used daily across HR, Sales, Accounts, Inventory, and Operations, and currently covers 120+ distinct tool categories. The next phase is expanding multi-turn reasoning so the assistant can chain several tool calls together for genuinely complex questions, rather than answering one lookup at a time.</p>
    `,
  },
  "weld-iot": {
    tag: "Industrial · IoT · AWS",
    read: "5 min read",
    date: "May 2025",
    title:
      "Factory Floor to Cloud: Designing Real-Time IoT Data Pipelines for Manufacturing",
    topics: ["AWS Lambda", "S3", "React", "IoT"],
    body: `
      <p>Our KUKA welding robots generate a steady stream of operational data — weld time, arc voltage, wire feed speed — every single shift. Before this project, that data lived in proprietary machine logs that nobody looked at unless something had already gone wrong. Quality review meant manually tracing a defect back through hours of unstructured exports. That's slow, and it's the kind of process that only catches problems after they've already shipped.</p>
      <h3>The brief</h3>
      <p>Build a pipeline that ingests robot telemetry continuously, normalizes it into something queryable, and makes it visible in close to real time — without ever losing a weld event, because a missing data point is indistinguishable from a quality issue if nobody can tell the difference later.</p>
      <h3>The pipeline</h3>
      <p>The machines export over FTP on a schedule. From there:</p>
      <ul>
        <li><strong>Ingestion</strong> — an AWS Lambda function watches for new exports and parses them as they land.</li>
        <li><strong>Raw storage</strong> — every parsed file is written to S3 untouched, so there's always a source of truth to replay from if a downstream step needs fixing.</li>
        <li><strong>Normalized store</strong> — a structured MySQL schema holds the cleaned, query-ready version: one row per weld event, joined against robot and shift metadata.</li>
        <li><strong>Dashboard</strong> — a React frontend reads from a lightweight API and renders live charts, with CloudWatch handling alerting when a reading falls outside spec.</li>
      </ul>
      <h3>The part that actually mattered: not losing data</h3>
      <p>The interesting engineering problem wasn't the happy path — it was making sure a flaky FTP transfer or a Lambda cold-start timeout couldn't silently drop a weld event. Every ingestion run is idempotent and checkpointed, so a retried run never double-counts and a failed run never disappears without a trace in CloudWatch.</p>
      <h3>Results</h3>
      <p>Quality review time dropped by roughly 40% once reviewers could query structured data instead of reading raw exports, and we get real-time alerts the moment a reading drifts out of spec — instead of finding out at the next scheduled audit.</p>
      <h3>What's next</h3>
      <p>The current dashboard is reactive — it shows you what happened. The next iteration aims to be predictive: flagging a robot trending toward an out-of-spec weld before it produces one, using the same normalized history this pipeline already collects.</p>
    `,
  },
  "erp-architecture": {
    tag: "ERPNext · Frappe · Architecture",
    read: "6 min read",
    date: "April 2025",
    title:
      "Why ERPNext Custom Apps Beat Monkey-Patching: An Upgrade-Safe Approach",
    topics: ["ERPNext", "Frappe", "Python", "Architecture"],
    body: `
      <p>After deploying 8+ custom modules to production ERPNext instances, I've settled on one rule that I don't break: never touch ERPNext core. It's tempting in the moment — a quick edit to a core file feels faster than scaffolding a whole new app — and it is faster, right up until the next <code>bench update</code> silently reverts your change or breaks in a way that takes an afternoon to trace back to a two-line edit from six months ago.</p>
      <h3>The alternative: proper Frappe apps</h3>
      <p>Frappe is built to be extended without modification, and the tooling reflects that:</p>
      <ul>
        <li><strong>Custom DocTypes</strong> — new data models that live alongside core ones, versioned in your own app, fully respecting the framework's permission and workflow systems.</li>
        <li><strong>Server scripts and hooks</strong> — instead of editing a core controller, you hook into the lifecycle events it already exposes (<code>validate</code>, <code>on_submit</code>, <code>before_save</code>) from your own namespace.</li>
        <li><strong>Custom print formats via Jinja</strong> — industry-specific document layouts without touching the rendering engine itself.</li>
      </ul>
      <p>Every customization for a manufacturing client — approval chains across four departments, bespoke print formats matching compliance requirements, email/SMS triggers on workflow transitions — was built this way, inside the <code>addon</code> app namespace, with zero edits to ERPNext's own source.</p>
      <h3>Why this matters more than it seems to</h3>
      <p>The benefit isn't visible on day one. It shows up a year later, when an upgrade that would otherwise be a multi-day merge-conflict exercise becomes a non-event, because nothing you built was ever in the part of the codebase that changed. Clients who've been burned by a previous vendor's monkey-patches tend to understand this instantly once you explain it; the ones who haven't yet usually do after their first painful upgrade.</p>
      <h3>The trade-off</h3>
      <p>It is occasionally slower up front. Building a proper DocType and hook structure takes more scaffolding than editing three lines in a core file. I've made peace with that trade — the slower path is the one that's still standing after the framework's next major release.</p>
      <h3>A rule of thumb</h3>
      <p>If a customization can't be expressed as a new app, a hook, a server script, or a client script, it usually means the requirement needs to be reshaped — not that core needs to be opened up. In every project so far, that's held.</p>
    `,
  },
};

let blogModalLastFocused = null;

function renderBlogArticle(slug) {
  const data = blogArticles[slug];
  if (!data) return;

  const modal = document.getElementById("blog-modal");
  const modalBody = document.getElementById("blog-modal-body");
  if (!modal || !modalBody) return;

  // Remember whatever had focus (the blog card / key press) so it can be
  // restored when the modal closes — required for proper keyboard a11y.
  blogModalLastFocused = document.activeElement;

  modalBody.innerHTML = `
    <div class="blog-modal-header">
      <span class="blog-tag">${data.tag}</span>
      <span class="blog-read"><i class="fa fa-clock"></i> ${data.read}</span>
    </div>
    <h2 class="blog-modal-title" id="blog-modal-heading">${data.title}</h2>
    <div class="blog-modal-meta"><i class="fa fa-calendar"></i> ${data.date}</div>
    <div class="blog-modal-body-text">${data.body}</div>
    <div class="blog-topics blog-modal-topics">
      ${data.topics.map((t) => `<span>${t}</span>`).join("")}
    </div>
    <div class="blog-engagement">
      <button class="blog-like-btn" id="blog-like-btn" data-slug="${slug}">
        <i class="fa fa-heart"></i> <span id="blog-like-count">0</span>
      </button>
      <span class="blog-like-hint">Liked locally in your browser</span>
    </div>
    <div class="blog-comments" id="blog-comments-mount"></div>
  `;

  setupLikeButton(slug);
  setupComments(slug);

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  // BUG FIX (part 2): a display:none element silently retains its old
  // scroll offset and re-applies it once it becomes visible again, even
  // if scrollTop was set to 0 while still hidden. So the reset has to
  // happen on the next frame, *after* the "open" class has actually made
  // the modal visible — otherwise the browser overwrites it right back.
  requestAnimationFrame(() => {
    modalBody.scrollTop = 0;
  });

  // Focus management: move focus into the dialog and trap Tab navigation
  // inside it while open, per standard modal a11y practice.
  const closeBtn = document.getElementById("blog-modal-close");
  if (closeBtn) closeBtn.focus();
  document.addEventListener("keydown", trapBlogModalFocus);
}

function trapBlogModalFocus(e) {
  if (e.key !== "Tab") return;
  const modal = document.getElementById("blog-modal");
  if (!modal || !modal.classList.contains("open")) return;

  const focusable = modal.querySelectorAll(
    'button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
  );
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function closeBlogModal() {
  const modal = document.getElementById("blog-modal");
  const modalBody = document.getElementById("blog-modal-body");
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  document.removeEventListener("keydown", trapBlogModalFocus);

  // Reset scroll defensively too, in case open is ever triggered
  // programmatically without going through renderBlogArticle.
  if (modalBody) modalBody.scrollTop = 0;

  // Return focus to whatever opened the modal (the blog card), so
  // keyboard users don't lose their place on the page.
  if (
    blogModalLastFocused &&
    typeof blogModalLastFocused.focus === "function"
  ) {
    blogModalLastFocused.focus();
  }
  blogModalLastFocused = null;
}

/* Likes — localStorage, per browser */
function getLikeStore() {
  try {
    return JSON.parse(localStorage.getItem("blogLikes") || "{}");
  } catch (e) {
    return {};
  }
}

function setupLikeButton(slug) {
  const btn = document.getElementById("blog-like-btn");
  const countEl = document.getElementById("blog-like-count");
  if (!btn || !countEl) return;

  const store = getLikeStore();
  const entry = store[slug] || { count: 0, likedByMe: false };
  countEl.textContent = entry.count;
  btn.classList.toggle("liked", entry.likedByMe);

  btn.addEventListener("click", () => {
    const store = getLikeStore();
    const entry = store[slug] || { count: 0, likedByMe: false };
    if (entry.likedByMe) {
      entry.count = Math.max(0, entry.count - 1);
      entry.likedByMe = false;
    } else {
      entry.count += 1;
      entry.likedByMe = true;
    }
    store[slug] = entry;
    localStorage.setItem("blogLikes", JSON.stringify(store));
    countEl.textContent = entry.count;
    btn.classList.toggle("liked", entry.likedByMe);
  });
}

/* Comments — Giscus if configured, else a local fallback box (localStorage) */
function setupComments(slug) {
  const mount = document.getElementById("blog-comments-mount");
  if (!mount) return;

  if (
    GISCUS_CONFIG.enabled &&
    GISCUS_CONFIG.repo &&
    GISCUS_CONFIG.repoId &&
    GISCUS_CONFIG.categoryId
  ) {
    mount.innerHTML = `<h4 class="blog-comments-title">Discussion</h4><div class="giscus-mount"></div>`;
    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", GISCUS_CONFIG.repo);
    script.setAttribute("data-repo-id", GISCUS_CONFIG.repoId);
    script.setAttribute("data-category", GISCUS_CONFIG.category);
    script.setAttribute("data-category-id", GISCUS_CONFIG.categoryId);
    script.setAttribute("data-mapping", "specific");
    script.setAttribute("data-term", slug);
    script.setAttribute("data-strict", "1");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute(
      "data-theme",
      document.documentElement.getAttribute("data-theme") === "light"
        ? "light"
        : "dark_dimmed",
    );
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;
    mount.querySelector(".giscus-mount").appendChild(script);
    return;
  }

  // Local fallback: comments stored per-browser in localStorage
  mount.innerHTML = `
    <h4 class="blog-comments-title">Comments</h4>
    <p class="blog-comments-note">Comments are saved in your browser on this device — they won't appear for other visitors yet.</p>
    <form class="comment-form" id="comment-form">
      <input type="text" id="comment-name" placeholder="Your name" required />
      <textarea id="comment-text" placeholder="Share a thought..." required></textarea>
      <button type="submit" class="btn-primary"><i class="fa fa-paper-plane"></i> Post comment</button>
    </form>
    <div class="comment-list" id="comment-list"></div>
  `;

  function getCommentStore() {
    try {
      return JSON.parse(localStorage.getItem("blogComments") || "{}");
    } catch (e) {
      return {};
    }
  }

  function renderComments() {
    const store = getCommentStore();
    const list = store[slug] || [];
    const listEl = document.getElementById("comment-list");
    if (!listEl) return;
    if (!list.length) {
      listEl.innerHTML = `<p class="comment-empty">No comments yet — be the first to share a thought.</p>`;
      return;
    }
    listEl.innerHTML = list
      .map(
        (c) => `
        <div class="comment-item">
          <div class="comment-avatar">${(c.name || "?").trim().charAt(0).toUpperCase()}</div>
          <div class="comment-body">
            <div class="comment-meta"><strong>${escapeHtml(c.name)}</strong><span>${c.date}</span></div>
            <p>${escapeHtml(c.text)}</p>
          </div>
        </div>`,
      )
      .join("");
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  renderComments();

  const form = document.getElementById("comment-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("comment-name").value.trim();
    const text = document.getElementById("comment-text").value.trim();
    if (!name || !text) return;

    const store = getCommentStore();
    if (!store[slug]) store[slug] = [];
    store[slug].push({
      name,
      text,
      date: new Date().toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    });
    localStorage.setItem("blogComments", JSON.stringify(store));
    form.reset();
    renderComments();
  });
}

document.querySelectorAll(".blog-card").forEach((card) => {
  card.addEventListener("click", () => {
    const slug = card.dataset.slug;
    if (slug) renderBlogArticle(slug);
  });
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      card.click();
    }
  });
});

const blogModalCloseBtn = document.getElementById("blog-modal-close");
if (blogModalCloseBtn)
  blogModalCloseBtn.addEventListener("click", closeBlogModal);

const blogModalOverlay = document.getElementById("blog-modal");
if (blogModalOverlay) {
  blogModalOverlay.addEventListener("click", (e) => {
    if (e.target === blogModalOverlay) closeBlogModal();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeBlogModal();
});

/* ── CHATBOT WIDGET LOGIC ── */
const chatbotWidget = document.getElementById("chatbot-widget");
const chatbotFab = document.getElementById("chatbot-fab");
const chatbotCloseBtn = document.getElementById("chatbot-close-btn");
const chatbotBody = document.getElementById("chatbot-body");
const chatSuggBtns = document.querySelectorAll(".chat-sugg-btn");

if (chatbotFab) {
  chatbotFab.addEventListener("click", () => {
    chatbotWidget.classList.add("open");
    chatbotFab.classList.add("hidden");
  });
}

if (chatbotCloseBtn) {
  chatbotCloseBtn.addEventListener("click", () => {
    chatbotWidget.classList.remove("open");
    chatbotFab.classList.remove("hidden");
  });
}

function addChatMessage(text, sender) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `chat-msg ${sender}`;
  msgDiv.textContent = text;
  const suggestions = document.getElementById("chat-suggestions");
  if (suggestions) {
    chatbotBody.insertBefore(msgDiv, suggestions);
  } else {
    chatbotBody.appendChild(msgDiv);
  }
  chatbotBody.scrollTop = chatbotBody.scrollHeight;
}

const chatResponses = {
  "Show me all open POs this month":
    "Found 14 open POs totalling ₹4.2L. Top supplier: Tata Steel (3 orders). 2 are overdue by >7 days.",
  "What is the current stock level for Item A?":
    "Item A: 450 units in stock. Reorder level: 500 units. Warehouse: Stores - KA. Last receipt: 3 days ago.",
  "List overdue Sales Invoices above 1 Lakh":
    "Found 7 unpaid invoices totalling ₹12.4L. Oldest: INV-2025-0041 (34 days overdue, customer: Apex Industries).",
  "Show employee leave balance for this quarter":
    "You have 8 Casual Leaves remaining, 4 Sick Leaves, and 2 Privilege Leaves for Q2 2025.",
  "What are the top 5 selling items this year?":
    "1. Steel Plates — ₹28L\n2. Welding Rods — ₹19L\n3. Industrial Paint — ₹15L\n4. Fasteners — ₹12L\n5. Safety Helmets — ₹9L",
  "Create a new ToDo for follow-up with client":
    "✅ Created ToDo: 'Follow-up with client' assigned to you, due in 3 days. Priority: Medium.",
};

chatSuggBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const query = btn.dataset.query;
    addChatMessage(query, "user");
    btn.style.display = "none";

    setTimeout(() => {
      const response =
        chatResponses[query] ||
        "Processing your request... Data fetched successfully from ERPNext.";
      addChatMessage(response, "ai");
    }, 1200);
  });
});
