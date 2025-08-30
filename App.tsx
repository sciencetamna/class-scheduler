import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ScheduleItem, ProgressData, Week } from './types';
import { INITIAL_WEEKS } from './constants';
import WeekSelector from './components/WeekSelector';
import Timetable from './components/Timetable';
import ProgressChart from './components/ProgressChart';
import Modal from './components/Modal';
import ProgressSummary from './components/ProgressSummary';
import ProgressEditorModal from './components/ProgressEditorModal';
import InfoModal from './components/InfoModal';
import ConfirmModal from './components/ConfirmModal';
import SubjectVisibilityModal from './components/SubjectVisibilityModal';

const initialSchedule: Omit<ScheduleItem, 'id'>[] = [
    { day: 1, period: 1, subject: '과학A', classId: '3-5' },
    { day: 1, period: 2, subject: '과학A', classId: '3-3' },
    { day: 1, period: 5, subject: '과학A', classId: '3-6' },
    { day: 2, period: 4, subject: '과학A', classId: '3-9' },
    { day: 2, period: 5, subject: '과학A', classId: '3-7' },
    { day: 2, period: 6, subject: '과학A', classId: '3-5' },
    { day: 2, period: 7, subject: '과학A', classId: '3-10' },
    { day: 3, period: 1, subject: '과학A', classId: '3-10' },
    { day: 3, period: 3, subject: '과학A', classId: '3-8' },
    { day: 3, period: 5, subject: '과학A', classId: '3-2' },
    { day: 3, period: 6, subject: '과학A', classId: '3-4' },
    { day: 4, period: 1, subject: '과학A', classId: '3-7' },
    { day: 4, period: 2, subject: '과학A', classId: '3-8' },
    { day: 4, period: 5, subject: '과학A', classId: '3-6' },
    { day: 4, period: 6, subject: '과학A', classId: '3-2' },
    { day: 5, period: 2, subject: '과학A', classId: '3-3' },
    { day: 5, period: 4, subject: '과학A', classId: '3-4' },
    { day: 5, period: 5, subject: '과학A', classId: '3-9' },
    { day: 5, period: 7, subject: '자율', classId: '3-6' },
];

const initialProgress: ProgressData = {};

const generateInitialSchedules = (base?: ScheduleItem[]): { [weekId: number]: ScheduleItem[] } => {
    const schedules: { [weekId: number]: ScheduleItem[] } = {};
    INITIAL_WEEKS.forEach(week => {
        const scheduleTemplate = base || initialSchedule;
        schedules[week.id] = scheduleTemplate.map((item, index) => ({
            ...item,
            id: `w${week.id}-s${index + 1}`
        }));
    });
    return schedules;
};

// Helper to load state from localStorage
const loadState = <T,>(key: string, defaultValue: T): T => {
    try {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
            return JSON.parse(storedValue);
        }
    } catch (error) {
        console.error(`Error loading state for ${key} from localStorage`, error);
    }
    return defaultValue;
};


const App: React.FC = () => {
    const [baseSchedule, setBaseSchedule] = useState<ScheduleItem[] | null>(() => loadState('timetableApp_baseSchedule', null));
    const [schedulesByWeek, setSchedulesByWeek] = useState<{ [weekId: number]: ScheduleItem[] }>(() => loadState('timetableApp_schedules', generateInitialSchedules(baseSchedule ?? undefined)));
    const [progress, setProgress] = useState<ProgressData>(() => loadState('timetableApp_progress', initialProgress));
    const [weeks, setWeeks] = useState<Week[]>(() => loadState('timetableApp_weeks', INITIAL_WEEKS));
    const [hiddenSubjects, setHiddenSubjects] = useState<string[]>(() => loadState('timetableApp_hiddenSubjects', ['자율']));
    const [currentWeek, setCurrentWeek] = useState<number>(() => {
        const loadedWeeks = loadState<Week[]>('timetableApp_weeks', INITIAL_WEEKS);
        if (!loadedWeeks || loadedWeeks.length === 0) {
            return 1; // Fallback if there are no weeks
        }
    
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize for date-only comparison
    
        const currentYear = today.getFullYear();
    
        // Find the week that contains today's date
        const foundWeek = loadedWeeks.find(week => {
            try {
                const [startStr, endStr] = week.dates.split(' ~ ');
                const [startMonth, startDay] = startStr.split('-').map(Number);
                const [endMonth, endDay] = endStr.split('-').map(Number);
    
                const startDate = new Date(currentYear, startMonth - 1, startDay);
                const endDate = new Date(currentYear, endMonth - 1, endDay);
                
                // Normalize week dates
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(0, 0, 0, 0);
    
                return today >= startDate && today <= endDate;
            } catch (e) {
                // In case of malformed date strings, log an error and continue
                console.error(`Error parsing dates for week ${week.id}: "${week.dates}"`);
                return false;
            }
        });
    
        // If a matching week is found, use its ID.
        if (foundWeek) {
            return foundWeek.id;
        }
    
        // Fallback: If no week matches, default to the first week in the list.
        return loadedWeeks[0]?.id ?? 1;
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ScheduleItem | null | { day: number, period: number }>(null);
    const [highlightedProgressContent, setHighlightedProgressContent] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [editingProgressItem, setEditingProgressItem] = useState<{ item: ScheduleItem, session: number } | null>(null);
    const [infoModalContent, setInfoModalContent] = useState<{ title: string; message: string } | null>(null);
    const [confirmModalContent, setConfirmModalContent] = useState<{ title: string; message: string; onConfirm: () => void; } | null>(null);

    const allSubjects = useMemo(() => {
        const scheduleToAnalyze = baseSchedule?.map(item => ({ ...item, id: '' })) || initialSchedule.map(item => ({ ...item, id: '' }));
        const subjectSet = new Set<string>();
        scheduleToAnalyze.forEach(item => {
            if (item.subject) {
                subjectSet.add(item.subject);
            }
        });
        return Array.from(subjectSet).sort();
    }, [baseSchedule]);

    const visibleSubjects = useMemo(() => {
        return allSubjects.filter(subject => !hiddenSubjects.includes(subject));
    }, [allSubjects, hiddenSubjects]);

    const classNumbers = useMemo(() => {
        const scheduleToAnalyze = baseSchedule || initialSchedule;
        const classSet = new Set<string>();
        scheduleToAnalyze.forEach(item => {
            if (item.classId) {
                classSet.add(item.classId);
            }
        });
        return Array.from(classSet).sort((a, b) => 
            a.localeCompare(b, 'ko-KR', { numeric: true, sensitivity: 'base' })
        );
    }, [baseSchedule]);

    const [selectedSubject, setSelectedSubject] = useState<string>('');

    useEffect(() => {
        if (visibleSubjects.length > 0 && !visibleSubjects.includes(selectedSubject)) {
            setSelectedSubject(visibleSubjects[0]);
        } else if (visibleSubjects.length === 0) {
            setSelectedSubject('');
        }
    }, [visibleSubjects, selectedSubject]);

    // Auto-save to localStorage
    useEffect(() => {
        localStorage.setItem('timetableApp_schedules', JSON.stringify(schedulesByWeek));
    }, [schedulesByWeek]);
    
    useEffect(() => {
        localStorage.setItem('timetableApp_progress', JSON.stringify(progress));
    }, [progress]);

    useEffect(() => {
        localStorage.setItem('timetableApp_weeks', JSON.stringify(weeks));
    }, [weeks]);

    useEffect(() => {
        localStorage.setItem('timetableApp_baseSchedule', JSON.stringify(baseSchedule));
    }, [baseSchedule]);

    useEffect(() => {
        localStorage.setItem('timetableApp_hiddenSubjects', JSON.stringify(hiddenSubjects));
    }, [hiddenSubjects]);

    const handleSaveHiddenSubjects = (newHidden: string[]) => {
        setHiddenSubjects(newHidden);
        setIsSubjectModalOpen(false);
    };

    const handleUpdateProgress = useCallback((key: string, value: string) => {
        setProgress(prev => {
            const newProgress = { ...prev };
            if (value.trim() === '') {
                delete newProgress[key];
            } else {
                newProgress[key] = value;
            }
            return newProgress;
        });
    }, []);
    
    const handleSaveProgress = (key: string, value: string) => {
        handleUpdateProgress(key, value);
        setIsProgressModalOpen(false);
        setEditingProgressItem(null);
    };

    const handleDrop = useCallback((itemId: string, day: number, period: number) => {
        setSchedulesByWeek(prev => {
            const newSchedules = { ...prev };
            const currentSchedule = newSchedules[currentWeek] || [];
            newSchedules[currentWeek] = currentSchedule.map(item => 
                item.id === itemId ? { ...item, day, period } : item
            );
            return newSchedules;
        });
    }, [currentWeek]);
    
    const openModal = useCallback((item: ScheduleItem | null | { day: number, period: number }) => {
        setEditingItem(item);
        setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setEditingItem(null);
    }, []);

    const handleSaveScheduleItem = (itemData: Omit<ScheduleItem, 'id'> & { id?: string }) => {
        setSchedulesByWeek(prev => {
            const newSchedules = { ...prev };
            const scheduleForWeek = prev[currentWeek] || [];
            if (itemData.id) {
                // Update
                newSchedules[currentWeek] = scheduleForWeek.map(item =>
                    item.id === itemData.id ? { ...item, ...itemData } as ScheduleItem : item
                );
            } else {
                // Add new
                const newItem: ScheduleItem = {
                    day: itemData.day,
                    period: itemData.period,
                    subject: itemData.subject || '',
                    classId: itemData.classId || '',
                    id: `w${currentWeek}-s${Date.now()}`
                };
                newSchedules[currentWeek] = [...scheduleForWeek, newItem];
            }
            return newSchedules;
        });
        closeModal();
    };
    
    const handleDeleteScheduleItem = (id: string) => {
        setSchedulesByWeek(prev => {
            const newSchedules = { ...prev };
            newSchedules[currentWeek] = (prev[currentWeek] || []).filter(item => item.id !== id);
            return newSchedules;
        });
        closeModal();
    };

    const handleAddWeek = useCallback(() => {
        if (weeks.length === 0) return;
    
        const currentIndex = weeks.findIndex(w => w.id === currentWeek);
        if (currentIndex === -1) return;

        // The week list is displayed in reverse, so the top half of the UI corresponds to the latter half of the array.
        // We add to the beginning if the selected week is in the first half of the data array (bottom of the UI).
        const shouldAddAtStart = currentIndex < weeks.length / 2;
        
        const formatDate = (date: Date) => {
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${m}-${d}`;
        };
    
        if (shouldAddAtStart) {
            // Add to the beginning and re-index everything
            const firstWeek = weeks[0];
            const [startMonthStr, startDayStr] = firstWeek.dates.split(' ~ ')[0].split('-');
            const firstDate = new Date(new Date().getFullYear(), parseInt(startMonthStr) - 1, parseInt(startDayStr));
    
            const prevEndDate = new Date(firstDate);
            prevEndDate.setDate(firstDate.getDate() - 3); // From Mon to previous Fri
    
            const prevStartDate = new Date(prevEndDate);
            prevStartDate.setDate(prevEndDate.getDate() - 4); // Find the Monday of that week
    
            const newDates = `${formatDate(prevStartDate)} ~ ${formatDate(prevEndDate)}`;
            const newWeekData = { dates: newDates };
    
            const weekIdMap: { [oldId: number]: number } = {};
            const newWeeksWithData = [newWeekData, ...weeks];
            const finalNewWeeks = newWeeksWithData.map((week, index) => {
                const newId = index + 1;
                if (index > 0) { // These are the old weeks
                    const oldId = weeks[index - 1].id;
                    weekIdMap[oldId] = newId;
                }
                return { ...week, id: newId, label: `${String(newId).padStart(2, '0')}주` };
            });
    
            const newSchedules: { [weekId: number]: ScheduleItem[] } = {};
            for (const oldWeekIdStr in schedulesByWeek) {
                const oldWeekId = parseInt(oldWeekIdStr, 10);
                const newWeekId = weekIdMap[oldWeekId];
                if (newWeekId !== undefined) {
                    newSchedules[newWeekId] = schedulesByWeek[oldWeekId].map(item => ({
                        ...item,
                        id: `w${newWeekId}-${item.id.split('-').slice(1).join('-')}`
                    }));
                }
            }
    
            const newProgress: ProgressData = {};
            for (const key in progress) {
                const match = key.match(/^w(\d+)-c(.+)-s(\d+)$/);
                if (match) {
                    const oldWeekId = parseInt(match[1], 10);
                    const newWeekId = weekIdMap[oldWeekId];
                    if (newWeekId !== undefined) {
                        newProgress[`w${newWeekId}-c${match[2]}-s${match[3]}`] = progress[key];
                    }
                }
            }
            
            // Use base schedule if available, otherwise copy from selected week
            const scheduleToCopy = baseSchedule || schedulesByWeek[currentWeek] || [];
            newSchedules[1] = scheduleToCopy.map(item => ({
                ...item,
                id: `w1-${item.id.split('-').slice(1).join('-')}`
            }));
    
            setWeeks(finalNewWeeks);
            setSchedulesByWeek(newSchedules);
            setProgress(newProgress);
            setCurrentWeek(1);
        } else {
            // Add to the end
            const lastWeek = weeks[weeks.length - 1];
            const newId = lastWeek.id + 1;
            
            const lastDateStr = lastWeek.dates.split(' ~ ')[1];
            const [monthStr, dayStr] = lastDateStr.split('-');
            const lastDate = new Date(new Date().getFullYear(), parseInt(monthStr) - 1, parseInt(dayStr));
    
            const nextStartDate = new Date(lastDate);
            nextStartDate.setDate(lastDate.getDate() + 3); // From Fri to next Mon
    
            const nextEndDate = new Date(nextStartDate);
            nextEndDate.setDate(nextStartDate.getDate() + 4);
    
            const newWeek: Week = {
                id: newId,
                label: `${String(newId).padStart(2, '0')}주`,
                dates: `${formatDate(nextStartDate)} ~ ${formatDate(nextEndDate)}`
            };
    
            setWeeks(prev => [...prev, newWeek]);
    
            setSchedulesByWeek(prev => {
                const newSchedules = { ...prev };
                // Use base schedule if available, otherwise copy from selected week
                const scheduleToCopy = baseSchedule || prev[currentWeek] || [];
                newSchedules[newWeek.id] = scheduleToCopy.map(item => ({
                    ...item,
                    id: `w${newWeek.id}-${item.id.split('-').slice(1).join('-')}`
                }));
                return newSchedules;
            });
    
            setCurrentWeek(newWeek.id);
        }
    }, [weeks, currentWeek, schedulesByWeek, progress, baseSchedule]);
    
    const handleRemoveWeek = useCallback(() => {
        if (weeks.length <= 1) {
            setInfoModalContent({ title: '삭제 불가', message: '마지막 남은 주는 삭제할 수 없습니다.'});
            return;
        }
    
        const weekToRemoveIndex = weeks.findIndex(w => w.id === currentWeek);
        if (weekToRemoveIndex === -1) return;
    
        // Create new weeks array and the ID map for re-indexing
        const weeksToKeep = weeks.filter(w => w.id !== currentWeek);
        const weekIdMap: { [oldId: number]: number } = {};
        const newWeeksFinal = weeksToKeep.map((week, index) => {
            const newId = index + 1;
            weekIdMap[week.id] = newId;
            return { ...week, id: newId, label: `${String(newId).padStart(2, '0')}주` };
        });
    
        // Remap schedules
        const newSchedules: { [weekId: number]: ScheduleItem[] } = {};
        for (const oldWeekIdStr in schedulesByWeek) {
            const oldWeekId = parseInt(oldWeekIdStr, 10);
            const newWeekId = weekIdMap[oldWeekId];
            if (newWeekId !== undefined) {
                newSchedules[newWeekId] = schedulesByWeek[oldWeekId].map(item => ({
                    ...item,
                    id: `w${newWeekId}-${item.id.split('-').slice(1).join('-')}`
                }));
            }
        }
    
        // Remap progress
        const newProgress: ProgressData = {};
        for (const key in progress) {
            const match = key.match(/^w(\d+)-c(.+)-s(\d+)$/);
            if (match) {
                const oldWeekId = parseInt(match[1], 10);
                const newWeekId = weekIdMap[oldWeekId];
                if (newWeekId !== undefined) {
                    newProgress[`w${newWeekId}-c${match[2]}-s${match[3]}`] = progress[key];
                }
            }
        }
    
        // Determine the next current week
        let newCurrentWeekId;
        if (weekToRemoveIndex >= newWeeksFinal.length) {
            newCurrentWeekId = newWeeksFinal[newWeeksFinal.length - 1]?.id || 1;
        } else {
            newCurrentWeekId = newWeeksFinal[weekToRemoveIndex]?.id || 1;
        }
    
        setWeeks(newWeeksFinal);
        setSchedulesByWeek(newSchedules);
        setProgress(newProgress);
        setCurrentWeek(newCurrentWeekId);
    
    }, [weeks, currentWeek, schedulesByWeek, progress]);

    const handleSelectWeek = useCallback((weekId: number) => {
        setCurrentWeek(weekId);
        setHighlightedProgressContent(null);
    }, []);

    const handleHighlightProgress = useCallback((content: string | null) => {
        setHighlightedProgressContent(prev => (prev === content ? null : content));
    }, []);

    const ScheduleForm: React.FC<{ 
        item: ScheduleItem | null | { day: number, period: number }, 
        onSave: (data: any) => void, 
        onDelete?: (id: string) => void
    }> = ({ item, onSave, onDelete }) => {
        const [formData, setFormData] = useState({
            id: item && 'id' in item ? item.id : undefined,
            day: item ? item.day : 1,
            period: item ? item.period : 1,
            subject: item && 'subject' in item ? item.subject : '',
            classId: item && 'classId' in item ? item.classId : '',
        });

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: name === 'day' || name === 'period' ? parseInt(value) : value }));
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            onSave(formData);
        };
        
        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">과목명</label>
                    <input type="text" name="subject" value={formData.subject} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">반</label>
                    <input type="text" name="classId" value={formData.classId} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="예: 3-1 or 관광경영과 등" required />
                </div>
                <div className="flex justify-end space-x-2">
                    {formData.id && onDelete && (
                         <button type="button" onClick={() => onDelete(formData.id!)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">삭제</button>
                    )}
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">저장</button>
                </div>
            </form>
        );
    };
    
    const currentSchedule = useMemo(() => schedulesByWeek[currentWeek] || [], [schedulesByWeek, currentWeek]);

    const sessionMap = useMemo(() => {
        const map = new Map<string, number>();
        const classSessionCounter = new Map<string, number>(); // Key: `${item.subject}-${item.classId}`
    
        const sortedSchedule = [...currentSchedule].sort((a, b) => {
            if (a.day !== b.day) return a.day - b.day;
            return a.period - b.period;
        });
    
        sortedSchedule.forEach(item => {
            const counterKey = `${item.subject}-${item.classId}`;
            const currentCount = classSessionCounter.get(counterKey) || 0;
            const sessionNumber = currentCount + 1;
            map.set(item.id, sessionNumber);
            classSessionCounter.set(counterKey, sessionNumber);
        });
        return map;
    }, [currentSchedule]);

    const sessionsCount = useMemo(() => {
        const counts: { [subject: string]: { [classId: string]: number } } = {};
        const scheduleToAnalyze = baseSchedule || initialSchedule.map(item => ({...item, id:''}));

        scheduleToAnalyze.forEach(item => {
            if (!item.subject || !item.classId) return;

            if (!counts[item.subject]) {
                counts[item.subject] = {};
            }
            if (!counts[item.subject][item.classId]) {
                counts[item.subject][item.classId] = 0;
            }
            counts[item.subject][item.classId]++;
        });
        return counts;
    }, [baseSchedule]);

    const progressKeyToSubjectMap = useMemo(() => {
        const map: { [key: string]: string } = {};

        Object.entries(schedulesByWeek).forEach(([weekId, schedule]) => {
            const weeklySessionCounter = new Map<string, number>();
            const sortedSchedule = [...schedule].sort((a, b) => {
                if (a.day !== b.day) return a.day - b.day;
                return a.period - b.period;
            });

            sortedSchedule.forEach(item => {
                const counterKey = `${item.subject}-${item.classId}`;
                const currentCount = weeklySessionCounter.get(counterKey) || 0;
                const sessionNumber = currentCount + 1;
                
                const progressKey = `w${weekId}-c${item.classId}-s${sessionNumber}`;
                map[progressKey] = item.subject;
                
                weeklySessionCounter.set(counterKey, sessionNumber);
            });
        });

        return map;
    }, [schedulesByWeek]);

    const handleCellClick = useCallback((cellData: ScheduleItem | { day: number, period: number }) => {
        if (isEditMode) {
            openModal(cellData);
        } else {
            if ('id' in cellData) {
                const session = sessionMap.get(cellData.id);
                if (session) {
                    setEditingProgressItem({ item: cellData, session });
                    setIsProgressModalOpen(true);
                }
            }
        }
    }, [isEditMode, openModal, sessionMap]);

    const handleSetBaseSchedule = useCallback(() => {
        const normalizeSchedule = (schedule: ScheduleItem[] | null | undefined): string => {
            if (!schedule || schedule.length === 0) return '[]';
            
            const simplified = schedule.map(({ id, ...rest }) => rest);
            simplified.sort((a, b) => {
                if (a.day !== b.day) return a.day - b.day;
                if (a.period !== b.period) return a.period - b.period;
                return a.classId.localeCompare(b.classId);
            });
            return JSON.stringify(simplified);
        };

        const currentNormalized = normalizeSchedule(currentSchedule);
        const baseNormalized = normalizeSchedule(baseSchedule);
        
        if (currentNormalized === baseNormalized) {
            setInfoModalContent({
                title: '알림',
                message: '변경된 내용이 없습니다.'
            });
            return;
        }

        setConfirmModalContent({
            title: '기본 시간표 설정',
            message: '현재 시간표를 기본 시간표로 설정하시겠습니까? 앞으로 추가되는 모든 주의 시간표가 이 시간표로 설정됩니다.',
            onConfirm: () => {
                const newBaseSchedule = JSON.parse(JSON.stringify(currentSchedule));
                setBaseSchedule(newBaseSchedule);
                setInfoModalContent({
                    title: '기본 시간표 설정 완료',
                    message: '현재 시간표가 기본 시간표로 설정되었습니다.'
                });
            }
        });
    }, [currentSchedule, baseSchedule]);

    const handleToggleEditMode = () => {
        const enteringEditMode = !isEditMode;
        setIsEditMode(enteringEditMode);

        if (enteringEditMode) {
            setInfoModalContent({
                title: '시간표 편집 모드',
                message: '시간표를 클릭하여 과목을 추가·수정하세요. 시간표를 드래그하여 옮길 수 있습니다.'
            });
        }
    };


    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-screen-xl mx-auto">
            <header className="mb-6 text-center">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500 pb-2">수업 진도 알리미</h1>
            </header>
            <div className="flex flex-col gap-8">
                <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
                    <aside className="lg:sticky lg:top-8 self-start">
                        <WeekSelector 
                            weeks={weeks} 
                            currentWeek={currentWeek} 
                            onSelectWeek={handleSelectWeek} 
                            onAddWeek={handleAddWeek}
                            onRemoveWeek={handleRemoveWeek}
                        />
                        <ProgressSummary
                            progress={progress}
                            highlightedProgressContent={highlightedProgressContent}
                            onHighlight={handleHighlightProgress}
                            subjects={visibleSubjects}
                            selectedSubject={selectedSubject}
                            onSelectSubject={setSelectedSubject}
                            progressKeyToSubjectMap={progressKeyToSubjectMap}
                        />
                    </aside>
                    <main>
                        <div className="relative">
                            <div className="absolute top-0 right-0 flex justify-end items-center gap-2 z-10" style={{ transform: 'translateY(calc(-100% - 0.5rem))' }}>
                                 <button 
                                    onClick={handleSetBaseSchedule}
                                    className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm font-semibold hover:bg-green-600 transition-colors"
                                >
                                    기본 시간표로 설정
                                </button>
                                 <button 
                                    onClick={handleToggleEditMode}
                                    className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                                        isEditMode 
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    }`}
                                >
                                    {isEditMode ? '편집 완료' : '시간표 편집'}
                                </button>
                            </div>
                            <Timetable 
                                schedule={currentSchedule} 
                                progress={progress} 
                                currentWeek={currentWeek} 
                                onDrop={handleDrop} 
                                onCellClick={handleCellClick}
                                highlightedProgressContent={highlightedProgressContent}
                                isEditMode={isEditMode}
                                sessionMap={sessionMap}
                            />
                        </div>
                    </main>
                </div>
                <section>
                    <ProgressChart
                        weeks={weeks}
                        progress={progress}
                        classNumbers={classNumbers}
                        onUpdateProgress={handleUpdateProgress}
                        subjects={visibleSubjects}
                        selectedSubject={selectedSubject}
                        onSelectSubject={setSelectedSubject}
                        sessionsCount={sessionsCount}
                        onEditSubjects={() => setIsSubjectModalOpen(true)}
                    />
                </section>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingItem && 'id' in editingItem ? '수업 편집' : '수업 추가'}>
                {editingItem && <ScheduleForm item={editingItem} onSave={handleSaveScheduleItem} onDelete={handleDeleteScheduleItem} />}
            </Modal>

            <ProgressEditorModal
                isOpen={isProgressModalOpen}
                onClose={() => setIsProgressModalOpen(false)}
                itemInfo={editingProgressItem}
                currentProgress={
                    editingProgressItem 
                    ? progress[`w${currentWeek}-c${editingProgressItem.item.classId}-s${editingProgressItem.session}`] || '' 
                    : ''
                }
                onSave={handleSaveProgress}
                currentWeek={currentWeek}
            />

            <SubjectVisibilityModal
                isOpen={isSubjectModalOpen}
                onClose={() => setIsSubjectModalOpen(false)}
                allSubjects={allSubjects}
                hiddenSubjects={hiddenSubjects}
                onSave={handleSaveHiddenSubjects}
            />

            <InfoModal
                isOpen={!!infoModalContent}
                onClose={() => setInfoModalContent(null)}
                title={infoModalContent?.title || ''}
                message={infoModalContent?.message || ''}
            />

            <ConfirmModal
                isOpen={!!confirmModalContent}
                onClose={() => setConfirmModalContent(null)}
                title={confirmModalContent?.title || ''}
                message={confirmModalContent?.message || ''}
                onConfirm={confirmModalContent?.onConfirm || (() => {})}
            />
        </div>
    );
};

export default App;