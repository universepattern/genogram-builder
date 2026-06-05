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
  { id: "hemophilia_carrier", name: "Hemophilia (Carrier)" }
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

  // Export Dropdown Trigger
  const exportDropdownBtn = document.getElementById("exportDropdownBtn");
  const exportMenu = document.getElementById("exportMenu");
  if (exportDropdownBtn && exportMenu) {
    exportDropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      exportMenu.classList.toggle("show");
    });
    
    // Close export menu on click outside
    window.addEventListener("click", () => {
      exportMenu.classList.remove("show");
    });
  }

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
    document.querySelectorAll(".trait-chip").forEach(chip => chip.classList.remove("active"));
    
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
  
  const lineEl = e.target.closest(".genogram-line");
  if (lineEl) {
    e.preventDefault();
    const id = lineEl.getAttribute("data-id");
    selectElement('relationship', id);
    return;
  }

  if (e.target.id === "svgBgClick" || e.target === svg) {
    e.preventDefault();
    clearSelection();
    
    state.isPanning = true;
    const touch = e.touches[0];
    state.dragOffset.x = touch.clientX - state.panX;
    state.dragOffset.y = touch.clientY - state.panY;
  }
}

function onTouchMove(e) {
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
  
  document.querySelectorAll(".genogram-node, .genogram-line").forEach(el => {
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
          <div class="form-field">
            <label>Death Year</label>
            <input type="number" id="editDeath" value="${p.deathYear || ''}" class="cream-input">
          </div>
        </div>
        <div class="form-row-checkboxes-inline" style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px;">
          <div class="form-row-checkbox">
            <input type="checkbox" id="editDeceased" ${p.isDeceased ? 'checked' : ''} class="cream-checkbox">
            <label for="editDeceased" class="checkbox-label">Deceased</label>
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
          <div class="traits-checkbox-grid">
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

    // Checkbox toggling inside detail panel
    document.querySelectorAll(".edit-trait-cb").forEach(cb => {
      cb.addEventListener("change", (e) => {
        const chip = e.target.closest(".trait-chip");
        chip.classList.toggle("active", e.target.checked);
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
    
    // Determine label positions to avoid line overlaps
    const isParent = state.relationships.some(r => r.personA === p.id || r.personB === p.id);
    const isChild = state.children.some(c => c.childId === p.id);
    
    let nameY = 32;
    let detailsY = 44;
    
    if (isParent && !isChild) {
      nameY = -32;
      detailsY = -44;
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
      ${probandHtml}
      ${adoptedHtml}
      ${deceasedHtml}
      ${carrierHtml}
      
      <!-- Label Name (White stroke shadow underneath for high legibility over lines) -->
      <text class="node-label-name" y="${nameY}" stroke="${state.isColorMode ? '#fbfaf7' : '#ffffff'}" stroke-width="7" paint-order="stroke fill" stroke-linejoin="round">${p.name}</text>
      <text class="node-label-name" y="${nameY}">${p.name}</text>
      
      <!-- Label Details (Age, Years) -->
      <text class="node-label-details" y="${detailsY}" stroke="${state.isColorMode ? '#fbfaf7' : '#ffffff'}" stroke-width="7" paint-order="stroke fill" stroke-linejoin="round">${detailsLabel}</text>
      <text class="node-label-details" y="${detailsY}">${detailsLabel}</text>
    `;
    
    peopleGroup.appendChild(gNode);
  });
}

// ----------------------------------------------------
// START THE APP
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", init);
