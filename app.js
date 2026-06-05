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
  { id: "asthma", name: "Asthma" }
];

// Initialize Application
function init() {
  setupEventListeners();
  updateFormDropdowns();
  render();
  
  // Set default view transform
  resetView();
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
  render();
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
  render();
}

function deleteRelationship(id) {
  state.relationships = state.relationships.filter(r => r.id !== id);
  // Clean up children links that belong to this relationship
  state.children = state.children.filter(c => c.parentType !== 'relationship' || c.parentId !== id);
  
  if (state.selectedId === id) {
    clearSelection();
  }
  updateFormDropdowns();
  render();
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
  render();
}

function deleteChildLink(childId, parentId) {
  state.children = state.children.filter(c => !(c.childId === childId && c.parentId === parentId));
  render();
}

function loadTemplate(templateName) {
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
  // Sidebar Accordion Headers
  document.querySelectorAll(".section-header").forEach(header => {
    header.addEventListener("click", () => {
      // Toggle active state
      const section = header.parentElement;
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
  });

  styleColBtn.addEventListener("click", () => {
    state.isColorMode = true;
    styleBwBtn.classList.remove("active");
    styleColBtn.classList.add("active");
    svg.classList.remove("bw-mode");
    render();
  });

  // Template Selector
  templateSelect.addEventListener("change", (e) => {
    loadTemplate(e.target.value);
  });

  // Add Person Form Submit
  addPersonForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("pName").value;
    const gender = document.getElementById("pGender").value;
    const age = document.getElementById("pAge").value;
    const birthYear = document.getElementById("pBirth").value;
    const deathYear = document.getElementById("pDeath").value;
    const isDeceased = document.getElementById("pDeceased").checked;
    
    // Read traits checkboxes
    const traits = [];
    document.querySelectorAll(".trait-cb:checked").forEach(cb => {
      traits.push(cb.value);
    });

    // Determine canvas position (center of current viewport)
    const containerRect = canvasContainer.getBoundingClientRect();
    const x = -state.panX / state.zoom + containerRect.width / (2 * state.zoom);
    const y = -state.panY / state.zoom + containerRect.height / (2 * state.zoom);

    const newPerson = {
      id: "person_" + Date.now() + "_" + Math.floor(Math.random() * 100),
      name,
      gender,
      age,
      birthYear,
      deathYear,
      isDeceased,
      traits,
      x: Math.round(x / 20) * 20,
      y: Math.round(y / 20) * 20
    };

    addPerson(newPerson);

    // Reset Form
    addPersonForm.reset();
    document.querySelectorAll(".trait-chip").forEach(chip => chip.classList.remove("active"));
  });

  // Custom Trait Chip Checkboxes Visual Toggles
  document.querySelectorAll(".trait-chip input").forEach(cb => {
    cb.addEventListener("change", (e) => {
      const chip = e.target.closest(".trait-chip");
      if (e.target.checked) {
        chip.classList.add("active");
      } else {
        chip.classList.remove("active");
      }
    });
  });

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
  svg.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  svg.addEventListener("wheel", onWheel, { passive: false });

  // Exporters hookups
  exportPngBtn.addEventListener("click", () => Exporter.exportImage(svg, state.people, state.isColorMode, 'png'));
  exportJpegBtn.addEventListener("click", () => Exporter.exportImage(svg, state.people, state.isColorMode, 'jpeg'));
  exportSvgBtn.addEventListener("click", () => Exporter.exportSvg(svg, state.people, state.isColorMode));
  exportPdfBtn.addEventListener("click", () => Exporter.exportPdf(svg, state.people, state.isColorMode));
  exportWordBtn.addEventListener("click", () => Exporter.exportWord(svg, state.people, state.isColorMode));
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

function onMouseDown(e) {
  // If clicking directly on a node shape, handle dragging instead of panning
  const nodeEl = e.target.closest(".genogram-node");
  if (nodeEl) {
    const id = nodeEl.getAttribute("data-id");
    selectElement('person', id);
    
    const person = state.people.find(p => p.id === id);
    if (person) {
      state.draggedNode = person;
      
      // Calculate mouse position inside zoomed SVG coordinate system
      const pt = getSvgCoords(e);
      state.dragOffset.x = pt.x - person.x;
      state.dragOffset.y = pt.y - person.y;
    }
    return;
  }
  
  // If clicking on a relationship line, select relationship
  const lineEl = e.target.closest(".genogram-line");
  if (lineEl) {
    const id = lineEl.getAttribute("data-id");
    selectElement('relationship', id);
    return;
  }

  // Clear selection if clicking empty canvas background
  if (e.target.id === "svgBgClick" || e.target === svg) {
    clearSelection();
    
    // Start canvas panning
    state.isPanning = true;
    state.dragOffset.x = e.clientX - state.panX;
    state.dragOffset.y = e.clientY - state.panY;
  }
}

function onMouseMove(e) {
  if (state.draggedNode) {
    // Perform node dragging
    const pt = getSvgCoords(e);
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
    // Perform canvas panning
    state.panX = e.clientX - state.dragOffset.x;
    state.panY = e.clientY - state.dragOffset.y;
    applyViewTransform();
  }
}

function onMouseUp() {
  state.draggedNode = null;
  state.isPanning = false;
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

// ----------------------------------------------------
// ELEMENT SELECTION & LIVE DETAIL EDITING
// ----------------------------------------------------

function selectElement(type, id) {
  state.selectedId = id;
  state.selectedType = type;
  
  // Highlight visually
  document.querySelectorAll(".genogram-node, .genogram-line").forEach(el => {
    el.classList.remove("selected");
  });
  
  const svgEl = document.querySelector(`[data-id="${id}"]`);
  if (svgEl) {
    svgEl.classList.add("selected");
  }
  
  // Update Selection Header
  selectionStatus.textContent = type === 'person' ? 'Family Member Selected' : 'Connection Selected';
  selectionStatus.className = "selection-indicator active";
  
  showSelectionDetails();
}

function clearSelection() {
  state.selectedId = null;
  state.selectedType = null;
  
  document.querySelectorAll(".genogram-node, .genogram-line").forEach(el => {
    el.classList.remove("selected");
  });
  
  selectionStatus.textContent = "None Selected";
  selectionStatus.className = "selection-indicator offline";
  selectionContent.innerHTML = `<p class="cream-placeholder">Click a person or connection line in the workspace to view or modify their details here.</p>`;
}

function showSelectionDetails() {
  if (!state.selectedId) return;
  
  if (state.selectedType === 'person') {
    const p = state.people.find(item => item.id === state.selectedId);
    if (!p) {
      clearSelection();
      return;
    }
    
    // Render detailed editor card for person
    let traitsList = ALL_TRAITS.map(t => {
      const checked = p.traits.includes(t.id) ? "checked" : "";
      const activeClass = p.traits.includes(t.id) ? "active" : "";
      return `
        <label class="trait-chip ${activeClass}" data-trait="${t.id}">
          <input type="checkbox" value="${t.id}" ${checked} class="edit-trait-cb"> ${t.name}
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
          <div class="form-field">
            <label>Death Year</label>
            <input type="number" id="editDeath" value="${p.deathYear || ''}" class="cream-input">
          </div>
        </div>
        <div class="form-row-checkbox">
          <input type="checkbox" id="editDeceased" ${p.isDeceased ? 'checked' : ''} class="cream-checkbox">
          <label for="editDeceased" class="checkbox-label">Deceased</label>
        </div>
        <div class="form-field">
          <label>Medical Conditions</label>
          <div class="traits-checkbox-grid">
            ${traitsList}
          </div>
        </div>
        <div class="selection-actions">
          <button id="saveEditBtn" class="primary-btn">Save Changes</button>
          <button id="deleteSelectBtn" class="danger-btn">Delete Member</button>
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
      
      const traits = [];
      document.querySelectorAll(".edit-trait-cb:checked").forEach(cb => {
        traits.push(cb.value);
      });
      
      updatePerson(p.id, { name, gender, age, birthYear, deathYear, isDeceased, traits });
    });
    
    document.getElementById("deleteSelectBtn").addEventListener("click", () => {
      if (confirm(`Are you sure you want to delete ${p.name}?`)) {
        deletePerson(p.id);
      }
    });

    // Checkbox toggling inside detail panel
    document.querySelectorAll(".edit-trait-cb").forEach(cb => {
      cb.addEventListener("change", (e) => {
        const chip = e.target.closest(".trait-chip");
        chip.classList.toggle("active", e.target.checked);
      });
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
        <div class="selection-actions">
          <button id="saveRelBtn" class="primary-btn">Save Type</button>
          <button id="deleteRelBtn" class="danger-btn">Break Connection</button>
        </div>
      </div>
    `;
    
    // Bind listeners
    document.getElementById("saveRelBtn").addEventListener("click", () => {
      const newType = document.getElementById("editRelType").value;
      rel.type = newType;
      render();
      showSelectionDetails();
    });
    
    document.getElementById("deleteRelBtn").addEventListener("click", () => {
      if (confirm("Disconnect these partners? All linked children will be unlinked from them.")) {
        deleteRelationship(rel.id);
      }
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
  const genSpacingY = 180;
  const nodeSpacingX = 160;
  
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
    
    // Horizontal step drop level
    const dropY = Math.max(pA.y, pB.y) + 50;
    
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
      strokeCol = p.gender === 'M' ? '#5681a8' : (p.gender === 'F' ? '#c97171' : '#c89c56');
      baseFill = p.gender === 'M' ? '#eaf1f7' : (p.gender === 'F' ? '#f9ebeb' : '#faf5eb');
    }
    
    // Quadrant paths for Traits
    let traitPathsHtml = "";
    
    // Build array of up to 4 traits mapped on the quadrants
    const activeTraits = p.traits.slice(0, 4);
    
    if (activeTraits.length > 0) {
      activeTraits.forEach((traitId, idx) => {
        // Resolve pattern or color fill
        let fillStyle = "";
        if (state.isColorMode) {
          fillStyle = `fill="var(--trait-${traitId.replace('disease', 'heart').replace('tension', 'hyper').replace('abuse', 'substance')})"`;
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
    } else {
      shapeHtml = `<polygon points="0,-20 20,0 0,20 -20,0" fill="${baseFill}" stroke="${strokeCol}" ${filterShadow} />`;
    }
    
    // Deceased mark (Cross overlay)
    let deceasedHtml = "";
    if (p.isDeceased) {
      const crossColor = state.isColorMode ? "#826f56" : "#000000";
      deceasedHtml = `<path d="M -15 -15 L 15 15 M 15 -15 L -15 15" stroke="${crossColor}" class="deceased-x" />`;
    }
    
    // Compile label texts
    let detailsLabel = "";
    if (p.age) detailsLabel += p.age;
    
    const birthStr = p.birthYear || "";
    const deathStr = p.deathYear || (p.isDeceased ? "?" : "");
    if (birthStr || deathStr) {
      if (detailsLabel) detailsLabel += " | ";
      detailsLabel += `${birthStr}–${deathStr}`;
    }
    
    // Build HTML block inside the node group
    gNode.innerHTML = `
      ${shapeHtml}
      ${traitPathsHtml}
      ${deceasedHtml}
      
      <!-- Label Name (White stroke shadow underneath for high legibility over lines) -->
      <text class="node-label-name" y="32" stroke="${state.isColorMode ? '#fbfaf7' : '#ffffff'}" stroke-width="3" paint-order="stroke fill" stroke-linejoin="round">${p.name}</text>
      <text class="node-label-name" y="32">${p.name}</text>
      
      <!-- Label Details (Age, Years) -->
      <text class="node-label-details" y="44" stroke="${state.isColorMode ? '#fbfaf7' : '#ffffff'}" stroke-width="3" paint-order="stroke fill" stroke-linejoin="round">${detailsLabel}</text>
      <text class="node-label-details" y="44">${detailsLabel}</text>
    `;
    
    peopleGroup.appendChild(gNode);
  });
}

// ----------------------------------------------------
// START THE APP
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", init);
