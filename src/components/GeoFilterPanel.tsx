import { Check, ChevronDown, Info } from "lucide-react";
import { OrgLevel, User } from "../types";
import { STATES } from "../mockData";
import { getFinancialUnitName } from "../utils/financialUnits";
import { GeoFilterKey, GeoOption } from "../hooks/useGeoFilters";

function MultiSelectFilter({
  label,
  options,
  selectedIds,
  isOpen,
  onToggleOpen,
  onToggleOption,
  onSelectAll,
  onClear,
  emptyHint,
  idPrefix,
  wrapperId,
}: {
  label: string;
  options: GeoOption[];
  selectedIds: string[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onToggleOption: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  emptyHint: string;
  idPrefix: string;
  wrapperId: string;
}) {
  const isEmpty = options.length === 0;
  const chosen = options.filter((option) => selectedIds.includes(option.id));

  let summary: string;
  if (isEmpty) summary = emptyHint;
  else if (chosen.length === 0) summary = `None selected (${options.length} available)`;
  else if (chosen.length === options.length) summary = `All ${label.toLowerCase()} (${options.length})`;
  else if (chosen.length <= 2) summary = chosen.map((option) => option.name).join(", ");
  else summary = `${chosen.length} of ${options.length} selected`;

  return (
    <div className="relative" id={wrapperId}>
      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">{label}</span>
      <button
        type="button"
        disabled={isEmpty}
        onClick={onToggleOpen}
        id={`${idPrefix}-dropdown-button`}
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border rounded-xl text-xs font-bold shadow-2xs transition-colors ${
          isEmpty
            ? "border-slate-200 text-slate-400 cursor-not-allowed"
            : "border-slate-300 text-slate-700 hover:border-blue-400 cursor-pointer"
        }`}
      >
        <span className="truncate text-left">{summary}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && !isEmpty && (
        <div className="absolute left-0 right-0 z-30 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50/70">
            <button type="button" onClick={onSelectAll} className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer">
              Select all
            </button>
            <button type="button" onClick={onClear} className="text-[10px] font-bold text-slate-500 hover:underline cursor-pointer">
              Clear
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
            {options.map((option) => {
              const checked = selectedIds.includes(option.id);
              return (
                <label
                  key={option.id}
                  id={`${idPrefix}-${option.id}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleOption(option.id)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="truncate">{option.name}</span>
                  {option.hint && <span className="text-[9px] text-slate-400 ml-auto shrink-0">{option.hint}</span>}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export interface GeoFilterPanelProps {
  currentUser: User;
  geoFilterRef: React.RefObject<HTMLDivElement | null>;
  openGeoFilter: GeoFilterKey | null;
  toggleGeoFilter: (key: GeoFilterKey) => void;
  includeOwnFinancialUnit: boolean;
  setIncludeOwnFinancialUnit: React.Dispatch<React.SetStateAction<boolean>>;
  userFinancialUnitId: string;
  selectedStates: string[];
  selectedDistricts: string[];
  selectedChapters: string[];
  availableDistricts: { id: string; name: string }[];
  chapterOptions: GeoOption[];
  hasAnyGeoSelection: boolean;
  districtEmptyHint: string;
  chapterEmptyHint: string;
  handleStateToggle: (stateId: string) => void;
  handleDistrictToggle: (distId: string) => void;
  handleChapterToggle: (chapId: string) => void;
  selectAllStates: () => void;
  selectNoneStates: () => void;
  selectAllDistricts: () => void;
  selectNoneDistricts: () => void;
  selectAllChapters: () => void;
  selectNoneChapters: () => void;
  compact?: boolean;
}

export default function GeoFilterPanel({
  currentUser,
  geoFilterRef,
  openGeoFilter,
  toggleGeoFilter,
  includeOwnFinancialUnit,
  setIncludeOwnFinancialUnit,
  userFinancialUnitId,
  selectedStates,
  selectedDistricts,
  selectedChapters,
  availableDistricts,
  chapterOptions,
  hasAnyGeoSelection,
  districtEmptyHint,
  chapterEmptyHint,
  handleStateToggle,
  handleDistrictToggle,
  handleChapterToggle,
  selectAllStates,
  selectNoneStates,
  selectAllDistricts,
  selectNoneDistricts,
  selectAllChapters,
  selectNoneChapters,
  compact = false,
}: GeoFilterPanelProps) {
  if (currentUser.level === OrgLevel.Local) return null;

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 shadow-xs ${compact ? "p-3 sm:p-4" : "p-4 sm:p-5"}`}
      id="dashboard-filters-container"
    >
      <div className="space-y-4">
        <div
          ref={geoFilterRef}
          id="geo-filter-row"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          <button
            type="button"
            onClick={() => setIncludeOwnFinancialUnit((selected) => !selected)}
            className={`sm:col-span-2 lg:col-span-3 flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border text-left text-xs font-bold cursor-pointer ${
              includeOwnFinancialUnit
                ? "bg-teal-50 border-teal-300 text-teal-900"
                : "bg-white border-slate-300 text-slate-700 hover:border-teal-300"
            }`}
          >
            <span>Include {getFinancialUnitName(userFinancialUnitId)}</span>
            <span
              className={`h-5 w-5 rounded-md border flex items-center justify-center ${
                includeOwnFinancialUnit ? "bg-[#0F6E5D] border-[#0F6E5D] text-white" : "border-slate-300"
              }`}
            >
              {includeOwnFinancialUnit && <Check className="h-3.5 w-3.5" />}
            </span>
          </button>

          {currentUser.level === OrgLevel.National && (
            <MultiSelectFilter
              label="States"
              wrapperId="state-selector-wrapper"
              idPrefix="state-filter"
              options={STATES.map((state) => ({ id: state.id, name: state.name }))}
              selectedIds={selectedStates}
              isOpen={openGeoFilter === "states"}
              onToggleOpen={() => toggleGeoFilter("states")}
              onToggleOption={handleStateToggle}
              onSelectAll={selectAllStates}
              onClear={selectNoneStates}
              emptyHint="No states available"
            />
          )}

          {(currentUser.level === OrgLevel.National || currentUser.level === OrgLevel.State) && (
            <MultiSelectFilter
              label="Districts"
              wrapperId="district-selector-wrapper"
              idPrefix="district-filter"
              options={availableDistricts.map((district) => ({ id: district.id, name: district.name }))}
              selectedIds={selectedDistricts}
              isOpen={openGeoFilter === "districts"}
              onToggleOpen={() => toggleGeoFilter("districts")}
              onToggleOption={handleDistrictToggle}
              onSelectAll={selectAllDistricts}
              onClear={selectNoneDistricts}
              emptyHint={districtEmptyHint}
            />
          )}

          <MultiSelectFilter
            label="Local Chapters"
            wrapperId="chapter-selector-wrapper"
            idPrefix="chapter-filter"
            options={chapterOptions}
            selectedIds={selectedChapters}
            isOpen={openGeoFilter === "chapters"}
            onToggleOpen={() => toggleGeoFilter("chapters")}
            onToggleOption={handleChapterToggle}
            onSelectAll={selectAllChapters}
            onClear={selectNoneChapters}
            emptyHint={chapterEmptyHint}
          />
        </div>

        {!hasAnyGeoSelection && (
          <div
            id="no-geo-selection-notice"
            className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-800"
          >
            <Info className="h-4 w-4 shrink-0" />
            Select at least one state, district or chapter above to view data. Nothing is shown until you make a selection.
          </div>
        )}
      </div>
    </div>
  );
}
