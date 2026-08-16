import { CHAPTERS, DISTRICTS, STATES } from "../mockData";
import { FinancialUnit, OrgLevel, User } from "../types";

export const NATIONAL_FINANCIAL_UNIT_ID = "national";

export const FINANCIAL_UNITS: FinancialUnit[] = [
  { id: NATIONAL_FINANCIAL_UNIT_ID, name: "National Chapter", level: OrgLevel.National },
  ...STATES.map((state) => ({ id: state.id, name: `${state.name} State Chapter`, level: OrgLevel.State, parentId: NATIONAL_FINANCIAL_UNIT_ID })),
  ...DISTRICTS.map((district) => ({ id: district.id, name: `${district.name} District Chapter`, level: OrgLevel.District, parentId: district.stateId })),
  ...CHAPTERS.map((chapter) => ({ id: chapter.id, name: chapter.name, level: OrgLevel.Local, parentId: chapter.districtId })),
];

export const getUserFinancialUnitId = (user: User) =>
  user.level === OrgLevel.National ? NATIONAL_FINANCIAL_UNIT_ID : user.nodeId || "";

export const getFinancialUnit = (id?: string) => FINANCIAL_UNITS.find((unit) => unit.id === id);

export const getFinancialUnitName = (id?: string) => {
  if (!id) return "Unknown chapter";
  const unit = getFinancialUnit(id);
  if (unit) return unit.name;

  const mappedNodeId = KNOWN_CODE_TO_UNITS[id.toUpperCase()];
  if (mappedNodeId) {
    const mappedUnit = getFinancialUnit(mappedNodeId);
    if (mappedUnit) return mappedUnit.name;
  }

  return id;
};

/* ---------------- Standard chapter code generation ---------------- */

const STATE_CODES: Record<string, string> = {
  kerala: "KL",
  tamil_nadu: "TN",
  andhra_pradesh: "AP",
  karnataka: "KA",
};

const DISTRICT_CODES: Record<string, string> = {
  // Kerala
  thiruvananthapuram: "TVM",
  trivandrum: "TVM",
  kollam: "KO",
  pathanamthitta: "PT",
  kottayam: "KT",
  thrissur: "TS",
  ernakulam: "EK",
  malappuram: "MA",
  kozhikode: "KZ",
  calicut: "KZ",
  wayanad: "WY",
  kasaragod: "KS",
  kannur: "KN",
  palakkad: "PK",

  // Tamil Nadu
  chennai: "CH",
  coimbatore: "CB",
  madurai: "MD",
  salem: "SA",
  tiruchirappalli: "TR",
  trichy: "TR",

  // Andhra Pradesh
  visakhapatnam: "VS",
  vijayawada: "VJ",
  guntur: "GU",
  tirupati: "TP",

  // Karnataka
  bangalore: "BL",
  bengaluru: "BL",
  mysuru: "MY",
  mysore: "MY",
  mangaluru: "MN",
  mangalore: "MN",
  hubballi: "HB",
  hubli: "HB",
  belagavi: "BG",
  belgaum: "BG",
};

const NATIONAL_CODE = "DL-ND-HQ00";

const initials = (name: string) => {
  const words = name.replace(/\bchapter\b/gi, "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "XX";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const stateCode = (stateId: string) =>
  STATE_CODES[stateId] || initials(STATES.find((s) => s.id === stateId)?.name || stateId);

const districtCode = (districtId: string) =>
  DISTRICT_CODES[districtId] || initials(DISTRICTS.find((d) => d.id === districtId)?.name || districtId);

/**
 * Returns the official, standard chapter code for a financial unit id,
 * e.g. "KL-EK-CO01" (local), "KL-EK-DT00" (district), "KL-ST00" (state).
 */
export const KNOWN_CHAPTER_CODES: Record<string, string> = {
  cochin: "KL-EK-CO01",
  aluva: "KL-EK-AL02",
  calicut_city: "KL-KZ-CC01",
  chennai_central: "TN-CN-CC01",
  bangalore_north: "KA-BN-BN01",
  national: "DL-ND-HQ00",
};

export const KNOWN_CODE_TO_UNITS: Record<string, string> = {
  "KL-EK-CO01": "cochin",
  "KL-EK-AL02": "aluva",
  "KL-KZ-CC01": "calicut_city",
  "TN-CN-CC01": "chennai_central",
  "KA-BN-BN01": "bangalore_north",
  "DL-ND-HQ00": "national",
};

export const getChapterCode = (unitId?: string): string => {
  if (!unitId) return "";
  if (unitId === NATIONAL_FINANCIAL_UNIT_ID) return NATIONAL_CODE;

  const upper = unitId.toUpperCase();
  if (KNOWN_CODE_TO_UNITS[upper]) return upper;
  if (KNOWN_CHAPTER_CODES[unitId.toLowerCase()]) return KNOWN_CHAPTER_CODES[unitId.toLowerCase()];

  const state = STATES.find((s) => s.id === unitId);
  if (state) return `${stateCode(state.id)}-ST00`;

  const district = DISTRICTS.find((d) => d.id === unitId);
  if (district) return `${stateCode(district.stateId)}-${districtCode(district.id)}-DT00`;

  const chapter = CHAPTERS.find((c) => c.id === unitId);
  if (chapter) {
    const dist = DISTRICTS.find((d) => d.id === chapter.districtId);
    const siblings = CHAPTERS.filter((c) => c.districtId === chapter.districtId);
    const index = siblings.findIndex((c) => c.id === chapter.id) + 1;
    const sc = dist ? stateCode(dist.stateId) : "XX";
    const dc = dist ? districtCode(dist.id) : "XX";
    return `${sc}-${dc}-${initials(chapter.name)}${String(index).padStart(2, "0")}`;
  }

  return unitId;
};

export const getReadableFinancialUnitIds = (user: User) => {
  const rootId = getUserFinancialUnitId(user);
  const readable = new Set<string>([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    FINANCIAL_UNITS.forEach((unit) => {
      if (unit.parentId && readable.has(unit.parentId) && !readable.has(unit.id)) {
        readable.add(unit.id);
        changed = true;
      }
    });
  }
  return [...readable];
};

export const isReadableFinancialUnit = (user: User, unitId?: string) =>
  !!unitId && getReadableFinancialUnitIds(user).includes(unitId);

export const isWritableFinancialUnit = (user: User, unitId?: string) =>
  user.role === "Treasurer" && unitId === getUserFinancialUnitId(user);
