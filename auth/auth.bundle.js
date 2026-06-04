(() => {
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });

  // auth/auth.js
  var import_firebase_app = __require("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
  var import_firebase_auth = __require("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
  var import_firebase_firestore = __require("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  var firebaseConfig = {
    apiKey: "AIzaSyBf2yI-zylLxYVW1TrhSBMeT1Cf2drqvzg",
    authDomain: "career-iq-ai.firebaseapp.com",
    projectId: "career-iq-ai",
    storageBucket: "career-iq-ai.firebasestorage.app",
    messagingSenderId: "554829620784",
    appId: "1:554829620784:web:787e5918ff3f149334aff5",
    measurementId: "G-1SD3X3J1NC"
  };
  var app = (0, import_firebase_app.initializeApp)(firebaseConfig);
  var auth = (0, import_firebase_auth.getAuth)(app);
  var db = (0, import_firebase_firestore.getFirestore)(app);
  var currentSession = null;
  var _authReadyCallback = null;
  var authReady = new Promise((resolve) => {
    _authReadyCallback = resolve;
  });
  (0, import_firebase_auth.onAuthStateChanged)(auth, async (user) => {
    if (user) {
      const email = user.email || "";
      const domain = email.includes("@") ? email.split("@")[1] : null;
      let role = "user";
      if (email.includes("admin")) {
        role = "admin";
      } else {
        try {
          const userDoc = await (0, import_firebase_firestore.getDoc)((0, import_firebase_firestore.doc)(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().role) {
            role = userDoc.data().role;
          }
        } catch (e) {
          console.warn("Could not fetch user role", e);
        }
      }
      currentSession = {
        user: {
          id: user.uid,
          uid: user.uid,
          email: user.email,
          name: user.displayName || email.split("@")[0],
          picture: user.photoURL,
          domain,
          role,
          verified: user.emailVerified
        }
      };
    } else {
      currentSession = null;
    }
    _authReadyCallback(currentSession);
  });
  var Storage = {
    get: (key) => {
      try {
        return JSON.parse(localStorage.getItem(`careeriq_${key}`));
      } catch {
        return null;
      }
    },
    set: (key, val) => localStorage.setItem(`careeriq_${key}`, JSON.stringify(val)),
    remove: (key) => localStorage.removeItem(`careeriq_${key}`)
  };
  var getDomains = async () => {
    try {
      const q = (0, import_firebase_firestore.query)((0, import_firebase_firestore.collection)(db, "allowed_domains"), (0, import_firebase_firestore.orderBy)("createdAt", "desc"));
      const snap = await (0, import_firebase_firestore.getDocs)(q);
      if (snap.empty) {
        return [
          { id: "1", domain: "vit.ac.in", is_active: true, org_name: "VIT University", org_logo: "\u{1F393}" },
          { id: "2", domain: "vitstudent.ac.in", is_active: true, org_name: "VIT Student Portal", org_logo: "\u{1F4DA}" },
          { id: "3", domain: "vitfaculty.ac.in", is_active: true, org_name: "VIT Faculty Portal", org_logo: "\u{1F3EB}" }
        ];
      }
      return snap.docs.map((doc2) => ({ id: doc2.id, ...doc2.data() }));
    } catch (error) {
      console.error("Error getting domains", error);
      return [
        { id: "1", domain: "vit.ac.in", is_active: true, org_name: "VIT University", org_logo: "\u{1F393}" },
        { id: "2", domain: "vitstudent.ac.in", is_active: true, org_name: "VIT Student Portal", org_logo: "\u{1F4DA}" }
      ];
    }
  };
  var addDomain = async (domain, orgName = "") => {
    try {
      const q = (0, import_firebase_firestore.query)((0, import_firebase_firestore.collection)(db, "allowed_domains"), (0, import_firebase_firestore.where)("domain", "==", domain));
      const existSnap = await (0, import_firebase_firestore.getDocs)(q);
      if (!existSnap.empty) return { error: "Domain already exists" };
      const docRef = await (0, import_firebase_firestore.addDoc)((0, import_firebase_firestore.collection)(db, "allowed_domains"), {
        domain,
        org_name: orgName,
        org_logo: "\u{1F3E2}",
        is_active: true,
        createdAt: (0, import_firebase_firestore.serverTimestamp)()
      });
      AuditLog.add("DOMAIN_ADDED", { domain, orgName }, null, true);
      return { data: { id: docRef.id, domain, org_name: orgName, is_active: true } };
    } catch (err) {
      return { error: err.message };
    }
  };
  var toggleDomain = async (id) => {
    try {
      const domainRef = (0, import_firebase_firestore.doc)(db, "allowed_domains", id);
      const snap = await (0, import_firebase_firestore.getDoc)(domainRef);
      if (!snap.exists()) return;
      const current = snap.data().is_active;
      await (0, import_firebase_firestore.updateDoc)(domainRef, { is_active: !current });
      return { id, ...snap.data(), is_active: !current };
    } catch (e) {
      console.error(e);
    }
  };
  var removeDomain = async (id) => {
    try {
      await (0, import_firebase_firestore.deleteDoc)((0, import_firebase_firestore.doc)(db, "allowed_domains", id));
    } catch (e) {
      console.error(e);
    }
  };
  var validateDomain = async (email) => {
    if (!email || !email.includes("@")) return { allowed: false, reason: "Invalid email" };
    const domain = email.split("@")[1].toLowerCase();
    try {
      const domains = await getDomains();
      const match = domains.find((d) => d.domain.toLowerCase() === domain && d.is_active);
      if (match) return { allowed: true, domain: match };
      return { allowed: false, reason: "unauthorized_domain", email, domain };
    } catch (error) {
      return { allowed: false, reason: "validation_error", error };
    }
  };
  var getOrgBranding = async (email) => {
    const { domain } = await validateDomain(email);
    if (!domain) return null;
    return { name: domain.org_name, logo: domain.org_logo, domain: domain.domain };
  };
  var AuditLog = {
    add: async (eventType, metadata = {}, email = null, allowed = false) => {
      try {
        await (0, import_firebase_firestore.addDoc)((0, import_firebase_firestore.collection)(db, "audit_logs"), {
          event_type: eventType,
          email,
          domain: email ? email.split("@")[1] : null,
          allowed,
          metadata,
          user_agent: navigator.userAgent,
          createdAt: (0, import_firebase_firestore.serverTimestamp)()
        });
      } catch (e) {
        console.error("AuditLog error", e);
      }
    },
    getLogs: async () => {
      try {
        const q = (0, import_firebase_firestore.query)((0, import_firebase_firestore.collection)(db, "audit_logs"), (0, import_firebase_firestore.orderBy)("createdAt", "desc"));
        const snap = await (0, import_firebase_firestore.getDocs)(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (e) {
        return [];
      }
    },
    getBlockedAttempts: async () => {
      try {
        const q = (0, import_firebase_firestore.query)((0, import_firebase_firestore.collection)(db, "audit_logs"), (0, import_firebase_firestore.where)("allowed", "==", false), (0, import_firebase_firestore.where)("event_type", "==", "LOGIN_BLOCKED"));
        const snap = await (0, import_firebase_firestore.getDocs)(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (e) {
        return [];
      }
    }
  };
  var Session = {
    get: () => currentSession,
    getUser: () => currentSession ? currentSession.user : null,
    isValid: () => !!currentSession,
    destroy: async () => {
      await (0, import_firebase_auth.signOut)(auth);
      currentSession = null;
    }
  };
  var handleGoogleAuth = async (context = "login") => {
    try {
      const provider = new import_firebase_auth.GoogleAuthProvider();
      const result = await (0, import_firebase_auth.signInWithPopup)(auth, provider);
      const user = result.user;
      const email = user.email.toLowerCase();
      const validation = await validateDomain(email);
      if (!validation.allowed) {
        await AuditLog.add("LOGIN_BLOCKED", { reason: "unauthorized_domain", domain: validation.domain, context }, email, false);
        await (0, import_firebase_auth.signOut)(auth);
        window.location.href = `./access-denied.html?email=${encodeURIComponent(email)}&domain=${encodeURIComponent(validation.domain || "")}`;
        return;
      }
      await AuditLog.add("LOGIN_SUCCESS", { domain: validation.domain.domain, context }, email, true);
      try {
        await (0, import_firebase_firestore.setDoc)((0, import_firebase_firestore.doc)(db, "users", user.uid), {
          email,
          name: user.displayName || email.split("@")[0],
          domain: validation.domain.domain,
          org: validation.domain.org_name,
          lastLogin: (0, import_firebase_firestore.serverTimestamp)()
        }, { merge: true });
      } catch (e) {
        console.warn("Failed to write to users collection", e);
      }
      try {
        const profileSnap = await (0, import_firebase_firestore.getDoc)((0, import_firebase_firestore.doc)(db, "user_profiles", user.uid));
        if (!profileSnap.exists()) {
          window.location.href = "../onboarding/index.html";
        } else {
          window.location.href = "../dashboard.html";
        }
      } catch (e) {
        window.location.href = "../dashboard.html";
      }
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") return;
      throw err;
    }
  };
  var handleEmailAuth = async (email, password, isSignup = false) => {
    const validation = await validateDomain(email);
    if (!validation.allowed) {
      await AuditLog.add(isSignup ? "SIGNUP_BLOCKED" : "LOGIN_BLOCKED", { reason: "unauthorized_domain", domain: validation.domain }, email, false);
      window.location.href = `./access-denied.html?email=${encodeURIComponent(email)}&domain=${encodeURIComponent(validation.domain || "")}`;
      return false;
    }
    try {
      let cred;
      if (isSignup) {
        cred = await (0, import_firebase_auth.createUserWithEmailAndPassword)(auth, email, password);
      } else {
        cred = await (0, import_firebase_auth.signInWithEmailAndPassword)(auth, email, password);
      }
      await AuditLog.add(isSignup ? "SIGNUP_SUCCESS" : "LOGIN_SUCCESS", { domain: validation.domain.domain }, email, true);
      try {
        await (0, import_firebase_firestore.setDoc)((0, import_firebase_firestore.doc)(db, "users", cred.user.uid), {
          email,
          name: email.split("@")[0],
          domain: validation.domain.domain,
          org: validation.domain.org_name,
          lastLogin: (0, import_firebase_firestore.serverTimestamp)()
        }, { merge: true });
      } catch (e) {
      }
      return true;
    } catch (error) {
      throw error;
    }
  };
  var RBAC = {
    ROLES: { SUPER_ADMIN: "super_admin", ADMIN: "admin", USER: "user" },
    PERMISSIONS: {
      "admin:domains": ["super_admin", "admin"],
      "admin:users": ["super_admin"],
      "admin:audit_logs": ["super_admin", "admin"],
      "dashboard": ["super_admin", "admin", "user"]
    },
    can: (user, permission) => {
      if (!user) return false;
      const allowed = RBAC.PERMISSIONS[permission] || [];
      return allowed.includes(user.role || "user");
    },
    isAdmin: (user) => user && ["super_admin", "admin"].includes(user.role)
  };
  var ProtectedRoute = {
    guard: async (options = {}) => {
      await authReady;
      const { permission = "dashboard", redirectTo = "/auth/login.html" } = options;
      const session = Session.get();
      if (!session) {
        window.location.href = redirectTo;
        return false;
      }
      if (permission && !RBAC.can(session.user, permission)) {
        window.location.href = "/auth/access-denied.html";
        return false;
      }
      return true;
    },
    guardAdmin: () => ProtectedRoute.guard({ permission: "admin:domains", redirectTo: "/auth/login.html" })
  };
  var RateLimit = {
    check: () => ({ allowed: true }),
    increment: () => {
    },
    reset: () => {
    }
  };
  var Theme = {
    init: () => {
      const saved = localStorage.getItem("careeriq-theme") || "dark";
      document.documentElement.setAttribute("data-theme", saved);
      document.querySelectorAll("#themeToggle").forEach((btn) => {
        btn.addEventListener("click", Theme.toggle);
      });
    },
    toggle: () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("careeriq-theme", next);
    }
  };
  var Toast = {
    container: null,
    init: () => {
      Toast.container = document.getElementById("toastContainer");
      if (!Toast.container) {
        Toast.container = document.createElement("div");
        Toast.container.id = "toastContainer";
        Toast.container.className = "toast-container";
        document.body.appendChild(Toast.container);
      }
    },
    show: (message, type = "info", duration = 3500) => {
      if (!Toast.container) Toast.init();
      const icons = { success: "\u2705", error: "\u274C", warning: "\u26A0\uFE0F", info: "\u2139\uFE0F" };
      const toast = document.createElement("div");
      toast.className = `toast toast-${type}`;
      toast.innerHTML = `<span class="toast-icon">${icons[type] || "\u2139\uFE0F"}</span><span>${message}</span>`;
      Toast.container.appendChild(toast);
      setTimeout(() => {
        toast.classList.add("toast-exit");
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  };
  var Validator = {
    rules: {
      required: (v) => v && v.trim() ? null : "This field is required",
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Invalid email address",
      minLength: (min) => (v) => v && v.length >= min ? null : `Minimum ${min} characters required`,
      password: (v) => {
        if (!v || v.length < 8) return "Password must be at least 8 characters";
        return null;
      },
      match: (other) => (v) => v === other ? null : "Passwords do not match"
    },
    validate: (field, value, ruleFns) => {
      for (const rule of ruleFns) {
        const err = rule(value);
        if (err) return err;
      }
      return null;
    },
    showError: (inputEl, message) => {
      inputEl.classList.add("error");
      inputEl.classList.remove("success");
      let errEl = inputEl.closest(".form-group")?.querySelector(".form-error");
      if (!errEl) {
        errEl = document.createElement("div");
        errEl.className = "form-error";
        inputEl.after(errEl);
      }
      errEl.innerHTML = `<span>\u26A0</span> ${message}`;
    },
    clearError: (inputEl) => {
      inputEl.classList.remove("error");
      inputEl.classList.add("success");
      const errEl = inputEl.closest(".form-group")?.querySelector(".form-error");
      if (errEl) errEl.remove();
    },
    passwordStrength: (password) => {
      if (!password) return { score: 0, label: "" };
      let score = 0;
      if (password.length >= 8) score++;
      if (password.length >= 12) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;
      const labels = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
      return { score, label: labels[score] || "Very Strong" };
    }
  };
  window.CareerIQAuth = {
    getDomains,
    addDomain,
    toggleDomain,
    removeDomain,
    validateDomain,
    getOrgBranding,
    handleGoogleAuth,
    handleEmailAuth,
    Session,
    AuditLog,
    RBAC,
    ProtectedRoute,
    RateLimit,
    Theme,
    Toast,
    Validator,
    Storage,
    authReady,
    auth,
    db
  };
  document.dispatchEvent(new Event("CareerIQAuthReady"));
  document.addEventListener("DOMContentLoaded", () => {
    Theme.init();
    Toast.init();
  });
})();
