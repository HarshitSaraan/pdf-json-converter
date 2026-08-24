document.addEventListener('DOMContentLoaded', () => {
  
  // App State
  let questionsData = [];
  let selectedFile = null;

  // DOM Elements
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
  
  const workspaceSection = document.getElementById('workspaceSection');
  const questionsList = document.getElementById('questionsList');
  const questionCountBadge = document.getElementById('questionCountBadge');
  
  const viewCardsBtn = document.getElementById('viewCardsBtn');
  const viewQbBtn = document.getElementById('viewQbBtn');
  const viewJsonBtn = document.getElementById('viewJsonBtn');
  const cardsView = document.getElementById('cardsView');
  const qbView = document.getElementById('qbView');
  const qbList = document.getElementById('qbList');
  const jsonView = document.getElementById('jsonView');
  const jsonCodeDisplay = document.getElementById('jsonCodeDisplay');
  const addAllToQbBtn = document.getElementById('addAllToQbBtn');
  
  const searchInput = document.getElementById('searchInput');
  const bulkTopicInput = document.getElementById('bulkTopicInput');
  const applyBulkTopicBtn = document.getElementById('applyBulkTopicBtn');
  
  const addQuestionBtn = document.getElementById('addQuestionBtn');
  const copyJsonBtn = document.getElementById('copyJsonBtn');
  const downloadJsonBtn = document.getElementById('downloadJsonBtn');
  
  // AI Engine Settings Elements
  const aiSettingsBtn = document.getElementById('aiSettingsBtn');
  const aiModalOverlay = document.getElementById('aiModalOverlay');
  const closeAiModalBtn = document.getElementById('closeAiModalBtn');
  const cancelAiModalBtn = document.getElementById('cancelAiModalBtn');
  const geminiApiKeyInput = document.getElementById('geminiApiKeyInput');
  const chatgptApiKeyInput = document.getElementById('chatgptApiKeyInput');
  const chatgptModelSelect = document.getElementById('chatgptModelSelect');
  const geminiConfigBox = document.getElementById('geminiConfigBox');
  const chatgptConfigBox = document.getElementById('chatgptConfigBox');
  const autoGenerateAllHintsBtn = document.getElementById('autoGenerateAllHintsBtn');
  const useAiTopicsCheckbox = document.getElementById('useAiTopicsCheckbox');

  // Subject Prompts Modal Elements
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

  // Google Authentication & Email Whitelist Settings
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

  const mainAppContainer = document.getElementById('mainAppContainer');
  const authLockScreen = document.getElementById('authLockScreen');
  const lockScreenGoogleBtnContainer = document.getElementById('lockScreenGoogleBtnContainer');

  function renderUserProfile(userData) {
    if (googleSignInContainer) googleSignInContainer.classList.add('hidden');
    if (userProfileBox) userProfileBox.classList.remove('hidden');
    if (userAvatarImg) userAvatarImg.src = userData.picture || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
    if (userNameText) userNameText.textContent = userData.name || userData.email.split('@')[0];
    if (userEmailText) userEmailText.textContent = userData.email;

    // Unlock App Workspace
    if (authLockScreen) authLockScreen.classList.add('hidden');
    if (mainAppContainer) mainAppContainer.classList.remove('hidden');
    if (promptSettingsBtn) promptSettingsBtn.classList.remove('hidden');
    if (aiSettingsBtn) aiSettingsBtn.classList.remove('hidden');
    updateStatusBadge('Ready', 'success');
  }

  function clearUserProfile() {
    localStorage.removeItem('google_user_session');
    if (userProfileBox) userProfileBox.classList.add('hidden');
    if (googleSignInContainer) googleSignInContainer.classList.remove('hidden');
    
    // Lock App Workspace
    if (mainAppContainer) mainAppContainer.classList.add('hidden');
    if (authLockScreen) authLockScreen.classList.remove('hidden');
    if (promptSettingsBtn) promptSettingsBtn.classList.add('hidden');
    if (aiSettingsBtn) aiSettingsBtn.classList.add('hidden');
    updateStatusBadge('Auth Required', 'danger');
    
    initGoogleAuth();
  }

  function showAccessDenied(email) {
    if (accessDeniedMsg) {
      accessDeniedMsg.innerHTML = `Access Denied for <strong>${escapeHtml(email)}</strong>.<br>Your account is not on the authorized user list for QuestifyJSON. Please sign in with an authorized email address.`;
    }
    if (accessDeniedModalOverlay) accessDeniedModalOverlay.classList.remove('hidden');
    if (window.google && google.accounts && google.accounts.id) {
      google.accounts.id.disableAutoSelect();
    }
    
    // Keep app locked
    if (mainAppContainer) mainAppContainer.classList.add('hidden');
    if (authLockScreen) authLockScreen.classList.remove('hidden');
    if (promptSettingsBtn) promptSettingsBtn.classList.add('hidden');
    if (aiSettingsBtn) aiSettingsBtn.classList.add('hidden');
  }

  if (closeAccessDeniedBtn) {
    closeAccessDeniedBtn.addEventListener('click', () => {
      if (accessDeniedModalOverlay) accessDeniedModalOverlay.classList.add('hidden');
      clearUserProfile();
    });
  }

  if (googleSignOutBtn) {
    googleSignOutBtn.addEventListener('click', () => {
      clearUserProfile();
    });
  }

  async function handleGoogleCredentialResponse(response) {
    const jwtData = parseJwtToken(response.credential);
    if (!jwtData || !jwtData.email) {
      alert("Could not process Google login response.");
      return;
    }

    const email = jwtData.email.trim().toLowerCase();
    
    // Check local whitelist
    if (!ALLOWED_EMAILS.includes(email)) {
      showAccessDenied(email);
      return;
    }

    // Verify with backend
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
    // Check saved session
    const savedSession = localStorage.getItem('google_user_session');
    if (savedSession) {
      try {
        const userData = JSON.parse(savedSession);
        if (userData && userData.email && ALLOWED_EMAILS.includes(userData.email.toLowerCase())) {
          renderUserProfile(userData);
          return;
        }
      } catch (e) {
        localStorage.removeItem('google_user_session');
      }
    }

    // Default locked state
    if (mainAppContainer) mainAppContainer.classList.add('hidden');
    if (authLockScreen) authLockScreen.classList.remove('hidden');
    if (promptSettingsBtn) promptSettingsBtn.classList.add('hidden');
    if (aiSettingsBtn) aiSettingsBtn.classList.add('hidden');

    // Initialize Google Buttons in navbar and lock screen
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

  initGoogleAuth();

  // Load stored AI settings
  const savedGeminiKey = localStorage.getItem('gemini_api_key') || '';
  const savedChatgptKey = localStorage.getItem('chatgpt_api_key') || '';
  const savedChatgptModel = localStorage.getItem('chatgpt_model') || 'gpt-4o-mini';

  if (geminiApiKeyInput) geminiApiKeyInput.value = savedGeminiKey;
  if (chatgptApiKeyInput) chatgptApiKeyInput.value = savedChatgptKey;
  if (chatgptModelSelect) chatgptModelSelect.value = savedChatgptModel;

  // Default Prompt Templates for Subjects
  const DEFAULT_PROMPTS = {
    "English": `Generate the solution for the given Verbal Ability question in a clear, structured, and concise format.

Start by identifying the relevant concept or reasoning approach required to solve the question. Explain the concept only to the extent necessary to understand why the correct option works.

Then explain the question by directly referring to the given passage, sentence, word, grammar rule, or arrangement, depending on the question type.

Option Elimination: Explain why the other options are incorrect in continuous prose without bullets or numbering.

The final answer should always end with the correct option in a boxed format using LaTeX:
\\boxed{\\text{Option X: [Correct Answer]}}

Question:
{question_text}

Options:
{opts_str}`,

    "Quants": `Generate the solution for the given Quantitative Ability question in a clear, structured, and student-friendly format suitable for IPMAT, JIPMAT, and entrance examinations.

Start by stating exactly what the question is asking us to find.

Concept: Explain the mathematical concept being tested.

Solution: Work through the question step by step. Explain the reasoning behind each major step and show all necessary calculations in LaTeX.

The final answer should always be given separately at the end under the heading "Final Answer" in boxed LaTeX format:
\\boxed{\\text{[Final answer]}}

Question:
{question_text}

Options:
{opts_str}`,

    "LRDI": `Generate a clear, step-by-step solution for the given Logical Reasoning / Data Interpretation question.

Identify the logical structure, given conditions, or data elements.

Break down the puzzle, arrangement, chart, or condition step by step.

Option Elimination: Briefly explain why incorrect options fail.

Final Answer: End with boxed LaTeX format:
\\boxed{\\text{Option X: [Correct Answer]}}

Question:
{question_text}

Options:
{opts_str}`
  };

  // Saved Custom Subjects and Prompts State
  let availableSubjects = JSON.parse(localStorage.getItem('custom_subjects') || '["English", "Quants"]');
  let subjectPrompts = JSON.parse(localStorage.getItem('subject_prompts') || '{}');

  // Fill default prompts if missing
  availableSubjects.forEach(sub => {
    if (!subjectPrompts[sub] && DEFAULT_PROMPTS[sub]) {
      subjectPrompts[sub] = DEFAULT_PROMPTS[sub];
    } else if (!subjectPrompts[sub]) {
      subjectPrompts[sub] = `Generate the solution for the given ${sub} question clearly step by step.\n\nFinal Answer:\n\\boxed{\\text{Option X: [Correct Answer]}}\n\nQuestion:\n{question_text}\n\nOptions:\n{opts_str}`;
    }
  });

  function getSubjectPrompt(subject) {
    if (subjectPrompts[subject] && subjectPrompts[subject].trim()) {
      return subjectPrompts[subject];
    }
    return DEFAULT_PROMPTS[subject] || `Generate solution for ${subject}.\n\nQuestion:\n{question_text}\n\nOptions:\n{opts_str}`;
  }

  let selectedSubject = availableSubjects[0] || 'English';
  let activeModalSubject = selectedSubject;

  // Render Subject Pills in Upload Card
  function renderMainSubjectPillList() {
    const subjectPillList = document.getElementById('subjectPillList');
    if (!subjectPillList) return;
    subjectPillList.innerHTML = '';
    availableSubjects.forEach(sub => {
      const btn = document.createElement('button');
      btn.className = `subject-pill ${sub === selectedSubject ? 'active' : ''}`;
      let icon = 'fa-book-open';
      if (sub === 'Quants') icon = 'fa-calculator';
      else if (sub === 'LRDI') icon = 'fa-diagram-project';
      btn.innerHTML = `<i class="fa-solid ${icon}"></i> ${sub}`;
      btn.addEventListener('click', () => {
        selectedSubject = sub;
        renderMainSubjectPillList();
      });
      subjectPillList.appendChild(btn);
    });
  }

  renderMainSubjectPillList();

  // Subject Prompts Modal Handlers
  function renderModalSubjectTabs() {
    if (!modalSubjectTabs) return;
    modalSubjectTabs.innerHTML = '';
    availableSubjects.forEach(sub => {
      const btn = document.createElement('button');
      btn.className = `subject-pill ${sub === activeModalSubject ? 'active' : ''}`;
      btn.innerHTML = `<i class="fa-solid fa-book"></i> ${sub}`;
      btn.addEventListener('click', () => {
        if (subjectPromptTextarea) {
          subjectPrompts[activeModalSubject] = subjectPromptTextarea.value;
        }
        activeModalSubject = sub;
        renderModalSubjectTabs();
        loadActiveSubjectPromptIntoTextarea();
      });
      modalSubjectTabs.appendChild(btn);
    });
  }

  function loadActiveSubjectPromptIntoTextarea() {
    if (activeSubjectPromptLabel) {
      activeSubjectPromptLabel.innerHTML = `<i class="fa-solid fa-terminal"></i> Custom Prompt & Conditions for <strong>${activeModalSubject}</strong>:`;
    }
    if (subjectPromptTextarea) {
      subjectPromptTextarea.value = getSubjectPrompt(activeModalSubject);
    }
  }

  if (promptSettingsBtn) {
    promptSettingsBtn.addEventListener('click', () => {
      activeModalSubject = selectedSubject || availableSubjects[0] || 'English';
      renderModalSubjectTabs();
      loadActiveSubjectPromptIntoTextarea();
      if (addSubjectInlineBox) addSubjectInlineBox.classList.add('hidden');
      promptsModalOverlay.classList.remove('hidden');
    });
  }

  const closePromptsModal = () => promptsModalOverlay.classList.add('hidden');
  if (closePromptsModalBtn) closePromptsModalBtn.addEventListener('click', closePromptsModal);
  if (cancelPromptsModalBtn) cancelPromptsModalBtn.addEventListener('click', closePromptsModal);

  if (savePromptsModalBtn) {
    savePromptsModalBtn.addEventListener('click', () => {
      if (subjectPromptTextarea) {
        subjectPrompts[activeModalSubject] = subjectPromptTextarea.value;
      }
      localStorage.setItem('custom_subjects', JSON.stringify(availableSubjects));
      localStorage.setItem('subject_prompts', JSON.stringify(subjectPrompts));
      renderMainSubjectPillList();
      closePromptsModal();
      alert('Subject Prompts & Conditions saved successfully!');
    });
  }

  if (resetPromptBtn) {
    resetPromptBtn.addEventListener('click', () => {
      if (confirm(`Reset prompt for "${activeModalSubject}" to system default?`)) {
        if (DEFAULT_PROMPTS[activeModalSubject]) {
          subjectPrompts[activeModalSubject] = DEFAULT_PROMPTS[activeModalSubject];
        } else {
          subjectPrompts[activeModalSubject] = `Generate the solution for the given ${activeModalSubject} question clearly step by step.\n\nFinal Answer:\n\\boxed{\\text{Option X: [Correct Answer]}}\n\nQuestion:\n{question_text}\n\nOptions:\n{opts_str}`;
        }
        loadActiveSubjectPromptIntoTextarea();
      }
    });
  }

  if (addNewSubjectBtn) {
    addNewSubjectBtn.addEventListener('click', () => {
      if (addSubjectInlineBox) {
        addSubjectInlineBox.classList.remove('hidden');
        if (newSubjectNameInput) {
          newSubjectNameInput.value = '';
          newSubjectNameInput.focus();
        }
      }
    });
  }

  if (cancelAddSubjectBtn) {
    cancelAddSubjectBtn.addEventListener('click', () => {
      if (addSubjectInlineBox) addSubjectInlineBox.classList.add('hidden');
    });
  }

  if (confirmAddSubjectBtn) {
    confirmAddSubjectBtn.addEventListener('click', () => {
      const sName = newSubjectNameInput ? newSubjectNameInput.value.trim() : '';
      if (!sName) {
        alert('Please enter a subject name.');
        return;
      }
      if (!availableSubjects.includes(sName)) {
        availableSubjects.push(sName);
        subjectPrompts[sName] = `Generate the solution for the given ${sName} question clearly step by step.\n\nFinal Answer:\n\\boxed{\\text{Option X: [Correct Answer]}}\n\nQuestion:\n{question_text}\n\nOptions:\n{opts_str}`;
        activeModalSubject = sName;
        renderModalSubjectTabs();
        loadActiveSubjectPromptIntoTextarea();
      } else {
        activeModalSubject = sName;
        renderModalSubjectTabs();
        loadActiveSubjectPromptIntoTextarea();
      }
      if (addSubjectInlineBox) addSubjectInlineBox.classList.add('hidden');
    });
  }

  if (insertQuestionVar) {
    insertQuestionVar.addEventListener('click', () => {
      if (subjectPromptTextarea) {
        const start = subjectPromptTextarea.selectionStart;
        const end = subjectPromptTextarea.selectionEnd;
        const text = subjectPromptTextarea.value;
        subjectPromptTextarea.value = text.substring(0, start) + '{question_text}' + text.substring(end);
        subjectPromptTextarea.focus();
        subjectPromptTextarea.selectionStart = subjectPromptTextarea.selectionEnd = start + 15;
      }
    });
  }

  if (insertOptsVar) {
    insertOptsVar.addEventListener('click', () => {
      if (subjectPromptTextarea) {
        const start = subjectPromptTextarea.selectionStart;
        const end = subjectPromptTextarea.selectionEnd;
        const text = subjectPromptTextarea.value;
        subjectPromptTextarea.value = text.substring(0, start) + '{opts_str}' + text.substring(end);
        subjectPromptTextarea.focus();
        subjectPromptTextarea.selectionStart = subjectPromptTextarea.selectionEnd = start + 10;
      }
    });
  }

  // AI Settings Modal handlers
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
      const gKey = geminiApiKeyInput ? geminiApiKeyInput.value.trim() : '';
      const cKey = chatgptApiKeyInput ? chatgptApiKeyInput.value.trim() : '';
      const cModel = chatgptModelSelect ? chatgptModelSelect.value : 'gpt-4o-mini';

      localStorage.setItem('gemini_api_key', gKey);
      localStorage.setItem('chatgpt_api_key', cKey);
      localStorage.setItem('chatgpt_model', cModel);
      
      closeAiModal();
      alert('AI Settings saved successfully!');
    });
  }

  // Drag and drop handlers
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
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

  // API Base URL resolution
  const API_BASE = (window.location.protocol === 'file:') 
    ? 'http://127.0.0.1:8000' 
    : '';

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

    const llmProvider = 'gemini'; // Enforce Gemini for document parsing
    const geminiApiKey = localStorage.getItem('gemini_api_key') || '';

    const customPrompt = getSubjectPrompt(selectedSubject);
    const useAiTopics = useAiTopicsCheckbox ? useAiTopicsCheckbox.checked : false;
    const useAiExtraction = document.getElementById('useAiExtractionCheckbox') ? document.getElementById('useAiExtractionCheckbox').checked : false;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('subject', selectedSubject);
    formData.append('llmProvider', llmProvider);
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
          questionsData = data.questions;
          questionsData.forEach(q => { if (!q.subject) q.subject = selectedSubject; });
          renderQuestions();
          workspaceSection.classList.remove('hidden');
          workspaceSection.scrollIntoView({ behavior: 'smooth' });
          updateStatusBadge('Parsed Successfully', 'success');
        } else {
          alert('No questions could be extracted from this document. Please check file format.');
        }
      }, 400);

    } catch (err) {
      progressContainer.classList.add('hidden');
      alert('Error parsing document: ' + err.message);
    }
  });

  // Full Taxonomy Definition
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

  function getTopicsForSubject(subj) {
    const s = subj || selectedSubject;
    return TAXONOMY[s] ? Object.keys(TAXONOMY[s]) : ["General Topic", "Misc"];
  }

  function getSubtopicsForTopic(subj, topic) {
    if (arguments.length === 1) {
      topic = subj;
      subj = selectedSubject;
    }
    const s = subj || selectedSubject;
    const subjData = TAXONOMY[s] || TAXONOMY["English"];
    if (subjData && subjData[topic]) return subjData[topic];
    for (let k in subjData) {
      if (k.toLowerCase() === (topic || '').toLowerCase()) return subjData[k];
    }
    return [Object.values(subjData)[0]?.[0] || "General Subtopic"];
  }

  // Render Questions Cards
  function renderQuestions() {
    questionsList.innerHTML = '';
    questionCountBadge.textContent = `${questionsData.length} Questions`;
    
    const filterQuery = searchInput.value.toLowerCase().trim();

    questionsData.forEach((q, qIndex) => {
      if (!q.subject) q.subject = selectedSubject;

      // Search filter check
      if (filterQuery) {
        const matchQ = q.questionText.toLowerCase().includes(filterQuery);
        const matchHint = q.hint.toLowerCase().includes(filterQuery);
        const matchTopic = (q.topic || '').toLowerCase().includes(filterQuery);
        const matchOpts = q.options.some(o => o.text.toLowerCase().includes(filterQuery));
        if (!matchQ && !matchHint && !matchTopic && !matchOpts) return;
      }

      const card = document.createElement('div');
      card.className = 'question-card';
      card.dataset.index = qIndex;

      let optionsHtml = '';
      q.options.forEach((opt, optIndex) => {
        optionsHtml += `
          <div class="option-row ${opt.isCorrect ? 'correct' : ''}">
            <input type="radio" name="correct_q_${qIndex}" class="radio-custom" 
              ${opt.isCorrect ? 'checked' : ''} data-qindex="${qIndex}" data-optindex="${optIndex}">
            <input type="text" class="option-input" value="${escapeHtml(opt.text)}" 
              data-qindex="${qIndex}" data-optindex="${optIndex}">
            ${opt.isCorrect ? '<span class="correct-badge"><i class="fa-solid fa-check"></i> Correct</span>' : ''}
            <button class="btn btn-icon text-danger delete-opt-btn" data-qindex="${qIndex}" data-optindex="${optIndex}">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        `;
      });

      // Build Subject Dropdown Options
      let subjectSelectOptionsHtml = '';
      availableSubjects.forEach(sub => {
        subjectSelectOptionsHtml += `<option value="${sub}" ${sub === q.subject ? 'selected' : ''}>${sub}</option>`;
      });

      // Build Topic Options based on Question Subject
      const availableTopics = getTopicsForSubject(q.subject);
      let currentTop = availableTopics.find(t => t.toLowerCase() === (q.topic || '').toLowerCase()) || availableTopics[0];
      q.topic = currentTop;
      
      let topicSelectOptionsHtml = '';
      availableTopics.forEach(t => {
        topicSelectOptionsHtml += `<option value="${t}" ${t === currentTop ? 'selected' : ''}>${t}</option>`;
      });

      // Build Subtopic Options based on Topic
      const subtopicsList = getSubtopicsForTopic(q.subject, currentTop);
      let currentSub = subtopicsList.find(s => s.toLowerCase() === (q.subtopic || '').toLowerCase()) || subtopicsList[0];
      q.subtopic = currentSub;

      let subtopicSelectOptionsHtml = '';
      subtopicsList.forEach(s => {
        subtopicSelectOptionsHtml += `<option value="${s}" ${s === currentSub ? 'selected' : ''}>${s}</option>`;
      });

      // Label Options
      const labels = ['easy', 'medium', 'hard'];
      let labelSelectOptionsHtml = '';
      labels.forEach(l => {
        labelSelectOptionsHtml += `<option value="${l}" ${l === q.label ? 'selected' : ''}>${l.charAt(0).toUpperCase() + l.slice(1)}</option>`;
      });

      card.innerHTML = `
        <div class="card-header">
          <span class="question-index"><i class="fa-solid fa-circle-question"></i> Question ${qIndex + 1}</span>
          <div class="card-meta-inputs">
            <select class="meta-select q-label-select" data-qindex="${qIndex}" title="Difficulty">
              ${labelSelectOptionsHtml}
            </select>
            <select class="meta-select q-subject-select" data-qindex="${qIndex}" title="Subject">
              ${subjectSelectOptionsHtml}
            </select>
            <select class="meta-select q-topic-select" data-qindex="${qIndex}" title="Topic">
              ${topicSelectOptionsHtml}
            </select>
            <select class="meta-select q-subtopic-select" data-qindex="${qIndex}" title="Subtopic">
              ${subtopicSelectOptionsHtml}
            </select>
            <button class="btn btn-sm btn-success add-to-qb-btn" data-qindex="${qIndex}" title="Save to Question Bank DB">
              <i class="fa-solid fa-cloud-arrow-up"></i>
            </button>
            <button class="btn btn-icon text-danger delete-q-btn" data-qindex="${qIndex}" title="Delete Question">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <div class="card-body">
          <div class="form-group">
            <label><i class="fa-solid fa-pen-nib"></i> Question Text (LaTeX supported $...$)</label>
            <textarea class="q-text-input" rows="2" data-qindex="${qIndex}">${escapeHtml(q.questionText)}</textarea>
            <div class="latex-preview-box math-render" id="math_preview_${qIndex}"></div>
          </div>

          <div class="hint-wrapper">
            <div class="hint-header">
              <label><i class="fa-solid fa-lightbulb"></i> Hint / Explanation</label>
              <div style="display: flex; gap: 0.4rem; align-items: center;">
                <button class="btn btn-sm btn-outline copy-hint-btn" data-qindex="${qIndex}" title="Copy hint text to clipboard">
                  <i class="fa-regular fa-copy"></i> Copy Hint
                </button>
                <button class="ai-gen-btn generate-single-ai-hint-btn" data-qindex="${qIndex}" title="Generate step-by-step explanation using AI">
                  <i class="fa-solid fa-wand-magic-sparkles"></i> Generate AI Hint
                </button>
              </div>
            </div>
            <textarea class="q-hint-input" rows="5" data-qindex="${qIndex}">${escapeHtml(q.hint)}</textarea>
          </div>

          <div class="options-editor">
            <div class="options-label"><i class="fa-solid fa-list-ul"></i> Options & Correct Answer</div>
            <div class="options-container">
              ${optionsHtml}
            </div>
            <button class="btn btn-sm btn-outline add-opt-btn" data-qindex="${qIndex}" style="align-self: flex-start; margin-top: 0.4rem;">
              <i class="fa-solid fa-plus"></i> Add Option
            </button>
          </div>
        </div>
      `;

      questionsList.appendChild(card);
    });

    renderMathPreviews();
    syncJsonCodeDisplay();
    attachCardEventListeners();
  }

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

  function renderMathPreviews() {
    questionsData.forEach((q, idx) => {
      const previewEl = document.getElementById(`math_preview_${idx}`);
      if (previewEl) {
        renderMathInContainer(previewEl, q.questionText || '<i>Empty question</i>');
      }
    });
  }

  function syncJsonCodeDisplay() {
    jsonCodeDisplay.textContent = JSON.stringify(questionsData, null, 2);
  }

  function attachCardEventListeners() {
    document.querySelectorAll('.q-subject-select').forEach(el => {
      el.addEventListener('change', (e) => {
        const qIndex = parseInt(e.target.dataset.qindex);
        const newSubj = e.target.value;
        questionsData[qIndex].subject = newSubj;
        const availableTops = getTopicsForSubject(newSubj);
        questionsData[qIndex].topic = availableTops[0];
        const subList = getSubtopicsForTopic(newSubj, availableTops[0]);
        questionsData[qIndex].subtopic = subList[0];
        renderQuestions();
      });
    });

    document.querySelectorAll('.q-text-input').forEach(el => {
      el.addEventListener('input', (e) => {
        const qIndex = parseInt(e.target.dataset.qindex);
        questionsData[qIndex].questionText = e.target.value;
        renderMathPreviews();
        syncJsonCodeDisplay();
      });
    });

    document.querySelectorAll('.q-hint-input').forEach(el => {
      el.addEventListener('input', (e) => {
        const qIndex = parseInt(e.target.dataset.qindex);
        questionsData[qIndex].hint = e.target.value;
        syncJsonCodeDisplay();
      });
    });

    document.querySelectorAll('.q-topic-select').forEach(el => {
      el.addEventListener('change', (e) => {
        const qIndex = parseInt(e.target.dataset.qindex);
        const newTopic = e.target.value;
        questionsData[qIndex].topic = newTopic;
        const subList = getSubtopicsForTopic(questionsData[qIndex].subject, newTopic);
        questionsData[qIndex].subtopic = subList[0];
        renderQuestions();
      });
    });

    document.querySelectorAll('.q-subtopic-select').forEach(el => {
      el.addEventListener('change', (e) => {
        const qIndex = parseInt(e.target.dataset.qindex);
        questionsData[qIndex].subtopic = e.target.value;
        syncJsonCodeDisplay();
      });
    });

    document.querySelectorAll('.option-input').forEach(el => {
      el.addEventListener('input', (e) => {
        const qIndex = parseInt(e.target.dataset.qindex);
        const optIndex = parseInt(e.target.dataset.optindex);
        questionsData[qIndex].options[optIndex].text = e.target.value;
        syncJsonCodeDisplay();
      });
    });

    document.querySelectorAll('.radio-custom').forEach(el => {
      el.addEventListener('change', (e) => {
        const qIndex = parseInt(e.target.dataset.qindex);
        const optIndex = parseInt(e.target.dataset.optindex);
        questionsData[qIndex].options.forEach((opt, idx) => {
          opt.isCorrect = (idx === optIndex);
        });
        renderQuestions();
      });
    });

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
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          if (successful) resolve();
          else reject(new Error('execCommand copy failed'));
        } catch (err) {
          reject(err);
        }
      });
    }
  }

    document.querySelectorAll('.copy-hint-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const btnEl = e.currentTarget;
        const qIndex = parseInt(btnEl.dataset.qindex);
        
        // Read directly from the card DOM textarea for real-time edited content
        const card = btnEl.closest('.question-card');
        const hintTextarea = card ? card.querySelector('.q-hint-input') : null;
        let hintText = hintTextarea ? hintTextarea.value : (questionsData[qIndex] ? questionsData[qIndex].hint : '');

        if (!hintText || !hintText.trim()) {
          alert('Hint text is empty!');
          return;
        }

        copyTextToClipboard(hintText).then(() => {
          const origHtml = btnEl.innerHTML;
          btnEl.innerHTML = '<i class="fa-solid fa-check" style="color: #10b981;"></i> Copied!';
          setTimeout(() => { btnEl.innerHTML = origHtml; }, 2000);
        }).catch(err => {
          console.error('Copy error:', err);
          alert('Failed to copy hint to clipboard.');
        });
      });
    });
    document.querySelectorAll('.q-label-select').forEach(el => {
      el.addEventListener('change', (e) => {
        const qIndex = parseInt(e.target.dataset.qindex);
        questionsData[qIndex].label = e.target.value;
        syncJsonCodeDisplay();
      });
    });

    document.querySelectorAll('.add-to-qb-btn').forEach(el => {
      el.addEventListener('click', async (e) => {
        const qIndex = parseInt(e.currentTarget.dataset.qindex);
        const qData = questionsData[qIndex];
        const btn = e.currentTarget;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner spin-icon"></i>';
        btn.disabled = true;

        try {
          const response = await fetch(`${API_BASE}/api/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(qData)
          });
          const result = await response.json();
          if (response.ok) {
            btn.innerHTML = '<i class="fa-solid fa-check"></i>';
            btn.classList.remove('btn-success');
            btn.classList.add('btn-outline');
          } else {
            alert('Error adding to DB: ' + (result.detail || 'Unknown error'));
            btn.innerHTML = originalHtml;
          }
        } catch (error) {
          alert('Network error: ' + error.message);
          btn.innerHTML = originalHtml;
        } finally {
          setTimeout(() => {
            if (btn.innerHTML !== '<i class="fa-solid fa-check"></i>') {
                btn.disabled = false;
            }
          }, 1000);
        }
      });
    });

    document.querySelectorAll('.generate-single-ai-hint-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const qIndex = parseInt(e.currentTarget.dataset.qindex);
        await generateSingleAiHint(qIndex, e.currentTarget);
      });
    });

    document.querySelectorAll('.delete-q-btn').forEach(el => {
      el.addEventListener('click', (e) => {
        const qIndex = parseInt(e.currentTarget.dataset.qindex);
        questionsData.splice(qIndex, 1);
        renderQuestions();
      });
    });

    document.querySelectorAll('.delete-opt-btn').forEach(el => {
      el.addEventListener('click', (e) => {
        const qIndex = parseInt(e.currentTarget.dataset.qindex);
        const optIndex = parseInt(e.currentTarget.dataset.optindex);
        questionsData[qIndex].options.splice(optIndex, 1);
        renderQuestions();
      });
    });

    document.querySelectorAll('.add-opt-btn').forEach(el => {
      el.addEventListener('click', (e) => {
        const qIndex = parseInt(e.currentTarget.dataset.qindex);
        questionsData[qIndex].options.push({
          text: "New Option",
          isCorrect: false
        });
        renderQuestions();
      });
    });
  }

  // Generate Single AI Hint helper
  async function generateSingleAiHint(qIndex, btnElement) {
    const q = questionsData[qIndex];
    if (!q) return;

    let llmProvider = 'gemini';
    const providerRadio = document.querySelector('input[name="global_ai_provider"]:checked');
    if (providerRadio) {
      llmProvider = providerRadio.value;
    }

    const apiKey = localStorage.getItem(llmProvider === 'chatgpt' ? 'chatgpt_api_key' : 'gemini_api_key') || '';
    
    const customPrompt = getSubjectPrompt(q.subject || selectedSubject || 'English');

    const origHtml = btnElement ? btnElement.innerHTML : '';
    if (btnElement) {
      btnElement.disabled = true;
      btnElement.innerHTML = '<i class="fa-solid fa-spinner spin-icon"></i> Generating...';
    }

    try {
      const response = await fetch(`${API_BASE}/api/generate-hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: q.questionText,
          options: q.options,
          apiKey: apiKey,
          llmProvider: llmProvider,
          model: llmProvider === 'chatgpt' ? (localStorage.getItem('chatgpt_model') || 'gpt-4o-mini') : 'gemini-2.0-flash',
          subject: q.subject || selectedSubject || 'English',
          customPrompt: customPrompt
        })
      });

      if (!response.ok) {
        let errStr = response.statusText;
        try {
          const errData = await response.json();
          if (errData && errData.detail) errStr = errData.detail;
        } catch(e) {}
        throw new Error(errStr);
      }

      const resData = await response.json();
      q.hint = cleanFormatting(resData.hint);
      renderQuestions();
    } catch(err) {
      alert('AI Generation Failed: ' + err.message);
      if (btnElement) {
        btnElement.disabled = false;
        btnElement.innerHTML = origHtml;
      }
    }
  }

  // Batch Auto-Generate Missing Hints
  if (autoGenerateAllHintsBtn) {
    autoGenerateAllHintsBtn.addEventListener('click', async () => {
      const emptyIndices = [];
      questionsData.forEach((q, idx) => {
        if (!q.hint || !q.hint.trim()) emptyIndices.push(idx);
      });

      if (emptyIndices.length === 0) {
        alert('All questions already have hints!');
        return;
      }

      if (!confirm(`Generate AI hints for ${emptyIndices.length} questions missing hints?`)) return;

      const origText = autoGenerateAllHintsBtn.innerHTML;
      autoGenerateAllHintsBtn.disabled = true;

      for (let i = 0; i < emptyIndices.length; i++) {
        const idx = emptyIndices[i];
        autoGenerateAllHintsBtn.innerHTML = `<i class="fa-solid fa-spinner spin-icon"></i> Generating (${i + 1}/${emptyIndices.length})...`;
        await generateSingleAiHint(idx, null);
      }

      autoGenerateAllHintsBtn.disabled = false;
      autoGenerateAllHintsBtn.innerHTML = origText;
      alert(`Successfully generated AI hints for ${emptyIndices.length} questions!`);
    });
  }

  // Add New Question
  addQuestionBtn.addEventListener('click', () => {
    questionsData.push({
      questionText: "New Question Text $x = 0$",
      hint: "Hint for new question",
      subject: selectedSubject || "English",
      topic: "Vocabulary",
      subtopic: "Definition",
      options: [
        { text: "$Option 1$", isCorrect: true },
        { text: "$Option 2$", isCorrect: false },
        { text: "$Option 3$", isCorrect: false },
        { text: "$Option 4$", isCorrect: false }
      ]
    });
    renderQuestions();
    const lastCard = questionsList.lastElementChild;
    if (lastCard) lastCard.scrollIntoView({ behavior: 'smooth' });
  });

  // Bulk Apply Topic
  applyBulkTopicBtn.addEventListener('click', () => {
    const newTopic = bulkTopicInput.value.trim();
    if (!newTopic) return;
    questionsData.forEach(q => q.topic = newTopic);
    renderQuestions();
  });

  // Search input filter
  searchInput.addEventListener('input', () => {
    renderQuestions();
  });

  // View Switcher (Cards vs QB vs JSON)
  viewCardsBtn.addEventListener('click', () => {
    viewCardsBtn.classList.add('active');
    viewQbBtn.classList.remove('active');
    viewJsonBtn.classList.remove('active');
    cardsView.classList.remove('hidden');
    qbView.classList.add('hidden');
    jsonView.classList.add('hidden');
  });

  viewQbBtn.addEventListener('click', () => {
    viewQbBtn.classList.add('active');
    viewCardsBtn.classList.remove('active');
    viewJsonBtn.classList.remove('active');
    qbView.classList.remove('hidden');
    cardsView.classList.add('hidden');
    jsonView.classList.add('hidden');
    fetchQuestionBank(); // load QB data
  });

  viewJsonBtn.addEventListener('click', () => {
    viewJsonBtn.classList.add('active');
    viewCardsBtn.classList.remove('active');
    viewQbBtn.classList.remove('active');
    jsonView.classList.remove('hidden');
    cardsView.classList.add('hidden');
    qbView.classList.add('hidden');
    syncJsonCodeDisplay();
  });

  // Copy JSON to Clipboard
  copyJsonBtn.addEventListener('click', () => {
    const jsonStr = JSON.stringify(questionsData, null, 2);
    copyTextToClipboard(jsonStr).then(() => {
      const origText = copyJsonBtn.innerHTML;
      copyJsonBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
      setTimeout(() => copyJsonBtn.innerHTML = origText, 2000);
    }).catch(err => {
      alert('Failed to copy JSON: ' + err.message);
    });
  });

  // Download JSON File
  downloadJsonBtn.addEventListener('click', async () => {
    try {
      const response = await fetch(`${API_BASE}/api/download-json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionsData)
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'questions.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch(err) {
      alert('Error downloading JSON: ' + err.message);
    }
  });

  // Dark / Light Theme Toggle
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      const isLight = document.body.classList.contains('light-theme');
      themeToggleBtn.innerHTML = isLight ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    });
  }

  function cleanFormatting(str) {
    if (!str) return '';
    let cleaned = str.replace(/#+\s*/g, '');
    cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
    cleaned = cleaned.replace(/__(.*?)__/g, '$1');
    cleaned = cleaned.replace(/\*\*/g, '').replace(/__/g, '');
    return cleaned.trim();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  addAllToQbBtn.addEventListener('click', async () => {
    if (questionsData.length === 0) {
      alert("No questions to add.");
      return;
    }
    const origHtml = addAllToQbBtn.innerHTML;
    addAllToQbBtn.innerHTML = '<i class="fa-solid fa-spinner spin-icon"></i> Pushing...';
    addAllToQbBtn.disabled = true;
    try {
      const response = await fetch(`${API_BASE}/api/questions/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: questionsData })
      });
      const result = await response.json();
      if (response.ok) {
        alert(result.message);
      } else {
        alert('Error: ' + result.detail);
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      addAllToQbBtn.innerHTML = origHtml;
      addAllToQbBtn.disabled = false;
    }
  });

  // =========================================================================
  // Primary Navigation Mode Switcher (4 Options)
  // =========================================================================
  const modeExtractBtn = document.getElementById('modeExtractBtn');
  const modeQbBtn = document.getElementById('modeQbBtn');
  const modeAddSingleBtn = document.getElementById('modeAddSingleBtn');
  const modeMockBtn = document.getElementById('modeMockBtn');

  const uploadSection = document.getElementById('uploadSection');
  const qbStandaloneSection = document.getElementById('qbStandaloneSection');
  const singleQSection = document.getElementById('singleQSection');
  const mockGeneratorSection = document.getElementById('mockGeneratorSection');

  function switchMainMode(activeMode) {
    [modeExtractBtn, modeQbBtn, modeAddSingleBtn, modeMockBtn].forEach(btn => btn && btn.classList.remove('active'));
    
    uploadSection.classList.add('hidden');
    if (workspaceSection) workspaceSection.classList.add('hidden');
    qbStandaloneSection.classList.add('hidden');
    singleQSection.classList.add('hidden');
    if (mockGeneratorSection) mockGeneratorSection.classList.add('hidden');

    if (activeMode === 'extract') {
      modeExtractBtn.classList.add('active');
      uploadSection.classList.remove('hidden');
      if (questionsData && questionsData.length > 0) {
        workspaceSection.classList.remove('hidden');
      }
    } else if (activeMode === 'qb') {
      modeQbBtn.classList.add('active');
      qbStandaloneSection.classList.remove('hidden');
      fetchStandaloneQb();
    } else if (activeMode === 'single') {
      modeAddSingleBtn.classList.add('active');
      singleQSection.classList.remove('hidden');
      initSingleQForm();
    } else if (activeMode === 'mock') {
      modeMockBtn.classList.add('active');
      mockGeneratorSection.classList.remove('hidden');
      initMockGeneratorForm();
    }
  }

  if (modeExtractBtn) modeExtractBtn.addEventListener('click', () => switchMainMode('extract'));
  if (modeQbBtn) modeQbBtn.addEventListener('click', () => switchMainMode('qb'));
  if (modeAddSingleBtn) modeAddSingleBtn.addEventListener('click', () => switchMainMode('single'));
  if (modeMockBtn) modeMockBtn.addEventListener('click', () => switchMainMode('mock'));


  // =========================================================================
  // Standalone Question Bank Logic (Option 2) - Collapsible Cards & USED Stamp
  // =========================================================================
  let qbStandaloneData = [];
  const qbStandaloneList = document.getElementById('qbStandaloneList');
  const qbTotalBadge = document.getElementById('qbTotalBadge');
  const qbSearchInput = document.getElementById('qbSearchInput');
  const qbSubjectFilter = document.getElementById('qbSubjectFilter');
  const qbLabelFilter = document.getElementById('qbLabelFilter');
  const refreshQbBtn = document.getElementById('refreshQbBtn');

  async function fetchStandaloneQb() {
    qbStandaloneList.innerHTML = '<div class="empty-state"><i class="fa-solid fa-spinner spin-icon"></i> Loading Question Bank...</div>';
    try {
      const response = await fetch(`${API_BASE}/api/questions`);
      const result = await response.json();
      if (response.ok) {
        qbStandaloneData = result.questions || [];
        renderStandaloneQb();
      } else {
        qbStandaloneList.innerHTML = `<div class="empty-state text-danger">Error: ${result.detail}</div>`;
      }
    } catch (err) {
      qbStandaloneList.innerHTML = `<div class="empty-state text-danger">Network Error: ${err.message}</div>`;
    }
  }

  if (refreshQbBtn) refreshQbBtn.addEventListener('click', fetchStandaloneQb);
  if (qbSearchInput) qbSearchInput.addEventListener('input', renderStandaloneQb);
  if (qbSubjectFilter) qbSubjectFilter.addEventListener('change', renderStandaloneQb);
  if (qbLabelFilter) qbLabelFilter.addEventListener('change', renderStandaloneQb);

  function renderStandaloneQb() {
    if (!qbStandaloneData || qbStandaloneData.length === 0) {
      qbStandaloneList.innerHTML = '<div class="empty-state">Question bank is empty.</div>';
      qbTotalBadge.textContent = '0 Questions';
      return;
    }

    const query = (qbSearchInput ? qbSearchInput.value : '').toLowerCase().trim();
    const subjectVal = qbSubjectFilter ? qbSubjectFilter.value : 'all';
    const labelVal = qbLabelFilter ? qbLabelFilter.value : 'all';

    const filtered = qbStandaloneData.filter(q => {
      if (subjectVal !== 'all' && (q.subject || '').toLowerCase() !== subjectVal.toLowerCase()) return false;
      if (labelVal !== 'all' && (q.label || '').toLowerCase() !== labelVal.toLowerCase()) return false;
      if (query) {
        const matchQ = (q.questionText || '').toLowerCase().includes(query);
        const matchHint = (q.hint || '').toLowerCase().includes(query);
        const matchTopic = (q.topic || '').toLowerCase().includes(query);
        const matchSubtopic = (q.subtopic || '').toLowerCase().includes(query);
        const matchOpts = (q.options || []).some(o => (o.text || '').toLowerCase().includes(query));
        if (!matchQ && !matchHint && !matchTopic && !matchSubtopic && !matchOpts) return false;
      }
      return true;
    });

    qbTotalBadge.textContent = `${filtered.length} Questions`;

    if (filtered.length === 0) {
      qbStandaloneList.innerHTML = '<div class="empty-state">No matching questions found.</div>';
      return;
    }

    qbStandaloneList.innerHTML = '';
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

      card.innerHTML = `
        <div class="card-header qb-card-toggle">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <i class="fa-solid fa-chevron-down expand-chevron"></i>
            <span class="question-index"><i class="fa-solid fa-database"></i> Question ${idx + 1}</span>
          </div>
          <div class="card-meta-inputs" style="gap: 0.6rem; align-items: center;">
            ${q.isUsed ? `<span class="used-stamp">USED</span>` : ''}
            <span class="badge" style="background:var(--bg-panel); border:1px solid var(--border-color); padding:0.2rem 0.6rem; border-radius:4px; font-weight:600; text-transform:uppercase; font-size:0.75rem; color:#818cf8;">${q.label || 'medium'}</span>
            <span class="badge" style="background:var(--bg-panel); border:1px solid var(--border-color); padding:0.2rem 0.6rem; border-radius:4px; font-size:0.75rem;">${q.subject || 'N/A'}</span>
            <span class="badge" style="background:var(--bg-panel); border:1px solid var(--border-color); padding:0.2rem 0.6rem; border-radius:4px; font-size:0.75rem;">${q.topic || 'N/A'}</span>
            ${q.id ? `<button class="btn btn-icon text-danger delete-qb-item-btn" data-id="${q.id}" title="Delete from Question Bank"><i class="fa-solid fa-trash"></i></button>` : ''}
          </div>
        </div>
        <div class="card-body-collapsible">
          <div class="form-group">
            <label><i class="fa-solid fa-pen-nib"></i> Question Text</label>
            <textarea class="q-text-input" rows="2" disabled>${escapeHtml(q.questionText)}</textarea>
            <div class="latex-preview-box math-render qb-math-q" style="margin-top:0.4rem;"></div>
          </div>
          ${q.hint ? `
          <div class="hint-wrapper">
            <div class="hint-header"><label><i class="fa-solid fa-lightbulb"></i> Hint / Explanation</label></div>
            <textarea class="q-hint-input" rows="3" disabled>${escapeHtml(q.hint)}</textarea>
            <div class="latex-preview-box math-render qb-math-h" style="margin-top:0.4rem;"></div>
          </div>` : ''}
          <div class="options-container" style="margin-top:1rem;">
            ${optionsHtml}
          </div>
        </div>
      `;
      
      const headerEl = card.querySelector('.qb-card-toggle');
      headerEl.addEventListener('click', (e) => {
        // Prevent expanding when clicking delete button
        if (e.target.closest('.delete-qb-item-btn')) return;
        card.classList.toggle('expanded');
      });

      const qBox = card.querySelector('.qb-math-q');
      if (qBox) renderMathInContainer(qBox, q.questionText);
      const hBox = card.querySelector('.qb-math-h');
      if (hBox && q.hint) renderMathInContainer(hBox, q.hint);

      qbStandaloneList.appendChild(card);
    });

    // Delete question from MongoDB handler
    document.querySelectorAll('.delete-qb-item-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const qId = e.currentTarget.dataset.id;
        if (!confirm('Are you sure you want to delete this question from the Question Bank?')) return;
        
        try {
          const res = await fetch(`${API_BASE}/api/questions/${qId}`, { method: 'DELETE' });
          if (res.ok) {
            fetchStandaloneQb();
          } else {
            const data = await res.json();
            alert('Delete failed: ' + (data.detail || 'Unknown error'));
          }
        } catch(err) {
          alert('Network error: ' + err.message);
        }
      });
    });
  }


  // =========================================================================
  // Single Question Upload Form Logic (Option 3)
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

  const singleQTextPreview = document.getElementById('singleQTextPreview');
  const singleHintPreview = document.getElementById('singleHintPreview');

  function initSingleQForm() {
    updateSingleTopics();
    renderSingleOptions();
    updateSinglePreviews();
  }

  function updateSinglePreviews() {
    if (singleQTextInput && singleQTextPreview) {
      renderMathInContainer(singleQTextPreview, singleQTextInput.value.trim());
    }
    if (singleHintInput && singleHintPreview) {
      renderMathInContainer(singleHintPreview, singleHintInput.value.trim());
    }
  }

  if (singleQTextInput) singleQTextInput.addEventListener('input', updateSinglePreviews);
  if (singleHintInput) singleHintInput.addEventListener('input', updateSinglePreviews);

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
        <input type="text" class="option-input single-opt-txt" value="${escapeHtml(opt.text)}" placeholder="Option ${chr(65+idx)} text..." data-idx="${idx}" required>
        ${opt.isCorrect ? '<span class="correct-badge"><i class="fa-solid fa-check"></i> Correct</span>' : ''}
        ${singleOptions.length > 2 ? `<button type="button" class="btn btn-icon text-danger single-del-opt-btn" data-idx="${idx}"><i class="fa-solid fa-xmark"></i></button>` : ''}
      `;
      singleOptionsList.appendChild(row);
    });

    // Option events
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

  if (singleResetBtn) {
    singleResetBtn.addEventListener('click', () => {
      singleQTextInput.value = '';
      singleHintInput.value = '';
      singleOptions = [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ];
      renderSingleOptions();
    });
  }

  if (singleQuestionForm) {
    singleQuestionForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const qText = singleQTextInput.value.trim();
      if (!qText) {
        alert('Please enter question text.');
        return;
      }

      if (singleOptions.some(o => !o.text.trim())) {
        alert('Please fill in text for all options.');
        return;
      }

      const questionObj = {
        subject: singleSubjectSelect.value,
        topic: singleTopicSelect.value,
        subtopic: singleSubtopicSelect.value,
        label: singleLabelSelect.value,
        questionText: qText,
        hint: singleHintInput.value.trim(),
        options: singleOptions.map(o => ({ text: o.text.trim(), isCorrect: o.isCorrect }))
      };

      const submitBtn = document.getElementById('singleSubmitBtn');
      const origHtml = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner spin-icon"></i> Saving...';
      submitBtn.disabled = true;

      try {
        const res = await fetch(`${API_BASE}/api/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(questionObj)
        });
        const result = await res.json();
        if (res.ok) {
          alert('Question successfully saved to Question Bank!');
          singleQTextInput.value = '';
          singleHintInput.value = '';
          singleOptions = [
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
          ];
          renderSingleOptions();
        } else {
          alert('Error saving question: ' + (result.detail || 'Unknown error'));
        }
      } catch (err) {
        alert('Network error: ' + err.message);
      } finally {
        submitBtn.innerHTML = origHtml;
        submitBtn.disabled = false;
      }
    });
  }

  // =========================================================================
  // Mock Test Paper Generator Logic (Option 4)
  // =========================================================================
  const mockGeneratorForm = document.getElementById('mockGeneratorForm');
  const mockEnglishCount = document.getElementById('mockEnglishCount');
  const mockQuantsCount = document.getElementById('mockQuantsCount');
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
    if (mockEasyPctVal && mockEasyPct) mockEasyPctVal.textContent = `${mockEasyPct.value}%`;
    if (mockMediumPctVal && mockMediumPct) mockMediumPctVal.textContent = `${mockMediumPct.value}%`;
    if (mockHardPctVal && mockHardPct) mockHardPctVal.textContent = `${mockHardPct.value}%`;
  }

  if (mockEnglishCount) mockEnglishCount.addEventListener('input', updateSliderBadges);
  if (mockQuantsCount) mockQuantsCount.addEventListener('input', updateSliderBadges);

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
      if (!confirm('Are you sure you want to reset all USED stamps in MongoDB back to unused?')) return;
      const origText = resetAllUsedBtn.innerHTML;
      resetAllUsedBtn.innerHTML = '<i class="fa-solid fa-spinner spin-icon"></i> Resetting...';
      try {
        const res = await fetch(`${API_BASE}/api/questions/reset-used`, { method: 'POST' });
        const result = await res.json();
        if (res.ok) {
          alert(result.message);
          if (qbStandaloneData) fetchStandaloneQb();
        } else {
          alert('Error: ' + result.detail);
        }
      } catch(err) {
        alert('Network error: ' + err.message);
      } finally {
        resetAllUsedBtn.innerHTML = origText;
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
        alert('Difficulty allocation percentages must add up to exactly 100%. Current total: ' + (easy + med + hard) + '%');
        return;
      }

      const engCount = parseInt(mockEnglishCount.value) || 0;
      const quantsCount = parseInt(mockQuantsCount.value) || 0;
      if (engCount + quantsCount <= 0) {
        alert('Please specify at least 1 question for English or Quants.');
        return;
      }

      const payload = {
        subjectCounts: {
          "English": engCount,
          "Quants": quantsCount
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
      btn.innerHTML = '<i class="fa-solid fa-spinner spin-icon"></i> Generating Mock Paper...';
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
          alert('Error generating mock paper: ' + (result.detail || 'Unknown error'));
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
      mockQuestionsList.innerHTML = '<div class="empty-state">No questions found matching your criteria. Try adjusting difficulty percentages or question counts.</div>';
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
          <div class="card-meta-inputs" style="gap: 0.6rem; align-items: center;">
            <span class="used-stamp">USED</span>
            <span class="badge" style="background:var(--bg-panel); border:1px solid var(--border-color); padding:0.2rem 0.6rem; border-radius:4px; font-weight:600; text-transform:uppercase; font-size:0.75rem; color:#818cf8;">${q.label || 'medium'}</span>
            <span class="badge" style="background:var(--bg-panel); border:1px solid var(--border-color); padding:0.2rem 0.6rem; border-radius:4px; font-size:0.75rem;">${q.subject || 'N/A'}</span>
            <span class="badge" style="background:var(--bg-panel); border:1px solid var(--border-color); padding:0.2rem 0.6rem; border-radius:4px; font-size:0.75rem;">${q.topic || 'N/A'}</span>
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
            <div class="hint-header"><label><i class="fa-solid fa-lightbulb"></i> Hint / Explanation</label></div>
            <textarea class="q-hint-input" rows="3" disabled>${escapeHtml(q.hint)}</textarea>
            <div class="latex-preview-box math-render mock-math-h" style="margin-top:0.4rem;"></div>
          </div>` : ''}
          <div class="options-container" style="margin-top:1rem;">
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
    downloadMockJsonBtn.addEventListener('click', async () => {
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

  function chr(n) {
    return String.fromCharCode(n);
  }

});

