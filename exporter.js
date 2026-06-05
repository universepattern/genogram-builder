// Genogram Export Engine

const Exporter = {
  // Helper: Find bounding box of all people nodes with padding
  getBoundingBox(people) {
    if (!people || people.length === 0) {
      return { x: 0, y: 0, width: 800, height: 600 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    people.forEach(p => {
      // Each person shape is roughly 40-50px wide/high. 
      // Include labels below (which go down ~40px) and padding
      minX = Math.min(minX, p.x - 70);
      minY = Math.min(minY, p.y - 70);
      maxX = Math.max(maxX, p.x + 70);
      maxY = Math.max(maxY, p.y + 110);
    });

    // Add extra padding to edges
    minX -= 30;
    minY -= 30;
    maxX += 30;
    maxY += 30;

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  },

  // Helper: Collect all CSS stylesheets active in document
  getStyles() {
    let cssText = "";
    for (let sheet of document.styleSheets) {
      try {
        if (sheet.href && sheet.href.indexOf(window.location.hostname) === -1) continue; // skip cross-domain stylesheets
        for (let rule of sheet.cssRules) {
          cssText += rule.cssText + "\n";
        }
      } catch (e) {
        console.warn("Could not read stylesheet rules", e);
      }
    }
    // Also inject font styling explicitly for standalone SVGs
    cssText += `
      text { font-family: 'Outfit', sans-serif; }
      .logo-serif { font-family: 'Playfair Display', serif; }
    `;
    return cssText;
  },

  // Helper: Build a self-contained SVG legend block
  buildLegendSvg(isColorMode, diagramWidth) {
    const W = Math.max(diagramWidth, 700);
    const H = 110; // legend strip height
    const bg = isColorMode ? '#faf9f6' : '#ffffff';
    const textColor = isColorMode ? '#3a3028' : '#000000';
    const mutedColor = isColorMode ? '#826f56' : '#555555';
    const borderColor = '#d4cbb8';

    // ── Trait definitions ──────────────────────────────
    const traits = [
      { label: 'Heart',       color: '#d9625d', bw: 'horiz'   },
      { label: 'Diabetes',    color: '#cfa140', bw: 'vert'    },
      { label: 'Hypertension',color: '#4da5bc', bw: 'diag'    },
      { label: 'Cancer',      color: '#8b6db8', bw: 'cross'   },
      { label: 'Depression',  color: '#66ad75', bw: 'dots'    },
      { label: 'Substance',   color: '#a35a58', bw: 'diagback'},
      { label: 'Asthma',      color: '#d6874b', bw: 'sparse'  },
      { label: 'Prediabetic', color: '#e3c16f', bw: 'zigzag'  },
    ];

    // Build SVG defs for B&W hatching patterns (small 12×12 tiles)
    const patternDefs = `
      <defs>
        <pattern id="leg_horiz"    width="12" height="12" patternUnits="userSpaceOnUse"><line x1="0" y1="4"  x2="12" y2="4"  stroke="#000" stroke-width="1.2"/><line x1="0" y1="9"  x2="12" y2="9"  stroke="#000" stroke-width="1.2"/></pattern>
        <pattern id="leg_vert"     width="12" height="12" patternUnits="userSpaceOnUse"><line x1="4"  y1="0" x2="4"  y2="12" stroke="#000" stroke-width="1.2"/><line x1="9"  y1="0" x2="9"  y2="12" stroke="#000" stroke-width="1.2"/></pattern>
        <pattern id="leg_diag"     width="12" height="12" patternUnits="userSpaceOnUse"><line x1="0" y1="12" x2="12" y2="0"  stroke="#000" stroke-width="1.2"/><line x1="-6" y1="12" x2="6"  y2="0"  stroke="#000" stroke-width="1.2"/><line x1="6" y1="12" x2="18" y2="0" stroke="#000" stroke-width="1.2"/></pattern>
        <pattern id="leg_cross"    width="12" height="12" patternUnits="userSpaceOnUse"><line x1="0" y1="12" x2="12" y2="0"  stroke="#000" stroke-width="1.2"/><line x1="0" y1="0"  x2="12" y2="12" stroke="#000" stroke-width="1.2"/></pattern>
        <pattern id="leg_dots"     width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.5" fill="#000"/><circle cx="10" cy="10" r="1.5" fill="#000"/><circle cx="4" cy="10" r="1.5" fill="#000"/><circle cx="10" cy="4" r="1.5" fill="#000"/></pattern>
        <pattern id="leg_diagback" width="12" height="12" patternUnits="userSpaceOnUse"><line x1="0" y1="0"  x2="12" y2="12" stroke="#000" stroke-width="1.2"/><line x1="-6" y1="0" x2="6" y2="12"  stroke="#000" stroke-width="1.2"/><line x1="6" y1="0" x2="18" y2="12" stroke="#000" stroke-width="1.2"/></pattern>
        <pattern id="leg_sparse"   width="12" height="12" patternUnits="userSpaceOnUse"><line x1="0" y1="8"  x2="12" y2="8"  stroke="#000" stroke-width="1.2"/></pattern>
        <pattern id="leg_zigzag"   width="12" height="12" patternUnits="userSpaceOnUse"><polyline points="0,10 3,4 6,10 9,4 12,10" fill="none" stroke="#000" stroke-width="1.2"/></pattern>
      </defs>`;

    // ── Row 1: Shapes & Status ─────────────────────────
    const mStroke = isColorMode ? '#5681a8' : '#000';
    const mFill   = isColorMode ? '#eaf1f7' : '#fff';
    const fStroke = isColorMode ? '#c97171' : '#000';
    const fFill   = isColorMode ? '#f9ebeb' : '#fff';

    const shapesRow = `
      <g transform="translate(16, 18)">
        <text x="0" y="0" font-family="Outfit,sans-serif" font-size="8" font-weight="700" fill="${mutedColor}" text-transform="uppercase" letter-spacing="0.5">SHAPES &amp; STATUS</text>
        <!-- Male -->
        <rect x="0" y="6" width="16" height="16" fill="${mFill}" stroke="${mStroke}" stroke-width="1.5"/>
        <text x="22" y="18" font-family="Outfit,sans-serif" font-size="9" fill="${textColor}">Male</text>
        <!-- Female -->
        <circle cx="60" cy="14" r="8" fill="${fFill}" stroke="${fStroke}" stroke-width="1.5"/>
        <text x="72" y="18" font-family="Outfit,sans-serif" font-size="9" fill="${textColor}">Female</text>
        <!-- Other -->
        <polygon points="114,6 122,14 114,22 106,14" fill="${isColorMode ? '#faf5eb' : '#fff'}" stroke="${isColorMode ? '#c89c56' : '#000'}" stroke-width="1.5"/>
        <text x="126" y="18" font-family="Outfit,sans-serif" font-size="9" fill="${textColor}">Other</text>
        <!-- Deceased -->
        <rect x="166" y="6" width="16" height="16" fill="#fff" stroke="#000" stroke-width="1.5"/>
        <line x1="166" y1="6"  x2="182" y2="22" stroke="#000" stroke-width="1.5"/>
        <line x1="182" y1="6"  x2="166" y2="22" stroke="#000" stroke-width="1.5"/>
        <text x="186" y="18" font-family="Outfit,sans-serif" font-size="9" fill="${textColor}">Deceased</text>
        <!-- Proband -->
        <rect x="238" y="3"  width="22" height="22" fill="none" stroke="#000" stroke-width="1"/>
        <rect x="241" y="6" width="16" height="16" fill="#fff" stroke="#000" stroke-width="1.5"/>
        <text x="264" y="18" font-family="Outfit,sans-serif" font-size="9" fill="${textColor}">Proband</text>
        <!-- Adopted -->
        <path d="M 308 5 L 303 5 L 303 23 L 308 23" stroke="#000" stroke-width="1.5" fill="none"/>
        <rect x="310" y="6" width="16" height="16" fill="#fff" stroke="#000" stroke-width="1.5"/>
        <path d="M 326 5 L 331 5 L 331 23 L 326 23" stroke="#000" stroke-width="1.5" fill="none"/>
        <text x="336" y="18" font-family="Outfit,sans-serif" font-size="9" fill="${textColor}">Adopted</text>
      </g>`;

    // ── Row 2: Relationship lines ──────────────────────
    const relColor = isColorMode ? '#826f56' : '#000';
    const relsRow = `
      <g transform="translate(16, 52)">
        <text x="0" y="0" font-family="Outfit,sans-serif" font-size="8" font-weight="700" fill="${mutedColor}">RELATIONSHIPS</text>
        <line x1="0"   y1="10" x2="32" y2="10" stroke="${relColor}" stroke-width="2"/>
        <text x="36"  y="14" font-family="Outfit,sans-serif" font-size="9" fill="${textColor}">Married</text>
        <line x1="90"  y1="10" x2="122" y2="10" stroke="${relColor}" stroke-width="2" stroke-dasharray="4,4"/>
        <text x="126" y="14" font-family="Outfit,sans-serif" font-size="9" fill="${textColor}">Cohabiting</text>
        <line x1="198" y1="10" x2="230" y2="10" stroke="${relColor}" stroke-width="2"/>
        <line x1="209" y1="17" x2="215" y2="4" stroke="${relColor}" stroke-width="2"/>
        <text x="234" y="14" font-family="Outfit,sans-serif" font-size="9" fill="${textColor}">Separated</text>
        <line x1="308" y1="10" x2="340" y2="10" stroke="${relColor}" stroke-width="2"/>
        <line x1="318" y1="17" x2="324" y2="4" stroke="${relColor}" stroke-width="2"/>
        <line x1="325" y1="17" x2="331" y2="4" stroke="${relColor}" stroke-width="2"/>
        <text x="344" y="14" font-family="Outfit,sans-serif" font-size="9" fill="${textColor}">Divorced</text>
      </g>`;

    // ── Row 3: Medical conditions ──────────────────────
    const swatchSize = 12;
    let traitsRow = `<g transform="translate(16, 80)">
        <text x="0" y="0" font-family="Outfit,sans-serif" font-size="8" font-weight="700" fill="${mutedColor}">MEDICAL CONDITIONS (quadrant shading)</text>`;
    let tx = 0;
    traits.forEach(t => {
      const swatchFill = isColorMode
        ? `fill="${t.color}"`
        : `fill="url(#leg_${t.bw})"`;
      traitsRow += `
        <rect x="${tx}" y="6" width="${swatchSize}" height="${swatchSize}" ${swatchFill} stroke="#999" stroke-width="0.8"/>
        <text x="${tx + swatchSize + 3}" y="16" font-family="Outfit,sans-serif" font-size="8.5" fill="${textColor}">${t.label}</text>`;
      tx += swatchSize + 3 + t.label.length * 5.2 + 8;
    });
    traitsRow += `</g>`;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      ${patternDefs}
      <!-- Background -->
      <rect width="${W}" height="${H}" fill="${bg}"/>
      <!-- Top border line -->
      <line x1="0" y1="0" x2="${W}" y2="0" stroke="${borderColor}" stroke-width="1.5"/>
      <!-- Title badge -->
      <rect x="0" y="0" width="${W}" height="10" fill="${isColorMode ? '#f0ece0' : '#f5f5f5'}"/>
      <text x="${W/2}" y="7.5" font-family="Outfit,sans-serif" font-size="7" font-weight="700" fill="${mutedColor}" text-anchor="middle" letter-spacing="1">GENOGRAM LEGEND  ·  Genogram.studio</text>
      ${shapesRow}
      ${relsRow}
      ${traitsRow}
    </svg>`;
  },

  // Helper: Generate standalone SVG element string with embedded styles
  generateStandaloneSvgString(svgElement, people, isColorMode) {
    const clone = svgElement.cloneNode(true);
    
    // Get actual bounding box of content
    const bbox = this.getBoundingBox(people);
    
    // Remove translation applied to viewport group and set it directly in viewBox
    const viewportGroup = clone.querySelector("#viewportGroup");
    if (viewportGroup) {
      viewportGroup.removeAttribute("transform");
    }
    
    // Set style class on SVG root depending on mode
    if (!isColorMode) {
      clone.classList.add("bw-mode");
    } else {
      clone.classList.remove("bw-mode");
    }
    
    // Force background color on SVG
    clone.style.backgroundColor = isColorMode ? '#faf9f6' : '#ffffff';
    
    // Embed active CSS rules
    const styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");
    styleElement.textContent = this.getStyles();
    clone.insertBefore(styleElement, clone.firstChild);

    // ── Build composite SVG: diagram + legend strip ────
    const LEGEND_H = 110;
    const totalW = bbox.width;
    const totalH = bbox.height + LEGEND_H;

    const serializer = new XMLSerializer();

    // Diagram SVG — positioned at top with correct viewBox
    clone.setAttribute("viewBox", `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
    clone.setAttribute("width", bbox.width);
    clone.setAttribute("height", bbox.height);
    const diagSvgString = serializer.serializeToString(clone);

    // Legend SVG string
    const legendSvgString = this.buildLegendSvg(isColorMode, totalW);

    // Wrap both inside a composite outer SVG
    const bg = isColorMode ? '#faf9f6' : '#ffffff';
    const compositeSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${totalW}" height="${totalH}">
  <rect width="${totalW}" height="${totalH}" fill="${bg}"/>
  <!-- Diagram -->
  <image href="data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(diagSvgString)))}"
         x="0" y="0" width="${bbox.width}" height="${bbox.height}"/>
  <!-- Legend -->
  <image href="data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(legendSvgString)))}"
         x="0" y="${bbox.height}" width="${totalW}" height="${LEGEND_H}"/>
</svg>`;

    return compositeSvg;
  },

  // Export to Raster Image (PNG or JPEG)
  exportImage(svgElement, people, isColorMode, format = 'png') {
    const bbox = this.getBoundingBox(people);
    const svgString = this.generateStandaloneSvgString(svgElement, people, isColorMode);
    
    // Convert to base64
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      
      // Scale multiplier for high-DPI crisp print results
      const dpiScale = 3.0; 
      canvas.width = bbox.width * dpiScale;
      canvas.height = bbox.height * dpiScale;
      
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw background
      ctx.fillStyle = isColorMode ? '#faf9f6' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw SVG Image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Export Data URL
      const dataUrl = canvas.toDataURL(`image/${format}`, 0.95);
      
      // Download
      const link = document.createElement('a');
      link.download = `genogram-${Date.now()}.${format}`;
      link.href = dataUrl;
      link.click();
      
      // Clean up memory
      URL.revokeObjectURL(blobUrl);
    };
    
    img.onerror = (err) => {
      console.error("Rasterization failed:", err);
      alert("Export failed: Could not render SVG paths to image. Please try downloading as Vector SVG.");
      URL.revokeObjectURL(blobUrl);
    };
    
    img.src = blobUrl;
  },

  // Export raw SVG vector file
  exportSvg(svgElement, people, isColorMode) {
    const svgString = this.generateStandaloneSvgString(svgElement, people, isColorMode);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const link = document.createElement('a');
    link.download = `genogram-${Date.now()}.svg`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
  },

  // Generate Base64 image internally for PDF & Word exports
  getBase64Image(svgElement, people, isColorMode, callback) {
    const bbox = this.getBoundingBox(people);
    const svgString = this.generateStandaloneSvgString(svgElement, people, isColorMode);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const dpiScale = 2.0; // 2x is plenty for PDF inserts
      canvas.width = bbox.width * dpiScale;
      canvas.height = bbox.height * dpiScale;
      
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = isColorMode ? '#faf9f6' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      
      URL.revokeObjectURL(blobUrl);
      callback(dataUrl, bbox.width, bbox.height);
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      callback(null);
    };
    img.src = blobUrl;
  },

  // Export to PDF report
  exportPdf(svgElement, people, isColorMode) {
    if (!window.jspdf) {
      alert("PDF library is still loading. Please wait a moment and try again.");
      return;
    }
    
    this.getBase64Image(svgElement, people, isColorMode, (pngDataUrl, origW, origH) => {
      if (!pngDataUrl) {
        alert("Could not render the diagram for PDF generation.");
        return;
      }
      
      const { jsPDF } = window.jspdf;
      // Initialize A4 document (210mm x 297mm)
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });
      
      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      
      // PAGE 1: TITLE & DIAGRAM
      // Header Text
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(60, 51, 42); // Warm charcoal
      doc.text("Family Genogram & History Report", 15, 20);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(117, 104, 90); // Muted brown
      doc.text(`Generated on ${dateStr} | Genogram.studio`, 15, 26);
      
      // Divider
      doc.setDrawColor(228, 222, 203); // border-light
      doc.setLineWidth(0.4);
      doc.line(15, 29, 195, 29);
      
      // Fit image onto page width (180mm max width)
      const maxPdfW = 180;
      const pdfImageW = maxPdfW;
      const pdfImageH = pdfImageW * (origH / origW);
      
      // Limit height to keep it on Page 1 (max 150mm height for diagram)
      let finalW = pdfImageW;
      let finalH = pdfImageH;
      if (finalH > 160) {
        finalH = 160;
        finalW = finalH * (origW / origH);
      }
      
      // Center horizontally
      const imgX = 15 + (maxPdfW - finalW) / 2;
      const imgY = 35;
      
      // Draw diagram box border
      doc.setDrawColor(240, 235, 220);
      doc.setFillColor(isColorMode ? 250 : 255, isColorMode ? 249 : 255, isColorMode ? 246 : 255);
      doc.rect(15, imgY - 3, 180, finalH + 6, 'F');
      
      // Add Image
      doc.addImage(pngDataUrl, 'PNG', imgX, imgY, finalW, finalH);
      
      // Legend Title
      const legendY = imgY + finalH + 12;
      if (legendY < 265) {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(117, 104, 90);
        doc.text("CLINICAL GENOGRAM LEGEND", 15, legendY);
        
        // Horizontal divider for legend
        doc.setDrawColor(228, 222, 203);
        doc.line(15, legendY + 2, 195, legendY + 2);
        
        // Draw standard legend descriptions
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(60, 51, 42);
        
        // Col 1: Symbols
        doc.text("• Square: Male | Circle: Female", 18, legendY + 7);
        doc.text("• Diamond: Other | Triangle: Pregnancy", 18, legendY + 11);
        doc.text("• Overlaid X: Deceased | Double Border: Proband", 18, legendY + 15);
        doc.text("• Shape Brackets [ ]: Adopted Member", 18, legendY + 19);
        doc.text("• Centered Dot: Genetic Carrier", 18, legendY + 23);
        
        // Col 2: Relationships
        doc.text("• Solid Line: Married", 85, legendY + 7);
        doc.text("• Dashed Line: Cohabiting/Dating", 85, legendY + 11);
        doc.text("• Single Diagonal Slash: Separated", 85, legendY + 15);
        doc.text("• Double Diagonal Slash: Divorced", 85, legendY + 19);
        
        // Col 3: Traits
        doc.text("• Heart Disease: Red / 45° Stripes", 138, legendY + 7);
        doc.text("• Diabetes: Yellow-Orange / Dots", 138, legendY + 11);
        doc.text("• Hypertension: Cyan / Crosshatch", 138, legendY + 15);
        doc.text("• Cancer / Depression: Purple / Green", 138, legendY + 19);
        doc.text("• Hemophilia: Dark Red / Dense Diag.", 138, legendY + 23);
      }
      
      // PAGE 2: FAMILY REGISTER TABLE
      doc.addPage();
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(60, 51, 42);
      doc.text("Family Members Registry", 15, 20);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(117, 104, 90);
      doc.text("Detailed summary of family history and mapped characteristics.", 15, 25);
      
      doc.setDrawColor(228, 222, 203);
      doc.line(15, 28, 195, 28);
      
      // Draw Table Header
      let rowY = 35;
      doc.setFillColor(245, 240, 227); // #f5f0e3 cream background
      doc.rect(15, rowY, 180, 8, 'F');
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(60, 51, 42);
      doc.text("Name", 18, rowY + 5.5);
      doc.text("Gender", 55, rowY + 5.5);
      doc.text("Age", 75, rowY + 5.5);
      doc.text("Status", 92, rowY + 5.5);
      doc.text("Medical Conditions & Mapped Traits", 120, rowY + 5.5);
      
      rowY += 8;
      
      // Draw Rows
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      
      people.forEach((p, idx) => {
        // Zebra stripes
        if (idx % 2 === 1) {
          doc.setFillColor(250, 247, 240);
          doc.rect(15, rowY, 180, 8, 'F');
        }
        
        // Underline
        doc.setDrawColor(240, 235, 220);
        doc.line(15, rowY + 8, 195, rowY + 8);
        
        // Columns
        doc.setTextColor(60, 51, 42);
        // Name (truncate if too long)
        let nameTxt = p.name || "Unnamed Individual";
        if (nameTxt.length > 22) nameTxt = nameTxt.substring(0, 20) + "...";
        doc.text(nameTxt, 18, rowY + 5.5);
        
        const genStr = p.gender === 'M' ? 'Male' : (p.gender === 'F' ? 'Female' : 'Other');
        doc.text(genStr, 55, rowY + 5.5);
        doc.text(p.age || "—", 75, rowY + 5.5);
        
        const statStr = p.isDeceased ? `Deceased (d. ${p.deathYear || 'N/A'})` : 'Alive';
        doc.text(statStr, 92, rowY + 5.5);
        
        const traitNames = p.traits.map(t => t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')).join(', ') || 'Healthy / No mapped traits';
        doc.text(traitNames, 120, rowY + 5.5);
        
        rowY += 8;
        
        // Page break if list is long
        if (rowY > 275) {
          doc.addPage();
          rowY = 20;
          
          // Re-draw headers
          doc.setFillColor(245, 240, 227);
          doc.rect(15, rowY, 180, 8, 'F');
          doc.setFont('Helvetica', 'bold');
          doc.setTextColor(60, 51, 42);
          doc.text("Name", 18, rowY + 5.5);
          doc.text("Gender", 55, rowY + 5.5);
          doc.text("Age", 75, rowY + 5.5);
          doc.text("Status", 92, rowY + 5.5);
          doc.text("Medical Conditions & Mapped Traits", 120, rowY + 5.5);
          rowY += 8;
          doc.setFont('Helvetica', 'normal');
        }
      });
      
      // Save PDF
      doc.save(`genogram-report-${Date.now()}.pdf`);
    });
  },

  // Export to Microsoft Word (DOC)
  exportWord(svgElement, people, isColorMode) {
    this.getBase64Image(svgElement, people, isColorMode, (pngDataUrl, origW, origH) => {
      if (!pngDataUrl) {
        alert("Could not render diagram for Word document generation.");
        return;
      }
      
      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      
      // Compile rows of family members for the table
      let rowsHtml = "";
      people.forEach((p, idx) => {
        const genderText = p.gender === 'M' ? 'Male' : (p.gender === 'F' ? 'Female' : 'Other');
        const statusText = p.isDeceased ? `Deceased (d. ${p.deathYear || 'N/A'})` : 'Alive';
        const ageText = p.age || 'Unknown';
        const traitsList = p.traits.map(t => t.replace('_', ' ')).join(', ') || 'None';
        
        rowsHtml += `
          <tr style="background-color: ${idx % 2 === 1 ? '#FAF7F0' : '#FFFFFF'};">
            <td style="border: 1px solid #E4DECB; padding: 8px; font-family: sans-serif; font-size: 10pt;">${p.name}</td>
            <td style="border: 1px solid #E4DECB; padding: 8px; font-family: sans-serif; font-size: 10pt;">${genderText}</td>
            <td style="border: 1px solid #E4DECB; padding: 8px; font-family: sans-serif; font-size: 10pt;">${ageText}</td>
            <td style="border: 1px solid #E4DECB; padding: 8px; font-family: sans-serif; font-size: 10pt;">${statusText}</td>
            <td style="border: 1px solid #E4DECB; padding: 8px; font-family: sans-serif; font-size: 10pt;">${traitsList}</td>
          </tr>
        `;
      });
      
      // HTML format MS Word accepts natively (including Base64 image embeds!)
      const wordHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:w="urn:schemas-microsoft-com:office:word" 
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>Family Genogram & History Report</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              color: #3C332A;
              margin: 20px;
            }
            h1 {
              font-family: 'Georgia', 'Times New Roman', serif;
              color: #3C332A;
              font-size: 22pt;
              border-bottom: 2px solid #E4DECB;
              padding-bottom: 8px;
              margin-bottom: 15px;
            }
            .metadata {
              font-family: 'Segoe UI', Arial, sans-serif;
              font-size: 9.5pt;
              color: #75685A;
              margin-bottom: 25px;
            }
            .canvas-box {
              border: 1px solid #E4DECB;
              background-color: #FAF9F6;
              padding: 15px;
              text-align: center;
              margin-bottom: 30px;
            }
            .diagram-img {
              max-width: 100%;
              height: auto;
            }
            h2 {
              font-family: 'Georgia', 'Times New Roman', serif;
              color: #75685A;
              font-size: 15pt;
              margin-top: 30px;
              border-bottom: 1px dashed #E4DECB;
              padding-bottom: 4px;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin-top: 12px;
            }
            th {
              background-color: #F5F0E3;
              border: 1px solid #E4DECB;
              padding: 10px;
              font-family: sans-serif;
              font-size: 10pt;
              font-weight: bold;
              text-align: left;
              color: #3C332A;
            }
          </style>
        </head>
        <body>
          <h1>Family Genogram & History Report</h1>
          <div class="metadata">
            Generated on ${dateStr} | Mapped utilizing Genogram.studio
          </div>
          
          <div class="canvas-box">
            <img class="diagram-img" src="${pngDataUrl}" width="600" alt="Family Genogram Diagram" />
          </div>
          
          <h2>Family Members Registry</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Gender</th>
                <th>Age</th>
                <th>Life Status</th>
                <th>Medical Conditions & Traits</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
        </html>
      `;
      
      // Convert to blob and trigger download as .doc file
      const blob = new Blob([wordHtml], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.download = `genogram-report-${Date.now()}.doc`;
      link.href = url;
      link.click();
      
      URL.revokeObjectURL(url);
    });
  }
};
