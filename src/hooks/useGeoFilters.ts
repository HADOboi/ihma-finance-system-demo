import { useEffect, useMemo, useRef, useState } from "react";
import { ChapterMaster, OrgLevel, User } from "../types";
import { CHAPTERS, DISTRICTS, STATES } from "../mockData";
import { districtMatches, normalizeUnitId } from "../utils/orgResolution";
import { getReadableFinancialUnitIds, getUserFinancialUnitId } from "../utils/financialUnits";

export type GeoFilterKey = "states" | "districts" | "chapters";

export interface GeoOption {
  id: string;
  name: string;
  hint?: string;
}

export function useGeoFilters(currentUser: User, chapterDirectory: ChapterMaster[] = []) {
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<string[]>(
    currentUser.level === OrgLevel.Local ? [currentUser.nodeId || ""] : []
  );
  const [includeOwnFinancialUnit, setIncludeOwnFinancialUnit] = useState<boolean>(true);
  const [openGeoFilter, setOpenGeoFilter] = useState<GeoFilterKey | null>(null);
  const geoFilterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openGeoFilter) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (geoFilterRef.current && !geoFilterRef.current.contains(e.target as Node)) {
        setOpenGeoFilter(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [openGeoFilter]);

  const toggleGeoFilter = (key: GeoFilterKey) => {
    setOpenGeoFilter((current) => (current === key ? null : key));
  };

  const userFinancialUnitId = useMemo(() => getUserFinancialUnitId(currentUser), [currentUser]);
  const readableFinancialUnitIds = useMemo(() => getReadableFinancialUnitIds(currentUser), [currentUser]);

  const combinedChapters = useMemo(() => {
    const list = [...CHAPTERS];
    const existingIds = new Set(list.map((chapter) => chapter.id));

    chapterDirectory.forEach((chapter) => {
      if (!chapter.id) return;
      const districtId = chapter.district ? normalizeUnitId(chapter.district) : "";
      if (!existingIds.has(chapter.id)) {
        list.push({
          id: chapter.id,
          name: chapter.chapterName,
          districtId,
        });
        existingIds.add(chapter.id);
      }
    });
    return list;
  }, [chapterDirectory]);

  const combinedDistricts = useMemo(() => {
    const list = [...DISTRICTS];
    const existingIds = new Set(list.map((district) => district.id));

    chapterDirectory.forEach((chapter) => {
      if (!chapter.district) return;
      const distId = normalizeUnitId(chapter.district);
      const stateId = chapter.state ? normalizeUnitId(chapter.state) : "kerala";
      if (!existingIds.has(distId)) {
        list.push({
          id: distId,
          name: chapter.district,
          stateId,
        });
        existingIds.add(distId);
      }
    });
    return list;
  }, [chapterDirectory]);

  const availableDistricts = useMemo(() => {
    if (currentUser.level === OrgLevel.National) {
      const stateScope = selectedStates.length > 0 ? selectedStates : STATES.map((state) => state.id);
      return combinedDistricts.filter((district) => stateScope.includes(district.stateId));
    }
    if (currentUser.level === OrgLevel.State) {
      const userState = normalizeUnitId(currentUser.nodeId);
      return combinedDistricts.filter((district) => {
        const districtState = normalizeUnitId(district.stateId);
        return districtState === userState || district.stateId === currentUser.nodeId;
      });
    }
    return [];
  }, [selectedStates, currentUser, combinedDistricts]);

  const availableChapters = useMemo(() => {
    if (currentUser.level === OrgLevel.National || currentUser.level === OrgLevel.State) {
      const districtScope =
        selectedDistricts.length > 0 ? selectedDistricts : availableDistricts.map((district) => district.id);
      return combinedChapters.filter((chapter) => districtScope.includes(chapter.districtId));
    }
    if (currentUser.level === OrgLevel.District) {
      const userDist = normalizeUnitId(currentUser.nodeId);
      return combinedChapters.filter((chapter) => districtMatches(userDist, chapter.districtId));
    }
    return [];
  }, [selectedDistricts, currentUser, availableDistricts, combinedChapters]);

  const selectedFinancialUnitIds = useMemo(() => {
    if (currentUser.level === OrgLevel.Local) return [userFinancialUnitId];
    const ownUnit = includeOwnFinancialUnit ? [userFinancialUnitId] : [];
    return [...new Set([...ownUnit, ...selectedStates, ...selectedDistricts, ...selectedChapters])].filter((id) =>
      readableFinancialUnitIds.includes(id)
    );
  }, [
    currentUser.level,
    userFinancialUnitId,
    includeOwnFinancialUnit,
    selectedStates,
    selectedDistricts,
    selectedChapters,
    readableFinancialUnitIds,
  ]);

  const hasAnyGeoSelection = currentUser.level === OrgLevel.Local ? true : selectedFinancialUnitIds.length > 0;

  const districtEmptyHint = useMemo(() => {
    if (currentUser.level === OrgLevel.State) {
      return availableDistricts.length === 0 ? "No districts in your state" : "None selected";
    }
    if (currentUser.level === OrgLevel.National) {
      return selectedStates.length === 0 ? "All states (pick districts below)" : "Select districts";
    }
    return "No districts available";
  }, [currentUser.level, availableDistricts.length, selectedStates.length]);

  const chapterEmptyHint = useMemo(() => {
    if (currentUser.level === OrgLevel.District) {
      return availableChapters.length === 0 ? "No local chapters in your district" : "None selected";
    }
    if (currentUser.level === OrgLevel.State) {
      return availableChapters.length === 0 ? "Select a district to see chapters" : "None selected";
    }
    if (currentUser.level === OrgLevel.National) {
      return availableChapters.length === 0 ? "Select states and districts to see chapters" : "None selected";
    }
    return "No chapters available";
  }, [currentUser.level, availableChapters.length]);

  const handleStateToggle = (stateId: string) => {
    const updated = selectedStates.includes(stateId)
      ? selectedStates.filter((id) => id !== stateId)
      : [...selectedStates, stateId];
    setSelectedStates(updated);

    const stillValidDists = combinedDistricts
      .filter((district) => updated.includes(district.stateId) && selectedDistricts.includes(district.id))
      .map((district) => district.id);
    setSelectedDistricts(stillValidDists);
    setSelectedChapters((prev) =>
      prev.filter((chapterId) => {
        const chapter = combinedChapters.find((entry) => entry.id === chapterId);
        return chapter ? stillValidDists.includes(chapter.districtId) : false;
      })
    );
  };

  const handleDistrictToggle = (distId: string) => {
    const updated = selectedDistricts.includes(distId)
      ? selectedDistricts.filter((id) => id !== distId)
      : [...selectedDistricts, distId];
    setSelectedDistricts(updated);

    setSelectedChapters((prev) =>
      prev.filter((chapterId) => {
        const chapter = combinedChapters.find((entry) => entry.id === chapterId);
        return chapter ? updated.includes(chapter.districtId) : false;
      })
    );
  };

  const handleChapterToggle = (chapId: string) => {
    setSelectedChapters((prev) =>
      prev.includes(chapId) ? prev.filter((id) => id !== chapId) : [...prev, chapId]
    );
  };

  const selectAllStates = () => setSelectedStates(STATES.map((state) => state.id));
  const selectNoneStates = () => {
    setSelectedStates([]);
    setSelectedDistricts([]);
    setSelectedChapters([]);
  };
  const selectAllDistricts = () => setSelectedDistricts(availableDistricts.map((district) => district.id));
  const selectNoneDistricts = () => {
    setSelectedDistricts([]);
    setSelectedChapters([]);
  };
  const selectAllChapters = () => setSelectedChapters(availableChapters.map((chapter) => chapter.id));
  const selectNoneChapters = () => setSelectedChapters([]);

  const chapterOptions: GeoOption[] = availableChapters.map((chapter) => ({
    id: chapter.id,
    name: chapter.name,
    hint:
      combinedDistricts.find((district) => district.id === chapter.districtId)?.name ||
      DISTRICTS.find((district) => district.id === chapter.districtId)?.name ||
      "",
  }));

  return {
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
    availableChapters,
    chapterOptions,
    selectedFinancialUnitIds,
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
  };
}
