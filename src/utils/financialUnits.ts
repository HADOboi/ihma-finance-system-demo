import { CHAPTERS, DISTRICTS, STATES } from "../mockData";
import { FinancialUnit, OrgLevel, User } from "../types";

export const NATIONAL_FINANCIAL_UNIT_ID = "national";

export const FINANCIAL_UNITS: FinancialUnit[] = [
  { id: NATIONAL_FINANCIAL_UNIT_ID, name: "National Financial Unit", level: OrgLevel.National },
  ...STATES.map((state) => ({ id: state.id, name: `${state.name} State`, level: OrgLevel.State, parentId: NATIONAL_FINANCIAL_UNIT_ID })),
  ...DISTRICTS.map((district) => ({ id: district.id, name: `${district.name} District`, level: OrgLevel.District, parentId: district.stateId })),
  ...CHAPTERS.map((chapter) => ({ id: chapter.id, name: chapter.name, level: OrgLevel.Local, parentId: chapter.districtId })),
];

export const getUserFinancialUnitId = (user: User) =>
  user.level === OrgLevel.National ? NATIONAL_FINANCIAL_UNIT_ID : user.nodeId || "";

export const getFinancialUnit = (id?: string) => FINANCIAL_UNITS.find((unit) => unit.id === id);

export const getFinancialUnitName = (id?: string) => getFinancialUnit(id)?.name || id || "Unknown financial unit";

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
