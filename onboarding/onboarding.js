/**
 * CareerIQ AI — Onboarding Wizard Logic
 *
 * 🔴 [SUPABASE] Save onboarding data:
 * await supabase.from('user_profiles').upsert({
 *   user_id: session.user.id,
 *   ...data
 * });
 *
 * 🔵 [FIREBASE]:
 * await setDoc(doc(db, 'user_profiles', uid), data, { merge: true });
 */



class ChipInput {
  constructor(wrapperId, hiddenInputId, suggestions = []) {
    this.wrapper = document.getElementById(wrapperId);
    if (!this.wrapper) return;
    this.hiddenInput = document.getElementById(hiddenInputId);
    this.chips = [];
    this.suggestions = suggestions;
    this.init();
  }

  init() {
    // Render text input inside wrapper
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'chip-text-input';
    input.placeholder = this.wrapper.dataset.placeholder || 'Type and press Enter...';
    this.wrapper.appendChild(input);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const val = input.value.trim().replace(/,$/, '');
        if (val) this.add(val);
        input.value = '';
      } else if (e.key === 'Backspace' && input.value === '' && this.chips.length > 0) {
        this.remove(this.chips.length - 1);
      }
    });

    // Handle suggestions click if they exist nearby
    const suggestionsContainer = this.wrapper.nextElementSibling;
    if (suggestionsContainer && suggestionsContainer.classList.contains('chip-suggestions')) {
      suggestionsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('chip-suggestion-badge')) {
          this.add(e.target.textContent);
          e.target.style.opacity = '0.5';
          e.target.style.pointerEvents = 'none';
        }
      });
    }
  }

  add(value) {
    if (this.chips.includes(value)) return;
    this.chips.push(value);
    this.render();
    if (window.OnboardingWizard) window.OnboardingWizard.saveData();
  }

  remove(index) {
    this.chips.splice(index, 1);
    this.render();
    if (window.OnboardingWizard) window.OnboardingWizard.saveData();
  }

  loadValues(values) {
    if (!Array.isArray(values)) return;
    this.chips = values;
    this.render();
  }

  getValues() {
    return this.chips;
  }

  render() {
    // Remove existing chips
    this.wrapper.querySelectorAll('.chip').forEach(c => c.remove());
    
    // Create new chips
    const input = this.wrapper.querySelector('.chip-text-input');
    this.chips.forEach((chip, index) => {
      const el = document.createElement('div');
      el.className = 'chip';
      el.innerHTML = `<span>${chip}</span><span class="chip-remove" onclick="event.stopPropagation()">&times;</span>`;
      el.querySelector('.chip-remove').addEventListener('click', () => this.remove(index));
      this.wrapper.insertBefore(el, input);
    });

    if (this.hiddenInput) {
      this.hiddenInput.value = JSON.stringify(this.chips);
    }
  }
}

const OnboardingWizard = {
  currentStep: 1,
  totalSteps: 9,
  data: {},
  chipInputs: {},
  saveTimeout: null,
  userEmail: null,

  async init() {
    // 1. Auth Check
    const session = CareerIQAuth.Session.get();
    if (!session) {
      window.location.href = '../auth/login.html';
      return;
    }
    this.user = session.user;
    
    const urlParams = new URLSearchParams(window.location.search);
    const isEditing = urlParams.get('edit') === 'true';

    // 2. Load saved data from Firestore
    try {
      const { db } = window.CareerIQAuth;
      const profileSnap = await db.collection("user_profiles").doc(this.user.uid).get();
      
      if (profileSnap.exists) {
        this.data = profileSnap.data();
        if (!isEditing && this.data.onboarding_complete) {
          window.location.href = '../dashboard.html';
          return;
        }
      } else {
        this.data = {};
      }

      // Auto-copy data gathered during signup if not already set
      if (!this.data.fullName) {
        const userSnap = await db.collection("users").doc(this.user.uid).get();
        if (userSnap.exists) {
          const udata = userSnap.data();
          this.data.fullName = udata.name || this.user.name || '';
          this.data.displayName = udata.displayName || this.user.displayName || '';
          if (udata.phone) this.data.phone = udata.phone;
        } else {
          this.data.fullName = this.user.name || '';
          this.data.displayName = this.user.displayName || '';
        }
      }
    } catch(e) {
      console.error("Failed to load profile", e);
      this.data = {};
    }

    // 3. Setup UI bindings
    this.setupNavigation();
    this.setupAutoSave();
    this.setupComplexInputs();
    this.updateProgressUI();

    // Pre-fill form from saved data
    setTimeout(() => this.populateForm(), 100);

    // Initial check on industry max selections
    this.updateIndustryCounter();
  },

  setupNavigation() {
    document.querySelectorAll('.btn-next').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.validateStep(this.currentStep)) {
          this.collectStepData(this.currentStep);
          this.goToStep(this.currentStep + 1);
        }
      });
    });

    document.querySelectorAll('.btn-back-step').forEach(btn => {
      btn.addEventListener('click', () => {
        this.collectStepData(this.currentStep);
        this.goToStep(this.currentStep - 1);
      });
    });

    const skipBtn = document.querySelector('.onboarding-skip');
    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        e.preventDefault();
        CareerIQAuth.Toast.show('Skipping setup. Redirecting to Dashboard...', 'info');
        if (this.userEmail) {
          CareerIQAuth.Storage.set(`onboarding_complete_${btoa(this.userEmail)}`, true);
        }
        setTimeout(() => {
          window.location.href = '../dashboard.html';
        }, 800);
      });
    }
  },

  goToStep(n) {
    if (n < 1) n = 1;
    if (n > this.totalSteps) {
      this.complete();
      return;
    }

    const currentCard = document.getElementById(`stepCard${this.currentStep}`);
    const nextCard = document.getElementById(`stepCard${n}`);

    // Animate out current
    currentCard.classList.add('leaving');
    
    setTimeout(() => {
      currentCard.style.display = 'none';
      currentCard.classList.remove('leaving');
      
      // Animate in next
      nextCard.style.display = 'block';
      this.currentStep = n;
      this.updateProgressUI();

      if (n === this.totalSteps) {
        this.renderSummary();
      }
    }, 300);
  },

  updateProgressUI() {
    // Text
    document.querySelector('.progress-current').textContent = `Step ${this.currentStep} of ${this.totalSteps}`;
    
    // Bar
    const progress = (this.currentStep / this.totalSteps) * 100;
    document.querySelector('.progress-bar-fill').style.width = `${progress}%`;

    // Dots
    document.querySelectorAll('.step-dot').forEach((dot, index) => {
      dot.className = 'step-dot';
      if (index + 1 === this.currentStep) {
        dot.classList.add('active');
      } else if (index + 1 < this.currentStep) {
        dot.classList.add('completed');
      }
    });
  },

  validateStep(n) {
    // Simple validation: check if required fields are filled
    const card = document.getElementById(`stepCard${n}`);
    const requiredInputs = card.querySelectorAll('[required]');
    let isValid = true;

    requiredInputs.forEach(input => {
      if (!input.value.trim()) {
        isValid = false;
        input.classList.add('error');
        
        // Remove error on input
        const clearErr = () => { input.classList.remove('error'); input.removeEventListener('input', clearErr); };
        input.addEventListener('input', clearErr);
      }
    });

    if (!isValid) {
      CareerIQAuth.Toast.show('Please fill in all required fields.', 'error');
    }
    return isValid;
  },

  collectStepData(n) {
    const card = document.getElementById(`stepCard${n}`);
    
    // Inputs & Selects & Textareas
    card.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]):not(.chip-text-input), select, textarea').forEach(el => {
      if (el.id) this.data[el.id] = el.value;
    });

    // Radios
    const radios = card.querySelectorAll('input[type="radio"]:checked');
    radios.forEach(r => {
      if (r.name) this.data[r.name] = r.value;
    });

    // Checkboxes (multi-select)
    const checkboxGroups = {};
    card.querySelectorAll('input[type="checkbox"]').forEach(c => {
      if (c.name) {
        if (!checkboxGroups[c.name]) checkboxGroups[c.name] = [];
        if (c.checked) checkboxGroups[c.name].push(c.value);
      }
    });
    Object.keys(checkboxGroups).forEach(k => this.data[k] = checkboxGroups[k]);

    // Chip inputs
    Object.keys(this.chipInputs).forEach(k => {
      this.data[k] = this.chipInputs[k].getValues();
    });

    this.saveData();
  },

  setupAutoSave() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('change', () => this.triggerAutoSave());
      input.addEventListener('input', () => this.triggerAutoSave());
    });
  },

  triggerAutoSave() {
    const ind = document.querySelectorAll('.autosave-indicator');
    ind.forEach(i => {
      i.className = 'autosave-indicator saving';
      i.innerHTML = '<div class="autosave-dot"></div> Saving...';
    });

    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.collectStepData(this.currentStep);
      ind.forEach(i => {
        i.className = 'autosave-indicator saved';
        i.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Saved';
      });
      setTimeout(() => {
        ind.forEach(i => { i.className = 'autosave-indicator'; i.innerHTML = ''; });
      }, 2000);
    }, 1000);
  },

  async saveData() {
    if (!this.user) return;
    try {
      const { db } = window.CareerIQAuth;
      await db.collection("user_profiles").doc(this.user.uid).set(this.data, { merge: true });
    } catch(e) {
      console.error("Failed to save data to Firebase", e);
    }
  },

  setupComplexInputs() {
    // 1. Chip Inputs
    if (document.getElementById('techSkillsWrapper')) {
      this.chipInputs['techSkills'] = new ChipInput('techSkillsWrapper', 'techSkillsHidden');
    }
    if (document.getElementById('softSkillsWrapper')) {
      this.chipInputs['softSkills'] = new ChipInput('softSkillsWrapper', 'softSkillsHidden');
    }
    if (document.getElementById('workLocationsWrapper')) {
      this.chipInputs['workLocations'] = new ChipInput('workLocationsWrapper', 'workLocationsHidden');
    }
    if (document.getElementById('motivatorsWrapper')) {
      this.chipInputs['motivators'] = new ChipInput('motivatorsWrapper', 'motivatorsHidden');
    }

    // 2. Salary Slider formatting
    const slider = document.getElementById('salarySlider');
    const display = document.getElementById('salaryDisplayValue');
    const currency = document.getElementById('salaryCurrency');
    
    if (slider && display && currency) {
      const formatSalary = () => {
        const val = parseInt(slider.value);
        const cur = currency.value;
        const symbols = { 'INR': '₹', 'USD': '$', 'GBP': '£', 'EUR': '€' };
        display.textContent = `${symbols[cur]}${val.toLocaleString()}/year`;
      };
      slider.addEventListener('input', formatSalary);
      currency.addEventListener('change', formatSalary);
    }

    // 3. Industry Max Selection logic
    const indCheckboxes = document.querySelectorAll('input[name="industries"]');
    if (indCheckboxes.length > 0) {
      indCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => this.updateIndustryCounter());
      });
    }

    // 4. Photo upload mock
    const photoUpload = document.getElementById('photoUploadMock');
    if (photoUpload) {
      photoUpload.addEventListener('click', () => {
        CareerIQAuth.Toast.show('Photo upload will be available after onboarding.', 'info');
      });
    }
  },

  updateIndustryCounter() {
    const checked = document.querySelectorAll('input[name="industries"]:checked');
    const counter = document.getElementById('industryCounter');
    if (counter) counter.textContent = `${checked.length}/3 selected`;

    const checkboxes = document.querySelectorAll('input[name="industries"]');
    if (checked.length >= 3) {
      checkboxes.forEach(cb => { if (!cb.checked) cb.disabled = true; });
    } else {
      checkboxes.forEach(cb => cb.disabled = false);
    }
  },

  populateForm() {
    // Fill text/select
    Object.keys(this.data).forEach(key => {
      const el = document.getElementById(key);
      if (el && el.tagName !== 'INPUT') { // For textareas, selects
        el.value = this.data[key];
      } else if (el && el.type !== 'radio' && el.type !== 'checkbox') {
        el.value = this.data[key];
      }
    });

    // Fill radios
    Object.keys(this.data).forEach(key => {
      const val = this.data[key];
      if (typeof val === 'string') {
        const radio = document.querySelector(`input[type="radio"][name="${key}"][value="${val}"]`);
        if (radio) radio.checked = true;
      }
    });

    // Fill checkboxes
    Object.keys(this.data).forEach(key => {
      const val = this.data[key];
      if (Array.isArray(val)) {
        val.forEach(v => {
          const cb = document.querySelector(`input[type="checkbox"][name="${key}"][value="${v}"]`);
          if (cb) cb.checked = true;
        });
      }
    });

    // Fill chips
    Object.keys(this.chipInputs).forEach(key => {
      if (this.data[key]) {
        this.chipInputs[key].loadValues(this.data[key]);
      }
    });

    // Trigger formatting
    const slider = document.getElementById('salarySlider');
    if (slider) slider.dispatchEvent(new Event('input'));
  },

  renderSummary() {
    const sName = document.getElementById('summaryName');
    const sRole = document.getElementById('summaryRole');
    const sSkills = document.getElementById('summarySkills');
    const sLocation = document.getElementById('summaryLocation');

    if (sName) sName.textContent = this.data.fullName || 'Awesome User';
    if (sRole) sRole.textContent = this.data.jobTitle || this.data.degreeLevel || 'Career Explorer';
    if (sSkills && this.data.techSkills) {
      sSkills.innerHTML = this.data.techSkills.slice(0, 3).map(s => `<span class="chip">${s}</span>`).join('') + 
                         (this.data.techSkills.length > 3 ? `<span class="chip">+${this.data.techSkills.length - 3}</span>` : '');
    }
    if (sLocation) sLocation.textContent = this.data.currentLocation || 'Earth';
  },

  async complete() {
    const btn = document.getElementById('finalSubmitBtn');
    if (btn) {
      btn.classList.add('loading');
      btn.disabled = true;
    }

    this.collectStepData(this.currentStep);
    this.data.onboarding_complete = true;
    
    // Mark as complete in Firestore
    await this.saveData();

    CareerIQAuth.Toast.show('Profile created successfully! Redirecting...', 'success');
    
    setTimeout(() => {
      window.location.href = '../dashboard.html';
    }, 1500);
  }
};

window.OnboardingWizard = OnboardingWizard;
