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
      { id: "p_mary", name: "Mary Vance", gender: "F", birthYear: "1982", deathYear: "", age: "44", isDeceased: false, traits: ["depression"], x: 450, y: 150 },
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
  },

  adoptionStandard: {
    name: "Adoption & Biological Parents",
    description: "A standard clinical study showing an adopted child Tommy Vance-Smith, who is legally adopted by David & Susan (solid line & brackets) and biologically related to John & Mary (divorced).",
    people: [
      // Adoptive parents (David & Susan Smith)
      { id: "ad_father", name: "David Smith (Adoptive Father)", gender: "M", birthYear: "1975", deathYear: "", age: "51", isDeceased: false, traits: ["hypertension"], x: 400, y: 100 },
      { id: "ad_mother", name: "Susan Smith (Adoptive Mother)", gender: "F", birthYear: "1977", deathYear: "", age: "49", isDeceased: false, traits: ["diabetes"], x: 580, y: 100 },
      
      // Biological parents (John & Mary Vance)
      { id: "bio_father", name: "John Vance (Bio Father)", gender: "M", birthYear: "1978", deathYear: "", age: "48", isDeceased: false, traits: ["substance_abuse"], x: 100, y: 100 },
      { id: "bio_mother", name: "Mary Vance (Bio Mother)", gender: "F", birthYear: "1980", deathYear: "", age: "46", isDeceased: false, traits: ["depression"], x: 260, y: 100 },
      
      // Adopted Child (Tommy)
      { id: "ad_child", name: "Tommy Vance-Smith", gender: "M", birthYear: "2010", deathYear: "", age: "16", isDeceased: false, isAdopted: true, traits: ["asthma"], x: 490, y: 280 }
    ],
    relationships: [
      { id: "rel_adoptive", type: "married", personA: "ad_father", personB: "ad_mother" },
      { id: "rel_biological", type: "divorced", personA: "bio_father", personB: "bio_mother" }
    ],
    children: [
      // Link child to adoptive parents
      { childId: "ad_child", parentType: "relationship", parentId: "rel_adoptive" },
      // Link child to biological parents
      { childId: "ad_child", parentType: "relationship", parentId: "rel_biological" }
    ]
  },

  skywalkerDynasty: {
    name: "Skywalker Family (Star Wars)",
    description: "The legendary Skywalker dynasty, showcasing single motherhood (Shmi), marriages, deceased marks, and adoption brackets (Princess Leia adopted by Bail & Queen Breha).",
    people: [
      // Gen 1
      { id: "shmi", name: "Shmi Skywalker", gender: "F", birthYear: "72BBY", deathYear: "22BBY", age: "50", isDeceased: true, traits: [], x: 200, y: 80 },
      
      // Gen 2
      { id: "anakin", name: "Anakin Skywalker / Vader", gender: "M", birthYear: "41BBY", deathYear: "4ABY", age: "45", isDeceased: true, traits: ["substance_abuse", "depression"], x: 200, y: 240 },
      { id: "padme", name: "Padmé Amidala", gender: "F", birthYear: "46BBY", deathYear: "19BBY", age: "27", isDeceased: true, traits: [], x: 380, y: 240 },
      
      // Adoptive Parents of Leia
      { id: "bail", name: "Bail Organa (Adoptive Father)", gender: "M", birthYear: "67BBY", deathYear: "0BBY", age: "67", isDeceased: true, traits: [], x: 560, y: 240 },
      { id: "breha", name: "Queen Breha (Adoptive Mother)", gender: "F", birthYear: "64BBY", deathYear: "0BBY", age: "64", isDeceased: true, traits: [], x: 720, y: 240 },

      // Gen 3
      { id: "luke", name: "Luke Skywalker", gender: "M", birthYear: "19BBY", deathYear: "34ABY", age: "53", isDeceased: true, traits: [], x: 180, y: 420 },
      { id: "leia", name: "Leia Organa", gender: "F", birthYear: "19BBY", deathYear: "35ABY", age: "54", isDeceased: true, isAdopted: true, traits: [], x: 420, y: 420 },
      { id: "han", name: "Han Solo", gender: "M", birthYear: "32BBY", deathYear: "34ABY", age: "66", isDeceased: true, traits: [], x: 600, y: 420 },
      
      // Gen 4
      { id: "ben", name: "Ben Solo / Kylo Ren", gender: "M", birthYear: "5ABY", deathYear: "35ABY", age: "30", isDeceased: true, traits: ["depression"], x: 510, y: 600 }
    ],
    relationships: [
      { id: "rel_anakin_padme", type: "married", personA: "anakin", personB: "padme" },
      { id: "rel_bail_breha", type: "married", personA: "bail", personB: "breha" },
      { id: "rel_han_leia", type: "married", personA: "han", personB: "leia" }
    ],
    children: [
      { childId: "anakin", parentType: "individual", parentId: "shmi" },
      { childId: "luke", parentType: "relationship", parentId: "rel_anakin_padme" },
      { childId: "leia", parentType: "relationship", parentId: "rel_anakin_padme" },
      { childId: "leia", parentType: "relationship", parentId: "rel_bail_breha" },
      { childId: "ben", parentType: "relationship", parentId: "rel_han_leia" }
    ]
  },

  royalHemophilia: {
    name: "British Royal Family (Hemophilia)",
    description: "The classic pedigree illustrating the inheritance of hemophilia. Queen Victoria (carrier, central dot) passed the carrier gene to daughters Alice and Beatrice, and the affected gene to son Leopold.",
    people: [
      // Gen 1
      { id: "vic", name: "Queen Victoria", gender: "F", birthYear: "1819", deathYear: "1901", age: "81", isDeceased: true, traits: ["hemophilia_carrier"], x: 300, y: 100 },
      { id: "alb", name: "Prince Albert", gender: "M", birthYear: "1819", deathYear: "1861", age: "42", isDeceased: true, traits: [], x: 500, y: 100 },
      
      // Gen 2
      { id: "alice", name: "Princess Alice (Carrier)", gender: "F", birthYear: "1843", deathYear: "1878", age: "35", isDeceased: true, traits: ["hemophilia_carrier"], x: 180, y: 280 },
      { id: "leopold", name: "Prince Leopold (Affected)", gender: "M", birthYear: "1853", deathYear: "1884", age: "30", isDeceased: true, traits: ["hemophilia"], x: 400, y: 280 },
      { id: "beatrice", name: "Princess Beatrice (Carrier)", gender: "F", birthYear: "1857", deathYear: "1944", age: "87", isDeceased: true, traits: ["hemophilia_carrier"], x: 620, y: 280 },
      { id: "louis", name: "Prince Louis of Battenberg", gender: "M", birthYear: "1854", deathYear: "1921", age: "67", isDeceased: true, traits: [], x: 780, y: 280 },

      // Gen 3 (Descendants via Alice)
      { id: "alix", name: "Alix of Hesse (Tsarina Alexandra)", gender: "F", birthYear: "1872", deathYear: "1918", age: "46", isDeceased: true, traits: ["hemophilia_carrier"], x: 150, y: 460 },
      { id: "nicholas", name: "Tsar Nicholas II", gender: "M", birthYear: "1868", deathYear: "1918", age: "50", isDeceased: true, traits: [], x: 310, y: 460 },
      
      // Descendants via Beatrice
      { id: "victoria_e", name: "Victoria Eugenie (Queen of Spain)", gender: "F", birthYear: "1887", deathYear: "1969", age: "81", isDeceased: true, traits: ["hemophilia_carrier"], x: 700, y: 460 },
      
      // Gen 4 (Alexei via Alix & Nicholas)
      { id: "alexei", name: "Tsarevich Alexei (Affected)", gender: "M", birthYear: "1904", deathYear: "1918", age: "13", isDeceased: true, traits: ["hemophilia"], x: 230, y: 640 }
    ],
    relationships: [
      { id: "rel_vic_alb", type: "married", personA: "vic", personB: "alb" },
      { id: "rel_beatrice_louis", type: "married", personA: "beatrice", personB: "louis" },
      { id: "rel_alix_nicholas", type: "married", personA: "alix", personB: "nicholas" }
    ],
    children: [
      { childId: "alice", parentType: "relationship", parentId: "rel_vic_alb" },
      { childId: "leopold", parentType: "relationship", parentId: "rel_vic_alb" },
      { childId: "beatrice", parentType: "relationship", parentId: "rel_vic_alb" },
      { childId: "alix", parentType: "individual", parentId: "alice" },
      { childId: "victoria_e", parentType: "relationship", parentId: "rel_beatrice_louis" },
      { childId: "alexei", parentType: "relationship", parentId: "rel_alix_nicholas" }
    ]
  }
};
