(function(){
  "use strict";

  /* ---------- Admin access ----------
     Front-end-only gate, meant to keep casual visitors from editing
     by accident — not a real security boundary (see note below the
     login form in the page, and the message Claude gave alongside
     this file). Both passwords below are stored as SHA-256 hashes,
     not plain text, so neither appears if someone reads this file's
     source. To set a new main password: open any browser console
     and run
       crypto.subtle.digest("SHA-256", new TextEncoder().encode("yourNewPassword"))
         .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2,"0")).join("")))
     then paste the resulting hex string in as ADMIN_PASSWORD_HASH below.
     ADMIN_RECOVERY_PASSWORD_HASH is a standing "forgot password" fallback —
     anyone who knows that password can also sign in. Generate its hash
     the same way and swap it out any time you want a different recovery
     password. */
  var ADMIN_USERNAME = "admin";
  var ADMIN_PASSWORD_HASH = "28b5ac77a74654a8f388c1961226883e2e4f1de12c31624a476e34fe59e3e4c3";
  var ADMIN_RECOVERY_PASSWORD_HASH = "a36aef5a11c4073fbe60314fc9df530a9d5f986533594d1f5190742ff9e0e408";

  function sha256Hex(text){
    var data = new TextEncoder().encode(text);
    return crypto.subtle.digest("SHA-256", data).then(function(buf){
      return Array.prototype.map.call(new Uint8Array(buf), function(b){
        return b.toString(16).padStart(2, "0");
      }).join("");
    });
  }

  var loginGate = document.getElementById("login-gate");
  var sessionBar = document.getElementById("session-bar");
  var panelContent = document.getElementById("panel-content");
  var loginForm = document.getElementById("login-form");
  var loginError = document.getElementById("login-error");

  function showUnlocked(username){
    loginGate.style.display = "none";
    sessionBar.style.display = "flex";
    panelContent.style.display = "block";
    document.getElementById("session-user").textContent = username;
  }
  function showLocked(){
    loginGate.style.display = "block";
    sessionBar.style.display = "none";
    panelContent.style.display = "none";
    loginForm.reset();
    loginError.textContent = "";
    document.getElementById("forgot-hint").hidden = true;
  }

  loginForm.addEventListener("submit", function(e){
    e.preventDefault();
    var u = document.getElementById("login-username").value.trim();
    var p = document.getElementById("login-password").value;
    var submitBtn = loginForm.querySelector(".login-btn");
    submitBtn.disabled = true;
    sha256Hex(p).then(function(hash){
      submitBtn.disabled = false;
      if (u === ADMIN_USERNAME && (hash === ADMIN_PASSWORD_HASH || hash === ADMIN_RECOVERY_PASSWORD_HASH)){
        loginError.textContent = "";
        showUnlocked(u);
      } else {
        loginError.textContent = "Incorrect username or password.";
      }
    }).catch(function(){
      submitBtn.disabled = false;
      loginError.textContent = "Could not verify in this browser.";
    });
  });

  document.getElementById("logout-btn").addEventListener("click", showLocked);

  document.getElementById("forgot-link").addEventListener("click", function(){
    var hint = document.getElementById("forgot-hint");
    hint.hidden = !hint.hidden;
  });

  showLocked();

  var state = {
    fixtures: [
      { team1:"Sky Riders", team2:"Royal Elevens", ground:"Sky" },
      { team1:"Blinks", team2:"V Tamiln's", ground:"Chennai" },
      { team1:"Rayyan Warriors", team2:"MCC", ground:"Blinks" },
      { team1:"FFC", team2:"My Elevens", ground:"FFC" }
    ]
  };

  /* ---------- simple text bindings ---------- */
  function bindText(inputId, outId){
    var input = document.getElementById(inputId);
    var out = document.getElementById(outId);
    input.addEventListener("input", function(){
      out.textContent = input.value;
    });
  }
  bindText("in-presents", "out-presents");
  bindText("in-headline", "out-headline");
  bindText("in-tagline", "out-tagline");
  bindText("in-date", "out-date");
  bindText("in-matchlabel", "out-matchlabel");
  bindText("in-time", "out-time");

  // headline also drives the watermark + left badge fallback letter
  document.getElementById("in-headline").addEventListener("input", function(e){
    var v = e.target.value || "K-TIC";
    document.getElementById("out-watermark").textContent = v;
    document.getElementById("logoLeftFallback").textContent = v.charAt(0).toUpperCase() || "K";
  });

  /* ---------- fixtures ---------- */
  function buildPosterFixtureRow(f, i){
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

  function renderPosterFixtures(){
    var wrap = document.getElementById("out-fixtures");
    wrap.replaceChildren();
    if (state.fixtures.length === 0){
      var empty = document.createElement("div");
      empty.className = "fixtures-empty";
      empty.textContent = "Add a fixture to see it here.";
      wrap.appendChild(empty);
      return;
    }
    state.fixtures.forEach(function(f, i){
      wrap.appendChild(buildPosterFixtureRow(f, i));
    });
  }

  function updateFixtureCount(){
    var n = state.fixtures.length;
    document.getElementById("fixture-count").textContent =
      n + (n === 1 ? " FIXTURE SET" : " FIXTURES SET");
  }

  function makeLabeledInput(labelText, value, onInput){
    var label = document.createElement("label");
    label.className = "field";
    var span = document.createElement("span");
    span.textContent = labelText;
    var input = document.createElement("input");
    input.type = "text";
    input.value = value;
    input.addEventListener("input", function(e){ onInput(e.target.value); });
    label.appendChild(span);
    label.appendChild(input);
    return label;
  }

  function renderFixtureEditor(){
    var wrap = document.getElementById("fixture-editor");
    wrap.replaceChildren();

    state.fixtures.forEach(function(f, i){
      var card = document.createElement("div");
      card.className = "fixture-edit-row";

      var top = document.createElement("div");
      top.className = "row-top";
      var strong = document.createElement("strong");
      strong.textContent = "Fixture " + (i + 1);
      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "remove-btn";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", function(){
        state.fixtures.splice(i, 1);
        renderFixtureEditor();
        renderPosterFixtures();
        updateFixtureCount();
      });
      top.appendChild(strong);
      top.appendChild(removeBtn);
      card.appendChild(top);

      var twoCol = document.createElement("div");
      twoCol.className = "two-col";
      twoCol.appendChild(makeLabeledInput("Team 1", f.team1, function(v){
        f.team1 = v;
        renderPosterFixtures();
      }));
      twoCol.appendChild(makeLabeledInput("Team 2", f.team2, function(v){
        f.team2 = v;
        renderPosterFixtures();
      }));
      card.appendChild(twoCol);

      card.appendChild(makeLabeledInput("Ground", f.ground, function(v){
        f.ground = v;
        renderPosterFixtures();
      }));

      wrap.appendChild(card);
    });
  }

  document.getElementById("add-fixture").addEventListener("click", function(){
    state.fixtures.push({ team1:"Team A", team2:"Team B", ground:"TBD" });
    renderFixtureEditor();
    renderPosterFixtures();
    updateFixtureCount();
  });

  renderFixtureEditor();
  renderPosterFixtures();
  updateFixtureCount();

  /* ---------- logo uploads ---------- */
  function bindUpload(inputId, imgId, fallbackId){
    document.getElementById(inputId).addEventListener("change", function(e){
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev){
        var img = document.getElementById(imgId);
        img.src = ev.target.result;
        img.style.display = "block";
        document.getElementById(fallbackId).style.display = "none";
      };
      reader.readAsDataURL(file);
    });
  }
  bindUpload("upload-left", "logoLeftImg", "logoLeftFallback");
  bindUpload("upload-right", "logoRightImg", "logoRightFallback");

  /* ---------- colors ---------- */
  function bindColor(inputId, cssVar){
    document.getElementById(inputId).addEventListener("input", function(e){
      document.documentElement.style.setProperty(cssVar, e.target.value);
    });
  }
  bindColor("color-accent", "--lime");
  bindColor("color-panel", "--forest-mid");
  bindColor("color-bg", "--forest-dark");
  bindColor("color-gold", "--gold");

  /* ---------- export ---------- */
  document.getElementById("download-btn").addEventListener("click", function(){
    var status = document.getElementById("download-status");
    status.textContent = "Rendering image…";
    var node = document.getElementById("poster");
    html2canvas(node, { scale:2, useCORS:true, backgroundColor:null }).then(function(canvas){
      var link = document.createElement("a");
      var name = (document.getElementById("in-headline").value || "poster").trim().replace(/\s+/g, "-");
      link.download = name + "-poster.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      status.textContent = "Downloaded.";
    }).catch(function(){
      status.textContent = "Could not render the image in this browser.";
    });
  });

})();
