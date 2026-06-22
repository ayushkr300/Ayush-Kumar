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
themeBtn.addEventListener("click", () => {
  const html = document.documentElement;
  const isDark = html.getAttribute("data-theme") === "dark";
  html.setAttribute("data-theme", isDark ? "light" : "dark");
  themeBtn.innerHTML = isDark
    ? '<i class="fa fa-sun"></i>'
    : '<i class="fa fa-moon"></i>';
});

/* ── MOBILE NAV ── */
const hamburger = document.getElementById("hamburger");
const mobileNav = document.getElementById("mobile-nav");
hamburger.addEventListener("click", () => mobileNav.classList.toggle("open"));
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

/* ── SKILL BAR ANIMATION ── */
const skillBars = document.querySelectorAll(".skill-bar");
const barObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.style.width = e.target.dataset.w + "%";
        barObs.unobserve(e.target);
      }
    });
  },
  { threshold: 0.1 },
);
skillBars.forEach((b) => barObs.observe(b));

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
    href: "https://github.com/ayushkumar",
    ext: true,
    cat: "Links",
  },
  {
    label: "LinkedIn",
    icon: "fab fa-linkedin",
    href: "https://linkedin.com/in/ayushkumar",
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
      else if (item.dataset.ext === "true") window.open(href, "_blank");
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

    // Validation
    if (!name.value.trim()) {
      document.getElementById("err-name").style.display = "block";
      valid = false;
    }

    if (!email.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      document.getElementById("err-email").style.display = "block";
      valid = false;
    }

    if (!msg.value.trim()) {
      document.getElementById("err-msg").style.display = "block";
      valid = false;
    }

    if (!valid) return;

    // Loading State
    const submitBtn = this.querySelector('button[type="submit"]');

    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = "Sending...";

    try {
      await emailjs.send(
        "service_64j4on4",
        "template_8sqjxyo",
        {
          to_email: "kunalayush30@gmail.com",
          from_name: name.value,
          from_email: email.value,
          message: msg.value,
          reply_to: email.value,
        }
      );

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

      alert(
        "Unable to send message right now. Please try again later."
      );
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
