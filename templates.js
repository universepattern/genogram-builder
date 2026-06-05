// Genogram Predefined Templates
const GENOGRAM_TEMPLATES = {
  threeGeneration: {
    name: "Standard 3-Generation Family",
    description: "A standard family structure spanning three generations, showing grandparents, parents, an uncle, and siblings.",
    people: [
      // Generation 1 (Grandparents)
      { id: "g1_m", name: "Arthur Smith", gender: "M", birthYear: "1951", deathYear: "", age: "75", isDeceased: false, traits: ["heart_disease"], x: 350, y: 100 },
      { id: "g1_f", name: "Eleanor Smith", gender: "F", birthYear: "1954", deathYear: "2022", age: "68", isDeceased: true, traits: ["diabetes"], x: 550, y: 100 },
      
      // Generation 2 (Parents & Uncle)
      { id: "g2_father", name: "Robert Smith", gender: "M", birthYear: "1978", deathYear: "", age: "48", isDeceased: false, traits: ["hypertension"], x: 300, y: 280 },
      { id: "g2_mother", name: "Sarah Smith", gender: "F", birthYear: "1980", deathYear: "", age: "46", isDeceased: false, traits: ["depression"], x: 500, y: 280 },
      { id: "g2_uncle", name: "Thomas Smith", gender: "M", birthYear: "1982", deathYear: "", age: "44", isDeceased: false, traits: ["substance_abuse"], x: 700, y: 280 },
      
      // Generation 3 (Children)
      { id: "g3_son", name: "David Smith", gender: "M", birthYear: "2006", deathYear: "", age: "20", isDeceased: false, traits: ["asthma"], x: 320, y: 460 },
      { id: "g3_daughter", name: "Emily Smith", gender: "F", birthYear: "2008", deathYear: "", age: "18", isDeceased: false, traits: [], x: 480, y: 460 }
    ],
    relationships: [
      { id: "rel_g1", type: "married", personA: "g1_m", personB: "g1_f" },
      { id: "rel_parents", type: "married", personA: "g2_father", personB: "g2_mother" }
    ],
    children: [
      // Children of Grandparents (Robert and Thomas)
      { childId: "g2_father", parentType: "relationship", parentId: "rel_g1" },
      { childId: "g2_uncle", parentType: "relationship", parentId: "rel_g1" },
      // Children of Parents (David and Emily)
      { childId: "g3_son", parentType: "relationship", parentId: "rel_parents" },
      { childId: "g3_daughter", parentType: "relationship", parentId: "rel_parents" }
    ]
  },
  
  blendedFamily: {
    name: "Blended / Reconstituted Family",
    description: "A complex family showing divorce, remarriage, step-parents, half-siblings, and cohabitation.",
    people: [
      { id: "p_john", name: "John Doe", gender: "M", birthYear: "1980", deathYear: "", age: "46", isDeceased: false, traits: [], x: 250, y: 150 },
      { id: "p_mary", name: "Mary Vance", gender: "F", birthYear: "1982", deathYear: "", age: "44", isDeceased: false, traits: ["anxiety"], x: 450, y: 150 },
      { id: "p_lisa", name: "Lisa Vance", gender: "F", birthYear: "1983", deathYear: "", age: "43", isDeceased: false, traits: [], x: 650, y: 150 },
      
      // Children of John & Mary (Divorced)
      { id: "c_jake", name: "Jake Doe", gender: "M", birthYear: "2005", deathYear: "", age: "21", isDeceased: false, traits: [], x: 200, y: 350 },
      { id: "c_chloe", name: "Chloe Doe", gender: "F", birthYear: "2008", deathYear: "", age: "18", isDeceased: false, traits: [], x: 350, y: 350 },
      
      // Child of Mary & Lisa (Cohabiting / Adopted or Step)
      { id: "c_lily", name: "Lily Vance", gender: "F", birthYear: "2015", deathYear: "", age: "11", isDeceased: false, traits: [], x: 550, y: 350 }
    ],
    relationships: [
      { id: "rel_john_mary", type: "divorced", personA: "p_john", personB: "p_mary" },
      { id: "rel_mary_lisa", type: "cohabitation", personA: "p_mary", personB: "p_lisa" }
    ],
    children: [
      { childId: "c_jake", parentType: "relationship", parentId: "rel_john_mary" },
      { childId: "c_chloe", parentType: "relationship", parentId: "rel_john_mary" },
      { childId: "c_lily", parentType: "relationship", parentId: "rel_mary_lisa" }
    ]
  },
  
  medicalStudy: {
    name: "Medical Case History",
    description: "Three generations tracking the inheritance of heart disease, type 2 diabetes, and cancer across generations.",
    people: [
      // Gen 1
      { id: "m_gf", name: "Albert (Grandpa)", gender: "M", birthYear: "1940", deathYear: "2010", age: "70", isDeceased: true, traits: ["heart_disease", "hypertension"], x: 300, y: 100 },
      { id: "m_gm", name: "Martha (Grandma)", gender: "F", birthYear: "1945", deathYear: "2018", age: "73", isDeceased: true, traits: ["diabetes", "cancer"], x: 500, y: 100 },
      
      // Gen 2
      { id: "m_uncle", name: "Uncle Frank", gender: "M", birthYear: "1968", deathYear: "", age: "58", isDeceased: false, traits: ["heart_disease"], x: 200, y: 280 },
      { id: "m_aunt", name: "Aunt Helen", gender: "F", birthYear: "1970", deathYear: "", age: "56", isDeceased: false, traits: ["diabetes"], x: 380, y: 280 },
      { id: "m_mother", name: "Mother (Jane)", gender: "F", birthYear: "1973", deathYear: "", age: "53", isDeceased: false, traits: ["hypertension", "diabetes"], x: 560, y: 280 },
      { id: "m_father", name: "Father (George)", gender: "M", birthYear: "1971", deathYear: "", age: "55", isDeceased: false, traits: ["heart_disease"], x: 740, y: 280 },
      
      // Gen 3
      { id: "m_patient", name: "Patient (Jack)", gender: "M", birthYear: "1998", deathYear: "", age: "28", isDeceased: false, traits: ["diabetes", "hypertension", "heart_disease"], x: 650, y: 460 }
    ],
    relationships: [
      { id: "rel_gen1", type: "married", personA: "m_gf", personB: "m_gm" },
      { id: "rel_gen2", type: "married", personA: "m_father", personB: "m_mother" }
    ],
    children: [
      { childId: "m_uncle", parentType: "relationship", parentId: "rel_gen1" },
      { childId: "m_aunt", parentType: "relationship", parentId: "rel_gen1" },
      { childId: "m_mother", parentType: "relationship", parentId: "rel_gen1" },
      { childId: "m_patient", parentType: "relationship", parentId: "rel_gen2" }
    ]
  }
};
