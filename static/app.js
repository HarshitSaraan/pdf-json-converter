document.addEventListener('DOMContentLoaded', () => {
  
  // App Global State
  let questionsData = []; // Guy A: Parsed questions in current session
  let selectedFile = null;

  // API Base URL resolution
  const API_BASE = (window.location.protocol === 'file:') 
    ? 'http://127.0.0.1:8000' 
    : '';

  // DOM Elements - Navigation & Modes
  const modeParserBtn = document.getElementById('modeParserBtn');
  const modeReviewerBtn = document.getElementById('modeReviewerBtn');
  const modeUnreviewedBankBtn = document.getElementById('modeUnreviewedBankBtn');
  const modeReviewedBankBtn = document.getElementById('modeReviewedBankBtn');
  const modeAddSingleBtn = document.getElementById('modeAddSingleBtn');
  const modeMockBtn = document.getElementById('modeMockBtn');
  const navPendingReviewBadge = document.getElementById('navPendingReviewBadge');
  const navUnreviewedCountBadge = document.getElementById('navUnreviewedCountBadge');
  const navReviewedCountBadge = document.getElementById('navReviewedCountBadge');

  // Role Gateway Screen & Navigation Elements
  const roleGatewayScreen = document.getElementById('roleGatewayScreen');
  const selectRoleParserBtn = document.getElementById('selectRoleParserBtn');
  const selectRoleReviewerBtn = document.getElementById('selectRoleReviewerBtn');
  const switchRoleNavBtn = document.getElementById('switchRoleNavBtn');
  const activeRoleNavLabel = document.getElementById('activeRoleNavLabel');
  const gatewayPendingBadge = document.getElementById('gatewayPendingBadge');

  let currentRole = localStorage.getItem('questify_user_role') || null;

  const parserSection = document.getElementById('parserSection');
  const reviewerSection = document.getElementById('reviewerSection');
  const reviewedBankSection = document.getElementById('reviewedBankSection');
  const singleQSection = document.getElementById('singleQSection');
  const mockGeneratorSection = document.getElementById('mockGeneratorSection');

  // Guy A Elements
  const parserTabDocBtn = document.getElementById('parserTabDocBtn');
  const parserTabPasteBtn = document.getElementById('parserTabPasteBtn');
  const parserDocUploadCard = document.getElementById('parserDocUploadCard');
  const parserPasteCard = document.getElementById('parserPasteCard');

  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const filePreviewCard = document.getElementById('filePreviewCard');
  const fileNameDisplay = document.getElementById('fileName');
  const fileSizeDisplay = document.getElementById('fileSize');
  const removeFileBtn = document.getElementById('removeFileBtn');
  const parsePdfBtn = document.getElementById('parsePdfBtn');
  const loadSampleBtn = document.getElementById('loadSampleBtn');
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');

  const rawTextInput = document.getElementById('rawTextInput');
  const parseTextBtn = document.getElementById('parseTextBtn');
  const loadPasteSampleBtn = document.getElementById('loadPasteSampleBtn');
  const pasteClipboardBtn = document.getElementById('pasteClipboardBtn');
  const clearPasteTextBtn = document.getElementById('clearPasteTextBtn');
  const pasteProgressContainer = document.getElementById('pasteProgressContainer');
  const pasteProgressBar = document.getElementById('pasteProgressBar');
  const pasteProgressText = document.getElementById('pasteProgressText');
  const useAiTopicsCheckbox = document.getElementById('useAiTopicsCheckbox');
  const useAiExtractionCheckbox = document.getElementById('useAiExtractionCheckbox');
  const pasteUseAiTopicsCheckbox = document.getElementById('pasteUseAiTopicsCheckbox');
  const pasteUseAiExtractionCheckbox = document.getElementById('pasteUseAiExtractionCheckbox');

  const workspaceSection = document.getElementById('workspaceSection');
  const questionsList = document.getElementById('questionsList');
  const questionCountBadge = document.getElementById('questionCountBadge');
  const selectAllParsedBtn = document.getElementById('selectAllParsedBtn');
  const deselectAllParsedBtn = document.getElementById('deselectAllParsedBtn');
  const pushToReviewQueueBtn = document.getElementById('pushToReviewQueueBtn');
  const searchInput = document.getElementById('searchInput');
  const bulkTopicInput = document.getElementById('bulkTopicInput');
  const applyBulkTopicBtn = document.getElementById('applyBulkTopicBtn');
  const autoGenerateAllHintsBtn = document.getElementById('autoGenerateAllHintsBtn');
  const downloadJsonBtn = document.getElementById('downloadJsonBtn');

  // AI & Auth Elements
  const aiSettingsBtn = document.getElementById('aiSettingsBtn');
  const aiModalOverlay = document.getElementById('aiModalOverlay');
  const closeAiModalBtn = document.getElementById('closeAiModalBtn');
  const cancelAiModalBtn = document.getElementById('cancelAiModalBtn');
  const saveAiModalBtn = document.getElementById('saveAiModalBtn');
  const geminiApiKeyInput = document.getElementById('geminiApiKeyInput');
  const chatgptApiKeyInput = document.getElementById('chatgptApiKeyInput');
  const chatgptModelSelect = document.getElementById('chatgptModelSelect');

  const promptSettingsBtn = document.getElementById('promptSettingsBtn');
  const promptsModalOverlay = document.getElementById('promptsModalOverlay');
  const closePromptsModalBtn = document.getElementById('closePromptsModalBtn');
  const cancelPromptsModalBtn = document.getElementById('cancelPromptsModalBtn');
  const savePromptsModalBtn = document.getElementById('savePromptsModalBtn');
  const modalSubjectTabs = document.getElementById('modalSubjectTabs');
  const addNewSubjectBtn = document.getElementById('addNewSubjectBtn');
  const addSubjectInlineBox = document.getElementById('addSubjectInlineBox');
  const newSubjectNameInput = document.getElementById('newSubjectNameInput');
  const confirmAddSubjectBtn = document.getElementById('confirmAddSubjectBtn');
  const cancelAddSubjectBtn = document.getElementById('cancelAddSubjectBtn');
  const subjectPromptTextarea = document.getElementById('subjectPromptTextarea');
  const activeSubjectPromptLabel = document.getElementById('activeSubjectPromptLabel');
  const resetPromptBtn = document.getElementById('resetPromptBtn');
  const insertQuestionVar = document.getElementById('insertQuestionVar');
  const insertOptsVar = document.getElementById('insertOptsVar');

  // Google Auth
  const GOOGLE_CLIENT_ID = "1095943139935-bv47gtem4cjn9rihb2s74ccht9sq2tss.apps.googleusercontent.com";
  const ALLOWED_EMAILS = [
    "cnandini828@gmail.com",
    "pratapsinghsusmit@gmail.com",
    "thepreproute@gmail.com",
    "harshitsaraan@gmail.com"
  ];
  const googleSignInContainer = document.getElementById('googleSignInContainer');
  const userProfileBox = document.getElementById('userProfileBox');
  const userAvatarImg = document.getElementById('userAvatarImg');
  const userNameText = document.getElementById('userNameText');
  const userEmailText = document.getElementById('userEmailText');
  const googleSignOutBtn = document.getElementById('googleSignOutBtn');
  const accessDeniedModalOverlay = document.getElementById('accessDeniedModalOverlay');
  const accessDeniedMsg = document.getElementById('accessDeniedMsg');
  const closeAccessDeniedBtn = document.getElementById('closeAccessDeniedBtn');
  const mainAppContainer = document.getElementById('mainAppContainer');
  const authLockScreen = document.getElementById('authLockScreen');
  const lockScreenGoogleBtnContainer = document.getElementById('lockScreenGoogleBtnContainer');

  // =========================================================================
  // TAXONOMY & SUBJECT CONFIG
  // =========================================================================
  const TAXONOMY = {
    "English": {
      "VA": ["RC", "Para Completion", "Para Jumbles", "Sentence Correction", "Spellings", "Verbal Analogy"],
      "Vocabulary": ["Idioms & Phrases", "Antonyms", "Synonyms", "Definition"],
      "Grammar": ["Active & Passive Voice", "Direct & Indirect Speech", "Error", "Punctuations", "Parts of Speech", "Subject–Verb Agreement"]
    },
    "Quants": {
      "Arithmetic": ["Averages", "Mixtures & Alligation", "Percentages", "Profit & Loss", "Ratio & Proportion", "SI/CI", "Time & Work", "Time–Speed–Distance"],
      "Number System": ["Digit properties", "Divisibility rules", "Factorials", "Factorization", "Factors/Multiples", "HCF/LCM", "Integral Solution", "Miscellaneous", "Remainders", "Unit digits"],
      "Algebra": ["Binomial Theorem", "Matrices & Determinants", "Algebraic identities", "Functions", "Indices & Surds", "Inequalities", "Linear/Quadratic equations", "Maxima & Minima", "Modulus", "Polynomials", "Progressions", "Sets"],
      "Geometry & Mensuration": ["Area & Perimeter", "Circles", "Coordinate Geometry", "Heights & Distances", "Lines & Angles", "Polygons", "Quadrilaterals", "Solids", "Triangles", "Trigonometry"],
      "Modern Maths": ["Binomial Theorem", "Logarithm", "Matrices & Determinants", "P & C", "Probability", "Set Theory"]
    },
    "LRDI": {
      "Logical Reasoning": ["Arrangements", "Blood Relations", "Clocks & Calendars", "Coding-Decoding", "Direction Sense", "Syllogisms", "Series & Analogies", "Venn Diagrams"],
      "Data Interpretation": ["Bar Charts", "Line Graphs", "Pie Charts", "Tables", "Caselets", "Data Sufficiency"]
    }
  };

  let availableSubjects = JSON.parse(localStorage.getItem('custom_subjects') || '["English", "Quants", "LRDI"]');
  let selectedSubject = availableSubjects[0] || 'English';

  function getTopicsForSubject(subj) {
    const s = subj || selectedSubject;
    return TAXONOMY[s] ? Object.keys(TAXONOMY[s]) : ["General Topic", "Misc"];
  }

  function getSubtopicsForTopic(subj, topic) {
    const s = subj || selectedSubject;
    const subjData = TAXONOMY[s] || TAXONOMY["English"];
    if (subjData && subjData[topic]) return subjData[topic];
    for (let k in subjData) {
      if (k.toLowerCase() === (topic || '').toLowerCase()) return subjData[k];
    }
    return [Object.values(subjData)[0]?.[0] || "General Subtopic"];
  }

  function chr(n) {
    return String.fromCharCode(n);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // =========================================================================
  // AUTHENTICATION
  // =========================================================================
  function parseJwtToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  function renderUserProfile(userData) {
    if (googleSignInContainer) googleSignInContainer.classList.add('hidden');
    if (userProfileBox) userProfileBox.classList.remove('hidden');
    if (userAvatarImg) userAvatarImg.src = userData.picture || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
    if (userNameText) userNameText.textContent = userData.name || userData.email.split('@')[0];
    if (userEmailText) userEmailText.textContent = userData.email;

    if (authLockScreen) authLockScreen.classList.add('hidden');
    if (mainAppContainer) mainAppContainer.classList.remove('hidden');
    if (promptSettingsBtn) promptSettingsBtn.classList.remove('hidden');
    if (aiSettingsBtn) aiSettingsBtn.classList.remove('hidden');
    updateStatusBadge('Ready', 'success');
    fetchPendingReviewCount();

    // Check if user has chosen a role (Parser vs Reviewer)
    const savedRole = localStorage.getItem('questify_user_role');
    if (savedRole && (savedRole === 'parser' || savedRole === 'reviewer')) {
      hideRoleGateway();
      switchMainMode(savedRole);
    } else {
      showRoleGateway();
    }
  }

  function clearUserProfile() {
    localStorage.removeItem('google_user_session');
    if (userProfileBox) userProfileBox.classList.add('hidden');
    if (googleSignInContainer) googleSignInContainer.classList.remove('hidden');
    if (mainAppContainer) mainAppContainer.classList.add('hidden');
    if (authLockScreen) authLockScreen.classList.remove('hidden');
    if (promptSettingsBtn) promptSettingsBtn.classList.add('hidden');
    if (aiSettingsBtn) aiSettingsBtn.classList.add('hidden');
    updateStatusBadge('Auth Required', 'danger');
    initGoogleAuth();
  }

  function showAccessDenied(email) {
    if (accessDeniedMsg) {
      accessDeniedMsg.innerHTML = `Access Denied for <strong>${escapeHtml(email)}</strong>.<br>Your account is not on the authorized user list.`;
    }
    if (accessDeniedModalOverlay) accessDeniedModalOverlay.classList.remove('hidden');
    if (window.google && google.accounts && google.accounts.id) {
      google.accounts.id.disableAutoSelect();
    }
    if (mainAppContainer) mainAppContainer.classList.add('hidden');
    if (authLockScreen) authLockScreen.classList.remove('hidden');
  }

  if (closeAccessDeniedBtn) {
    closeAccessDeniedBtn.addEventListener('click', () => {
      if (accessDeniedModalOverlay) accessDeniedModalOverlay.classList.add('hidden');
      clearUserProfile();
    });
  }

  if (googleSignOutBtn) {
    googleSignOutBtn.addEventListener('click', clearUserProfile);
  }

  async function handleGoogleCredentialResponse(response) {
    const jwtData = parseJwtToken(response.credential);
    if (!jwtData || !jwtData.email) {
      alert("Could not process Google login response.");
      return;
    }

    const email = jwtData.email.trim().toLowerCase();
    if (!ALLOWED_EMAILS.includes(email)) {
      showAccessDenied(email);
      return;
    }

    try {
      const authRes = await fetch(`${API_BASE}/api/auth/verify-google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential, email: email })
      });
      if (authRes.ok) {
        const authData = await authRes.json();
        if (!authData.isAuthorized) {
          showAccessDenied(email);
          return;
        }
      }
    } catch(err) {
      console.warn("Backend auth verification warning:", err);
    }

    const sessionData = {
      email: email,
      name: jwtData.name || email.split('@')[0],
      picture: jwtData.picture || '',
      credential: response.credential
    };

    localStorage.setItem('google_user_session', JSON.stringify(sessionData));
    renderUserProfile(sessionData);
  }

  function initGoogleAuth() {
    const savedSession = localStorage.getItem('google_user_session');
    if (savedSession) {
      try {
        const userData = JSON.parse(savedSession);
        if (userData && userData.email && userData.credential !== 'local_dev_bypass' && ALLOWED_EMAILS.includes(userData.email.toLowerCase())) {
          renderUserProfile(userData);
          return;
        } else {
          localStorage.removeItem('google_user_session');
        }
      } catch (e) {
        localStorage.removeItem('google_user_session');
      }
    }

    if (mainAppContainer) mainAppContainer.classList.add('hidden');
    if (authLockScreen) authLockScreen.classList.remove('hidden');

    const checkGoogleInterval = setInterval(() => {
      if (window.google && google.accounts && google.accounts.id) {
        clearInterval(checkGoogleInterval);
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false
        });

        if (googleSignInContainer) {
          googleSignInContainer.classList.remove('hidden');
          googleSignInContainer.innerHTML = '';
          google.accounts.id.renderButton(googleSignInContainer, {
            theme: "outline",
            size: "medium",
            type: "standard",
            shape: "pill",
            text: "signin_with"
          });
        }

        if (lockScreenGoogleBtnContainer) {
          lockScreenGoogleBtnContainer.innerHTML = '';
          google.accounts.id.renderButton(lockScreenGoogleBtnContainer, {
            theme: "filled_blue",
            size: "large",
            type: "standard",
            shape: "rectangular",
            text: "signin_with"
          });
        }
      }
    }, 200);
  }

  // Load stored AI settings
  const savedGeminiKey = localStorage.getItem('gemini_api_key') || '';
  const savedChatgptKey = localStorage.getItem('chatgpt_api_key') || '';
  const savedChatgptModel = localStorage.getItem('chatgpt_model') || 'gpt-4o-mini';

  if (geminiApiKeyInput) geminiApiKeyInput.value = savedGeminiKey;
  if (chatgptApiKeyInput) chatgptApiKeyInput.value = savedChatgptKey;
  if (chatgptModelSelect) chatgptModelSelect.value = savedChatgptModel;

  // Prompts State
  let subjectPrompts = JSON.parse(localStorage.getItem('subject_prompts') || '{}');

  function getSubjectPrompt(subject) {
    if (subjectPrompts[subject] && subjectPrompts[subject].trim()) {
      return subjectPrompts[subject];
    }
    return `Generate clear step-by-step solution for ${subject}.\n\nQuestion:\n{question_text}\n\nOptions:\n{opts_str}`;
  }

  // Render Subject Pills in Parser Hub
  function renderMainSubjectPillList() {
    ['subjectPillList', 'pasteSubjectPillList'].forEach(id => {
      const pillList = document.getElementById(id);
      if (!pillList) return;
      pillList.innerHTML = '';
      const subjects = Object.keys(TAXONOMY);
      subjects.forEach(sub => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `subject-pill ${sub === selectedSubject ? 'active' : ''}`;
        let icon = 'fa-book-open';
        if (sub === 'Quants') icon = 'fa-calculator';
        else if (sub === 'LRDI') icon = 'fa-diagram-project';
        btn.innerHTML = `<i class="fa-solid ${icon}"></i> ${sub}`;
        btn.addEventListener('click', () => {
          selectedSubject = sub;
          renderMainSubjectPillList();
        });
        pillList.appendChild(btn);
      });
    });
  }

  renderMainSubjectPillList();

  // AI Modal Handlers
  if (aiSettingsBtn) {
    aiSettingsBtn.addEventListener('click', () => {
      if (geminiApiKeyInput) geminiApiKeyInput.value = localStorage.getItem('gemini_api_key') || '';
      if (chatgptApiKeyInput) chatgptApiKeyInput.value = localStorage.getItem('chatgpt_api_key') || '';
      if (chatgptModelSelect) chatgptModelSelect.value = localStorage.getItem('chatgpt_model') || 'gpt-4o-mini';
      aiModalOverlay.classList.remove('hidden');
    });
  }
  const closeAiModal = () => aiModalOverlay.classList.add('hidden');
  if (closeAiModalBtn) closeAiModalBtn.addEventListener('click', closeAiModal);
  if (cancelAiModalBtn) cancelAiModalBtn.addEventListener('click', closeAiModal);
  if (saveAiModalBtn) {
    saveAiModalBtn.addEventListener('click', () => {
      localStorage.setItem('gemini_api_key', geminiApiKeyInput.value.trim());
      localStorage.setItem('chatgpt_api_key', chatgptApiKeyInput.value.trim());
      localStorage.setItem('chatgpt_model', chatgptModelSelect.value);
      closeAiModal();
      alert('AI Settings saved successfully!');
    });
  }

  // =========================================================================
  // SUBJECT PROMPTS & CONDITIONS MODAL
  // =========================================================================
  let activeModalPromptSubject = 'English';

  function renderModalSubjectTabs() {
    if (!modalSubjectTabs) return;
    modalSubjectTabs.innerHTML = '';
    const subjects = Object.keys(TAXONOMY);
    availableSubjects.forEach(s => {
      if (!subjects.includes(s)) subjects.push(s);
    });

    subjects.forEach(sub => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `subject-pill ${sub === activeModalPromptSubject ? 'active' : ''}`;
      let icon = 'fa-book-open';
      if (sub === 'Quants') icon = 'fa-calculator';
      else if (sub === 'LRDI') icon = 'fa-diagram-project';
      btn.innerHTML = `<i class="fa-solid ${icon}"></i> ${sub}`;
      btn.addEventListener('click', () => {
        if (subjectPromptTextarea) {
          subjectPrompts[activeModalPromptSubject] = subjectPromptTextarea.value;
        }
        activeModalPromptSubject = sub;
        renderModalSubjectTabs();
        loadPromptForSubject(activeModalPromptSubject);
      });
      modalSubjectTabs.appendChild(btn);
    });
  }

  function loadPromptForSubject(sub) {
    if (activeSubjectPromptLabel) {
      activeSubjectPromptLabel.innerHTML = `<i class="fa-solid fa-terminal"></i> Custom Prompt for ${sub}:`;
    }
    if (subjectPromptTextarea) {
      subjectPromptTextarea.value = getSubjectPrompt(sub);
    }
  }

  function openPromptsModal() {
    if (!promptsModalOverlay) return;
    activeModalPromptSubject = selectedSubject || 'English';
    renderModalSubjectTabs();
    loadPromptForSubject(activeModalPromptSubject);
    promptsModalOverlay.classList.remove('hidden');
  }

  function closePromptsModal() {
    if (promptsModalOverlay) promptsModalOverlay.classList.add('hidden');
    if (addSubjectInlineBox) addSubjectInlineBox.classList.add('hidden');
  }

  if (promptSettingsBtn) {
    promptSettingsBtn.addEventListener('click', openPromptsModal);
  }
  if (closePromptsModalBtn) closePromptsModalBtn.addEventListener('click', closePromptsModal);
  if (cancelPromptsModalBtn) cancelPromptsModalBtn.addEventListener('click', closePromptsModal);

  if (savePromptsModalBtn) {
    savePromptsModalBtn.addEventListener('click', () => {
      if (subjectPromptTextarea) {
        subjectPrompts[activeModalPromptSubject] = subjectPromptTextarea.value;
      }
      localStorage.setItem('subject_prompts', JSON.stringify(subjectPrompts));
      closePromptsModal();
      alert('All subject prompts saved successfully!');
    });
  }

  if (resetPromptBtn) {
    resetPromptBtn.addEventListener('click', () => {
      const def = `Generate clear step-by-step solution for ${activeModalPromptSubject}.\n\nQuestion:\n{question_text}\n\nOptions:\n{opts_str}`;
      if (subjectPromptTextarea) subjectPromptTextarea.value = def;
      subjectPrompts[activeModalPromptSubject] = def;
    });
  }

  if (insertQuestionVar && subjectPromptTextarea) {
    insertQuestionVar.addEventListener('click', () => {
      const cur = subjectPromptTextarea.selectionStart || subjectPromptTextarea.value.length;
      const text = subjectPromptTextarea.value;
      subjectPromptTextarea.value = text.slice(0, cur) + '{question_text}' + text.slice(cur);
      subjectPromptTextarea.focus();
    });
  }

  if (insertOptsVar && subjectPromptTextarea) {
    insertOptsVar.addEventListener('click', () => {
      const cur = subjectPromptTextarea.selectionStart || subjectPromptTextarea.value.length;
      const text = subjectPromptTextarea.value;
      subjectPromptTextarea.value = text.slice(0, cur) + '{opts_str}' + text.slice(cur);
      subjectPromptTextarea.focus();
    });
  }

  if (addNewSubjectBtn && addSubjectInlineBox) {
    addNewSubjectBtn.addEventListener('click', () => {
      addSubjectInlineBox.classList.toggle('hidden');
      if (newSubjectNameInput) newSubjectNameInput.focus();
    });
  }

  if (confirmAddSubjectBtn && newSubjectNameInput) {
    confirmAddSubjectBtn.addEventListener('click', () => {
      const name = newSubjectNameInput.value.trim();
      if (!name) return;
      if (!availableSubjects.includes(name)) {
        availableSubjects.push(name);
        localStorage.setItem('custom_subjects', JSON.stringify(availableSubjects));
      }
      if (!TAXONOMY[name]) {
        TAXONOMY[name] = { "General": ["General"] };
      }
      newSubjectNameInput.value = '';
      if (addSubjectInlineBox) addSubjectInlineBox.classList.add('hidden');
      activeModalPromptSubject = name;
      renderModalSubjectTabs();
      renderMainSubjectPillList();
      loadPromptForSubject(name);
    });
  }

  if (cancelAddSubjectBtn && addSubjectInlineBox) {
    cancelAddSubjectBtn.addEventListener('click', () => {
      addSubjectInlineBox.classList.add('hidden');
    });
  }

  // Role Gateway Screen & Navigation Helpers
  function showRoleGateway() {
    if (roleGatewayScreen) roleGatewayScreen.classList.remove('hidden');
    fetchPendingReviewCount();
  }

  function hideRoleGateway() {
    if (roleGatewayScreen) roleGatewayScreen.classList.add('hidden');
  }

  function applyRolePermissions(role) {
    if (role === 'parser') {
      if (modeReviewerBtn) modeReviewerBtn.classList.add('hidden');
      if (modeParserBtn) modeParserBtn.classList.remove('hidden');
      if (modeReviewedBankBtn) modeReviewedBankBtn.classList.remove('hidden');
      if (modeAddSingleBtn) modeAddSingleBtn.classList.remove('hidden');
      if (modeMockBtn) modeMockBtn.classList.remove('hidden');
    } else if (role === 'reviewer') {
      if (modeParserBtn) modeParserBtn.classList.add('hidden');
      if (modeAddSingleBtn) modeAddSingleBtn.classList.add('hidden');
      if (modeReviewerBtn) modeReviewerBtn.classList.remove('hidden');
      if (modeReviewedBankBtn) modeReviewedBankBtn.classList.remove('hidden');
      if (modeMockBtn) modeMockBtn.classList.remove('hidden');
    }
  }

  function setUserRole(role) {
    localStorage.setItem('questify_user_role', role);
    hideRoleGateway();
    applyRolePermissions(role);
    if (role === 'parser') {
      switchMainMode('parser');
    } else if (role === 'reviewer') {
      switchMainMode('reviewer');
    }
  }

  window.selectUserRole = function(role) {
    setUserRole(role);
  };

  const enterParserHubBtn = document.getElementById('enterParserHubBtn');
  const enterReviewerStudioBtn = document.getElementById('enterReviewerStudioBtn');

  if (enterParserHubBtn) {
    enterParserHubBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setUserRole('parser');
    });
  }

  if (enterReviewerStudioBtn) {
    enterReviewerStudioBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setUserRole('reviewer');
    });
  }

  if (selectRoleParserBtn) {
    selectRoleParserBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setUserRole('parser');
    });
    selectRoleParserBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setUserRole('parser');
      }
    });
  }

  if (selectRoleReviewerBtn) {
    selectRoleReviewerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setUserRole('reviewer');
    });
    selectRoleReviewerBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setUserRole('reviewer');
      }
    });
  }

  if (switchRoleNavBtn) {
    switchRoleNavBtn.addEventListener('click', showRoleGateway);
  }

  // =========================================================================
  // PRIMARY NAVIGATION (5 MODES) & FULL-SCREEN REVIEWER STUDIO
  // =========================================================================
  function switchMainMode(activeMode) {
    const role = localStorage.getItem('questify_user_role') || (activeMode === 'reviewer' ? 'reviewer' : 'parser');
    applyRolePermissions(role);

    [modeParserBtn, modeReviewerBtn, modeUnreviewedBankBtn, modeReviewedBankBtn, modeAddSingleBtn, modeMockBtn].forEach(b => b && b.classList.remove('active'));
    [parserSection, reviewerSection, reviewedBankSection, singleQSection, mockGeneratorSection].forEach(s => s && s.classList.add('hidden'));

    // Toggle Reviewer full-screen body class (hides footers and extra widgets)
    if (activeMode === 'reviewer') {
      document.body.classList.add('reviewer-mode');
      if (activeRoleNavLabel) activeRoleNavLabel.textContent = 'Reviewer (Guy B)';
    } else {
      document.body.classList.remove('reviewer-mode');
      if (activeRoleNavLabel) {
        if (activeMode === 'parser') activeRoleNavLabel.textContent = 'Parser (Guy A)';
        else if (activeMode === 'unreviewed_bank') activeRoleNavLabel.textContent = 'Unreviewed Questions';
        else if (activeMode === 'reviewed_bank') activeRoleNavLabel.textContent = 'Reviewed Bank';
        else if (activeMode === 'single') activeRoleNavLabel.textContent = 'Add Question';
        else if (activeMode === 'mock') activeRoleNavLabel.textContent = 'Mock Generator';
      }
    }

    if (activeMode === 'parser') {
      if (modeParserBtn) modeParserBtn.classList.add('active');
      if (parserSection) parserSection.classList.remove('hidden');
    } else if (activeMode === 'reviewer') {
      if (modeReviewerBtn) modeReviewerBtn.classList.add('active');
      if (reviewerSection) reviewerSection.classList.remove('hidden');
      initReviewerPortal();
    } else if (activeMode === 'unreviewed_bank') {
      if (modeUnreviewedBankBtn) modeUnreviewedBankBtn.classList.add('active');
      if (reviewedBankSection) reviewedBankSection.classList.remove('hidden');
      setBankTab('unreviewed');
    } else if (activeMode === 'reviewed_bank') {
      if (modeReviewedBankBtn) modeReviewedBankBtn.classList.add('active');
      if (reviewedBankSection) reviewedBankSection.classList.remove('hidden');
      setBankTab('reviewed');
    } else if (activeMode === 'single') {
      if (modeAddSingleBtn) modeAddSingleBtn.classList.add('active');
      if (singleQSection) singleQSection.classList.remove('hidden');
      initSingleQForm();
    } else if (activeMode === 'mock') {
      if (modeMockBtn) modeMockBtn.classList.add('active');
      if (mockGeneratorSection) mockGeneratorSection.classList.remove('hidden');
      initMockGeneratorForm();
    }
  }

  if (modeParserBtn) modeParserBtn.addEventListener('click', () => switchMainMode('parser'));
  if (modeReviewerBtn) modeReviewerBtn.addEventListener('click', () => switchMainMode('reviewer'));
  if (modeUnreviewedBankBtn) modeUnreviewedBankBtn.addEventListener('click', () => switchMainMode('unreviewed_bank'));
  if (modeReviewedBankBtn) modeReviewedBankBtn.addEventListener('click', () => switchMainMode('reviewed_bank'));
  if (modeAddSingleBtn) modeAddSingleBtn.addEventListener('click', () => switchMainMode('single'));
  if (modeMockBtn) modeMockBtn.addEventListener('click', () => switchMainMode('mock'));

  // Parser Sub-tabs: Document Upload vs Paste Text
  if (parserTabDocBtn && parserTabPasteBtn) {
    parserTabDocBtn.addEventListener('click', () => {
      parserTabDocBtn.classList.add('active');
      parserTabPasteBtn.classList.remove('active');
      if (parserDocUploadCard) parserDocUploadCard.classList.remove('hidden');
      if (parserPasteCard) parserPasteCard.classList.add('hidden');
    });
    parserTabPasteBtn.addEventListener('click', () => {
      parserTabPasteBtn.classList.add('active');
      parserTabDocBtn.classList.remove('active');
      if (parserPasteCard) parserPasteCard.classList.remove('hidden');
      if (parserDocUploadCard) parserDocUploadCard.classList.add('hidden');
      renderMainSubjectPillList();
    });
  }

  // =========================================================================
  // GUY A: PARSE DOCUMENTS & RAW TEXT
  // =========================================================================
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
  });
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
  });
  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
  });
  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const ext = files[0].name.split('.').pop().toLowerCase();
      if (['pdf', 'docx', 'doc'].includes(ext)) {
        handleFileSelection(files[0]);
      } else {
        alert('Please upload a valid PDF or Word document (.docx, .doc).');
      }
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  });

  function handleFileSelection(file) {
    selectedFile = file;
    fileNameDisplay.textContent = file.name;
    fileSizeDisplay.textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    filePreviewCard.classList.remove('hidden');
    parsePdfBtn.disabled = false;
  }

  removeFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    selectedFile = null;
    fileInput.value = '';
    filePreviewCard.classList.add('hidden');
    parsePdfBtn.disabled = true;
  });

  function showProgress(text, percent) {
    if (progressContainer) progressContainer.classList.remove('hidden');
    if (progressBar) progressBar.style.width = percent + '%';
    if (progressText) progressText.textContent = text;
  }

  function updateStatusBadge(msg, type) {
    const statusBadge = document.getElementById('statusBadge');
    if (statusBadge) {
      statusBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${msg}`;
    }
  }

  // Parse Document Action
  parsePdfBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    const geminiApiKey = localStorage.getItem('gemini_api_key') || '';
    const customPrompt = getSubjectPrompt(selectedSubject);
    const useAiTopics = useAiTopicsCheckbox ? useAiTopicsCheckbox.checked : false;
    const useAiExtraction = useAiExtractionCheckbox ? useAiExtractionCheckbox.checked : false;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('subject', selectedSubject);
    formData.append('llmProvider', 'gemini');
    formData.append('model', 'gemini-2.0-flash');
    formData.append('useAiTopics', useAiTopics ? 'true' : 'false');
    formData.append('useAiExtraction', useAiExtraction ? 'true' : 'false');
    if (customPrompt) formData.append('customPrompt', customPrompt);
    if (geminiApiKey) formData.append('apiKey', geminiApiKey);

    showProgress('Parsing document contents...', 30);

    try {
      const response = await fetch(`${API_BASE}/api/parse-document`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let errDetails = response.statusText;
        try {
          const errText = await response.text();
          if (errText) errDetails = errText;
        } catch(e) {}
        throw new Error(`Server Status ${response.status}: ${errDetails}`);
      }

      showProgress('Extracting questions & options...', 70);
      const data = await response.json();
      showProgress('Rendering preview cards...', 100);
      
      setTimeout(() => {
        progressContainer.classList.add('hidden');
        if (data.questions && data.questions.length > 0) {
          questionsData = data.questions.map(q => ({
            ...q,
            subject: q.subject || selectedSubject,
            isSelected: true
          }));
          renderParsedQuestions();
          workspaceSection.classList.remove('hidden');
          workspaceSection.scrollIntoView({ behavior: 'smooth' });
          updateStatusBadge('Parsed Successfully', 'success');
        } else {
          alert('No questions could be extracted from this document. Please verify format.');
        }
      }, 400);

    } catch (err) {
      progressContainer.classList.add('hidden');
      alert('Error parsing document: ' + err.message);
    }
  });

  // Paste Text Parser
  const SAMPLE_PASTE_TEXT = `**Question 1.**\nA trader buys 75 kg of rice at ₹44 per kg and 45 kg at ₹68 per kg. During cleaning, 5% of the total weight is lost. He sells two-thirds of the remaining mixture at ₹65 per kg and the rest at ₹59 per kg. If mixing and transportation cost ₹162, determine his net result.\n\n**(A)** ₹822 profit\n**(B)** ₹498 profit\n**(C)** ₹660 profit\n**(D)** ₹660 loss\n\n**Correct Option: (C)**\n**Hint:** Calculate total cost price, net weight after 5% loss, and total revenue.\n\n---\n\n**Question 2.**\nIf $x^2 - 7x + 12 = 0$, find the value of $x$.\n\n**(A)** $3, 4$\n**(B)** $2, 6$\n**(C)** $-3, -4$\n**(D)** $1, 12$\n\n**Correct Option: (A)**\n**Hint:** Factorize $(x-3)(x-4) = 0$.`;

  if (loadPasteSampleBtn) {
    loadPasteSampleBtn.addEventListener('click', () => {
      if (rawTextInput) {
        rawTextInput.value = SAMPLE_PASTE_TEXT;
        selectedSubject = 'Quants';
        renderMainSubjectPillList();
        rawTextInput.focus();
      }
    });
  }

  if (loadSampleBtn) {
    loadSampleBtn.addEventListener('click', () => {
      parserTabPasteBtn.click();
      if (rawTextInput) {
        rawTextInput.value = SAMPLE_PASTE_TEXT;
        selectedSubject = 'Quants';
        renderMainSubjectPillList();
        rawTextInput.focus();
      }
    });
  }

  if (clearPasteTextBtn) {
    clearPasteTextBtn.addEventListener('click', () => {
      if (rawTextInput) { rawTextInput.value = ''; rawTextInput.focus(); }
    });
  }

  if (pasteClipboardBtn) {
    pasteClipboardBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text && rawTextInput) { rawTextInput.value = text; rawTextInput.focus(); }
      } catch (err) {
        alert('Could not read clipboard. Please paste manually into the text box.');
      }
    });
  }

  if (parseTextBtn) {
    parseTextBtn.addEventListener('click', async () => {
      const text = rawTextInput ? rawTextInput.value.trim() : '';
      if (!text) {
        alert('Please paste or enter questions text to extract.');
        return;
      }

      const geminiApiKey = localStorage.getItem('gemini_api_key') || '';
      const customPrompt = getSubjectPrompt(selectedSubject);
      const useAiTopics = pasteUseAiTopicsCheckbox ? pasteUseAiTopicsCheckbox.checked : false;
      const useAiExtraction = pasteUseAiExtractionCheckbox ? pasteUseAiExtractionCheckbox.checked : false;

      if (pasteProgressContainer) pasteProgressContainer.classList.remove('hidden');
      if (pasteProgressBar) pasteProgressBar.style.width = '40%';
      parseTextBtn.disabled = true;

      try {
        const response = await fetch(`${API_BASE}/api/parse-text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text,
            subject: selectedSubject,
            llmProvider: 'gemini',
            model: 'gemini-2.0-flash',
            apiKey: geminiApiKey,
            useAiTopics: useAiTopics,
            useAiExtraction: useAiExtraction,
            customPrompt: customPrompt
          })
        });

        if (!response.ok) {
          let errDetails = response.statusText;
          try {
            const errObj = await response.json();
            if (errObj && errObj.detail) errDetails = errObj.detail;
          } catch(e) {}
          throw new Error(`Server Status ${response.status}: ${errDetails}`);
        }

        const data = await response.json();
        if (pasteProgressBar) pasteProgressBar.style.width = '100%';

        setTimeout(() => {
          if (pasteProgressContainer) pasteProgressContainer.classList.add('hidden');
          if (data.questions && data.questions.length > 0) {
            questionsData = data.questions.map(q => ({
              ...q,
              subject: q.subject || selectedSubject,
              isSelected: true
            }));
            renderParsedQuestions();
            if (workspaceSection) {
              workspaceSection.classList.remove('hidden');
              workspaceSection.scrollIntoView({ behavior: 'smooth' });
            }
            updateStatusBadge('Parsed Successfully', 'success');
          } else {
            alert('No questions could be extracted. Please check formatting.');
          }
        }, 300);

      } catch (err) {
        if (pasteProgressContainer) pasteProgressContainer.classList.add('hidden');
        alert('Error parsing text: ' + err.message);
      } finally {
        parseTextBtn.disabled = false;
      }
    });
  }

  // Render Parsed Questions Cards (Guy A View)
  function renderParsedQuestions() {
    if (!questionsList) return;
    questionsList.innerHTML = '';
    questionCountBadge.textContent = `${questionsData.length} Questions`;

    const filterQuery = (searchInput ? searchInput.value : '').toLowerCase().trim();

    questionsData.forEach((q, qIndex) => {
      if (!q.subject) q.subject = selectedSubject;

      if (filterQuery) {
        const matchQ = (q.questionText || '').toLowerCase().includes(filterQuery);
        const matchHint = (q.hint || '').toLowerCase().includes(filterQuery);
        const matchTopic = (q.topic || '').toLowerCase().includes(filterQuery);
        const matchOpts = (q.options || []).some(o => (o.text || '').toLowerCase().includes(filterQuery));
        if (!matchQ && !matchHint && !matchTopic && !matchOpts) return;
      }

      const card = document.createElement('div');
      card.className = `question-card ${q.isSelected ? 'selected' : ''}`;
      card.dataset.index = qIndex;

      let optionsHtml = '';
      (q.options || []).forEach((opt, optIndex) => {
        optionsHtml += `
          <div class="option-row ${opt.isCorrect ? 'correct' : ''}">
            <input type="radio" name="parsed_correct_${qIndex}" class="radio-custom" ${opt.isCorrect ? 'checked' : ''} data-qindex="${qIndex}" data-optindex="${optIndex}">
            <input type="text" class="option-input parsed-opt-text" value="${escapeHtml(opt.text)}" data-qindex="${qIndex}" data-optindex="${optIndex}">
            ${opt.isCorrect ? '<span class="correct-badge"><i class="fa-solid fa-check"></i> Correct</span>' : ''}
          </div>
        `;
      });

      card.innerHTML = `
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <input type="checkbox" class="parsed-select-checkbox" data-qindex="${qIndex}" ${q.isSelected ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
            <span class="question-index"><i class="fa-solid fa-circle-question"></i> Question ${qIndex + 1}</span>
          </div>
          <div class="card-meta-inputs" style="gap: 0.5rem; align-items: center;">
            <span class="badge" style="background: var(--bg-input); border: 1px solid var(--border-color); font-size: 0.75rem; text-transform: uppercase; color: #818cf8;">${q.label || 'medium'}</span>
            <span class="badge" style="background: var(--bg-input); border: 1px solid var(--border-color); font-size: 0.75rem;">${q.subject || 'English'}</span>
            <span class="badge" style="background: var(--bg-input); border: 1px solid var(--border-color); font-size: 0.75rem;">${q.topic || 'General'}</span>
            <button class="btn btn-icon text-danger parsed-del-q-btn" data-qindex="${qIndex}" title="Remove question"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>

        <div class="card-body">
          <div class="form-group">
            <label><i class="fa-solid fa-pen-nib"></i> Question Text</label>
            <textarea class="q-text-input parsed-qtext-input" rows="2" data-qindex="${qIndex}">${escapeHtml(q.questionText)}</textarea>
            <div class="latex-preview-box math-render parsed-math-preview" id="parsed_math_${qIndex}"></div>
          </div>
          ${q.hint ? `
          <div class="hint-wrapper">
            <div class="hint-header"><label><i class="fa-solid fa-lightbulb"></i> Hint / Solution</label></div>
            <textarea class="q-hint-input parsed-hint-input" rows="3" data-qindex="${qIndex}">${escapeHtml(q.hint)}</textarea>
          </div>` : ''}
          <div class="options-container" style="margin-top: 0.75rem;">
            ${optionsHtml}
          </div>
        </div>
      `;

      questionsList.appendChild(card);
    });

    renderParsedMathPreviews();
    attachParsedCardEvents();
  }

  function renderParsedMathPreviews() {
    questionsData.forEach((q, idx) => {
      const box = document.getElementById(`parsed_math_${idx}`);
      if (box) renderMathInContainer(box, q.questionText || '');
    });
  }

  function attachParsedCardEvents() {
    document.querySelectorAll('.parsed-select-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const qIdx = parseInt(e.target.dataset.qindex);
        questionsData[qIdx].isSelected = e.target.checked;
        const card = e.target.closest('.question-card');
        if (card) card.classList.toggle('selected', e.target.checked);
      });
    });

    document.querySelectorAll('.parsed-qtext-input').forEach(ta => {
      ta.addEventListener('input', (e) => {
        const qIdx = parseInt(e.target.dataset.qindex);
        questionsData[qIdx].questionText = e.target.value;
        const box = document.getElementById(`parsed_math_${qIdx}`);
        if (box) renderMathInContainer(box, e.target.value);
      });
    });

    document.querySelectorAll('.parsed-hint-input').forEach(ta => {
      ta.addEventListener('input', (e) => {
        const qIdx = parseInt(e.target.dataset.qindex);
        questionsData[qIdx].hint = e.target.value;
      });
    });

    document.querySelectorAll('.parsed-opt-text').forEach(input => {
      input.addEventListener('input', (e) => {
        const qIdx = parseInt(e.target.dataset.qindex);
        const optIdx = parseInt(e.target.dataset.optindex);
        questionsData[qIdx].options[optIdx].text = e.target.value;
      });
    });

    document.querySelectorAll('.parsed-del-q-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const qIdx = parseInt(e.currentTarget.dataset.qindex);
        questionsData.splice(qIdx, 1);
        renderParsedQuestions();
      });
    });
  }

  if (selectAllParsedBtn) {
    selectAllParsedBtn.addEventListener('click', () => {
      questionsData.forEach(q => q.isSelected = true);
      renderParsedQuestions();
    });
  }

  if (deselectAllParsedBtn) {
    deselectAllParsedBtn.addEventListener('click', () => {
      questionsData.forEach(q => q.isSelected = false);
      renderParsedQuestions();
    });
  }

  if (applyBulkTopicBtn) {
    applyBulkTopicBtn.addEventListener('click', () => {
      const top = bulkTopicInput.value.trim();
      if (!top) return;
      questionsData.forEach(q => q.topic = top);
      renderParsedQuestions();
    });
  }

  if (searchInput) searchInput.addEventListener('input', renderParsedQuestions);

  // Guy A Primary Action: Push to Review Queue (Staging DB)
  if (pushToReviewQueueBtn) {
    pushToReviewQueueBtn.addEventListener('click', async () => {
      const selectedQuestions = questionsData.filter(q => q.isSelected !== false);
      if (selectedQuestions.length === 0) {
        alert('Please select at least one question to send to the review queue.');
        return;
      }

      const origHtml = pushToReviewQueueBtn.innerHTML;
      pushToReviewQueueBtn.innerHTML = '<i class="fa-solid fa-spinner spin-icon"></i> Sending to Guy B...';
      pushToReviewQueueBtn.disabled = true;

      try {
        const res = await fetch(`${API_BASE}/api/unreviewed-questions/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questions: selectedQuestions })
        });
        const result = await res.json();
        if (res.ok) {
          alert(`🎉 Success! ${result.count} questions have been transferred to Guy B's Review Queue in Questify DB.\nGuy A's task is complete!`);
          questionsData = questionsData.filter(q => !q.isSelected);
          renderParsedQuestions();
          fetchPendingReviewCount();
        } else {
          alert('Error transferring questions: ' + (result.detail || 'Unknown error'));
        }
      } catch (err) {
        alert('Network error: ' + err.message);
      } finally {
        pushToReviewQueueBtn.innerHTML = origHtml;
        pushToReviewQueueBtn.disabled = false;
      }
    });
  }

  // =========================================================================
  // GUY B: REVIEWER PORTAL (ONE-BY-ONE QUEUE)
  // =========================================================================
  let reviewQueueData = [];
  let currentReviewQuestion = null;
  let currentReviewIndex = 0;
  let totalReviewQueueCount = 0;
  let reviewSubMode = 'focus'; // 'focus' or 'list'

  const reviewerQueueCountBadge = document.getElementById('reviewerQueueCountBadge');
  const reviewSubjectFilter = document.getElementById('reviewSubjectFilter');
  const reviewFocusModeBtn = document.getElementById('reviewFocusModeBtn');
  const reviewQueueListModeBtn = document.getElementById('reviewQueueListModeBtn');
  const refreshReviewQueueBtn = document.getElementById('refreshReviewQueueBtn');

  const reviewFocusView = document.getElementById('reviewFocusView');
  const reviewQueueListView = document.getElementById('reviewQueueListView');
  const focusReviewCard = document.getElementById('focusReviewCard');
  const reviewerEmptyQueueState = document.getElementById('reviewerEmptyQueueState');

  const stepperQuestionIndex = document.getElementById('stepperQuestionIndex');
  const focusQuestionMetaBadge = document.getElementById('focusQuestionMetaBadge');
  const queueProgressBar = document.getElementById('queueProgressBar');
  const prevQueueItemBtn = document.getElementById('prevQueueItemBtn');
  const skipQueueItemBtn = document.getElementById('skipQueueItemBtn');

  const focusQuestionTabBtn = document.getElementById('focusQuestionTabBtn');
  const focusJsonTabBtn = document.getElementById('focusJsonTabBtn');
  const focusQuestionPane = document.getElementById('focusQuestionPane');
  const focusJsonPane = document.getElementById('focusJsonPane');
  const focusJsonEditor = document.getElementById('focusJsonEditor');
  const focusJsonActions = document.getElementById('focusJsonActions');
  const focusCopyJsonBtn = document.getElementById('focusCopyJsonBtn');
  const focusPrettifyJsonBtn = document.getElementById('focusPrettifyJsonBtn');

  const focusSubjectSelect = document.getElementById('focusSubjectSelect');
  const focusTopicSelect = document.getElementById('focusTopicSelect');
  const focusSubtopicSelect = document.getElementById('focusSubtopicSelect');
  const focusLabelSelect = document.getElementById('focusLabelSelect');
  const focusQTextInput = document.getElementById('focusQTextInput');
  const focusOptionsContainer = document.getElementById('focusOptionsContainer');
  const focusAddOptBtn = document.getElementById('focusAddOptBtn');
  const focusHintInput = document.getElementById('focusHintInput');
  const focusGenerateAiHintBtn = document.getElementById('focusGenerateAiHintBtn');
  const focusRejectQuestionBtn = document.getElementById('focusRejectQuestionBtn');
  const focusSaveDraftBtn = document.getElementById('focusSaveDraftBtn');
  const focusApproveQuestionBtn = document.getElementById('focusApproveQuestionBtn');

  const queueListContainer = document.getElementById('queueListContainer');
  const queueListSearchInput = document.getElementById('queueListSearchInput');
  const emptyQueueToBankBtn = document.getElementById('emptyQueueToBankBtn');

  function normalizeParagraphText(text) {
    if (!text || typeof text !== 'string') return '';
    let t = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const paragraphs = t.split(/\n\s*\n/);
    const cleanedParas = paragraphs.map(p => {
      const lines = p.split('\n').map(l => l.trim()).filter(Boolean);
      if (!lines.length) return '';
      let result = lines[0];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (/^(\d+[\.\)]|[A-Za-z][\.\)]|[-*•])\s+/.test(line)) {
          result += '\n' + line;
        } else {
          result += ' ' + line;
        }
      }
      return result;
    }).filter(Boolean);
    return cleanedParas.join('\n\n');
  }

  function syncQuestionFormToJson() {
    if (!focusJsonEditor) return;
    const currentOpts = (currentReviewQuestion && currentReviewQuestion.options) ? currentReviewQuestion.options : [];
    const qObj = {
      subject: focusSubjectSelect ? focusSubjectSelect.value : (currentReviewQuestion ? currentReviewQuestion.subject : 'English'),
      topic: focusTopicSelect ? focusTopicSelect.value : (currentReviewQuestion ? currentReviewQuestion.topic : ''),
      subtopic: focusSubtopicSelect ? focusSubtopicSelect.value : (currentReviewQuestion ? currentReviewQuestion.subtopic : ''),
      label: focusLabelSelect ? focusLabelSelect.value : (currentReviewQuestion ? currentReviewQuestion.label : 'medium'),
      questionText: focusQTextInput ? focusQTextInput.value : (currentReviewQuestion ? currentReviewQuestion.questionText : ''),
      options: currentOpts,
      hint: focusHintInput ? focusHintInput.value : (currentReviewQuestion ? currentReviewQuestion.hint : '')
    };
    focusJsonEditor.value = JSON.stringify(qObj, null, 2);
  }

  function syncJsonToQuestionForm() {
    if (!focusJsonEditor) return true;
    const raw = focusJsonEditor.value.trim();
    if (!raw) return true;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.subject && focusSubjectSelect) {
        focusSubjectSelect.value = parsed.subject;
      }
      updateFocusTopics(
        parsed.subject || (focusSubjectSelect ? focusSubjectSelect.value : 'English'),
        parsed.topic,
        parsed.subtopic
      );
      if (parsed.label && focusLabelSelect) {
        focusLabelSelect.value = parsed.label;
      }
      if (parsed.questionText !== undefined && focusQTextInput) {
        focusQTextInput.value = normalizeParagraphText(parsed.questionText);
      }
      if (parsed.hint !== undefined && focusHintInput) {
        focusHintInput.value = normalizeParagraphText(parsed.hint);
      }
      if (Array.isArray(parsed.options)) {
        if (!currentReviewQuestion) currentReviewQuestion = {};
        currentReviewQuestion.options = parsed.options;
        renderFocusOptions(currentReviewQuestion.options);
      }
      return true;
    } catch (e) {
      alert('Invalid JSON syntax: ' + e.message);
      return false;
    }
  }

  // Question <-> JSON Slider Switch
  function setFocusReviewTab(tab) {
    if (tab === 'json') {
      syncQuestionFormToJson();
      if (focusQuestionTabBtn) focusQuestionTabBtn.classList.remove('active');
      if (focusJsonTabBtn) focusJsonTabBtn.classList.add('active');
      if (focusQuestionPane) {
        focusQuestionPane.classList.add('hidden');
        focusQuestionPane.style.setProperty('display', 'none', 'important');
      }
      if (focusJsonPane) {
        focusJsonPane.classList.remove('hidden');
        focusJsonPane.style.setProperty('display', 'flex', 'important');
      }
      if (focusJsonActions) {
        focusJsonActions.classList.remove('hidden');
        focusJsonActions.style.setProperty('display', 'flex', 'important');
      }
    } else {
      if (focusJsonPane && !focusJsonPane.classList.contains('hidden') && focusJsonPane.style.display !== 'none') {
        if (!syncJsonToQuestionForm()) return;
      }
      if (focusJsonTabBtn) focusJsonTabBtn.classList.remove('active');
      if (focusQuestionTabBtn) focusQuestionTabBtn.classList.add('active');
      if (focusJsonPane) {
        focusJsonPane.classList.add('hidden');
        focusJsonPane.style.setProperty('display', 'none', 'important');
      }
      if (focusJsonActions) {
        focusJsonActions.classList.add('hidden');
        focusJsonActions.style.setProperty('display', 'none', 'important');
      }
      if (focusQuestionPane) {
        focusQuestionPane.classList.remove('hidden');
        focusQuestionPane.style.setProperty('display', 'flex', 'important');
      }
    }
  }

  if (focusQuestionTabBtn) {
    focusQuestionTabBtn.addEventListener('click', () => setFocusReviewTab('question'));
  }
  if (focusJsonTabBtn) {
    focusJsonTabBtn.addEventListener('click', () => setFocusReviewTab('json'));
  }

  if (focusCopyJsonBtn) {
    focusCopyJsonBtn.addEventListener('click', () => {
      if (!focusJsonEditor) return;
      navigator.clipboard.writeText(focusJsonEditor.value).then(() => {
        const orig = focusCopyJsonBtn.innerHTML;
        focusCopyJsonBtn.innerHTML = '<i class="fa-solid fa-check" style="color: #10b981;"></i> Copied!';
        setTimeout(() => { focusCopyJsonBtn.innerHTML = orig; }, 1800);
      }).catch(() => {
        alert('Could not copy JSON to clipboard.');
      });
    });
  }

  if (focusPrettifyJsonBtn) {
    focusPrettifyJsonBtn.addEventListener('click', () => {
      if (!focusJsonEditor) return;
      try {
        const parsed = JSON.parse(focusJsonEditor.value);
        focusJsonEditor.value = JSON.stringify(parsed, null, 2);
      } catch(e) {
        alert('Cannot format invalid JSON: ' + e.message);
      }
    });
  }

  async function fetchPendingReviewCount() {
    try {
      const res = await fetch(`${API_BASE}/api/unreviewed-questions/stats`);
      if (res.ok) {
        const stats = await res.json();
        const cnt = stats.unreviewedTotal || 0;
        const rev = stats.reviewedTotal || 0;
        if (navPendingReviewBadge) {
          navPendingReviewBadge.textContent = cnt;
          navPendingReviewBadge.style.display = cnt > 0 ? 'inline-block' : 'none';
        }
        if (navUnreviewedCountBadge) {
          navUnreviewedCountBadge.textContent = cnt;
        }
        if (navReviewedCountBadge) {
          navReviewedCountBadge.textContent = rev;
        }
        if (qbUnreviewedBadge) {
          qbUnreviewedBadge.textContent = cnt;
        }
        if (qbReviewedBadge) {
          qbReviewedBadge.textContent = rev;
        }
        if (reviewerQueueCountBadge) {
          reviewerQueueCountBadge.textContent = `${cnt} Pending Review`;
        }
        if (gatewayPendingBadge) {
          gatewayPendingBadge.textContent = `${cnt} in Queue`;
        }
      }
    } catch(e) {}
  }

  function initReviewerPortal() {
    currentReviewIndex = 0;
    fetchFocusQuestion(currentReviewIndex);
    fetchPendingReviewCount();
  }

  async function fetchFocusQuestion(index = 0) {
    const subj = reviewSubjectFilter ? reviewSubjectFilter.value : 'all';
    try {
      const res = await fetch(`${API_BASE}/api/review-queue/next?index=${index}&subject=${subj}`);
      if (res.ok) {
        const data = await res.json();
        totalReviewQueueCount = data.total || 0;
        currentReviewIndex = index;

        if (reviewerQueueCountBadge) {
          reviewerQueueCountBadge.textContent = `${totalReviewQueueCount} Pending Review`;
        }
        if (navPendingReviewBadge) {
          navPendingReviewBadge.textContent = totalReviewQueueCount;
        }

        if (data.status === 'empty' || !data.question) {
          if (focusReviewCard) focusReviewCard.classList.add('hidden');
          if (reviewerEmptyQueueState) reviewerEmptyQueueState.classList.remove('hidden');
          if (stepperQuestionIndex) stepperQuestionIndex.textContent = 'Queue Empty';
          if (queueProgressBar) queueProgressBar.style.width = '100%';
          return;
        }

        if (focusReviewCard) focusReviewCard.classList.remove('hidden');
        if (reviewerEmptyQueueState) reviewerEmptyQueueState.classList.add('hidden');

        currentReviewQuestion = data.question;
        renderFocusQuestion(currentReviewQuestion, currentReviewIndex, totalReviewQueueCount);
      }
    } catch(err) {
      alert('Error fetching question from queue: ' + err.message);
    }
  }

  function renderFocusQuestion(q, idx, total) {
    if (!q) return;

    if (stepperQuestionIndex) stepperQuestionIndex.textContent = `Question ${idx + 1} of ${total}`;
    if (focusQuestionMetaBadge) focusQuestionMetaBadge.textContent = `${q.subject || 'English'} • ${q.topic || 'General'}`;
    if (queueProgressBar) {
      const pct = total > 0 ? Math.round(((idx + 1) / total) * 100) : 0;
      queueProgressBar.style.width = `${pct}%`;
    }

    if (prevQueueItemBtn) prevQueueItemBtn.disabled = (idx === 0);
    if (skipQueueItemBtn) skipQueueItemBtn.disabled = (idx >= total - 1);

    if (focusSubjectSelect) focusSubjectSelect.value = q.subject || 'English';
    updateFocusTopics(q.subject || 'English', q.topic, q.subtopic);
    if (focusLabelSelect) focusLabelSelect.value = q.label || 'medium';

    const cleanQ = normalizeParagraphText(q.questionText || '');
    const cleanH = normalizeParagraphText(q.hint || '');
    q.questionText = cleanQ;
    q.hint = cleanH;

    if (focusQTextInput) focusQTextInput.value = cleanQ;
    if (focusHintInput) focusHintInput.value = cleanH;

    renderFocusOptions(q.options || []);

    if (focusJsonPane && !focusJsonPane.classList.contains('hidden') && focusJsonPane.style.display !== 'none') {
      syncQuestionFormToJson();
    }
  }

  function updateFocusTopics(subject, currentTopic, currentSubtopic) {
    const topics = getTopicsForSubject(subject);
    focusTopicSelect.innerHTML = '';
    topics.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      if (t === currentTopic) opt.selected = true;
      focusTopicSelect.appendChild(opt);
    });

    const activeTop = focusTopicSelect.value;
    const subtopics = getSubtopicsForTopic(subject, activeTop);
    focusSubtopicSelect.innerHTML = '';
    subtopics.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      if (s === currentSubtopic) opt.selected = true;
      focusSubtopicSelect.appendChild(opt);
    });
  }

  if (focusSubjectSelect) {
    focusSubjectSelect.addEventListener('change', () => {
      updateFocusTopics(focusSubjectSelect.value);
      if (focusJsonPane && !focusJsonPane.classList.contains('hidden')) {
        syncQuestionFormToJson();
      }
    });
  }
  if (focusTopicSelect) {
    focusTopicSelect.addEventListener('change', () => {
      const subs = getSubtopicsForTopic(focusSubjectSelect.value, focusTopicSelect.value);
      focusSubtopicSelect.innerHTML = '';
      subs.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        focusSubtopicSelect.appendChild(opt);
      });
      if (focusJsonPane && !focusJsonPane.classList.contains('hidden')) {
        syncQuestionFormToJson();
      }
    });
  }
  if (focusSubtopicSelect) {
    focusSubtopicSelect.addEventListener('change', () => {
      if (focusJsonPane && !focusJsonPane.classList.contains('hidden')) {
        syncQuestionFormToJson();
      }
    });
  }
  if (focusLabelSelect) {
    focusLabelSelect.addEventListener('change', () => {
      if (focusJsonPane && !focusJsonPane.classList.contains('hidden')) {
        syncQuestionFormToJson();
      }
    });
  }

  function renderFocusOptions(options) {
    if (!focusOptionsContainer) return;
    focusOptionsContainer.innerHTML = '';

    options.forEach((opt, oIdx) => {
      const row = document.createElement('div');
      row.className = `option-row ${opt.isCorrect ? 'correct' : ''}`;
      row.innerHTML = `
        <input type="radio" name="focus_correct_opt" class="radio-custom" ${opt.isCorrect ? 'checked' : ''} data-oidx="${oIdx}">
        <input type="text" class="option-input focus-opt-text" value="${escapeHtml(opt.text)}" placeholder="Option ${chr(65 + oIdx)}..." data-oidx="${oIdx}">
        ${opt.isCorrect ? '<span class="correct-badge"><i class="fa-solid fa-check"></i> Correct</span>' : ''}
        ${options.length > 2 ? `<button type="button" class="btn btn-icon text-danger focus-del-opt-btn" data-oidx="${oIdx}"><i class="fa-solid fa-xmark"></i></button>` : ''}
      `;
      focusOptionsContainer.appendChild(row);
    });

    document.querySelectorAll('input[name="focus_correct_opt"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const targetOIdx = parseInt(e.target.dataset.oidx);
        currentReviewQuestion.options.forEach((o, i) => o.isCorrect = (i === targetOIdx));
        renderFocusOptions(currentReviewQuestion.options);
        if (focusJsonPane && !focusJsonPane.classList.contains('hidden')) {
          syncQuestionFormToJson();
        }
      });
    });

    document.querySelectorAll('.focus-opt-text').forEach(input => {
      input.addEventListener('input', (e) => {
        const targetOIdx = parseInt(e.target.dataset.oidx);
        currentReviewQuestion.options[targetOIdx].text = e.target.value;
        if (focusJsonPane && !focusJsonPane.classList.contains('hidden')) {
          syncQuestionFormToJson();
        }
      });
    });

    document.querySelectorAll('.focus-del-opt-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetOIdx = parseInt(e.currentTarget.dataset.oidx);
        currentReviewQuestion.options.splice(targetOIdx, 1);
        if (!currentReviewQuestion.options.some(o => o.isCorrect) && currentReviewQuestion.options.length > 0) {
          currentReviewQuestion.options[0].isCorrect = true;
        }
        renderFocusOptions(currentReviewQuestion.options);
        if (focusJsonPane && !focusJsonPane.classList.contains('hidden')) {
          syncQuestionFormToJson();
        }
      });
    });
  }

  if (focusAddOptBtn) {
    focusAddOptBtn.addEventListener('click', () => {
      if (!currentReviewQuestion) return;
      if (!currentReviewQuestion.options) currentReviewQuestion.options = [];
      currentReviewQuestion.options.push({ text: '', isCorrect: false });
      renderFocusOptions(currentReviewQuestion.options);
      if (focusJsonPane && !focusJsonPane.classList.contains('hidden')) {
        syncQuestionFormToJson();
      }
    });
  }

  // Generate / Refine AI Hint for Focus Question
  if (focusGenerateAiHintBtn) {
    focusGenerateAiHintBtn.addEventListener('click', async () => {
      if (focusJsonPane && !focusJsonPane.classList.contains('hidden')) {
        if (!syncJsonToQuestionForm()) return;
      }

      const qText = focusQTextInput.value.trim();
      if (!qText) { alert('Question text is empty.'); return; }

      const geminiApiKey = localStorage.getItem('gemini_api_key') || '';
      const subj = focusSubjectSelect.value;
      const customPrompt = getSubjectPrompt(subj);

      const origHtml = focusGenerateAiHintBtn.innerHTML;
      focusGenerateAiHintBtn.innerHTML = '<i class="fa-solid fa-spinner spin-icon"></i> Generating Solution...';
      focusGenerateAiHintBtn.disabled = true;

      try {
        const res = await fetch(`${API_BASE}/api/generate-hint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionText: qText,
            options: currentReviewQuestion.options || [],
            apiKey: geminiApiKey,
            llmProvider: 'gemini',
            model: 'gemini-2.0-flash',
            subject: subj,
            customPrompt: customPrompt
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || 'AI generation failed');
        }

        const data = await res.json();
        focusHintInput.value = data.hint || '';
        if (currentReviewQuestion) currentReviewQuestion.hint = data.hint || '';
        if (focusJsonPane && !focusJsonPane.classList.contains('hidden')) {
          syncQuestionFormToJson();
        }
      } catch (err) {
        alert('AI Hint generation error: ' + err.message);
      } finally {
        focusGenerateAiHintBtn.innerHTML = origHtml;
        focusGenerateAiHintBtn.disabled = false;
      }
    });
  }

  // Next / Previous Stepper
  if (prevQueueItemBtn) {
    prevQueueItemBtn.addEventListener('click', () => {
      if (currentReviewIndex > 0) {
        fetchFocusQuestion(currentReviewIndex - 1);
      }
    });
  }
  if (skipQueueItemBtn) {
    skipQueueItemBtn.addEventListener('click', () => {
      fetchFocusQuestion(currentReviewIndex + 1);
    });
  }

  // Save Draft (Updates question in unreviewed_questions)
  if (focusSaveDraftBtn) {
    focusSaveDraftBtn.addEventListener('click', async () => {
      if (!currentReviewQuestion || !currentReviewQuestion.id) return;
      
      if (focusJsonPane && !focusJsonPane.classList.contains('hidden')) {
        if (!syncJsonToQuestionForm()) return;
      }

      const payload = {
        subject: focusSubjectSelect.value,
        topic: focusTopicSelect.value,
        subtopic: focusSubtopicSelect.value,
        label: focusLabelSelect.value,
        questionText: focusQTextInput.value.trim(),
        hint: focusHintInput.value.trim(),
        options: currentReviewQuestion.options
      };

      try {
        const res = await fetch(`${API_BASE}/api/review-queue/${currentReviewQuestion.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          alert('Draft updated in staging queue.');
        } else {
          alert('Error saving draft');
        }
      } catch(err) {
        alert('Network error: ' + err.message);
      }
    });
  }

  // Reject / Delete Question from Staging Queue
  if (focusRejectQuestionBtn) {
    focusRejectQuestionBtn.addEventListener('click', async () => {
      if (!currentReviewQuestion || !currentReviewQuestion.id) return;
      if (!confirm('Are you sure you want to reject and permanently delete this question from the review queue?')) return;

      try {
        const res = await fetch(`${API_BASE}/api/review-queue/${currentReviewQuestion.id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          fetchFocusQuestion(currentReviewIndex);
          fetchPendingReviewCount();
        } else {
          alert('Error deleting question');
        }
      } catch (err) {
        alert('Network error: ' + err.message);
      }
    });
  }

  // Guy B Core Action: Grant & Approve (Pushes to reviewed_questions & removes from queue)
  if (focusApproveQuestionBtn) {
    focusApproveQuestionBtn.addEventListener('click', async () => {
      if (!currentReviewQuestion || !currentReviewQuestion.id) return;

      if (focusJsonPane && !focusJsonPane.classList.contains('hidden')) {
        if (!syncJsonToQuestionForm()) return;
      }

      const qText = focusQTextInput.value.trim();
      if (!qText) { alert('Question text cannot be empty.'); return; }

      const payload = {
        subject: focusSubjectSelect.value,
        topic: focusTopicSelect.value,
        subtopic: focusSubtopicSelect.value,
        label: focusLabelSelect.value,
        questionText: qText,
        hint: focusHintInput.value.trim(),
        options: currentReviewQuestion.options
      };

      const origHtml = focusApproveQuestionBtn.innerHTML;
      focusApproveQuestionBtn.innerHTML = '<i class="fa-solid fa-spinner spin-icon"></i> Granting...';
      focusApproveQuestionBtn.disabled = true;

      try {
        const res = await fetch(`${API_BASE}/api/review-queue/${currentReviewQuestion.id}/approve`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          // Success: load the next available question in queue!
          fetchPendingReviewCount();
          fetchFocusQuestion(currentReviewIndex);
        } else {
          const errData = await res.json();
          alert('Approval failed: ' + (errData.detail || 'Unknown error'));
        }
      } catch (err) {
        alert('Network error: ' + err.message);
      } finally {
        focusApproveQuestionBtn.innerHTML = origHtml;
        focusApproveQuestionBtn.disabled = false;
      }
    });
  }

  const queueNavPrevNextBtns = document.getElementById('queueNavPrevNextBtns');

  // Reviewer Sub-mode Toggle (Focus vs Queue List)
  if (reviewFocusModeBtn && reviewQueueListModeBtn) {
    reviewFocusModeBtn.addEventListener('click', () => {
      reviewFocusModeBtn.classList.add('active');
      reviewQueueListModeBtn.classList.remove('active');
      if (reviewFocusView) reviewFocusView.classList.remove('hidden');
      if (reviewQueueListView) reviewQueueListView.classList.add('hidden');
      if (queueNavPrevNextBtns) queueNavPrevNextBtns.style.display = 'flex';
      fetchFocusQuestion(currentReviewIndex);
    });

    reviewQueueListModeBtn.addEventListener('click', () => {
      reviewQueueListModeBtn.classList.add('active');
      reviewFocusModeBtn.classList.remove('active');
      if (reviewQueueListView) reviewQueueListView.classList.remove('hidden');
      if (reviewFocusView) reviewFocusView.classList.add('hidden');
      if (queueNavPrevNextBtns) queueNavPrevNextBtns.style.display = 'none';
      if (stepperQuestionIndex) stepperQuestionIndex.textContent = 'Queue List Overview';
      fetchQueueList();
    });
  }

  if (refreshReviewQueueBtn) {
    refreshReviewQueueBtn.addEventListener('click', () => {
      fetchPendingReviewCount();
      if (reviewQueueListModeBtn.classList.contains('active')) {
        fetchQueueList();
      } else {
        fetchFocusQuestion(currentReviewIndex);
      }
    });
  }

  if (reviewSubjectFilter) {
    reviewSubjectFilter.addEventListener('change', () => {
      if (reviewQueueListModeBtn.classList.contains('active')) {
        fetchQueueList();
      } else {
        fetchFocusQuestion(0);
      }
    });
  }

  async function fetchQueueList() {
    if (!queueListContainer) return;
    queueListContainer.innerHTML = '<div class="empty-state"><i class="fa-solid fa-spinner spin-icon"></i> Loading pending questions...</div>';
    
    const subj = reviewSubjectFilter ? reviewSubjectFilter.value : 'all';
    try {
      const res = await fetch(`${API_BASE}/api/unreviewed-questions?subject=${subj}`);
      if (res.ok) {
        const data = await res.json();
        renderQueueList(data.questions || []);
      }
    } catch(err) {
      queueListContainer.innerHTML = `<div class="empty-state text-danger">Error: ${err.message}</div>`;
    }
  }

  function renderQueueList(questions) {
    if (!queueListContainer) return;
    if (questions.length === 0) {
      queueListContainer.innerHTML = '<div class="empty-state">No pending questions in queue.</div>';
      return;
    }

    const query = (queueListSearchInput ? queueListSearchInput.value : '').toLowerCase().trim();
    const filtered = questions.filter(q => {
      if (!query) return true;
      return (q.questionText || '').toLowerCase().includes(query) ||
             (q.topic || '').toLowerCase().includes(query);
    });

    queueListContainer.innerHTML = '';
    filtered.forEach((q, idx) => {
      const card = document.createElement('div');
      card.className = 'question-card';
      card.innerHTML = `
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span class="question-index"><i class="fa-solid fa-clipboard-question"></i> Queue Item #${idx + 1}</span>
          <div class="card-meta-inputs" style="gap: 0.5rem; align-items: center;">
            <span class="badge" style="background: var(--bg-input); border: 1px solid var(--border-color); font-size: 0.75rem;">${q.subject || 'English'}</span>
            <span class="badge" style="background: var(--bg-input); border: 1px solid var(--border-color); font-size: 0.75rem;">${q.topic || 'General'}</span>
            <button class="btn btn-sm btn-primary jump-to-review-btn" data-qidx="${idx}">
              <i class="fa-solid fa-bullseye"></i> Review This Question
            </button>
          </div>
        </div>
        <div class="card-body">
          <p style="font-size: 0.95rem; line-height: 1.5; color: var(--text-primary); margin-bottom: 0.5rem;">${escapeHtml(q.questionText)}</p>
        </div>
      `;
      queueListContainer.appendChild(card);
    });

    document.querySelectorAll('.jump-to-review-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const qIdx = parseInt(e.currentTarget.dataset.qidx);
        reviewFocusModeBtn.click();
        fetchFocusQuestion(qIdx);
      });
    });
  }

  if (queueListSearchInput) queueListSearchInput.addEventListener('input', fetchQueueList);
  if (emptyQueueToBankBtn) {
    emptyQueueToBankBtn.addEventListener('click', () => switchMainMode('reviewed_bank'));
  }

  // =========================================================================
  // QUESTION BANK & DATABASE (UNREVIEWED & REVIEWED)
  // =========================================================================
  let currentBankTab = 'unreviewed'; // 'unreviewed' | 'reviewed'
  let unreviewedBankData = [];
  let reviewedBankData = [];

  const qbUnreviewedTabBtn = document.getElementById('qbUnreviewedTabBtn');
  const qbReviewedTabBtn = document.getElementById('qbReviewedTabBtn');
  const qbUnreviewedBadge = document.getElementById('qbUnreviewedBadge');
  const qbReviewedBadge = document.getElementById('qbReviewedBadge');
  const qbHeaderTitle = document.getElementById('qbHeaderTitle');
  const qbHeaderDesc = document.getElementById('qbHeaderDesc');
  const qbResetUsedBtn = document.getElementById('qbResetUsedBtn');

  const reviewedBankList = document.getElementById('reviewedBankList');
  const reviewedBankTotalBadge = document.getElementById('reviewedBankTotalBadge');
  const reviewedBankSearchInput = document.getElementById('reviewedBankSearchInput');
  const reviewedBankSubjectFilter = document.getElementById('reviewedBankSubjectFilter');
  const reviewedBankLabelFilter = document.getElementById('reviewedBankLabelFilter');
  const refreshReviewedBankBtn = document.getElementById('refreshReviewedBankBtn');
  const exportReviewedBankJsonBtn = document.getElementById('exportReviewedBankJsonBtn');

  function setBankTab(tab) {
    currentBankTab = tab;
    if (qbUnreviewedTabBtn && qbReviewedTabBtn) {
      qbUnreviewedTabBtn.classList.toggle('active', tab === 'unreviewed');
      qbReviewedTabBtn.classList.toggle('active', tab === 'reviewed');
    }

    if (qbHeaderTitle && qbHeaderDesc) {
      if (tab === 'unreviewed') {
        qbHeaderTitle.innerHTML = `<i class="fa-solid fa-clock-rotate-left" style="color: #f59e0b;"></i> Unreviewed Questions (Staging DB) <span class="count-badge" id="reviewedBankTotalBadge">${unreviewedBankData.length} Questions</span>`;
        qbHeaderDesc.innerHTML = 'Raw questions parsed and staged in <code>questify.unreviewed_questions</code> waiting for Guy B review.';
        if (qbResetUsedBtn) qbResetUsedBtn.classList.add('hidden');
      } else {
        qbHeaderTitle.innerHTML = `<i class="fa-solid fa-database" style="color: #6366f1;"></i> Reviewed Question Bank (Production DB) <span class="count-badge" id="reviewedBankTotalBadge">${reviewedBankData.length} Vetted Questions</span>`;
        qbHeaderDesc.innerHTML = 'Production repository of verified, vetted questions granted by Guy B in <code>questify.reviewed_questions</code>.';
        if (qbResetUsedBtn) qbResetUsedBtn.classList.remove('hidden');
      }
    }

    fetchBankQuestions();
  }

  if (qbUnreviewedTabBtn) qbUnreviewedTabBtn.addEventListener('click', () => setBankTab('unreviewed'));
  if (qbReviewedTabBtn) qbReviewedTabBtn.addEventListener('click', () => setBankTab('reviewed'));

  async function fetchBankStats() {
    try {
      const res = await fetch(`${API_BASE}/api/unreviewed-questions/stats`);
      if (res.ok) {
        const stats = await res.json();
        const unrev = stats.unreviewedTotal || 0;
        const rev = stats.reviewedTotal || 0;

        if (qbUnreviewedBadge) qbUnreviewedBadge.textContent = unrev;
        if (qbReviewedBadge) qbReviewedBadge.textContent = rev;
        if (navUnreviewedCountBadge) navUnreviewedCountBadge.textContent = unrev;
        if (navReviewedCountBadge) navReviewedCountBadge.textContent = rev;
        if (navPendingReviewBadge) {
          navPendingReviewBadge.textContent = unrev;
          navPendingReviewBadge.style.display = unrev > 0 ? 'inline-block' : 'none';
        }
      }
    } catch(e) {}
  }

  async function fetchBankQuestions() {
    if (!reviewedBankList) return;
    const isUnrev = (currentBankTab === 'unreviewed');
    const endpoint = isUnrev ? `${API_BASE}/api/unreviewed-questions` : `${API_BASE}/api/reviewed-questions`;

    reviewedBankList.innerHTML = `<div class="empty-state"><i class="fa-solid fa-spinner spin-icon"></i> Loading ${isUnrev ? 'Unreviewed Staging Questions' : 'Reviewed Question Bank'}...</div>`;

    fetchBankStats();

    try {
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (isUnrev) {
          unreviewedBankData = data.questions || [];
        } else {
          reviewedBankData = data.questions || [];
        }
        renderBankQuestions();
      }
    } catch(err) {
      reviewedBankList.innerHTML = `<div class="empty-state text-danger">Error loading questions: ${err.message}</div>`;
    }
  }

  function renderBankQuestions() {
    if (!reviewedBankList) return;
    const isUnrev = (currentBankTab === 'unreviewed');
    const rawData = isUnrev ? unreviewedBankData : reviewedBankData;

    if (rawData.length === 0) {
      reviewedBankList.innerHTML = `<div class="empty-state">No ${isUnrev ? 'unreviewed' : 'reviewed'} questions found in MongoDB ${isUnrev ? 'questify.unreviewed_questions' : 'questify.reviewed_questions'}.</div>`;
      if (reviewedBankTotalBadge) reviewedBankTotalBadge.textContent = `0 ${isUnrev ? 'Questions' : 'Vetted Questions'}`;
      return;
    }

    const query = (reviewedBankSearchInput ? reviewedBankSearchInput.value : '').toLowerCase().trim();
    const subjVal = reviewedBankSubjectFilter ? reviewedBankSubjectFilter.value : 'all';
    const labelVal = reviewedBankLabelFilter ? reviewedBankLabelFilter.value : 'all';

    const filtered = rawData.filter(q => {
      if (subjVal !== 'all' && (q.subject || '').toLowerCase() !== subjVal.toLowerCase()) return false;
      if (labelVal !== 'all' && (q.label || '').toLowerCase() !== labelVal.toLowerCase()) return false;
      if (query) {
        const matchQ = (q.questionText || '').toLowerCase().includes(query);
        const matchHint = (q.hint || '').toLowerCase().includes(query);
        const matchTopic = (q.topic || '').toLowerCase().includes(query);
        const matchSubtopic = (q.subtopic || '').toLowerCase().includes(query);
        if (!matchQ && !matchHint && !matchTopic && !matchSubtopic) return false;
      }
      return true;
    });

    if (reviewedBankTotalBadge) {
      reviewedBankTotalBadge.textContent = `${filtered.length} ${isUnrev ? 'Questions' : 'Vetted Questions'}`;
    }

    if (filtered.length === 0) {
      reviewedBankList.innerHTML = `<div class="empty-state">No matching questions found with selected filters.</div>`;
      return;
    }

    reviewedBankList.innerHTML = '';
    filtered.forEach((q, idx) => {
      const card = document.createElement('div');
      card.className = 'question-card collapsible';

      let optionsHtml = '';
      (q.options || []).forEach(opt => {
        optionsHtml += `
          <div class="option-row ${opt.isCorrect ? 'correct' : ''}">
            <input type="radio" class="radio-custom" ${opt.isCorrect ? 'checked' : ''} disabled>
            <input type="text" class="option-input" value="${escapeHtml(opt.text)}" disabled>
            ${opt.isCorrect ? '<span class="correct-badge"><i class="fa-solid fa-check"></i> Correct</span>' : ''}
          </div>
        `;
      });

      const qTextClean = normalizeParagraphText(q.questionText || '');
      const qHintClean = normalizeParagraphText(q.hint || '');

      card.innerHTML = `
        <div class="card-header qb-card-toggle">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <i class="fa-solid fa-chevron-down expand-chevron"></i>
            <span class="question-index">
              ${isUnrev 
                ? `<i class="fa-solid fa-clock" style="color: #f59e0b;"></i> Question #${idx + 1}` 
                : `<i class="fa-solid fa-circle-check" style="color: #10b981;"></i> Question #${idx + 1}`}
            </span>
          </div>
          <div class="card-meta-inputs" style="gap: 0.4rem; align-items: center;">
            ${isUnrev 
              ? `<span class="badge" style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); font-size: 0.72rem; color: #f59e0b; font-weight: 700;">UNREVIEWED</span>` 
              : `<span class="badge" style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); font-size: 0.72rem; color: #10b981; font-weight: 700;">REVIEWED</span>`}
            ${q.isUsed ? `<span class="used-stamp">USED</span>` : ''}
            <span class="badge" style="background:var(--bg-panel); border:1px solid var(--border-color); font-size:0.75rem; text-transform:uppercase; color:#818cf8;">${q.label || 'medium'}</span>
            <span class="badge" style="background:var(--bg-panel); border:1px solid var(--border-color); font-size:0.75rem;">${q.subject || 'N/A'}</span>
            <span class="badge" style="background:var(--bg-panel); border:1px solid var(--border-color); font-size:0.75rem;">${q.topic || 'General'}</span>
            <button class="btn btn-icon qb-copy-q-btn" title="Copy Question JSON"><i class="fa-regular fa-copy"></i></button>
            ${!isUnrev && q.id ? `<button class="btn btn-icon text-danger del-reviewed-btn" data-id="${q.id}" title="Delete from Reviewed Bank"><i class="fa-solid fa-trash"></i></button>` : ''}
          </div>
        </div>
        <div class="card-body-collapsible">
          <div class="form-group">
            <label style="display: flex; justify-content: space-between; align-items: center;">
              <span><i class="fa-solid fa-pen-nib" style="color: #6366f1;"></i> Question Text</span>
              ${q.subtopic ? `<span style="font-size: 0.78rem; color: var(--text-secondary); font-weight: normal;">Subtopic: <strong>${escapeHtml(q.subtopic)}</strong></span>` : ''}
            </label>
            <textarea class="q-text-input" rows="3" disabled>${escapeHtml(qTextClean)}</textarea>
            <div class="latex-preview-box math-render rev-math-q" style="margin-top:0.4rem;"></div>
          </div>
          ${qHintClean ? `
          <div class="hint-wrapper" style="margin-top: 0.75rem;">
            <div class="hint-header"><label><i class="fa-solid fa-lightbulb" style="color: #f59e0b;"></i> Solution / Explanation</label></div>
            <textarea class="q-hint-input" rows="3" disabled>${escapeHtml(qHintClean)}</textarea>
            <div class="latex-preview-box math-render rev-math-h" style="margin-top:0.4rem;"></div>
          </div>` : ''}
          <div class="options-container" style="margin-top:0.75rem;">
            ${optionsHtml}
          </div>
          ${isUnrev ? `
          <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end;">
            <button class="btn btn-sm btn-primary jump-to-review-btn" data-idx="${idx}">
              <i class="fa-solid fa-clipboard-check"></i> Review this Question in Studio (Guy B)
            </button>
          </div>` : ''}
        </div>
      `;

      card.querySelector('.qb-card-toggle').addEventListener('click', (e) => {
        if (e.target.closest('.del-reviewed-btn') || e.target.closest('.qb-copy-q-btn')) return;
        card.classList.toggle('expanded');
      });

      const copyBtn = card.querySelector('.qb-copy-q-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(JSON.stringify(q, null, 2)).then(() => {
            copyBtn.innerHTML = '<i class="fa-solid fa-check" style="color: #10b981;"></i>';
            setTimeout(() => { copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>'; }, 1500);
          });
        });
      }

      const jumpBtn = card.querySelector('.jump-to-review-btn');
      if (jumpBtn) {
        jumpBtn.addEventListener('click', () => {
          switchMainMode('reviewer');
          fetchFocusQuestion(idx);
        });
      }

      const qBox = card.querySelector('.rev-math-q');
      if (qBox) renderMathInContainer(qBox, qTextClean);
      const hBox = card.querySelector('.rev-math-h');
      if (hBox && qHintClean) renderMathInContainer(hBox, qHintClean);

      reviewedBankList.appendChild(card);
    });

    document.querySelectorAll('.del-reviewed-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const qId = e.currentTarget.dataset.id;
        if (!confirm('Are you sure you want to delete this verified question from the Reviewed Bank?')) return;
        try {
          const res = await fetch(`${API_BASE}/api/reviewed-questions/${qId}`, { method: 'DELETE' });
          if (res.ok) fetchBankQuestions();
        } catch(err) {
          alert('Delete error: ' + err.message);
        }
      });
    });
  }

  if (refreshReviewedBankBtn) refreshReviewedBankBtn.addEventListener('click', fetchBankQuestions);
  if (reviewedBankSearchInput) reviewedBankSearchInput.addEventListener('input', renderBankQuestions);
  if (reviewedBankSubjectFilter) reviewedBankSubjectFilter.addEventListener('change', renderBankQuestions);
  if (reviewedBankLabelFilter) reviewedBankLabelFilter.addEventListener('change', renderBankQuestions);

  if (qbResetUsedBtn) {
    qbResetUsedBtn.addEventListener('click', async () => {
      if (!confirm('Reset all questions in Reviewed Question Bank back to unused status?')) return;
      try {
        const res = await fetch(`${API_BASE}/api/reviewed-questions/reset-used`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          alert(data.message || 'Questions reset successfully!');
          fetchBankQuestions();
        }
      } catch(err) {
        alert('Reset error: ' + err.message);
      }
    });
  }

  if (exportReviewedBankJsonBtn) {
    exportReviewedBankJsonBtn.addEventListener('click', () => {
      const isUnrev = (currentBankTab === 'unreviewed');
      const dataToExport = isUnrev ? unreviewedBankData : reviewedBankData;
      const jsonStr = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = isUnrev ? 'unreviewed_questions.json' : 'reviewed_questions.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    });
  }

  // =========================================================================
  // ADD SINGLE QUESTION (OPTION 4)
  // =========================================================================
  const singleQuestionForm = document.getElementById('singleQuestionForm');
  const singleSubjectSelect = document.getElementById('singleSubjectSelect');
  const singleTopicSelect = document.getElementById('singleTopicSelect');
  const singleSubtopicSelect = document.getElementById('singleSubtopicSelect');
  const singleLabelSelect = document.getElementById('singleLabelSelect');
  const singleQTextInput = document.getElementById('singleQTextInput');
  const singleHintInput = document.getElementById('singleHintInput');
  const singleOptionsList = document.getElementById('singleOptionsList');
  const singleAddOptBtn = document.getElementById('singleAddOptBtn');
  const singleResetBtn = document.getElementById('singleResetBtn');

  let singleOptions = [
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false }
  ];

  function initSingleQForm() {
    updateSingleTopics();
    renderSingleOptions();
  }

  function updateSingleTopics() {
    const sub = singleSubjectSelect.value;
    const topics = getTopicsForSubject(sub);
    singleTopicSelect.innerHTML = '';
    topics.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      singleTopicSelect.appendChild(opt);
    });
    updateSingleSubtopics();
  }

  function updateSingleSubtopics() {
    const sub = singleSubjectSelect.value;
    const top = singleTopicSelect.value;
    const subtopics = getSubtopicsForTopic(sub, top);
    singleSubtopicSelect.innerHTML = '';
    subtopics.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      singleSubtopicSelect.appendChild(opt);
    });
  }

  if (singleSubjectSelect) singleSubjectSelect.addEventListener('change', updateSingleTopics);
  if (singleTopicSelect) singleTopicSelect.addEventListener('change', updateSingleSubtopics);

  function renderSingleOptions() {
    if (!singleOptionsList) return;
    singleOptionsList.innerHTML = '';
    singleOptions.forEach((opt, idx) => {
      const row = document.createElement('div');
      row.className = `option-row ${opt.isCorrect ? 'correct' : ''}`;
      row.innerHTML = `
        <input type="radio" name="single_correct_opt" class="radio-custom" ${opt.isCorrect ? 'checked' : ''} data-idx="${idx}">
        <input type="text" class="option-input single-opt-txt" value="${escapeHtml(opt.text)}" placeholder="Option ${chr(65+idx)}..." data-idx="${idx}" required>
        ${opt.isCorrect ? '<span class="correct-badge"><i class="fa-solid fa-check"></i> Correct</span>' : ''}
        ${singleOptions.length > 2 ? `<button type="button" class="btn btn-icon text-danger single-del-opt-btn" data-idx="${idx}"><i class="fa-solid fa-xmark"></i></button>` : ''}
      `;
      singleOptionsList.appendChild(row);
    });

    document.querySelectorAll('input[name="single_correct_opt"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const correctIdx = parseInt(e.target.dataset.idx);
        singleOptions.forEach((o, i) => o.isCorrect = (i === correctIdx));
        renderSingleOptions();
      });
    });

    document.querySelectorAll('.single-opt-txt').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        singleOptions[idx].text = e.target.value;
      });
    });

    document.querySelectorAll('.single-del-opt-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx);
        singleOptions.splice(idx, 1);
        if (!singleOptions.some(o => o.isCorrect) && singleOptions.length > 0) {
          singleOptions[0].isCorrect = true;
        }
        renderSingleOptions();
      });
    });
  }

  if (singleAddOptBtn) {
    singleAddOptBtn.addEventListener('click', () => {
      singleOptions.push({ text: '', isCorrect: false });
      renderSingleOptions();
    });
  }

  if (singleQuestionForm) {
    singleQuestionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const targetDbRadio = document.querySelector('input[name="single_target_db"]:checked');
      const targetDb = targetDbRadio ? targetDbRadio.value : 'staging';

      const questionObj = {
        subject: singleSubjectSelect.value,
        topic: singleTopicSelect.value,
        subtopic: singleSubtopicSelect.value,
        label: singleLabelSelect.value,
        questionText: singleQTextInput.value.trim(),
        hint: singleHintInput.value.trim(),
        options: singleOptions.map(o => ({ text: o.text.trim(), isCorrect: o.isCorrect }))
      };

      const endpoint = targetDb === 'reviewed' 
        ? `${API_BASE}/api/reviewed-questions` 
        : `${API_BASE}/api/unreviewed-questions/bulk`;

      const payload = targetDb === 'reviewed' 
        ? questionObj 
        : { questions: [questionObj] };

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          alert(`Question saved successfully to ${targetDb === 'reviewed' ? 'Reviewed Bank' : "Guy B's Review Queue"}!`);
          singleQTextInput.value = '';
          singleHintInput.value = '';
          fetchPendingReviewCount();
        } else {
          alert('Error saving question.');
        }
      } catch (err) {
        alert('Network error: ' + err.message);
      }
    });
  }

  // =========================================================================
  // MOCK TEST GENERATOR (EXCLUSIVELY FROM REVIEWED DATABASE)
  // =========================================================================
  const mockGeneratorForm = document.getElementById('mockGeneratorForm');
  const mockEnglishCount = document.getElementById('mockEnglishCount');
  const mockQuantsCount = document.getElementById('mockQuantsCount');
  const mockLrdiCount = document.getElementById('mockLrdiCount');
  const mockEasyPct = document.getElementById('mockEasyPct');
  const mockMediumPct = document.getElementById('mockMediumPct');
  const mockHardPct = document.getElementById('mockHardPct');
  const diffTotalBadge = document.getElementById('diffTotalBadge');
  const mockExcludeUsedCheckbox = document.getElementById('mockExcludeUsedCheckbox');
  const mockResultsSection = document.getElementById('mockResultsSection');
  const mockQuestionsList = document.getElementById('mockQuestionsList');
  const mockQuestionCountBadge = document.getElementById('mockQuestionCountBadge');
  const resetAllUsedBtn = document.getElementById('resetAllUsedBtn');
  const copyMockJsonBtn = document.getElementById('copyMockJsonBtn');
  const downloadMockJsonBtn = document.getElementById('downloadMockJsonBtn');

  let generatedMockQuestions = [];

  const mockEnglishCountVal = document.getElementById('mockEnglishCountVal');
  const mockQuantsCountVal = document.getElementById('mockQuantsCountVal');
  const mockLrdiCountVal = document.getElementById('mockLrdiCountVal');
  const mockEasyPctVal = document.getElementById('mockEasyPctVal');
  const mockMediumPctVal = document.getElementById('mockMediumPctVal');
  const mockHardPctVal = document.getElementById('mockHardPctVal');

  function initMockGeneratorForm() {
    updateSliderBadges();
    updateDiffTotalBadge();
  }

  function updateSliderBadges() {
    if (mockEnglishCountVal && mockEnglishCount) mockEnglishCountVal.textContent = `${mockEnglishCount.value} Questions`;
    if (mockQuantsCountVal && mockQuantsCount) mockQuantsCountVal.textContent = `${mockQuantsCount.value} Questions`;
    if (mockLrdiCountVal && mockLrdiCount) mockLrdiCountVal.textContent = `${mockLrdiCount.value} Questions`;
    if (mockEasyPctVal && mockEasyPct) mockEasyPctVal.textContent = `${mockEasyPct.value}%`;
    if (mockMediumPctVal && mockMediumPct) mockMediumPctVal.textContent = `${mockMediumPct.value}%`;
    if (mockHardPctVal && mockHardPct) mockHardPctVal.textContent = `${mockHardPct.value}%`;
  }

  if (mockEnglishCount) mockEnglishCount.addEventListener('input', updateSliderBadges);
  if (mockQuantsCount) mockQuantsCount.addEventListener('input', updateSliderBadges);
  if (mockLrdiCount) mockLrdiCount.addEventListener('input', updateSliderBadges);

  function updateDiffTotalBadge() {
    updateSliderBadges();
    if (!diffTotalBadge) return;
    const easy = parseFloat(mockEasyPct.value) || 0;
    const med = parseFloat(mockMediumPct.value) || 0;
    const hard = parseFloat(mockHardPct.value) || 0;
    const sum = easy + med + hard;

    diffTotalBadge.textContent = `Total: ${sum}%`;
    if (Math.abs(sum - 100) < 0.01) {
      diffTotalBadge.style.background = 'rgba(16,185,129,0.2)';
      diffTotalBadge.style.color = '#10b981';
    } else {
      diffTotalBadge.style.background = 'rgba(239,68,68,0.2)';
      diffTotalBadge.style.color = '#ef4444';
    }
  }

  document.querySelectorAll('.mock-diff-pct').forEach(input => {
    input.addEventListener('input', updateDiffTotalBadge);
  });

  if (resetAllUsedBtn) {
    resetAllUsedBtn.addEventListener('click', async () => {
      if (!confirm('Reset all USED stamps in Reviewed DB back to unused?')) return;
      try {
        const res = await fetch(`${API_BASE}/api/reviewed-questions/reset-used`, { method: 'POST' });
        const result = await res.json();
        if (res.ok) {
          alert(result.message);
        }
      } catch(err) {
        alert('Network error: ' + err.message);
      }
    });
  }

  if (mockGeneratorForm) {
    mockGeneratorForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const easy = parseFloat(mockEasyPct.value) || 0;
      const med = parseFloat(mockMediumPct.value) || 0;
      const hard = parseFloat(mockHardPct.value) || 0;
      if (Math.abs((easy + med + hard) - 100) > 0.01) {
        alert('Difficulty allocation percentages must add up to exactly 100%.');
        return;
      }

      const engCount = parseInt(mockEnglishCount.value) || 0;
      const quantsCount = parseInt(mockQuantsCount.value) || 0;
      const lrdiCount = parseInt(mockLrdiCount.value) || 0;

      if (engCount + quantsCount + lrdiCount <= 0) {
        alert('Please specify at least 1 question for a subject.');
        return;
      }

      const payload = {
        subjectCounts: {
          "English": engCount,
          "Quants": quantsCount,
          "LRDI": lrdiCount
        },
        difficulty: {
          "easy": easy,
          "medium": med,
          "hard": hard
        },
        excludeUsed: mockExcludeUsedCheckbox ? mockExcludeUsedCheckbox.checked : true
      };

      const btn = document.getElementById('generateMockBtn');
      const origHtml = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-spinner spin-icon"></i> Generating from Reviewed DB...';
      btn.disabled = true;

      try {
        const res = await fetch(`${API_BASE}/api/mock-tests/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (res.ok) {
          generatedMockQuestions = result.questions || [];
          renderMockResults();
        } else {
          alert('Error: ' + (result.detail || 'Failed to generate mock'));
        }
      } catch (err) {
        alert('Network error: ' + err.message);
      } finally {
        btn.innerHTML = origHtml;
        btn.disabled = false;
      }
    });
  }

  function renderMockResults() {
    if (!mockResultsSection || !mockQuestionsList) return;
    mockResultsSection.classList.remove('hidden');
    mockQuestionCountBadge.textContent = `${generatedMockQuestions.length} Questions`;
    mockQuestionsList.innerHTML = '';

    if (generatedMockQuestions.length === 0) {
      mockQuestionsList.innerHTML = '<div class="empty-state">No questions found matching your criteria in Reviewed Bank. Please ensure Guy B has approved questions.</div>';
      return;
    }

    generatedMockQuestions.forEach((q, idx) => {
      const card = document.createElement('div');
      card.className = 'question-card';

      let optionsHtml = '';
      (q.options || []).forEach(opt => {
        optionsHtml += `
          <div class="option-row ${opt.isCorrect ? 'correct' : ''}">
            <input type="radio" class="radio-custom" ${opt.isCorrect ? 'checked' : ''} disabled>
            <input type="text" class="option-input" value="${escapeHtml(opt.text)}" disabled>
            ${opt.isCorrect ? '<span class="correct-badge"><i class="fa-solid fa-check"></i> Correct</span>' : ''}
          </div>
        `;
      });

      card.innerHTML = `
        <div class="card-header">
          <span class="question-index"><i class="fa-solid fa-file-signature"></i> Question ${idx + 1}</span>
          <div class="card-meta-inputs" style="gap: 0.5rem; align-items: center;">
            <span class="used-stamp">USED</span>
            <span class="badge" style="background:var(--bg-panel); border:1px solid var(--border-color); font-size:0.75rem; text-transform:uppercase; color:#818cf8;">${q.label || 'medium'}</span>
            <span class="badge" style="background:var(--bg-panel); border:1px solid var(--border-color); font-size:0.75rem;">${q.subject || 'N/A'}</span>
            <span class="badge" style="background:var(--bg-panel); border:1px solid var(--border-color); font-size:0.75rem;">${q.topic || 'N/A'}</span>
          </div>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label><i class="fa-solid fa-pen-nib"></i> Question Text</label>
            <textarea class="q-text-input" rows="2" disabled>${escapeHtml(q.questionText)}</textarea>
            <div class="latex-preview-box math-render mock-math-q" style="margin-top:0.4rem;"></div>
          </div>
          ${q.hint ? `
          <div class="hint-wrapper">
            <div class="hint-header"><label><i class="fa-solid fa-lightbulb"></i> Solution / Explanation</label></div>
            <textarea class="q-hint-input" rows="3" disabled>${escapeHtml(q.hint)}</textarea>
            <div class="latex-preview-box math-render mock-math-h" style="margin-top:0.4rem;"></div>
          </div>` : ''}
          <div class="options-container" style="margin-top:0.75rem;">
            ${optionsHtml}
          </div>
        </div>
      `;

      const qBox = card.querySelector('.mock-math-q');
      if (qBox) renderMathInContainer(qBox, q.questionText);
      const hBox = card.querySelector('.mock-math-h');
      if (hBox && q.hint) renderMathInContainer(hBox, q.hint);

      mockQuestionsList.appendChild(card);
    });

    mockResultsSection.scrollIntoView({ behavior: 'smooth' });
  }

  if (copyMockJsonBtn) {
    copyMockJsonBtn.addEventListener('click', () => {
      copyTextToClipboard(JSON.stringify(generatedMockQuestions, null, 2)).then(() => {
        alert('Mock JSON copied to clipboard!');
      });
    });
  }

  if (downloadMockJsonBtn) {
    downloadMockJsonBtn.addEventListener('click', () => {
      const jsonStr = JSON.stringify(generatedMockQuestions, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mock_test_paper.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    });
  }

  // General Utilities
  function renderMathInContainer(container, rawText) {
    if (!container) return;
    container.innerHTML = rawText || '';
    if (window.renderMathInElement) {
      try {
        renderMathInElement(container, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false}
          ],
          throwOnError: false
        });
      } catch(e) {}
    }
  }

  function copyTextToClipboard(textToCopy) {
    if (!textToCopy) return Promise.reject(new Error('Nothing to copy'));
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(textToCopy);
    } else {
      return new Promise((resolve, reject) => {
        try {
          const textArea = document.createElement('textarea');
          textArea.value = textToCopy;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          const ok = document.execCommand('copy');
          document.body.removeChild(textArea);
          if (ok) resolve();
          else reject(new Error('copy failed'));
        } catch (err) {
          reject(err);
        }
      });
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Dark/Light theme toggle
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      const isLight = document.body.classList.contains('light-theme');
      themeToggleBtn.innerHTML = isLight ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    });
  }

  // Keyboard shortcuts for Reviewer mode
  document.addEventListener('keydown', (e) => {
    if (!document.body.classList.contains('reviewer-mode')) return;

    // Ctrl+Enter or Cmd+Enter: Approve & Grant
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      const approveBtn = document.getElementById('focusApproveQuestionBtn');
      if (approveBtn && !approveBtn.disabled) approveBtn.click();
    }
    // Ctrl+S or Cmd+S: Save Draft
    else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      const draftBtn = document.getElementById('focusSaveDraftBtn');
      if (draftBtn && !draftBtn.disabled) draftBtn.click();
    }
  });

  // Initialize Auth and Workspace Role Gateway after all handlers are bound
  initGoogleAuth();

});

