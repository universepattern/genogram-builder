// Genogram Studio App Logic

// App State
const state = {
  people: [],
  relationships: [],
  children: [],
  selectedId: null,
  selectedType: null, // 'person' or 'relationship'
  isColorMode: false,
  gridSnap: true,
  zoom: 1.0,
  panX: 0,
  panY: 0,
  isPanning: false,
  draggedNode: null,
  dragOffset: { x: 0, y: 0 }
};

// DOM Elements
const svg = document.getElementById("genogramSvg");
const viewportGroup = document.getElementById("viewportGroup");
const peopleGroup = document.getElementById("peopleGroup");
const relationshipsGroup = document.getElementById("relationshipsGroup");
const childrenGroup = document.getElementById("childrenGroup");
const canvasContainer = document.getElementById("canvasContainer");
const canvasOverlay = document.getElementById("canvasOverlay");

// Form Elements
const addPersonForm = document.getElementById("addPersonForm");
const addRelationshipForm = document.getElementById("addRelationshipForm");
const addChildForm = document.getElementById("addChildForm");
const relPartnerA = document.getElementById("relPartnerA");
const relPartnerB = document.getElementById("relPartnerB");
const childSelect = document.getElementById("childSelect");
const parentLinkSelect = document.getElementById("parentLinkSelect");
const selectionContent = document.getElementById("selectionContent");
const selectionStatus = document.getElementById("selectionStatus");
const peopleCountBadge = document.getElementById("peopleCountBadge");

// Tool Controls
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const zoomResetBtn = document.getElementById("zoomResetBtn");
const fitViewBtn = document.getElementById("fitViewBtn");
const snapGridBtn = document.getElementById("snapGridBtn");
const autoLayoutBtn = document.getElementById("autoLayoutBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const styleBwBtn = document.getElementById("styleBwBtn");
const styleColBtn = document.getElementById("styleColBtn");
const templateSelect = document.getElementById("templateSelect");

// Export Buttons
const exportPngBtn = document.getElementById("exportPngBtn");
const exportJpegBtn = document.getElementById("exportJpegBtn");
const exportSvgBtn = document.getElementById("exportSvgBtn");
const exportPdfBtn = document.getElementById("exportPdfBtn");
const exportWordBtn = document.getElementById("exportWordBtn");

// Trait Info
const ALL_TRAITS = [
  { id: "heart_disease", name: "Heart Disease" },
  { id: "diabetes", name: "Diabetes" },
  { id: "hypertension", name: "Hypertension" },
  { id: "cancer", name: "Cancer" },
  { id: "depression", name: "Depression / Anxiety" },
  { id: "substance_abuse", name: "Substance Abuse" },
  { id: "asthma", name: "Asthma" },
  { id: "hemophilia", name: "Hemophilia (Affected)" },
  { id: "hemophilia_carrier", name: "Hemophilia (Carrier)" },
  { id: "prediabetic", name: "Prediabetic" }
];

// -----------------------------------------------
// LEGEND: Dynamic mode-aware legend builder
// -----------------------------------------------
function updateLegend() {
  const colorMode = state.isColorMode;

  // --- 1. Medical Conditions legend row ---
  const medRow = document.querySelector('.legend-bar-section:nth-child(3) .legend-row');
  if (medRow) {
    // Trait definitions: id, label, color (for Color mode), SVG pattern (for B&W)
    const traits = [
      { id: 'heart_disease',   label: 'Heart',      color: '#d9625d', bwLines: 'horizontal' },
      { id: 'diabetes',        label: 'Diabetes',   color: '#cfa140', bwLines: 'vertical'   },
      { id: 'hypertension',    label: 'Hypertension', color: '#4da5bc', bwLines: 'diagonal'  },
      { id: 'cancer',          label: 'Cancer',     color: '#8b6db8', bwLines: 'cross'      },
      { id: 'depression',      label: 'Depression', color: '#66ad75', bwLines: 'dots'       },
      { id: 'substance_abuse', label: 'Substance',  color: '#a35a58', bwLines: 'diagback'   },
      { id: 'asthma',          label: 'Asthma',     color: '#d6874b', bwLines: 'sparse'     },
      { id: 'prediabetic',     label: 'Prediabetic',color: '#e3c16f', bwLines: 'zigzag'     },
    ];

    // Inline SVG patterns for B&W legend swatches
    function bwSwatch(type) {
      const s = 16; // swatch size
      let pattern = '';
      if (type === 'horizontal') {
        pattern = `<line x1="0" y1="4"  x2="${s}" y2="4"  stroke="#000" stroke-width="1.2"/>
                   <line x1="0" y1="9"  x2="${s}" y2="9"  stroke="#000" stroke-width="1.2"/>
                   <line x1="0" y1="14" x2="${s}" y2="14" stroke="#000" stroke-width="1.2"/>`;
      } else if (type === 'vertical') {
        pattern = `<line x1="4"  y1="0" x2="4"  y2="${s}" stroke="#000" stroke-width="1.2"/>
                   <line x1="9"  y1="0" x2="9"  y2="${s}" stroke="#000" stroke-width="1.2"/>
                   <line x1="14" y1="0" x2="14" y2="${s}" stroke="#000" stroke-width="1.2"/>`;
      } else if (type === 'diagonal') {
        pattern = `<line x1="0" y1="${s}" x2="${s}" y2="0" stroke="#000" stroke-width="1.2"/>
                   <line x1="-4" y1="${s}" x2="${s/2}" y2="0" stroke="#000" stroke-width="1.2"/>
                   <line x1="${s/2}" y1="${s}" x2="${s+4}" y2="0" stroke="#000" stroke-width="1.2"/>`;
      } else if (type === 'cross') {
        pattern = `<line x1="0" y1="${s}" x2="${s}" y2="0" stroke="#000" stroke-width="1.2"/>
                   <line x1="0" y1="0" x2="${s}" y2="${s}" stroke="#000" stroke-width="1.2"/>`;
      } else if (type === 'dots') {
        pattern = `<circle cx="4" cy="4" r="1.5" fill="#000"/>
                   <circle cx="12" cy="4" r="1.5" fill="#000"/>
                   <circle cx="4" cy="12" r="1.5" fill="#000"/>
                   <circle cx="12" cy="12" r="1.5" fill="#000"/>
                   <circle cx="8" cy="8" r="1.5" fill="#000"/>`;
      } else if (type === 'diagback') {
        pattern = `<line x1="0" y1="0" x2="${s}" y2="${s}" stroke="#000" stroke-width="1.2"/>
                   <line x1="-4" y1="0" x2="${s/2}" y2="${s}" stroke="#000" stroke-width="1.2"/>
                   <line x1="${s/2}" y1="0" x2="${s+4}" y2="${s}" stroke="#000" stroke-width="1.2"/>`;
      } else if (type === 'sparse') {
        pattern = `<line x1="0" y1="${s*0.6}" x2="${s}" y2="${s*0.6}" stroke="#000" stroke-width="1.2"/>`;
      } else if (type === 'zigzag') {
        pattern = `<polyline points="0,12 4,6 8,12 12,6 16,12" fill="none" stroke="#000" stroke-width="1.2"/>`;
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"
                style="border:1px solid #bbb; border-radius:2px; display:inline-block; vertical-align:middle; background:#fff; flex-shrink:0;"
                overflow="hidden">
                ${pattern}
              </svg>`;
    }

    medRow.innerHTML = traits.map(t => {
      const swatch = colorMode
        ? `<span style="width:16px;height:16px;border-radius:3px;background:${t.color};border:1px solid rgba(0,0,0,0.15);display:inline-block;vertical-align:middle;flex-shrink:0;"></span>`
        : bwSwatch(t.bwLines);
      return `<span style="display:flex;align-items:center;gap:5px;font-size:11.5px;">${swatch} ${t.label}</span>`;
    }).join('');
  }

  // --- 2. Gender shape symbols in legend: tint in color mode ---
  const symMale   = document.querySelector('.sym-male');
  const symFemale = document.querySelector('.sym-female');
  const symOther  = document.querySelector('.sym-other');
  const symPreg   = document.querySelector('.sym-pregnancy');

  if (symMale) {
    symMale.style.backgroundColor   = colorMode ? '#eaf1f7' : '';
    symMale.style.borderColor       = colorMode ? '#5681a8' : '';
  }
  if (symFemale) {
    symFemale.style.backgroundColor = colorMode ? '#f9ebeb' : '';
    symFemale.style.borderColor     = colorMode ? '#c97171' : '';
  }
  if (symOther) {
    symOther.style.backgroundColor  = colorMode ? '#faf5eb' : '';
    symOther.style.borderColor      = colorMode ? '#c89c56' : '';
  }
  if (symPreg) {
    // Triangle SVG — swap fill/stroke color
    symPreg.style.backgroundImage = colorMode
      ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><polygon points="10,2 18,17 2,17" fill="%23ebf2eb" stroke="%23789078" stroke-width="2"/></svg>')`
      : `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><polygon points="10,2 18,17 2,17" fill="white" stroke="black" stroke-width="2"/></svg>')`;
  }
}

// Initialize Application
function init() {
  setupEventListeners();
  updateFormDropdowns();
  render();
  
  // Set default view transform
  resetView();
  
  // Set initial legend state
  updateLegend();
}

// ----------------------------------------------------
// STATE MANAGEMENT & DATA OPERATIONS
// ----------------------------------------------------

function addPerson(person) {
  state.people.push(person);
  updateFormDropdowns();
  peopleCountBadge.textContent = state.people.length;
  hideOverlayIfNeeded();
  render();
}

function updatePerson(id, updatedFields) {
  const person = state.people.find(p => p.id === id);
  if (person) {
    Object.assign(person, updatedFields);
    updateFormDropdowns();
    render();
    if (state.selectedId === id) {
      showSelectionDetails();
    }
  }
}

function deletePerson(id) {
  // Remove person
  state.people = state.people.filter(p => p.id !== id);
  
  // Clean up relationships
  state.relationships = state.relationships.filter(r => r.personA !== id && r.personB !== id);
  
  // Clean up children links where this person is a child or single parent
  state.children = state.children.filter(c => c.childId !== id && c.parentId !== id);
  
  if (state.selectedId === id) {
    clearSelection();
  }
  
  updateFormDropdowns();
  peopleCountBadge.textContent = state.people.length;
  hideOverlayIfNeeded();
  runAutoLayout();
}

function addNewPersonWithGender(gender) {
  let genderName = "Person";
  if (gender === 'M') genderName = "John Doe";
  else if (gender === 'F') genderName = "Jane Doe";
  else if (gender === 'P') genderName = "Pregnancy";
  else if (gender === 'X') genderName = "Other";
  
  const count = state.people.filter(p => p.gender === gender).length + 1;
  const name = `${genderName} ${count}`;
  
  const containerRect = canvasContainer.getBoundingClientRect();
  const x = -state.panX / state.zoom + containerRect.width / (2 * state.zoom);
  const y = -state.panY / state.zoom + containerRect.height / (2 * state.zoom);
  
  const offset = (state.people.length % 5) * 20;
  const freePos = findFreePosition(x + offset, y + offset);

  const newPerson = {
    id: "person_" + Date.now() + "_" + Math.floor(Math.random() * 100),
    name,
    gender,
    age: "",
    birthYear: "",
    deathYear: "",
    isDeceased: false,
    isProband: false,
    isAdopted: false,
    traits: [],
    x: freePos.x,
    y: freePos.y
  };

  addPerson(newPerson);
  selectElement('person', newPerson.id);
  
  // Auto-focus and highlight the edit name text for immediate editing
  setTimeout(() => {
    const editNameInput = document.getElementById("editName");
    if (editNameInput) {
      editNameInput.focus();
      editNameInput.select();
    }
  }, 50);
}

function addRelationship(rel) {
  // Prevent duplicate partnership
  const exists = state.relationships.some(
    r => (r.personA === rel.personA && r.personB === rel.personB) ||
         (r.personA === rel.personB && r.personB === rel.personA)
  );
  if (exists) {
    alert("This relationship already exists!");
    return;
  }
  
  state.relationships.push(rel);
  updateFormDropdowns();
  runAutoLayout();
}

function deleteRelationship(id) {
  state.relationships = state.relationships.filter(r => r.id !== id);
  // Clean up children links that belong to this relationship
  state.children = state.children.filter(c => c.parentType !== 'relationship' || c.parentId !== id);
  
  if (state.selectedId === id) {
    clearSelection();
  }
  updateFormDropdowns();
  runAutoLayout();
}

function addChild(childLink) {
  // Check if link exists
  const exists = state.children.some(
    c => c.childId === childLink.childId && c.parentId === childLink.parentId
  );
  if (exists) {
    alert("This child link is already created!");
    return;
  }
  
  state.children.push(childLink);
  runAutoLayout();
}

function deleteChildLink(childId, parentId) {
  state.children = state.children.filter(c => !(c.childId === childId && c.parentId === parentId));
  runAutoLayout();
}

function loadTemplate(templateName) {
  if (templateName === 'blank') {
    state.people = [];
    state.relationships = [];
    state.children = [];
    clearSelection();
    updateFormDropdowns();
    peopleCountBadge.textContent = "0";
    hideOverlayIfNeeded();
    render();
    resetView();
    return;
  }

  const t = GENOGRAM_TEMPLATES[templateName];
  if (!t) return;
  
  state.people = JSON.parse(JSON.stringify(t.people));
  state.relationships = JSON.parse(JSON.stringify(t.relationships));
  state.children = JSON.parse(JSON.stringify(t.children));
  
  clearSelection();
  updateFormDropdowns();
  peopleCountBadge.textContent = state.people.length;
  hideOverlayIfNeeded();
  render();
  fitToScreen();
}

function clearAll() {
  if (confirm("Are you sure you want to clear the workspace? This will delete all members and relationships.")) {
    state.people = [];
    state.relationships = [];
    state.children = [];
    clearSelection();
    updateFormDropdowns();
    peopleCountBadge.textContent = "0";
    hideOverlayIfNeeded();
    render();
    resetView();
  }
}

function hideOverlayIfNeeded() {
  if (state.people.length > 0) {
    canvasOverlay.classList.add("hidden");
  } else {
    canvasOverlay.classList.remove("hidden");
  }
}

// ----------------------------------------------------
// UI EVENT LISTENERS & FORM BINDINGS
// ----------------------------------------------------

function setupEventListeners() {
  // Sidebar Accordion Headers - skip no-collapse sections
  document.querySelectorAll(".section-header").forEach(header => {
    const section = header.parentElement;
    if (section.classList.contains("no-collapse")) return;
    header.addEventListener("click", () => {
      section.classList.toggle("active");
    });
  });

  // Style Toggles
  styleBwBtn.addEventListener("click", () => {
    state.isColorMode = false;
    styleBwBtn.classList.add("active");
    styleColBtn.classList.remove("active");
    svg.classList.add("bw-mode");
    render();
    updateLegend();
  });

  styleColBtn.addEventListener("click", () => {
    state.isColorMode = true;
    styleBwBtn.classList.remove("active");
    styleColBtn.classList.add("active");
    svg.classList.remove("bw-mode");
    render();
    updateLegend();
  });

  // Export Dropdown Trigger
  const exportDropdownBtn = document.getElementById("exportDropdownBtn");
  const exportMenu = document.getElementById("exportMenu");
  const helpDropdownBtn = document.getElementById("helpDropdownBtn");
  const helpMenu = document.getElementById("helpMenu");

  if (exportDropdownBtn && exportMenu) {
    exportDropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      exportMenu.classList.toggle("show");
      if (helpMenu) helpMenu.classList.remove("show");
    });
  }

  if (helpDropdownBtn && helpMenu) {
    helpDropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      helpMenu.classList.toggle("show");
      if (exportMenu) exportMenu.classList.remove("show");
    });
  }

  // Close menus on click outside
  window.addEventListener("click", () => {
    if (exportMenu) exportMenu.classList.remove("show");
    if (helpMenu) helpMenu.classList.remove("show");
  });

  // Floating Legend Collapsible Trigger
  const legendToggle = document.getElementById("legendToggle");
  const floatingLegend = document.getElementById("floatingLegend");
  const legendToggleIcon = document.getElementById("legendToggleIcon");
  if (legendToggle && floatingLegend) {
    legendToggle.addEventListener("click", () => {
      floatingLegend.classList.toggle("collapsed");
      if (floatingLegend.classList.contains("collapsed")) {
        legendToggleIcon.textContent = "▲";
      } else {
        legendToggleIcon.textContent = "▼";
      }
    });
  }

  // Template Selector
  if (templateSelect) {
    templateSelect.addEventListener("change", (e) => {
      loadTemplate(e.target.value);
    });
  }

  // Add Person Form Submit
  addPersonForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("pName").value;
    const gender = document.getElementById("pGender").value;
    const age = document.getElementById("pAge").value;
    const birthYear = document.getElementById("pBirth").value;
    const deathYear = document.getElementById("pDeath").value;
    const isDeceased = document.getElementById("pDeceased").checked;
    const isProband = document.getElementById("pProband").checked;
    const isAdopted = document.getElementById("pAdopted").checked;
    
    // Read traits checkboxes
    const traits = [];
    document.querySelectorAll(".trait-cb:checked").forEach(cb => {
      traits.push(cb.value);
    });

    const selected = state.people.find(p => p.id === state.selectedId);
    const relation = document.getElementById("pRelation") ? document.getElementById("pRelation").value : "none";
    
    let spawnX, spawnY;
    let finalGender = gender;
    
    if (selected && relation !== "none") {
      if (relation === "father") {
        spawnX = selected.x - 80;
        spawnY = selected.y - 120;
        finalGender = "M";
      } else if (relation === "mother") {
        spawnX = selected.x + 80;
        spawnY = selected.y - 120;
        finalGender = "F";
      } else if (relation === "partner") {
        spawnX = selected.x + 160;
        spawnY = selected.y;
      } else if (relation === "child") {
        spawnX = selected.x;
        spawnY = selected.y + 120;
      }
    } else {
      const containerRect = canvasContainer.getBoundingClientRect();
      const x = -state.panX / state.zoom + containerRect.width / (2 * state.zoom);
      const y = -state.panY / state.zoom + containerRect.height / (2 * state.zoom);
      
      const offset = (state.people.length % 5) * 20;
      spawnX = x + offset;
      spawnY = y + offset;
    }
    
    const freePos = findFreePosition(spawnX, spawnY);
    
    const newPerson = {
      id: "person_" + Date.now() + "_" + Math.floor(Math.random() * 100),
      name,
      gender: finalGender,
      age,
      birthYear,
      deathYear,
      isDeceased,
      isProband,
      isAdopted,
      traits,
      x: freePos.x,
      y: freePos.y
    };
    
    addPerson(newPerson);
    selectElement('person', newPerson.id);
    
    // Auto-focus and highlight the edit name text for immediate editing
    setTimeout(() => {
      const editNameInput = document.getElementById("editName");
      if (editNameInput) {
        editNameInput.focus();
        editNameInput.select();
      }
    }, 50);
    
    // Auto-linking rules
    if (selected && relation !== "none") {
      if (relation === "father") {
        const motherLink = state.children.find(link => 
          link.childId === selected.id && 
          link.parentType === 'individual' && 
          state.people.some(p => p.id === link.parentId && p.gender === 'F')
        );
        if (motherLink) {
          const relId = "rel_" + Date.now();
          const newRel = {
            id: relId,
            type: 'married',
            personA: newPerson.id,
            personB: motherLink.parentId
          };
          addRelationship(newRel);
          
          state.children = state.children.filter(link => 
            !(link.childId === selected.id && link.parentId === motherLink.parentId)
          );
          
          const newChildLink = {
            childId: selected.id,
            parentType: 'relationship',
            parentId: relId
          };
          addChild(newChildLink);
        } else {
          const newChildLink = {
            childId: selected.id,
            parentType: 'individual',
            parentId: newPerson.id
          };
          addChild(newChildLink);
        }
      } else if (relation === "mother") {
        const fatherLink = state.children.find(link => 
          link.childId === selected.id && 
          link.parentType === 'individual' && 
          state.people.some(p => p.id === link.parentId && p.gender === 'M')
        );
        if (fatherLink) {
          const relId = "rel_" + Date.now();
          const newRel = {
            id: relId,
            type: 'married',
            personA: fatherLink.parentId,
            personB: newPerson.id
          };
          addRelationship(newRel);
          
          state.children = state.children.filter(link => 
            !(link.childId === selected.id && link.parentId === fatherLink.parentId)
          );
          
          const newChildLink = {
            childId: selected.id,
            parentType: 'relationship',
            parentId: relId
          };
          addChild(newChildLink);
        } else {
          const newChildLink = {
            childId: selected.id,
            parentType: 'individual',
            parentId: newPerson.id
          };
          addChild(newChildLink);
        }
      } else if (relation === "partner") {
        const relId = "rel_" + Date.now();
        const newRel = {
          id: relId,
          type: 'married',
          personA: selected.id,
          personB: newPerson.id
        };
        addRelationship(newRel);
      } else if (relation === "child") {
        const parentRels = state.relationships.filter(r => r.personA === selected.id || r.personB === selected.id);
        if (parentRels.length === 1) {
          const R = parentRels[0];
          const newChildLink = {
            childId: newPerson.id,
            parentType: 'relationship',
            parentId: R.id
          };
          addChild(newChildLink);
        } else {
          const newChildLink = {
            childId: newPerson.id,
            parentType: 'individual',
            parentId: selected.id
          };
          addChild(newChildLink);
        }
      }
    }

    // Reset Form
    addPersonForm.reset();
    document.querySelectorAll(".trait-row").forEach(row => row.classList.remove("checked"));
    
    // Hide and reset relation dropdown block
    const relationFieldContainer = document.getElementById("relationFieldContainer");
    if (relationFieldContainer) {
      relationFieldContainer.style.display = "none";
    }
    const pRelation = document.getElementById("pRelation");
    if (pRelation) {
      pRelation.value = "none";
    }
  });

  // Custom Trait Row Checkboxes Visual Toggles (Add form)
  document.querySelectorAll(".trait-row input, .trait-cb").forEach(cb => {
    cb.addEventListener("change", (e) => {
      const row = e.target.closest(".trait-row");
      if (row) {
        row.classList.toggle("checked", e.target.checked);
      }
    });
  });

  // Show/hide Death Year based on Deceased checkbox (Add form)
  const pDeceased = document.getElementById("pDeceased");
  const pDeathYearField = document.getElementById("pDeathYearField");
  if (pDeceased && pDeathYearField) {
    pDeceased.addEventListener("change", () => {
      pDeathYearField.style.display = pDeceased.checked ? "block" : "none";
      if (!pDeceased.checked) {
        document.getElementById("pDeath").value = "";
      }
    });
  }

  // Add Partnership Link Form Submit
  addRelationshipForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const pA = relPartnerA.value;
    const pB = relPartnerB.value;
    const type = document.getElementById("relType").value;

    if (pA === pB) {
      alert("A person cannot have a relationship with themselves!");
      return;
    }

    const newRel = {
      id: "rel_" + Date.now(),
      type,
      personA: pA,
      personB: pB
    };

    addRelationship(newRel);
  });

  // Add Child Form Submit
  addChildForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const childId = childSelect.value;
    const parentVal = parentLinkSelect.value; // format: 'rel_id' or 'person_id'
    
    let parentType = 'individual';
    let parentId = parentVal;
    
    if (parentVal.startsWith('rel_')) {
      parentType = 'relationship';
    }

    const childLink = {
      childId,
      parentType,
      parentId
    };

    addChild(childLink);
  });

  // Canvas View Controls
  zoomInBtn.addEventListener("click", () => adjustZoom(1.15));
  zoomOutBtn.addEventListener("click", () => adjustZoom(0.85));
  zoomResetBtn.addEventListener("click", resetView);
  fitViewBtn.addEventListener("click", fitToScreen);
  snapGridBtn.addEventListener("click", () => {
    state.gridSnap = !state.gridSnap;
    snapGridBtn.classList.toggle("active", state.gridSnap);
  });
  autoLayoutBtn.addEventListener("click", runAutoLayout);
  clearAllBtn.addEventListener("click", clearAll);

  // SVG Pan & Zoom Interactive Controls
  svg.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  svg.addEventListener("wheel", onWheel, { passive: false });
  svg.addEventListener("touchstart", onTouchStart, { passive: false });
  svg.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd);
  window.addEventListener("touchcancel", onTouchEnd);

  // Mobile View Toggle FAB event handler
  const mobileToggleBtn = document.getElementById("mobileToggleBtn");
  const mainLayout = document.querySelector(".main-layout");
  if (mobileToggleBtn && mainLayout) {
    mobileToggleBtn.addEventListener("click", () => {
      mainLayout.classList.toggle("show-sidebar-mobile");
      if (mainLayout.classList.contains("show-sidebar-mobile")) {
        mobileToggleBtn.querySelector(".icon").textContent = "👁️";
        mobileToggleBtn.querySelector(".label").textContent = "View Canvas";
      } else {
        mobileToggleBtn.querySelector(".icon").textContent = "✍️";
        mobileToggleBtn.querySelector(".label").textContent = "Edit Data";
      }
    });
  }

  // Sidebar Tabs event listeners
  const tabBuildBtn = document.getElementById("tabBuildBtn");
  const tabEditBtn = document.getElementById("tabEditBtn");
  if (tabBuildBtn && tabEditBtn) {
    tabBuildBtn.addEventListener("click", () => switchTab('build'));
    tabEditBtn.addEventListener("click", () => switchTab('edit'));
  }

  // Exporters hookups (mapped to header dropdown menu buttons)
  document.getElementById("exportPngBtn").addEventListener("click", () => Exporter.exportImage(svg, state.people, state.isColorMode, 'png'));
  document.getElementById("exportJpegBtn").addEventListener("click", () => Exporter.exportImage(svg, state.people, state.isColorMode, 'jpeg'));
  document.getElementById("exportSvgBtn").addEventListener("click", () => Exporter.exportSvg(svg, state.people, state.isColorMode));
  document.getElementById("exportPdfBtn").addEventListener("click", () => Exporter.exportPdf(svg, state.people, state.isColorMode));
  document.getElementById("exportWordBtn").addEventListener("click", () => Exporter.exportWord(svg, state.people, state.isColorMode));

  // Legend-to-canvas spawning event listeners
  document.querySelectorAll(".clickable-legend-item").forEach(item => {
    item.addEventListener("click", () => {
      const gender = item.getAttribute("data-gender");
      addNewPersonWithGender(gender);
    });
  });
}

// Update option lists inside sidebar dropdowns
function updateFormDropdowns() {
  // Save selected values
  const prevA = relPartnerA.value;
  const prevB = relPartnerB.value;
  const prevChild = childSelect.value;
  const prevParent = parentLinkSelect.value;

  // Clear
  relPartnerA.innerHTML = '<option value="" disabled selected>Select person...</option>';
  relPartnerB.innerHTML = '<option value="" disabled selected>Select person...</option>';
  childSelect.innerHTML = '<option value="" disabled selected>Select child...</option>';
  parentLinkSelect.innerHTML = '<option value="" disabled selected>Select parents...</option>';

  // Sort people alphabetically for ease
  const sortedPeople = [...state.people].sort((a, b) => a.name.localeCompare(b.name));

  sortedPeople.forEach(p => {
    const opt = `<option value="${p.id}">${p.name} (${p.gender})</option>`;
    relPartnerA.insertAdjacentHTML('beforeend', opt);
    relPartnerB.insertAdjacentHTML('beforeend', opt);
    childSelect.insertAdjacentHTML('beforeend', opt);
    
    // Add individual parent options
    const optParentIndiv = `<option value="${p.id}">Single Parent: ${p.name}</option>`;
    parentLinkSelect.insertAdjacentHTML('beforeend', optParentIndiv);
  });

  // Add partnership options to parents selector
  state.relationships.forEach(r => {
    const partnerA = state.people.find(p => p.id === r.personA);
    const partnerB = state.people.find(p => p.id === r.personB);
    if (partnerA && partnerB) {
      const label = `${partnerA.name} & ${partnerB.name} (${r.type})`;
      const optRel = `<option value="${r.id}">Partners: ${label}</option>`;
      parentLinkSelect.insertAdjacentHTML('beforeend', optRel);
    }
  });

  // Restore selections if still valid
  if (state.people.some(p => p.id === prevA)) relPartnerA.value = prevA;
  if (state.people.some(p => p.id === prevB)) relPartnerB.value = prevB;
  if (state.people.some(p => p.id === prevChild)) childSelect.value = prevChild;
  
  const parentExists = state.relationships.some(r => r.id === prevParent) || state.people.some(p => p.id === prevParent);
  if (parentExists) parentLinkSelect.value = prevParent;
}

// ----------------------------------------------------
// ZOOM & PAN MECHANICS
// ----------------------------------------------------

function applyViewTransform() {
  viewportGroup.setAttribute("transform", `translate(${state.panX}, ${state.panY}) scale(${state.zoom})`);
  document.getElementById("zoomLevelDisplay").textContent = `${Math.round(state.zoom * 100)}%`;
}

function adjustZoom(factor) {
  const containerRect = canvasContainer.getBoundingClientRect();
  const centerX = containerRect.width / 2;
  const centerY = containerRect.height / 2;
  
  // Zoom towards center
  const newZoom = Math.min(Math.max(state.zoom * factor, 0.15), 4.0);
  
  state.panX = centerX - (centerX - state.panX) * (newZoom / state.zoom);
  state.panY = centerY - (centerY - state.panY) * (newZoom / state.zoom);
  state.zoom = newZoom;
  
  applyViewTransform();
}

function resetView() {
  state.zoom = 1.0;
  state.panX = 0;
  state.panY = 0;
  applyViewTransform();
}

function fitToScreen() {
  if (state.people.length === 0) return;
  
  const bbox = Exporter.getBoundingBox(state.people);
  const containerRect = canvasContainer.getBoundingClientRect();
  
  // Calculate best fit scale
  const scaleX = (containerRect.width - 60) / bbox.width;
  const scaleY = (containerRect.height - 60) / bbox.height;
  const newZoom = Math.min(Math.min(scaleX, scaleY), 2.0); // max scale 2x
  
  // Center bbox
  const diagramCenterX = bbox.x + bbox.width / 2;
  const diagramCenterY = bbox.y + bbox.height / 2;
  
  state.zoom = newZoom;
  state.panX = containerRect.width / 2 - diagramCenterX * newZoom;
  state.panY = containerRect.height / 2 - diagramCenterY * newZoom;
  
  applyViewTransform();
}

// ---- MOUSE / DRAG / PAN / ZOOM ----
// Uses requestAnimationFrame for smooth node dragging.
// State guards prevent ghost panning after pointer leaves window.

let _rafPending = false; // RAF guard — only one frame queued at a time

function onMouseDown(e) {
  // Only react to primary mouse button (left click)
  if (e.button !== 0) return;

  const nodeEl = e.target.closest(".genogram-node");
  if (nodeEl) {
    e.preventDefault();
    const id = nodeEl.getAttribute("data-id");
    selectElement('person', id);

    const person = state.people.find(p => p.id === id);
    if (person) {
      state.draggedNode = person;
      const pt = getSvgCoords(e);
      state.dragOffset.x = pt.x - person.x;
      state.dragOffset.y = pt.y - person.y;
    }
    return;
  }

  const lineEl = e.target.closest(".genogram-line, .genogram-line-hitbox");
  if (lineEl) {
    const groupEl = lineEl.closest("g");
    if (groupEl) {
      const id = groupEl.getAttribute("data-id");
      if (id) {
        selectElement('relationship', id);
        return;
      }
    }
  }

  // Click on empty canvas — clear selection and start panning
  e.preventDefault();
  clearSelection();
  state.isPanning = true;
  state.dragOffset.x = e.clientX - state.panX;
  state.dragOffset.y = e.clientY - state.panY;
}

function onMouseMove(e) {
  if (state.draggedNode) {
    e.preventDefault();
    const pt = getSvgCoords(e);
    let newX = pt.x - state.dragOffset.x;
    let newY = pt.y - state.dragOffset.y;

    if (state.gridSnap) {
      newX = Math.round(newX / 20) * 20;
      newY = Math.round(newY / 20) * 20;
    }

    state.draggedNode.x = newX;
    state.draggedNode.y = newY;

    // Throttle renders via RAF — prevents jank on fast moves
    if (!_rafPending) {
      _rafPending = true;
      requestAnimationFrame(() => {
        render();
        _rafPending = false;
      });
    }
    return;
  }

  if (state.isPanning) {
    e.preventDefault();
    state.panX = e.clientX - state.dragOffset.x;
    state.panY = e.clientY - state.dragOffset.y;
    applyViewTransform();
  }
}

function onMouseUp(e) {
  state.draggedNode = null;
  state.isPanning = false;
  _rafPending = false;
}

function onWheel(e) {
  e.preventDefault();
  
  // Zoom towards mouse cursor
  const rect = svg.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
  const newZoom = Math.min(Math.max(state.zoom * zoomFactor, 0.15), 4.0);
  
  state.panX = mouseX - (mouseX - state.panX) * (newZoom / state.zoom);
  state.panY = mouseY - (mouseY - state.panY) * (newZoom / state.zoom);
  state.zoom = newZoom;
  
  applyViewTransform();
}

// Helper: Translate window page coordinates to SVG local user space coordinates
function getSvgCoords(e) {
  const rect = svg.getBoundingClientRect();
  const clientX = e.clientX - rect.left;
  const clientY = e.clientY - rect.top;
  
  return {
    x: (clientX - state.panX) / state.zoom,
    y: (clientY - state.panY) / state.zoom
  };
}

function getTouchCoords(e) {
  if (!e.touches || e.touches.length === 0) return { x: 0, y: 0 };
  const touch = e.touches[0];
  const rect = svg.getBoundingClientRect();
  const clientX = touch.clientX - rect.left;
  const clientY = touch.clientY - rect.top;
  
  return {
    x: (clientX - state.panX) / state.zoom,
    y: (clientY - state.panY) / state.zoom
  };
}

function findFreePosition(startX, startY) {
  let targetX = Math.round(startX / 20) * 20;
  let targetY = Math.round(startY / 20) * 20;
  
  const minDistance = 70;
  const minDistanceSq = minDistance * minDistance;
  
  function isOverlapping(x, y) {
    for (const person of state.people) {
      const dx = person.x - x;
      const dy = person.y - y;
      if (dx * dx + dy * dy < minDistanceSq) {
        return true;
      }
    }
    return false;
  }
  
  if (!isOverlapping(targetX, targetY)) {
    return { x: targetX, y: targetY };
  }
  
  const step = 20;
  const maxRings = 50;
  
  for (let ring = 1; ring <= maxRings; ring++) {
    // Check top and bottom horizontal segments
    for (let dx = -ring; dx <= ring; dx++) {
      for (const dy of [-ring, ring]) {
        const testX = targetX + dx * step;
        const testY = targetY + dy * step;
        if (!isOverlapping(testX, testY)) {
          return { x: testX, y: testY };
        }
      }
    }
    // Check left and right vertical segments
    for (let dy = -ring + 1; dy <= ring - 1; dy++) {
      for (const dx of [-ring, ring]) {
        const testX = targetX + dx * step;
        const testY = targetY + dy * step;
        if (!isOverlapping(testX, testY)) {
          return { x: testX, y: testY };
        }
      }
    }
  }
  
  return { x: targetX, y: targetY };
}

function onTouchStart(e) {
  if (e.touches.length === 2) {
    e.preventDefault();
    state.isPanning = false;
    state.draggedNode = null;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    state.lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
    return;
  }

  const nodeEl = e.target.closest(".genogram-node");
  if (nodeEl) {
    e.preventDefault();
    const id = nodeEl.getAttribute("data-id");
    selectElement('person', id);
    
    const person = state.people.find(p => p.id === id);
    if (person) {
      state.draggedNode = person;
      
      const pt = getTouchCoords(e);
      state.dragOffset.x = pt.x - person.x;
      state.dragOffset.y = pt.y - person.y;
    }
    return;
  }
  
  const lineEl = e.target.closest(".genogram-line, .genogram-line-hitbox");
  if (lineEl) {
    e.preventDefault();
    const groupEl = lineEl.closest("g");
    if (groupEl) {
      const id = groupEl.getAttribute("data-id");
      if (id) {
        selectElement('relationship', id);
        return;
      }
    }
  }

  // Not touching node or line -> pan canvas
  e.preventDefault();
  clearSelection();
  
  state.isPanning = true;
  if (e.touches && e.touches.length > 0) {
    const touch = e.touches[0];
    state.dragOffset.x = touch.clientX - state.panX;
    state.dragOffset.y = touch.clientY - state.panY;
  }
}

function onTouchMove(e) {
  if (e.touches.length === 2 && state.lastTouchDistance) {
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const factor = distance / state.lastTouchDistance;
    
    const touch0 = e.touches[0];
    const touch1 = e.touches[1];
    const rect = svg.getBoundingClientRect();
    const midX = ((touch0.clientX + touch1.clientX) / 2) - rect.left;
    const midY = ((touch0.clientY + touch1.clientY) / 2) - rect.top;
    
    const newZoom = Math.min(Math.max(state.zoom * factor, 0.15), 4.0);
    
    state.panX = midX - (midX - state.panX) * (newZoom / state.zoom);
    state.panY = midY - (midY - state.panY) * (newZoom / state.zoom);
    state.zoom = newZoom;
    
    state.lastTouchDistance = distance;
    applyViewTransform();
    return;
  }

  if (state.draggedNode) {
    e.preventDefault();
    const pt = getTouchCoords(e);
    let newX = pt.x - state.dragOffset.x;
    let newY = pt.y - state.dragOffset.y;
    
    if (state.gridSnap) {
      newX = Math.round(newX / 20) * 20;
      newY = Math.round(newY / 20) * 20;
    }
    
    state.draggedNode.x = newX;
    state.draggedNode.y = newY;
    
    render();
  } else if (state.isPanning) {
    e.preventDefault();
    if (e.touches && e.touches.length > 0) {
      const touch = e.touches[0];
      state.panX = touch.clientX - state.dragOffset.x;
      state.panY = touch.clientY - state.dragOffset.y;
      applyViewTransform();
    }
  }
}

function onTouchEnd(e) {
  state.draggedNode = null;
  state.isPanning = false;
  state.lastTouchDistance = null;
}

// ----------------------------------------------------
// ELEMENT SELECTION & LIVE DETAIL EDITING
// ----------------------------------------------------

// Tab Switching Utility
function switchTab(tabName) {
  const tabBuildBtn = document.getElementById("tabBuildBtn");
  const tabEditBtn = document.getElementById("tabEditBtn");
  const buildPanel = document.getElementById("buildPanel");
  const editPanel = document.getElementById("editPanel");
  
  if (!tabBuildBtn || !tabEditBtn) return;
  
  if (tabName === 'build') {
    tabBuildBtn.classList.add("active");
    tabEditBtn.classList.remove("active");
    buildPanel.classList.add("active");
    editPanel.classList.remove("active");
  } else if (tabName === 'edit') {
    tabBuildBtn.classList.remove("active");
    tabEditBtn.classList.add("active");
    buildPanel.classList.remove("active");
    editPanel.classList.add("active");
  }
}

function selectElement(type, id) {
  state.selectedId = id;
  state.selectedType = type;
  
  // Highlight visually
  document.querySelectorAll(".genogram-node, [data-id], .genogram-line").forEach(el => {
    el.classList.remove("selected");
  });
  
  const svgEl = document.querySelector(`[data-id="${id}"]`);
  if (svgEl) {
    svgEl.classList.add("selected");
    // Also highlight the path inside it if it's a line
    const pathEl = svgEl.querySelector(".genogram-line");
    if (pathEl) {
      pathEl.classList.add("selected");
    }
  }
  
  // Update Selection Header
  selectionStatus.textContent = type === 'person' ? 'Family Member Selected' : 'Connection Selected';
  selectionStatus.className = "selection-indicator active";
  
  // Auto switch sidebar to edit tab & show selection indicator dot
  switchTab('edit');
  const editBadge = document.getElementById("tabEditBadge");
  if (editBadge) editBadge.style.display = "inline-block";
  
  showSelectionDetails();

  // Show relation selection if person
  if (type === 'person') {
    const person = state.people.find(p => p.id === id);
    if (person) {
      const relationFieldContainer = document.getElementById("relationFieldContainer");
      if (relationFieldContainer) {
        relationFieldContainer.style.display = "block";
      }
      const relationSelectedName = document.getElementById("relationSelectedName");
      if (relationSelectedName) {
        relationSelectedName.textContent = person.name;
      }
    }
  } else {
    const relationFieldContainer = document.getElementById("relationFieldContainer");
    if (relationFieldContainer) {
      relationFieldContainer.style.display = "none";
    }
  }

  // Auto switch mobile view to show forms
  const mainLayout = document.querySelector(".main-layout");
  const mobileToggleBtn = document.getElementById("mobileToggleBtn");
  if (mainLayout && window.innerWidth <= 768) {
    mainLayout.classList.add("show-sidebar-mobile");
    if (mobileToggleBtn) {
      mobileToggleBtn.querySelector(".icon").textContent = "👁️";
      mobileToggleBtn.querySelector(".label").textContent = "View Canvas";
    }
  }
}

function clearSelection() {
  state.selectedId = null;
  state.selectedType = null;
  
  document.querySelectorAll(".genogram-node, [data-id], .genogram-line").forEach(el => {
    el.classList.remove("selected");
  });
  
  selectionStatus.textContent = "None Selected";
  selectionStatus.className = "selection-indicator offline";
  selectionContent.innerHTML = `<p class="cream-placeholder">Click a person or connection line in the workspace to view or modify their details here.</p>`;
  
  // Auto switch sidebar back to build data tab & hide selection dot
  switchTab('build');
  const editBadge = document.getElementById("tabEditBadge");
  if (editBadge) editBadge.style.display = "none";

  // Hide and reset relation dropdown block
  const relationFieldContainer = document.getElementById("relationFieldContainer");
  if (relationFieldContainer) {
    relationFieldContainer.style.display = "none";
  }
  const pRelation = document.getElementById("pRelation");
  if (pRelation) {
    pRelation.value = "none";
  }
}

function showSelectionDetails() {
  if (!state.selectedId) return;
  
  if (state.selectedType === 'person') {
    const p = state.people.find(item => item.id === state.selectedId);
    if (!p) {
      clearSelection();
      return;
    }
    
    // Build trait list as clean inline rows
    let traitsList = ALL_TRAITS.map(t => {
      const checked = p.traits.includes(t.id) ? "checked" : "";
      const checkedClass = p.traits.includes(t.id) ? "checked" : "";
      return `
        <label class="trait-row ${checkedClass}" data-trait="${t.id}">
          <input type="checkbox" value="${t.id}" ${checked} class="edit-trait-cb">
          <span class="trait-row-label">${t.name}</span>
        </label>
      `;
    }).join("");
    
    selectionContent.innerHTML = `
      <div class="selection-details-card">
        <h4>Edit Member</h4>
        <div class="form-field">
          <label>Full Name</label>
          <input type="text" id="editName" value="${p.name}" class="cream-input">
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>Gender</label>
            <select id="editGender" class="cream-select">
              <option value="M" ${p.gender === 'M' ? 'selected' : ''}>Male</option>
              <option value="F" ${p.gender === 'F' ? 'selected' : ''}>Female</option>
              <option value="X" ${p.gender === 'X' ? 'selected' : ''}>Other</option>
              <option value="P" ${p.gender === 'P' ? 'selected' : ''}>Pregnancy (Triangle)</option>
            </select>
          </div>
          <div class="form-field">
            <label>Age</label>
            <input type="number" id="editAge" value="${p.age || ''}" class="cream-input" min="0">
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>Birth Year</label>
            <input type="number" id="editBirth" value="${p.birthYear || ''}" class="cream-input">
          </div>
        </div>
        <div class="form-row-checkboxes-inline" style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px;">
          <div class="form-row-checkbox">
            <input type="checkbox" id="editDeceased" ${p.isDeceased ? 'checked' : ''} class="cream-checkbox">
            <label for="editDeceased" class="checkbox-label">Deceased</label>
          </div>
          <!-- Death year — only visible when deceased -->
          <div class="form-field" id="editDeathRow" style="display:${p.isDeceased ? 'block' : 'none'}; padding-left: 22px;">
            <label for="editDeath">Year of Death</label>
            <input type="number" id="editDeath" value="${p.deathYear || ''}" class="cream-input">
          </div>
          <div class="form-row-checkbox">
            <input type="checkbox" id="editProband" ${p.isProband ? 'checked' : ''} class="cream-checkbox">
            <label for="editProband" class="checkbox-label">Index Person / Proband (Double Line)</label>
          </div>
          <div class="form-row-checkbox">
            <input type="checkbox" id="editAdopted" ${p.isAdopted ? 'checked' : ''} class="cream-checkbox">
            <label for="editAdopted" class="checkbox-label">Adopted Status (Brackets)</label>
          </div>
        </div>
        <div class="form-field">
          <label>Medical Conditions</label>
          <div class="traits-checkbox-list">
            ${traitsList}
          </div>
        </div>
        <div class="selection-actions" style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; gap: 8px;">
            <button id="saveEditBtn" class="primary-btn" style="flex: 1; margin: 0;">Save Changes</button>
            <button id="cancelEditBtn" class="secondary-btn" style="flex: 1; margin: 0;">Cancel</button>
          </div>
          <button id="deleteSelectBtn" class="danger-btn" style="width: 100%; margin: 0;">Delete Member</button>
        </div>
        <div class="shortcut-actions-group" style="margin-top: 10px; border-top: 1px dashed var(--border-light); padding-top: 10px;">
          <label style="font-size: 11px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 6px;">Connection Shortcuts</label>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button id="setPartnerABtn" class="secondary-btn" style="flex: 1; padding: 6px 8px; font-size: 10.5px; margin: 0;">Use as Partner A</button>
            <button id="setPartnerBBtn" class="secondary-btn" style="flex: 1; padding: 6px 8px; font-size: 10.5px; margin: 0;">Use as Partner B</button>
            <button id="setChildBtn" class="secondary-btn" style="flex: 1; padding: 6px 8px; font-size: 10.5px; margin: 0; min-width: 100%;">Use as Child</button>
          </div>
        </div>
      </div>
    `;
    
    // Bind listeners inside card
    document.getElementById("saveEditBtn").addEventListener("click", () => {
      const name = document.getElementById("editName").value;
      const gender = document.getElementById("editGender").value;
      const age = document.getElementById("editAge").value;
      const birthYear = document.getElementById("editBirth").value;
      const deathYear = document.getElementById("editDeath").value;
      const isDeceased = document.getElementById("editDeceased").checked;
      const isProband = document.getElementById("editProband").checked;
      const isAdopted = document.getElementById("editAdopted").checked;
      
      const traits = [];
      document.querySelectorAll(".edit-trait-cb:checked").forEach(cb => {
        traits.push(cb.value);
      });
      
      updatePerson(p.id, { name, gender, age, birthYear, deathYear, isDeceased, isProband, isAdopted, traits });
      clearSelection();
    });
    
    document.getElementById("cancelEditBtn").addEventListener("click", () => {
      clearSelection();
    });
    
    document.getElementById("deleteSelectBtn").addEventListener("click", () => {
      if (confirm(`Are you sure you want to delete ${p.name}?`)) {
        deletePerson(p.id);
      }
    });

    // Toggle Death Year visibility in edit panel
    const editDeceasedCb = document.getElementById("editDeceased");
    const editDeathRow = document.getElementById("editDeathRow");
    if (editDeceasedCb && editDeathRow) {
      editDeceasedCb.addEventListener("change", () => {
        editDeathRow.style.display = editDeceasedCb.checked ? "block" : "none";
        if (!editDeceasedCb.checked) {
          document.getElementById("editDeath").value = "";
        }
      });
    }

    // Checkbox toggling inside edit panel
    document.querySelectorAll(".edit-trait-cb").forEach(cb => {
      cb.addEventListener("change", (e) => {
        const row = e.target.closest(".trait-row");
        if (row) row.classList.toggle("checked", e.target.checked);
      });
    });

    // Connection Shortcuts bindings
    document.getElementById("setPartnerABtn").addEventListener("click", () => {
      relPartnerA.value = p.id;
      switchTab('build');
      const sections = document.querySelectorAll(".sidebar-section");
      if (sections[1]) sections[1].classList.add("active");
    });
    
    document.getElementById("setPartnerBBtn").addEventListener("click", () => {
      relPartnerB.value = p.id;
      switchTab('build');
      const sections = document.querySelectorAll(".sidebar-section");
      if (sections[1]) sections[1].classList.add("active");
    });
    
    document.getElementById("setChildBtn").addEventListener("click", () => {
      childSelect.value = p.id;
      switchTab('build');
      const sections = document.querySelectorAll(".sidebar-section");
      if (sections[1]) sections[1].classList.add("active");
    });
    
  } else if (state.selectedType === 'relationship') {
    const rel = state.relationships.find(item => item.id === state.selectedId);
    if (!rel) {
      clearSelection();
      return;
    }
    
    const partnerA = state.people.find(p => p.id === rel.personA);
    const partnerB = state.people.find(p => p.id === rel.personB);
    const partnerAName = partnerA ? partnerA.name : "Unknown";
    const partnerBName = partnerB ? partnerB.name : "Unknown";
    
    // Find children linked to this relationship
    const childLinks = state.children.filter(c => c.parentType === 'relationship' && c.parentId === rel.id);
    const childrenNames = childLinks.map(link => {
      const child = state.people.find(p => p.id === link.childId);
      return child ? child.name : "Unknown";
    }).join(", ") || "No child links connected";

    selectionContent.innerHTML = `
      <div class="selection-details-card">
        <h4>Connection Details</h4>
        <div class="detail-row">
          <span class="detail-label">Partner A:</span>
          <span class="detail-val">${partnerAName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Partner B:</span>
          <span class="detail-val">${partnerBName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Linked Children:</span>
          <span class="detail-val" style="text-align: right; max-width: 65%; font-size: 11px;">${childrenNames}</span>
        </div>
        <div class="form-field" style="margin-top: 6px;">
          <label for="editRelType">Relationship Type</label>
          <select id="editRelType" class="cream-select">
            <option value="married" ${rel.type === 'married' ? 'selected' : ''}>Married (Solid)</option>
            <option value="divorced" ${rel.type === 'divorced' ? 'selected' : ''}>Divorced (Double Slashed)</option>
            <option value="separated" ${rel.type === 'separated' ? 'selected' : ''}>Separated (Single Slashed)</option>
            <option value="cohabitation" ${rel.type === 'cohabitation' ? 'selected' : ''}>Cohabitation / Dating (Dashed)</option>
          </select>
        </div>
        <div class="selection-actions" style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; gap: 8px;">
            <button id="saveRelBtn" class="primary-btn" style="flex: 1; margin: 0;">Save Type</button>
            <button id="cancelRelBtn" class="secondary-btn" style="flex: 1; margin: 0;">Cancel</button>
          </div>
          <button id="deleteRelBtn" class="danger-btn" style="width: 100%; margin: 0;">Break Connection</button>
        </div>
        <div class="shortcut-actions-group" style="margin-top: 10px; border-top: 1px dashed var(--border-light); padding-top: 10px;">
          <label style="font-size: 11px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 6px;">Connection Shortcuts</label>
          <button id="setParentPairBtn" class="secondary-btn" style="width: 100%; padding: 6px 8px; font-size: 11px; margin: 0;">Use as Parent Pair</button>
        </div>
      </div>
    `;
    
    // Bind listeners
    document.getElementById("saveRelBtn").addEventListener("click", () => {
      const newType = document.getElementById("editRelType").value;
      rel.type = newType;
      render();
      clearSelection();
    });
    
    document.getElementById("cancelRelBtn").addEventListener("click", () => {
      clearSelection();
    });
    
    document.getElementById("deleteRelBtn").addEventListener("click", () => {
      if (confirm("Disconnect these partners? All linked children will be unlinked from them.")) {
        deleteRelationship(rel.id);
      }
    });

    document.getElementById("setParentPairBtn").addEventListener("click", () => {
      parentLinkSelect.value = rel.id;
      switchTab('build');
      const sections = document.querySelectorAll(".sidebar-section");
      if (sections[1]) sections[1].classList.add("active");
    });
  }
}

// ----------------------------------------------------
// AUTO LAYOUT ALGORITHM (GENERATION SOLVER)
// ----------------------------------------------------

function runAutoLayout() {
  if (state.people.length === 0) return;
  
  // 1. Solve generations
  const generations = {};
  
  // Set all initial generations to 0
  state.people.forEach(p => {
    generations[p.id] = 0;
  });
  
  // Iterate multiple times to propagate generations down the family hierarchy
  const maxIterations = 8;
  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;
    
    // Propagate generations for children
    state.children.forEach(c => {
      const childId = c.childId;
      let parentGen = -1;
      
      if (c.parentType === 'relationship') {
        const rel = state.relationships.find(r => r.id === c.parentId);
        if (rel) {
          parentGen = Math.max(generations[rel.personA] || 0, generations[rel.personB] || 0);
        }
      } else {
        parentGen = generations[c.parentId] || 0;
      }
      
      const expectedChildGen = parentGen + 1;
      if (generations[childId] < expectedChildGen) {
        generations[childId] = expectedChildGen;
        changed = true;
      }
    });
    
    // Also try to balance spouses/partners to be in the same generation
    state.relationships.forEach(r => {
      const genA = generations[r.personA] || 0;
      const genB = generations[r.personB] || 0;
      if (genA !== genB) {
        const targetGen = Math.max(genA, genB);
        generations[r.personA] = targetGen;
        generations[r.personB] = targetGen;
        changed = true;
      }
    });
    
    if (!changed) break;
  }
  
  // 2. Group people by generation
  const genGroups = {};
  state.people.forEach(p => {
    const gen = generations[p.id] || 0;
    if (!genGroups[gen]) genGroups[gen] = [];
    genGroups[gen].push(p);
  });
  
  // 3. Position people horizontally and vertically
  const startY = 100;
  const genSpacingY = 220;   // increased: dropY is now node.y+75, labels at +36/+51
  const nodeSpacingX = 170;
  
  const containerRect = canvasContainer.getBoundingClientRect();
  const centerX = containerRect.width / 2;
  
  Object.keys(genGroups).forEach(genStr => {
    const gen = parseInt(genStr);
    const group = genGroups[gen];
    
    // Sort horizontally to keep parents grouped near their relatives
    group.sort((a, b) => {
      // Simple heuristic: group by name or relationship links
      return a.name.localeCompare(b.name);
    });
    
    const count = group.length;
    const y = startY + gen * genSpacingY;
    
    group.forEach((p, idx) => {
      // Calculate horizontal coordinate centered around centerX
      const x = centerX + (idx - (count - 1) / 2) * nodeSpacingX;
      
      p.x = Math.round(x / 20) * 20;
      p.y = Math.round(y / 20) * 20;
    });
  });
  
  render();
  fitToScreen();
}

// ----------------------------------------------------
// SVG RENDER ENGINE
// ----------------------------------------------------

function render() {
  // Clear SVG groups
  peopleGroup.innerHTML = "";
  relationshipsGroup.innerHTML = "";
  childrenGroup.innerHTML = "";
  
  // Registry of computed relationship midpoints to attach child lines
  const relMidpoints = {};
  
  // 1. DRAW RELATIONSHIP (SPOUSE/PARTNER) LINES
  state.relationships.forEach(rel => {
    const pA = state.people.find(p => p.id === rel.personA);
    const pB = state.people.find(p => p.id === rel.personB);
    
    if (!pA || !pB) return;
    
    // Connection points (bottom center of shapes)
    const Ax = pA.x;
    const Ay = pA.y + 20;
    const Bx = pB.x;
    const By = pB.y + 20;
    
    // Drop line must clear name+date labels below the shape.
    // Shape bottom = node.y+20, name at +36, date at +51 → drop at +75 clears both.
    const dropY = Math.max(pA.y, pB.y) + 75;
    
    // Draw connecting path (drops from A, runs horizontally at dropY, goes up to B)
    const linePath = `M ${Ax} ${Ay} L ${Ax} ${dropY} L ${Bx} ${dropY} L ${Bx} ${By}`;
    
    // Calculate line midpoint
    const Mx = (Ax + Bx) / 2;
    const My = dropY;
    relMidpoints[rel.id] = { x: Mx, y: My };
    
    // Create Line Element
    const gLine = document.createElementNS("http://www.w3.org/2000/svg", "g");
    gLine.setAttribute("data-id", rel.id);
    
    // Visual stroke class
    let strokeClass = "genogram-line line-married";
    let dashAttr = "";
    if (rel.type === 'cohabitation') {
      strokeClass = "genogram-line line-cohab";
      dashAttr = 'stroke-dasharray="5,5"';
    }
    
    const strokeColor = state.isColorMode ? "#826f56" : "#000000";
    const highlight = state.selectedId === rel.id ? "selected" : "";
    
    gLine.innerHTML = `
      <!-- Invisible wider line for easier hover & clicking -->
      <path d="${linePath}" stroke="transparent" stroke-width="12" fill="none" class="genogram-line-hitbox" style="cursor: pointer;" />
      <!-- Visible line -->
      <path d="${linePath}" stroke="${strokeColor}" ${dashAttr} fill="none" class="${strokeClass} ${highlight}" />
    `;
    
    // Draw slashes for divorces or separations
    const slashColor = state.isColorMode ? "#826f56" : "#000000";
    if (rel.type === 'divorced') {
      gLine.innerHTML += `
        <line x1="${Mx - 6}" y1="${My + 8}" x2="${Mx}" y2="${My - 8}" stroke="${slashColor}" class="line-slash" />
        <line x1="${Mx}" y1="${My + 8}" x2="${Mx + 6}" y2="${My - 8}" stroke="${slashColor}" class="line-slash" />
      `;
    } else if (rel.type === 'separated') {
      gLine.innerHTML += `
        <line x1="${Mx - 3}" y1="${My + 8}" x2="${Mx + 3}" y2="${My - 8}" stroke="${slashColor}" class="line-slash" />
      `;
    }
    
    relationshipsGroup.appendChild(gLine);
  });
  
  // 2. DRAW CHILD LINES
  // Group children by parent link
  const childGroups = {};
  state.children.forEach(link => {
    if (!childGroups[link.parentId]) {
      childGroups[link.parentId] = [];
    }
    childGroups[link.parentId].push(link);
  });
  
  Object.keys(childGroups).forEach(parentId => {
    const links = childGroups[parentId];
    
    // Get parent connection origin (Px, Py)
    let Px, Py;
    
    if (parentId.startsWith("rel_")) {
      const mid = relMidpoints[parentId];
      if (!mid) return; // parents not rendered
      Px = mid.x;
      Py = mid.y;
    } else {
      const p = state.people.find(item => item.id === parentId);
      if (!p) return;
      Px = p.x;
      Py = p.y + 20; // single parent bottom
    }
    
    // Resolve children info and sort horizontally by their current coordinate
    const childNodes = links.map(l => {
      const child = state.people.find(p => p.id === l.childId);
      return child;
    }).filter(c => c !== undefined)
      .sort((a, b) => a.x - b.x);
      
    if (childNodes.length === 0) return;
    
    const strokeColor = state.isColorMode ? "#826f56" : "#000000";
    const splitY = Py + 25; // drop height level
    
    const gChildren = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    if (childNodes.length === 1) {
      // Single child: simple drop line down, across, and down
      const child = childNodes[0];
      const Cx = child.x;
      const Cy = child.y - 20; // top connection
      
      const path = `M ${Px} ${Py} L ${Px} ${splitY} L ${Cx} ${splitY} L ${Cx} ${Cy}`;
      gChildren.innerHTML = `<path d="${path}" stroke="${strokeColor}" stroke-width="2.5" fill="none" />`;
    } else {
      // Multiple children: drop from parent, horizontal bar, and vertical drop lines to each child
      const minX = childNodes[0].x;
      const maxX = childNodes[childNodes.length - 1].x;
      
      let paths = `
        <!-- Drop from parent midpoint -->
        <path d="M ${Px} ${Py} L ${Px} ${splitY}" stroke="${strokeColor}" stroke-width="2.5" fill="none" />
        <!-- Horizontal pedigree bar -->
        <path d="M ${minX} ${splitY} L ${maxX} ${splitY}" stroke="${strokeColor}" stroke-width="2.5" fill="none" />
      `;
      
      // Vertical drops for each child
      childNodes.forEach(child => {
        const Cx = child.x;
        const Cy = child.y - 20; // child top
        paths += `<path d="M ${Cx} ${splitY} L ${Cx} ${Cy}" stroke="${strokeColor}" stroke-width="2.5" fill="none" />`;
      });
      
      gChildren.innerHTML = paths;
    }
    
    childrenGroup.appendChild(gChildren);
  });
  
  // 3. DRAW INDIVIDUAL MEMBER NODES
  state.people.forEach(p => {
    const gNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
    gNode.setAttribute("class", "genogram-node");
    gNode.setAttribute("transform", `translate(${p.x}, ${p.y})`);
    gNode.setAttribute("data-id", p.id);
    
    if (state.selectedId === p.id) {
      gNode.classList.add("selected");
    }
    
    // Core borders & fills based on Color/BW mode
    let strokeCol = "#000000";
    let baseFill = "#ffffff";
    
    if (state.isColorMode) {
      strokeCol = p.gender === 'M' ? '#5681a8' : (p.gender === 'F' ? '#c97171' : (p.gender === 'P' ? '#789078' : '#c89c56'));
      baseFill = p.gender === 'M' ? '#eaf1f7' : (p.gender === 'F' ? '#f9ebeb' : (p.gender === 'P' ? '#ebf2eb' : '#faf5eb'));
    }
    
    // Quadrant paths for Traits
    let traitPathsHtml = "";
    
    // Build array of up to 4 traits mapped on the quadrants (excluding carrier which is central dot)
    const activeTraits = p.traits.filter(t => t !== "hemophilia_carrier").slice(0, 4);
    
    if (activeTraits.length > 0) {
      activeTraits.forEach((traitId, idx) => {
        // Resolve pattern or color fill
        let fillStyle = "";
        if (state.isColorMode) {
          // Explicit map: trait ID → CSS color value (must match legend swatches)
          const TRAIT_COLORS = {
            heart_disease: '#d9625d',
            diabetes: '#cfa140',
            hypertension: '#4da5bc',
            cancer: '#8b6db8',
            depression: '#66ad75',
            substance_abuse: '#a35a58',
            asthma: '#d6874b',
            hemophilia: '#b84f4f',
            prediabetic: '#e3c16f',
          };
          const color = TRAIT_COLORS[traitId] || '#999999';
          fillStyle = `fill="${color}"`;
        } else {
          fillStyle = `fill="url(#pat_${traitId})"`;
        }
        
        if (p.gender === 'M') {
          // Square quadrant paths
          if (idx === 0) { // Top-Left
            traitPathsHtml += `<path d="M -20 -20 L 0 -20 L 0 0 L -20 0 Z" ${fillStyle} />`;
          } else if (idx === 1) { // Top-Right
            traitPathsHtml += `<path d="M 0 -20 L 20 -20 L 20 0 L 0 0 Z" ${fillStyle} />`;
          } else if (idx === 2) { // Bottom-Left
            traitPathsHtml += `<path d="M -20 0 L 0 0 L 0 20 L -20 20 Z" ${fillStyle} />`;
          } else if (idx === 3) { // Bottom-Right
            traitPathsHtml += `<path d="M 0 0 L 20 0 L 20 20 L 0 20 Z" ${fillStyle} />`;
          }
        } else if (p.gender === 'F') {
          // Circle quadrant paths (Arcs)
          if (idx === 0) { // Top-Left
            traitPathsHtml += `<path d="M -20 0 A 20 20 0 0 1 0 -20 L 0 0 Z" ${fillStyle} />`;
          } else if (idx === 1) { // Top-Right
            traitPathsHtml += `<path d="M 0 -20 A 20 20 0 0 1 20 0 L 0 0 Z" ${fillStyle} />`;
          } else if (idx === 2) { // Bottom-Right
            traitPathsHtml += `<path d="M 20 0 A 20 20 0 0 1 0 20 L 0 0 Z" ${fillStyle} />`;
          } else if (idx === 3) { // Bottom-Left
            traitPathsHtml += `<path d="M 0 20 A 20 20 0 0 1 -20 0 L 0 0 Z" ${fillStyle} />`;
          }
        } else if (p.gender === 'P') {
          // Triangle halves for pregnancy
          if (idx === 0) { // Left Half
            traitPathsHtml += `<polygon points="0,-20 -20,15 0,15 Z" ${fillStyle} />`;
          } else if (idx === 1) { // Right Half
            traitPathsHtml += `<polygon points="0,-20 20,15 0,15 Z" ${fillStyle} />`;
          }
        } else {
          // Diamond quadrant paths
          if (idx === 0) { // Top-Left
            traitPathsHtml += `<path d="M -20 0 L 0 -20 L 0 0 Z" ${fillStyle} />`;
          } else if (idx === 1) { // Top-Right
            traitPathsHtml += `<path d="M 0 -20 L 20 0 L 0 0 Z" ${fillStyle} />`;
          } else if (idx === 2) { // Bottom-Right
            traitPathsHtml += `<path d="M 20 0 L 0 20 L 0 0 Z" ${fillStyle} />`;
          } else if (idx === 3) { // Bottom-Left
            traitPathsHtml += `<path d="M 0 20 L -20 0 L 0 0 Z" ${fillStyle} />`;
          }
        }
      });
    }
    
    // Core shape tags
    let shapeHtml = "";
    const filterShadow = state.isColorMode ? 'filter="url(#shadowFilter)"' : "";
    
    if (p.gender === 'M') {
      shapeHtml = `<rect x="-20" y="-20" width="40" height="40" fill="${baseFill}" stroke="${strokeCol}" ${filterShadow} />`;
    } else if (p.gender === 'F') {
      shapeHtml = `<circle cx="0" cy="0" r="20" fill="${baseFill}" stroke="${strokeCol}" ${filterShadow} />`;
    } else if (p.gender === 'P') {
      shapeHtml = `<polygon points="0,-20 20,15 -20,15" fill="${baseFill}" stroke="${strokeCol}" ${filterShadow} />`;
    } else {
      shapeHtml = `<polygon points="0,-20 20,0 0,20 -20,0" fill="${baseFill}" stroke="${strokeCol}" ${filterShadow} />`;
    }
    
    // Proband overlay (Double Border)
    let probandHtml = "";
    if (p.isProband) {
      if (p.gender === 'M') {
        probandHtml = `<rect x="-24" y="-24" width="48" height="48" fill="none" stroke="${strokeCol}" stroke-width="2" />`;
      } else if (p.gender === 'F') {
        probandHtml = `<circle cx="0" cy="0" r="24" fill="none" stroke="${strokeCol}" stroke-width="2" />`;
      } else if (p.gender === 'P') {
        probandHtml = `<polygon points="0,-25 25,19 -25,19" fill="none" stroke="${strokeCol}" stroke-width="2" />`;
      } else {
        probandHtml = `<polygon points="0,-25 25,0 0,25 -25,0" fill="none" stroke="${strokeCol}" stroke-width="2" />`;
      }
    }

    // Adopted brackets overlay
    let adoptedHtml = "";
    if (p.isAdopted) {
      adoptedHtml = `
        <path d="M -26 -22 L -31 -22 L -31 22 L -26 22" stroke="${strokeCol}" stroke-width="2" fill="none" />
        <path d="M 26 -22 L 31 -22 L 31 22 L 26 22" stroke="${strokeCol}" stroke-width="2" fill="none" />
      `;
    }

    // Deceased mark (Cross overlay)
    let deceasedHtml = "";
    if (p.isDeceased) {
      const crossColor = state.isColorMode ? "#826f56" : "#000000";
      deceasedHtml = `<path d="M -15 -15 L 15 15 M 15 -15 L -15 15" stroke="${crossColor}" class="deceased-x" />`;
    }

    // Carrier dot overlay (Standard Clinical Symbol)
    let carrierHtml = "";
    if (p.traits.includes("hemophilia_carrier")) {
      const dotColor = state.isColorMode ? "#8b6db8" : "#000000";
      carrierHtml = `<circle cx="0" cy="0" r="5" fill="${dotColor}" stroke="none" />`;
    }
    
    // ── Standard McGoldrick label layout ──────────────────
    // • Age: inside the shape (centred)
    // • Name: bold, below the shape — no background card
    // • Dates: (birthYear) or (birthYear–deathYear), below name
    // • Traits: shown ONLY via quadrant shading, not as text
    // ─────────────────────────────────────────────────────

    const textCol  = state.isColorMode ? '#3a3028' : '#000000';
    const mutedCol = state.isColorMode ? '#826f56' : '#555555';

    // --- Age label INSIDE the shape ---
    let ageInsideHtml = '';
    if (p.age) {
      // For triangle (pregnancy) offset slightly lower to stay inside
      const ageY = p.gender === 'P' ? 6 : 5;
      ageInsideHtml = `<text
        x="0" y="${ageY}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="'Outfit', 'Inter', sans-serif"
        font-size="11"
        font-weight="700"
        fill="${textCol}"
        pointer-events="none">${p.age}</text>`;
    }

    // --- Name label: bold, below shape, safely above the drop line (at +75) ---
    const displayName = p.name.length > 18 ? p.name.substring(0, 16) + '\u2026' : p.name;
    const nameY = p.gender === 'P' ? 34 : 36;

    const nameHtml = `<text
      x="0" y="${nameY}"
      text-anchor="middle"
      font-family="'Outfit', 'Inter', sans-serif"
      font-size="11"
      font-weight="700"
      fill="${textCol}"
      pointer-events="none">${displayName}</text>`;

    // --- Date label: (birthYear) or (birthYear–deathYear) ---
    let dateHtml = '';
    const birthStr = p.birthYear ? String(p.birthYear) : '';
    const deathStr = p.deathYear ? String(p.deathYear) : (p.isDeceased ? '?' : '');
    let dateText = '';
    if (birthStr && deathStr)       dateText = `(${birthStr}\u2013${deathStr})`;
    else if (birthStr)              dateText = `(${birthStr})`;
    else if (deathStr)              dateText = `(d. ${deathStr})`;

    if (dateText) {
      const dateY = nameY + 14;
      dateHtml = `<text
        x="0" y="${dateY}"
        text-anchor="middle"
        font-family="'Outfit', 'Inter', sans-serif"
        font-size="9"
        font-weight="400"
        fill="${mutedCol}"
        pointer-events="none">${dateText}</text>`;
    }

    const cardHtml = ageInsideHtml + nameHtml + dateHtml;

    // Build HTML block inside the node group
    gNode.innerHTML = `
      ${shapeHtml}
      ${traitPathsHtml}
      ${probandHtml}
      ${adoptedHtml}
      ${deceasedHtml}
      ${carrierHtml}
      ${cardHtml}
    `;
    
    peopleGroup.appendChild(gNode);
  });
}

// ----------------------------------------------------
// START THE APP
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", init);
