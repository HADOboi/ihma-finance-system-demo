import { OrgLevel } from "../types";
import { CHAPTERS, DISTRICTS, STATES } from "../mockData";
import { getChapterCode, NATIONAL_FINANCIAL_UNIT_ID } from "./financialUnits";

export function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

const STATE_CODE_TO_ID: Record<string, string> = {
  IN: "national",
  KL: "kerala",
  TN: "tamil_nadu",
  AP: "andhra_pradesh",
  KA: "karnataka",
};

const DISTRICT_CODE_TO_ID: Record<string, string> = {
  // Kerala
  TVM: "thiruvananthapuram",
  KO: "kollam",
  PT: "pathanamthitta",
  KT: "kottayam",
  TS: "thrissur",
  EK: "ernakulam",
  MA: "malappuram",
  KZ: "kozhikode",
  WY: "wayanad",
  KS: "kasaragod",
  KN: "kannur",
  PK: "palakkad",

  // Tamil Nadu
  CH: "chennai",
  CN: "chennai",
  CB: "coimbatore",
  MD: "madurai",
  SA: "salem",
  TR: "tiruchirappalli",

  // Andhra Pradesh
  VS: "visakhapatnam",
  VJ: "vijayawada",
  GU: "guntur",
  TP: "tirupati",

  // Karnataka
  BL: "bangalore",
  BN: "bangalore",
  MY: "mysuru",
  MN: "mangaluru",
  HB: "hubballi",
  BG: "belagavi",
};

/** Username / alias prefixes mapped to district slugs */
const DISTRICT_PREFIXES: Record<string, string> = {
  // Kerala
  tvm: "thiruvananthapuram",
  trivandrum: "thiruvananthapuram",
  thiruvananthapuram: "thiruvananthapuram",
  ko: "kollam",
  kollam: "kollam",
  pt: "pathanamthitta",
  pathanamthitta: "pathanamthitta",
  kt: "kottayam",
  kottayam: "kottayam",
  ts: "thrissur",
  thrissur: "thrissur",
  tcr: "thrissur",
  ek: "ernakulam",
  ekm: "ernakulam",
  ernakulam: "ernakulam",
  cochin: "ernakulam",
  ma: "malappuram",
  mlp: "malappuram",
  malappuram: "malappuram",
  kz: "kozhikode",
  kzd: "kozhikode",
  kozhikode: "kozhikode",
  calicut: "kozhikode",
  wy: "wayanad",
  wayanad: "wayanad",
  ks: "kasaragod",
  kasaragod: "kasaragod",
  kn: "kannur",
  kannur: "kannur",
  can: "kannur",
  pk: "palakkad",
  pkd: "palakkad",
  palakkad: "palakkad",

  // Tamil Nadu
  ch: "chennai",
  chennai: "chennai",
  cb: "coimbatore",
  cbe: "coimbatore",
  coimbatore: "coimbatore",
  md: "madurai",
  mdu: "madurai",
  madurai: "madurai",
  sa: "salem",
  salem: "salem",
  tr: "tiruchirappalli",
  try: "tiruchirappalli",
  trichy: "tiruchirappalli",
  tiruchirappalli: "tiruchirappalli",

  // Andhra Pradesh
  vs: "visakhapatnam",
  vizag: "visakhapatnam",
  visakhapatnam: "visakhapatnam",
  vj: "vijayawada",
  vij: "vijayawada",
  vijayawada: "vijayawada",
  gu: "guntur",
  guntur: "guntur",
  tp: "tirupati",
  tpt: "tirupati",
  tirupati: "tirupati",

  // Karnataka
  bl: "bangalore",
  blr: "bangalore",
  bangalore: "bangalore",
  bengaluru: "bangalore",
  my: "mysuru",
  mysore: "mysuru",
  mysuru: "mysuru",
  mn: "mangaluru",
  mangalore: "mangaluru",
  mangaluru: "mangaluru",
  hb: "hubballi",
  hubli: "hubballi",
  hubballi: "hubballi",
  bg: "belagavi",
  belgaum: "belagavi",
  belagavi: "belagavi",
};

const STATE_PREFIXES: Record<string, string> = {
  kerala: "kerala",
  kl: "kerala",
  tamil: "tamil_nadu",
  tn: "tamil_nadu",
  tamil_nadu: "tamil_nadu",
  andhra: "andhra_pradesh",
  ap: "andhra_pradesh",
  andhra_pradesh: "andhra_pradesh",
  karnataka: "karnataka",
  ka: "karnataka",
};

export interface OrgContext {
  level: OrgLevel;
  nodeId: string;
}

export function normalizeUnitId(id?: string): string {
  return slugify(id || "");
}

export function districtMatches(userDistrictId: string, chapterDistrictId: string): boolean {
  const a = normalizeUnitId(userDistrictId);
  const b = normalizeUnitId(chapterDistrictId);
  if (!a || !b) return false;
  if (a === b) return true;
  if (DISTRICT_PREFIXES[a] && DISTRICT_PREFIXES[a] === DISTRICT_PREFIXES[b]) return true;
  if (DISTRICT_PREFIXES[a] && DISTRICT_PREFIXES[a] === b) return true;
  if (DISTRICT_PREFIXES[b] && DISTRICT_PREFIXES[b] === a) return true;
  return a.includes(b) || b.includes(a);
}

export function isEntityInScope(
  entityUnitId: string | undefined,
  selectedUnitIds: string[]
): boolean {
  if (!entityUnitId) return false;
  if (selectedUnitIds.length === 0) return false;
  if (selectedUnitIds.includes(entityUnitId)) return true;
  const slug = slugify(entityUnitId);
  for (const sel of selectedUnitIds) {
    if (!sel) continue;
    if (slug === slugify(sel)) return true;
    if (districtMatches(sel, entityUnitId)) return true;
  }
  return false;
}

export function parseChapterCodeToOrg(chapterCode: string): OrgContext | null {
  const code = chapterCode.trim().toUpperCase();
  if (!code) return null;

  if (code === "IN" || code.startsWith("IN-") || code.includes("ND-HQ") || (code.startsWith("DL") && code.includes("HQ"))) {
    return { level: OrgLevel.National, nodeId: NATIONAL_FINANCIAL_UNIT_ID };
  }

  // Exact 2-letter state code e.g. "KL", "TN", "KA", "AP"
  if (STATE_CODE_TO_ID[code]) {
    return { level: OrgLevel.State, nodeId: STATE_CODE_TO_ID[code] };
  }

  // State code pattern e.g. "KL-ST00" or "KL-MEM001"
  const stateMatch = code.match(/^([A-Z]{2})-(?:ST00|MEM\d+)$/);
  if (stateMatch && STATE_CODE_TO_ID[stateMatch[1]]) {
    const nodeId = STATE_CODE_TO_ID[stateMatch[1]];
    return { level: OrgLevel.State, nodeId };
  }

  // District code pattern e.g. "KL-TVM", "KL-EK", "KL-EK-DT00", "KL-EK-MEM001"
  const districtMatch = code.match(/^([A-Z]{2})-([A-Z]{2,4})(?:-DT00|-MEM\d+)?$/);
  if (districtMatch) {
    const distKey = districtMatch[2];
    const nodeId = DISTRICT_CODE_TO_ID[distKey] || DISTRICT_PREFIXES[distKey.toLowerCase()] || slugify(distKey);
    return { level: OrgLevel.District, nodeId };
  }

  // Local chapter code pattern e.g. "KL-EK-CO01", "KL-MA-PER01", "KL-TVM-ATT01-MEM001"
  const localMatch = code.match(/^([A-Z]{2})-([A-Z]{2,4})-([A-Z0-9]+)(?:-MEM\d+)?$/);
  if (localMatch && !localMatch[3].startsWith("DT")) {
    const distKey = localMatch[2];
    const districtId = DISTRICT_CODE_TO_ID[distKey] || DISTRICT_PREFIXES[distKey.toLowerCase()];
    if (districtId) {
      const districtChapters = CHAPTERS.filter((chapter) => chapter.districtId === districtId);
      const byCode = districtChapters.find((chapter) => getChapterCode(chapter.id).toUpperCase() === code);
      if (byCode) return { level: OrgLevel.Local, nodeId: byCode.id };

      const suffix = localMatch[3].slice(0, 3).toLowerCase();
      const bySuffix = districtChapters.find(
        (chapter) =>
          slugify(chapter.name).includes(suffix) ||
          chapter.id.startsWith(suffix) ||
          slugify(chapter.id).includes(suffix)
      );
      if (bySuffix) return { level: OrgLevel.Local, nodeId: bySuffix.id };
    }
    return { level: OrgLevel.Local, nodeId: slugify(code) };
  }

  return null;
}

export function matchOrgFromSlug(text: string): OrgContext | null {
  const slug = slugify(text);
  if (!slug) return null;

  if (slug === "national" || slug === "in" || slug.includes("all_india") || slug.startsWith("nat_")) {
    return { level: OrgLevel.National, nodeId: NATIONAL_FINANCIAL_UNIT_ID };
  }

  for (const state of STATES) {
    const stateSlug = slugify(state.name);
    if (
      slug === state.id ||
      slug === stateSlug ||
      slug.startsWith(`${state.id}_`) ||
      slug.endsWith(`_${state.id}`) ||
      slug.includes(`_${state.id}_`)
    ) {
      return { level: OrgLevel.State, nodeId: state.id };
    }
  }

  for (const district of DISTRICTS) {
    const distSlug = slugify(district.name);
    if (
      slug === district.id ||
      slug === distSlug ||
      slug.startsWith(`${district.id}_`) ||
      slug.endsWith(`_${district.id}`) ||
      slug.includes(`_${district.id}_`)
    ) {
      return { level: OrgLevel.District, nodeId: district.id };
    }
  }

  for (const [prefix, districtId] of Object.entries(DISTRICT_PREFIXES)) {
    if (slug === prefix || slug.startsWith(`${prefix}_`) || slug.endsWith(`_${prefix}`) || slug.includes(`_${prefix}_`)) {
      return { level: OrgLevel.District, nodeId: districtId };
    }
  }

  for (const [prefix, stateId] of Object.entries(STATE_PREFIXES)) {
    if (slug === prefix || slug.startsWith(`${prefix}_`) || slug.endsWith(`_${prefix}`) || slug.includes(`_${prefix}_`)) {
      return { level: OrgLevel.State, nodeId: stateId };
    }
  }

  for (const chapter of CHAPTERS) {
    const chapSlug = slugify(chapter.name.replace(/\bchapter\b/gi, ""));
    if (
      slug === chapter.id ||
      slug === chapSlug ||
      slug.startsWith(`${chapter.id}_`) ||
      slug.endsWith(`_${chapter.id}`) ||
      slug.includes(`_${chapter.id}_`) ||
      slug.startsWith(chapter.id)
    ) {
      return { level: OrgLevel.Local, nodeId: chapter.id };
    }
  }

  return null;
}

export function resolveOrgContext(
  authUsernameOrEmail: string,
  member?: {
    membershipType?: string;
    membership_type?: string;
    memberId?: string;
    member_id?: string;
    memberName?: string;
    member_name?: string;
    chapterIdNo?: string;
    chapter_id_no?: string;
    chapter_id?: string;
    chapterName?: string;
    chapter_name?: string;
  } | null
): OrgContext {
  const identifier = authUsernameOrEmail.toLowerCase().split("@")[0];
  const memberId = ((member?.memberId || member?.member_id) ?? "").trim();
  const membershipType = ((member?.membershipType || member?.membership_type) ?? "").toLowerCase();
  const memberName = ((member?.memberName || member?.member_name) ?? "").toLowerCase();
  const chapterId = ((member?.chapterIdNo || member?.chapter_id_no || member?.chapter_id) ?? "").trim();
  const chapterName = ((member?.chapterName || member?.chapter_name) ?? "").toLowerCase();
  const combined = `${memberId} ${membershipType} ${identifier} ${memberName} ${chapterName}`;

  if (chapterId) {
    const fromCode = parseChapterCodeToOrg(chapterId);
    if (fromCode) return fromCode;
    const fromSlug = matchOrgFromSlug(chapterId);
    if (fromSlug) return fromSlug;
  }

  if (memberId) {
    const fromMemberCode = parseChapterCodeToOrg(memberId);
    if (fromMemberCode) return fromMemberCode;
  }

  const fromIdentCode = parseChapterCodeToOrg(identifier);
  if (fromIdentCode) return fromIdentCode;

  if (
    combined.includes("national") ||
    combined.includes("all india") ||
    identifier.includes("national") ||
    identifier.startsWith("nat") ||
    identifier.startsWith("in_") ||
    identifier.startsWith("in-")
  ) {
    return { level: OrgLevel.National, nodeId: NATIONAL_FINANCIAL_UNIT_ID };
  }

  if (combined.includes("district")) {
    for (const source of [memberId, identifier, memberName, chapterName, membershipType]) {
      const match = matchOrgFromSlug(source);
      if (match?.level === OrgLevel.District) return match;
    }
  }

  if (combined.includes("state") && !combined.includes("district")) {
    for (const source of [memberId, identifier, memberName, chapterName]) {
      const match = matchOrgFromSlug(source);
      if (match?.level === OrgLevel.State) return match;
    }
  }

  for (const source of [memberId, identifier, memberName, chapterName]) {
    const match = matchOrgFromSlug(source);
    if (match) return match;
  }

  return { level: OrgLevel.Local, nodeId: "cochin" };
}

export function getOrgLevelLabel(org: OrgContext): string {
  if (org.level === OrgLevel.National) return "National";
  if (org.level === OrgLevel.State) {
    const name = STATES.find((state) => state.id === org.nodeId)?.name || org.nodeId;
    return `${name} State`;
  }
  if (org.level === OrgLevel.District) {
    const name = DISTRICTS.find((district) => district.id === org.nodeId)?.name || org.nodeId;
    return `${name} District`;
  }
  const chapterName = CHAPTERS.find((chapter) => chapter.id === org.nodeId)?.name || org.nodeId;
  return chapterName.toLowerCase().includes("chapter") ? chapterName : `${chapterName} Chapter`;
}
