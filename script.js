(function () {
  "use strict";

  /* ── Admin auth ── */
  var ADMIN_USERNAME = "admin";
  var ADMIN_PASSWORD_HASH =
    "28b5ac77a74654a8f388c1961226883e2e4f1de12c31624a476e34fe59e3e4c3";
  var ADMIN_RECOVERY_PASSWORD_HASH =
    "a36aef5a11c4073fbe60314fc9df530a9d5f986533594d1f5190742ff9e0e408";

  function sha256Hex(text) {
    return crypto.subtle
      .digest("SHA-256", new TextEncoder().encode(text))
      .then(function (buf) {
        return [...new Uint8Array(buf)]
          .map(function (b) {
            return b.toString(16).padStart(2, "0");
          })
          .join("");
      });
  }

  var loginGate = document.getElementById("login-gate");
  var sessionBar = document.getElementById("session-bar");
  var panelContent = document.getElementById("panel-content");
  var loginForm = document.getElementById("login-form");
  var loginError = document.getElementById("login-error");

  function showUnlocked(u) {
    loginGate.style.display = "none";
    sessionBar.style.display = "flex";
    panelContent.style.display = "block";
    document.getElementById("session-user").textContent = u;
  }
  function showLocked() {
    loginGate.style.display = "block";
    sessionBar.style.display = "none";
    panelContent.style.display = "none";
    loginForm.reset();
    loginError.textContent = "";
    document.getElementById("forgot-hint").hidden = true;
  }

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var u = document.getElementById("login-username").value.trim();
    var p = document.getElementById("login-password").value;
    var btn = loginForm.querySelector(".login-btn");
    btn.disabled = true;
    sha256Hex(p)
      .then(function (hash) {
        btn.disabled = false;
        if (
          u === ADMIN_USERNAME &&
          (hash === ADMIN_PASSWORD_HASH ||
            hash === ADMIN_RECOVERY_PASSWORD_HASH)
        ) {
          loginError.textContent = "";
          showUnlocked(u);
        } else {
          loginError.textContent = "Incorrect username or password.";
        }
      })
      .catch(function () {
        btn.disabled = false;
        loginError.textContent = "Could not verify in this browser.";
      });
  });
  document.getElementById("logout-btn").addEventListener("click", showLocked);
  document.getElementById("forgot-link").addEventListener("click", function () {
    var h = document.getElementById("forgot-hint");
    h.hidden = !h.hidden;
  });
  showLocked();

  /* ── State ── */
  var state = {
    fixtures: [
      { team1: "Sky Riders", team2: "Royal Elevens", ground: "Sky" },
      { team1: "Blinks", team2: "V Tamiln's", ground: "Chennai" },
      { team1: "Rayyan Warriors", team2: "MCC", ground: "Blinks" },
      { team1: "FFC", team2: "My Elevens", ground: "FFC" },
    ],
    logoLeft: null, // HTMLImageObject when loaded
    logoRight: null,
  };

  /* ── Logo canvas rendering ──
     We draw the uploaded image onto a <canvas> clipped to a circle.
     This works identically on screen and in html2canvas export. */
  function drawCircularLogo(canvasEl, imgObj) {
    var SIZE = 144; // 72px display × 2 for sharpness
    canvasEl.width = SIZE;
    canvasEl.height = SIZE;
    var ctx = canvasEl.getContext("2d");
    ctx.clearRect(0, 0, SIZE, SIZE);
    // Clip to circle
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    // White background so transparent PNG areas look clean
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, SIZE, SIZE);
    // Draw image fitting the full circle
    ctx.drawImage(imgObj, 0, 0, SIZE, SIZE);
  }

  function loadLogoIntoCanvas(file, canvasId, fallbackId) {
    if (!file) return;
    var img = new Image();
    var reader = new FileReader();
    reader.onload = function (ev) {
      img.onload = function () {
        var cv = document.getElementById(canvasId);
        drawCircularLogo(cv, img);
        cv.style.display = "block";
        document.getElementById(fallbackId).style.display = "none";
        // Store for re-draw if needed
        if (canvasId === "logoLeftCanvas") state.logoLeft = img;
        if (canvasId === "logoRightCanvas") state.logoRight = img;
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  /* ── Pre-load default left badge (K-TIC Premier League logo) ── */
  (function () {
    var img = new Image();
    img.onload = function () {
      var cv = document.getElementById("logoLeftCanvas");
      if (cv) {
        drawCircularLogo(cv, img);
        cv.style.display = "block";
      }
      var fb = document.getElementById("logoLeftFallback");
      if (fb) fb.style.display = "none";
      state.logoLeft = img;
    };
    // ktic logo

    img.src = "ktic1.png";
  })();

  (function () {
    var img = new Image();
    img.onload = function () {
      var cv = document.getElementById("logoRightCanvas");
      if (cv) {
        drawCircularLogo(cv, img);
        cv.style.display = "block";
      }
      var fb = document.getElementById("logoRightFallback");
      if (fb) fb.style.display = "none";
      state.logoLeft = img;
    };

    // rw logo

    img.src = "rw.png";
  })();

  document
    .getElementById("upload-left")
    .addEventListener("change", function (e) {
      loadLogoIntoCanvas(
        e.target.files && e.target.files[0],
        "logoLeftCanvas",
        "logoLeftFallback",
      );
    });
  document
    .getElementById("upload-right")
    .addEventListener("change", function (e) {
      loadLogoIntoCanvas(
        e.target.files && e.target.files[0],
        "logoRightCanvas",
        "logoRightFallback",
      );
    });

  /* ── Text bindings ── */
  function bindText(inputId, outId) {
    var inp = document.getElementById(inputId);
    var out = document.getElementById(outId);
    inp.addEventListener("input", function () {
      out.textContent = inp.value;
    });
  }
  bindText("in-presents", "out-presents");
  bindText("in-headline", "out-headline");
  bindText("in-tagline", "out-tagline");
  bindText("in-date", "out-date");
  bindText("in-matchlabel", "out-matchlabel");
  bindText("in-time", "out-time");

  document
    .getElementById("in-headline")
    .addEventListener("input", function (e) {
      var v = e.target.value || "K-TIC";
      document.getElementById("out-watermark").textContent = v;
      document.getElementById("logoLeftFallback").textContent =
        v.charAt(0).toUpperCase() || "K";
    });

  /* ── Fixtures ── */
  function buildPosterFixtureRow(f, i) {
    var row = document.createElement("div");
    row.className = "fixture-row " + (i % 2 === 0 ? "alt-a" : "alt-b");
    var teams = document.createElement("div");
    teams.className = "fixture-teams";
    var t1 = document.createElement("span");
    t1.className = "team team-a";
    t1.textContent = f.team1 || "Team A";
    var vs = document.createElement("span");
    vs.className = "vs-badge";
    vs.textContent = "VS";
    var t2 = document.createElement("span");
    t2.className = "team team-b";
    t2.textContent = f.team2 || "Team B";
    teams.appendChild(t1);
    teams.appendChild(vs);
    teams.appendChild(t2);
    var ground = document.createElement("div");
    ground.className = "fixture-ground";
    ground.textContent = "Ground - " + (f.ground || "TBD");
    row.appendChild(teams);
    row.appendChild(ground);
    return row;
  }
  function renderPosterFixtures() {
    var wrap = document.getElementById("out-fixtures");
    wrap.replaceChildren();
    if (!state.fixtures.length) {
      var e = document.createElement("div");
      e.className = "fixtures-empty";
      e.textContent = "Add a fixture to see it here.";
      wrap.appendChild(e);
      return;
    }
    state.fixtures.forEach(function (f, i) {
      wrap.appendChild(buildPosterFixtureRow(f, i));
    });
  }
  function updateFixtureCount() {
    var n = state.fixtures.length;
    document.getElementById("fixture-count").textContent =
      n + (n === 1 ? " FIXTURE SET" : " FIXTURES SET");
  }
  function makeLabeledInput(label, val, cb) {
    var l = document.createElement("label");
    l.className = "field";
    var s = document.createElement("span");
    s.textContent = label;
    var inp = document.createElement("input");
    inp.type = "text";
    inp.value = val;
    inp.addEventListener("input", function (e) {
      cb(e.target.value);
    });
    l.appendChild(s);
    l.appendChild(inp);
    return l;
  }
  function renderFixtureEditor() {
    var wrap = document.getElementById("fixture-editor");
    wrap.replaceChildren();
    state.fixtures.forEach(function (f, i) {
      var card = document.createElement("div");
      card.className = "fixture-edit-row";
      var top = document.createElement("div");
      top.className = "row-top";
      var strong = document.createElement("strong");
      strong.textContent = "Fixture " + (i + 1);
      var rm = document.createElement("button");
      rm.type = "button";
      rm.className = "remove-btn";
      rm.textContent = "Remove";
      rm.addEventListener("click", function () {
        state.fixtures.splice(i, 1);
        renderFixtureEditor();
        renderPosterFixtures();
        updateFixtureCount();
      });
      top.appendChild(strong);
      top.appendChild(rm);
      card.appendChild(top);
      var two = document.createElement("div");
      two.className = "two-col";
      two.appendChild(
        makeLabeledInput("Team 1", f.team1, function (v) {
          f.team1 = v;
          renderPosterFixtures();
        }),
      );
      two.appendChild(
        makeLabeledInput("Team 2", f.team2, function (v) {
          f.team2 = v;
          renderPosterFixtures();
        }),
      );
      card.appendChild(two);
      card.appendChild(
        makeLabeledInput("Ground", f.ground, function (v) {
          f.ground = v;
          renderPosterFixtures();
        }),
      );
      wrap.appendChild(card);
    });
  }
  document.getElementById("add-fixture").addEventListener("click", function () {
    state.fixtures.push({ team1: "Team A", team2: "Team B", ground: "TBD" });
    renderFixtureEditor();
    renderPosterFixtures();
    updateFixtureCount();
  });
  renderFixtureEditor();
  renderPosterFixtures();
  updateFixtureCount();

  /* ── Colors ── */
  function bindColor(id, cssVar) {
    document.getElementById(id).addEventListener("input", function (e) {
      document.documentElement.style.setProperty(cssVar, e.target.value);
    });
  }
  bindColor("color-accent", "--lime");
  bindColor("color-panel", "--forest-mid");
  bindColor("color-bg", "--forest-dark");
  bindColor("color-gold", "--gold");

  /* ── Export ── */
  document
    .getElementById("download-btn")
    .addEventListener("click", function () {
      var status = document.getElementById("download-status");
      status.textContent = "Rendering image…";
      var node = document.getElementById("poster");

      html2canvas(node, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#0f2a0a",
        logging: false,
        onclone: function (clonedDoc, clonedEl) {
          /* 1. Re-draw circular logos in the clone using stored image objects */
          ["Left", "Right"].forEach(function (side) {
            var imgObj = state["logo" + side];
            var cv = clonedDoc.getElementById("logo" + side + "Canvas");
            var fb = clonedDoc.getElementById("logo" + side + "Fallback");
            if (imgObj && cv) {
              drawCircularLogo(cv, imgObj);
              cv.style.display = "block";
              if (fb) fb.style.display = "none";
            }
          });

          /* 2. Flatten unsupported CSS for html2canvas */
          var fix = clonedDoc.createElement("style");
          fix.textContent = [
            ".headline{",
            "  background:none !important;",
            "  -webkit-background-clip:unset !important;",
            "  background-clip:unset !important;",
            "  color:#4cd400 !important;",
            "  text-shadow:none !important;",
            "  -webkit-text-stroke:3px #1a6600 !important;",
            "  animation:none !important;",
            "}",
            ".presents{",
            "  background:none !important;",
            "  -webkit-background-clip:unset !important;",
            "  background-clip:unset !important;",
            "  color:#ffb648 !important;",
            "}",
            ".poster{",
            "  background:linear-gradient(165deg,#163a0f,#0f2a0a 70%) !important;",
            "}",
          ].join("\n");
          clonedDoc.head.appendChild(fix);
        },
      })
        .then(function (canvas) {
          var link = document.createElement("a");
          var name = (document.getElementById("in-headline").value || "poster")
            .trim()
            .replace(/\s+/g, "-");
          link.download = name + "-poster.jpeg";
          link.href = canvas.toDataURL("image/jpeg", 0.92);
          link.click();
          status.textContent = "Downloaded ✓";
        })
        .catch(function (err) {
          console.error("Export error:", err);
          status.textContent = "Could not render — try a different browser.";
        });
    });
})();
