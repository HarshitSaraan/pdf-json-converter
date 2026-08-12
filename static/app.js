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
  
  const defaultTopicInput = document.getElementById('defaultTopic');
  const defaultSubtopicInput = document.getElementById('defaultSubtopic');
  
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  
  const workspaceSection = document.getElementById('workspaceSection');
  const questionsList = document.getElementById('questionsList');
  const questionCountBadge = document.getElementById('questionCountBadge');
  
  const viewCardsBtn = document.getElementById('viewCardsBtn');
  const viewJsonBtn = document.getElementById('viewJsonBtn');
  const cardsView = document.getElementById('cardsView');
  const jsonView = document.getElementById('jsonView');
  const jsonCodeDisplay = document.getElementById('jsonCodeDisplay');
  
  const searchInput = document.getElementById('searchInput');
  const bulkTopicInput = document.getElementById('bulkTopicInput');
  const applyBulkTopicBtn = document.getElementById('applyBulkTopicBtn');
  
  const addQuestionBtn = document.getElementById('addQuestionBtn');
  const copyJsonBtn = document.getElementById('copyJsonBtn');
  const downloadJsonBtn = document.getElementById('downloadJsonBtn');
  const aiSettingsBtn = document.getElementById('aiSettingsBtn');
  const aiModalOverlay = document.getElementById('aiModalOverlay');
  const closeAiModalBtn = document.getElementById('closeAiModalBtn');
  const cancelAiModalBtn = document.getElementById('cancelAiModalBtn');
  const saveAiModalBtn = document.getElementById('saveAiModalBtn');
  const geminiApiKeyInput = document.getElementById('geminiApiKeyInput');
  const autoGenerateAllHintsBtn = document.getElementById('autoGenerateAllHintsBtn');

  // Load stored Gemini API key
  const savedKey = localStorage.getItem('gemini_api_key') || '';
  if (geminiApiKeyInput) geminiApiKeyInput.value = savedKey;

  // AI Modal handlers
  if (aiSettingsBtn) {
    aiSettingsBtn.addEventListener('click', () => {
      geminiApiKeyInput.value = localStorage.getItem('gemini_api_key') || '';
      aiModalOverlay.classList.remove('hidden');
    });
  }

  const closeAiModal = () => aiModalOverlay.classList.add('hidden');
  if (closeAiModalBtn) closeAiModalBtn.addEventListener('click', closeAiModal);
  if (cancelAiModalBtn) cancelAiModalBtn.addEventListener('click', closeAiModal);

  if (saveAiModalBtn) {
    saveAiModalBtn.addEventListener('click', () => {
      const keyVal = geminiApiKeyInput.value.trim();
      localStorage.setItem('gemini_api_key', keyVal);
      closeAiModal();
      alert(keyVal ? 'Google Gemini API Key saved locally!' : 'API Key cleared.');
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

  // API Base URL resolution (uses relative path on Vercel/http/https, fallback to 127.0.0.1 on file://)
  const API_BASE = (window.location.protocol === 'file:') 
    ? 'http://127.0.0.1:8000' 
    : '';

  let selectedSubject = 'English';

  const subjectEnglishBtn = document.getElementById('subjectEnglishBtn');
  const subjectQuantsBtn = document.getElementById('subjectQuantsBtn');

  if (subjectEnglishBtn && subjectQuantsBtn) {
    subjectEnglishBtn.addEventListener('click', () => {
      selectedSubject = 'English';
      subjectEnglishBtn.classList.add('active');
      subjectQuantsBtn.classList.remove('active');
    });

    subjectQuantsBtn.addEventListener('click', () => {
      selectedSubject = 'Quants';
      subjectQuantsBtn.classList.add('active');
      subjectEnglishBtn.classList.remove('active');
    });
  }

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

    const apiKey = localStorage.getItem('gemini_api_key') || '';
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('subject', selectedSubject);
    if (apiKey) formData.append('apiKey', apiKey);

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
          // Assign subject to questions
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

  // Full Taxonomy Definition for English and Quants
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
    }
  };

  function getTopicsForSubject(subj) {
    const s = subj || selectedSubject;
    return TAXONOMY[s] ? Object.keys(TAXONOMY[s]) : Object.keys(TAXONOMY["English"]);
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
    return [Object.values(subjData)[0][0]];
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
        const matchTopic = q.topic.toLowerCase().includes(filterQuery);
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

      card.innerHTML = `
        <div class="card-header">
          <span class="question-index"><i class="fa-solid fa-circle-question"></i> Question ${qIndex + 1}</span>
          <div class="card-meta-inputs">
            <select class="meta-select q-subject-select" data-qindex="${qIndex}" title="Subject">
              <option value="English" ${q.subject === 'English' ? 'selected' : ''}>English</option>
              <option value="Quants" ${q.subject === 'Quants' ? 'selected' : ''}>Quants</option>
            </select>
            <select class="meta-select q-topic-select" data-qindex="${qIndex}" title="Topic">
              ${topicSelectOptionsHtml}
            </select>
            <select class="meta-select q-subtopic-select" data-qindex="${qIndex}" title="Subtopic">
              ${subtopicSelectOptionsHtml}
            </select>
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
              <button class="ai-gen-btn generate-single-ai-hint-btn" data-qindex="${qIndex}" title="Generate step-by-step explanation using Gemini AI">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Generate AI Hint
              </button>
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

    // Update KaTeX math previews & code view
    renderMathPreviews();
    syncJsonCodeDisplay();
    attachCardEventListeners();
  }

  function renderMathPreviews() {
    questionsData.forEach((q, idx) => {
      const previewEl = document.getElementById(`math_preview_${idx}`);
      if (previewEl) {
        previewEl.innerHTML = q.questionText || '<i>Empty question</i>';
        if (window.renderMathInElement) {
          try {
            renderMathInElement(previewEl, {
              delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false}
              ],
              throwOnError: false
            });
          } catch(e) {}
        }
      }
    });
  }

  function syncJsonCodeDisplay() {
    jsonCodeDisplay.textContent = JSON.stringify(questionsData, null, 2);
  }

  function attachCardEventListeners() {
    // Subject Select Change
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

    // Question Text change
    document.querySelectorAll('.q-text-input').forEach(el => {
      el.addEventListener('input', (e) => {
        const qIndex = parseInt(e.target.dataset.qindex);
        questionsData[qIndex].questionText = e.target.value;
        renderMathPreviews();
        syncJsonCodeDisplay();
      });
    });

    // Hint change
    document.querySelectorAll('.q-hint-input').forEach(el => {
      el.addEventListener('input', (e) => {
        const qIndex = parseInt(e.target.dataset.qindex);
        questionsData[qIndex].hint = e.target.value;
        syncJsonCodeDisplay();
      });
    });

    // Topic & Subtopic Select Change
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

    // Option text change
    document.querySelectorAll('.option-input').forEach(el => {
      el.addEventListener('input', (e) => {
        const qIndex = parseInt(e.target.dataset.qindex);
        const optIndex = parseInt(e.target.dataset.optindex);
        questionsData[qIndex].options[optIndex].text = e.target.value;
        syncJsonCodeDisplay();
      });
    });

    // Correct Option Radio Select
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

    // Single AI Hint Generation Click
    document.querySelectorAll('.generate-single-ai-hint-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const qIndex = parseInt(e.currentTarget.dataset.qindex);
        await generateSingleAiHint(qIndex, e.currentTarget);
      });
    });

    // Delete Question
    document.querySelectorAll('.delete-q-btn').forEach(el => {
      el.addEventListener('click', (e) => {
        const qIndex = parseInt(e.currentTarget.dataset.qindex);
        questionsData.splice(qIndex, 1);
        renderQuestions();
      });
    });

    // Delete Option
    document.querySelectorAll('.delete-opt-btn').forEach(el => {
      el.addEventListener('click', (e) => {
        const qIndex = parseInt(e.currentTarget.dataset.qindex);
        const optIndex = parseInt(e.currentTarget.dataset.optindex);
        questionsData[qIndex].options.splice(optIndex, 1);
        renderQuestions();
      });
    });

    // Add Option
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

    const apiKey = localStorage.getItem('gemini_api_key') || '';
    
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
          subject: q.subject || selectedSubject || 'English'
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

  // View Switcher (Cards vs JSON)
  viewCardsBtn.addEventListener('click', () => {
    viewCardsBtn.classList.add('active');
    viewJsonBtn.classList.remove('active');
    cardsView.classList.remove('hidden');
    jsonView.classList.add('hidden');
  });

  viewJsonBtn.addEventListener('click', () => {
    viewJsonBtn.classList.add('active');
    viewCardsBtn.classList.remove('active');
    jsonView.classList.remove('hidden');
    cardsView.classList.add('hidden');
    syncJsonCodeDisplay();
  });

  // Copy JSON to Clipboard
  copyJsonBtn.addEventListener('click', () => {
    const jsonStr = JSON.stringify(questionsData, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      const origText = copyJsonBtn.innerHTML;
      copyJsonBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
      setTimeout(() => copyJsonBtn.innerHTML = origText, 2000);
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
  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    themeToggleBtn.innerHTML = isLight ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  });

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

});

