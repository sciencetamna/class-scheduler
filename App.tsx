
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ScheduleItem, ProgressData, Week, ProgressEntry } from './types';
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
import Auth from './components/Auth';
import SmileyIcon from './components/SmileyIcon';

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

// Helper to load state from localStorage for a specific user
const loadState = <T,>(key: string, defaultValue: T, user: string | null): T => {
    if (!user) return defaultValue;
    try {
        const storedValue = localStorage.getItem(`${key}_${user}`);
        if (storedValue) {
            return JSON.parse(storedValue);
        }
    } catch (error) {
        console.error(`Error loading state for ${key}_${user} from localStorage`, error);
    }
    return defaultValue;
};

// Helper to save state to localStorage for a specific user
const saveState = <T,>(key: string, value: T, user: string | null) => {
    if (!user) return;
    try {
        localStorage.setItem(`${key}_${user}`, JSON.stringify(value));
    } catch (error) {
        console.error(`Error saving state for ${key}_${user} to localStorage`, error);
    }
};

interface ScheduleFormProps {
    item: ScheduleItem | null | { day: number, period: number };
    onSave: (data: Omit<ScheduleItem, 'id'> & { id?: string }) => void;
    onDelete?: (id: string) => void;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ item, onSave, onDelete }) => {
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
                <input type="text" name="subject" value={formData.subject} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="예: 과학, 보충수업 등" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">반</label>
                <input type="text" name="classId" value={formData.classId} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="예: 3-1 or 관광경영과 등" required />
            </div>
            <div className="flex justify-end space-x-2">
                {formData.id && onDelete && (
                     <button type="button" onClick={() => onDelete(formData.id!)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium">삭제</button>
                )}
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">저장</button>
            </div>
        </form>
    );
};

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem('timetableApp_currentUser'));
    
    const [baseSchedule, setBaseSchedule] = useState<ScheduleItem[] | null>(null);
    const [schedulesByWeek, setSchedulesByWeek] = useState<{ [weekId: number]: ScheduleItem[] }>({});
    const [progress, setProgress] = useState<ProgressData>(initialProgress);
    const [weeks, setWeeks] = useState<Week[]>(INITIAL_WEEKS);
    const [hiddenSubjects, setHiddenSubjects] = useState<string[]>(['자율']);
    const [currentWeek, setCurrentWeek] = useState<number>(1);
    const [progressOrder, setProgressOrder] = useState<{ [subject: string]: string[] }>({});
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ScheduleItem | null | { day: number, period: number }>(null);
    const [highlightedProgressContent, setHighlightedProgressContent] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [editingProgressItem, setEditingProgressItem] = useState<{ item: ScheduleItem, session: number } | null>(null);
    const [infoModalContent, setInfoModalContent] = useState<{ title: string; message: string } | null>(null);
    const [confirmModalContent, setConfirmModalContent] = useState<{ title: string; message: string; onConfirm: () => void; } | null>(null);

    // Load data on user login
    useEffect(() => {
        if (currentUser) {
            const loadedBaseSchedule = loadState<ScheduleItem[] | null>('timetableApp_baseSchedule', null, currentUser);
            const loadedSchedules = loadState<{ [weekId: number]: ScheduleItem[] }>('timetableApp_schedules', {}, currentUser);
            const loadedWeeks = loadState<Week[]>('timetableApp_weeks', INITIAL_WEEKS, currentUser);
            
            const loadedProgressRaw = loadState<any>('timetableApp_progress', initialProgress, currentUser);
            const loadedProgress: ProgressData = {};
            if (loadedProgressRaw) {
                Object.keys(loadedProgressRaw).forEach(key => {
                    const value = loadedProgressRaw[key];
                    if (typeof value === 'string') {
                        loadedProgress[key] = { content: value, memo: '' };
                    } else if (value && typeof value === 'object') {
                        loadedProgress[key] = { content: value.content || '', memo: value.memo || '' };
                    }
                });
            }
            
            const loadedHiddenSubjects = loadState<string[]>('timetableApp_hiddenSubjects', ['자율'], currentUser);
            const loadedProgressOrder = loadState<{ [subject: string]: string[] }>('timetableApp_progressOrder', {}, currentUser);
            
            setBaseSchedule(loadedBaseSchedule);
            setSchedulesByWeek(Object.keys(loadedSchedules).length > 0 ? loadedSchedules : generateInitialSchedules(loadedBaseSchedule ?? undefined));
            setWeeks(loadedWeeks);
            setProgress(loadedProgress);
            setHiddenSubjects(loadedHiddenSubjects);
            setProgressOrder(loadedProgressOrder);

            // Set current week
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const currentYear = today.getFullYear();
            const foundWeek = loadedWeeks.find(week => {
                try {
                    const [startStr, endStr] = week.dates.split(' ~ ');
                    const [startMonth, startDay] = startStr.split('-').map(Number);
                    const [endMonth, endDay] = endStr.split('-').map(Number);
                    const startDate = new Date(currentYear, startMonth - 1, startDay);
                    const endDate = new Date(currentYear, endMonth - 1, endDay);
                    startDate.setHours(0, 0, 0, 0);
                    endDate.setHours(0, 0, 0, 0);
                    return today >= startDate && today <= endDate;
                } catch (e) {
                    console.error(`Error parsing dates for week ${week.id}: "${week.dates}"`);
                    return false;
                }
            });
            setCurrentWeek(foundWeek ? foundWeek.id : (loadedWeeks[0]?.id ?? 1));
        } else {
             // Reset state on logout
            setBaseSchedule(null);
            setSchedulesByWeek({});
            setProgress(initialProgress);
            setWeeks(INITIAL_WEEKS);
            setHiddenSubjects(['자율']);
            setCurrentWeek(1);
            setProgressOrder({});
        }
    }, [currentUser]);

    // Auto-save to localStorage
    useEffect(() => saveState('timetableApp_schedules', schedulesByWeek, currentUser), [schedulesByWeek, currentUser]);
    useEffect(() => saveState('timetableApp_progress', progress, currentUser), [progress, currentUser]);
    useEffect(() => saveState('timetableApp_weeks', weeks, currentUser), [weeks, currentUser]);
    useEffect(() => saveState('timetableApp_baseSchedule', baseSchedule, currentUser), [baseSchedule, currentUser]);
    useEffect(() => saveState('timetableApp_hiddenSubjects', hiddenSubjects, currentUser), [hiddenSubjects, currentUser]);
    useEffect(() => saveState('timetableApp_progressOrder', progressOrder, currentUser), [progressOrder, currentUser]);

    const handleAuthSuccess = (username: string) => {
        const isNewUser = !localStorage.getItem(`timetableApp_weeks_${username}`);
        
        if (isNewUser) {
            const initialSchedulesForNewUser = generateInitialSchedules();
            saveState('timetableApp_schedules', initialSchedulesForNewUser, username);
            saveState('timetableApp_weeks', INITIAL_WEEKS, username);
            saveState('timetableApp_progress', initialProgress, username);
            saveState('timetableApp_hiddenSubjects', ['자율'], username);
            saveState('timetableApp_baseSchedule', null, username);
            saveState('timetableApp_progressOrder', {}, username);
        }
        
        localStorage.setItem('timetableApp_currentUser', username);
        setCurrentUser(username);
    };

    const handleLogout = () => {
        localStorage.removeItem('timetableApp_currentUser');
        setCurrentUser(null);
    };

    const allSubjects = useMemo(() => {
        const subjectSet = new Set<string>();
        const base = baseSchedule || initialSchedule;
        
        base.forEach(item => {
            if (item.subject) {
                subjectSet.add(item.subject);
            }
        });

        Object.values(schedulesByWeek).flat().forEach(item => {
            if (item.subject) {
                subjectSet.add(item.subject);
            }
        });

        return Array.from(subjectSet).sort();
    }, [baseSchedule, schedulesByWeek]);

    const visibleSubjects = useMemo(() => {
        return allSubjects.filter(subject => !hiddenSubjects.includes(subject));
    }, [allSubjects, hiddenSubjects]);

    const [selectedSubject, setSelectedSubject] = useState<string>('');
    
    const classNumbers = useMemo(() => {
        if (!selectedSubject) {
            return [];
        }
        const classSet = new Set<string>();
        
        const base = baseSchedule || initialSchedule;
        base.forEach(item => {
            if (item.subject === selectedSubject && item.classId) {
                classSet.add(item.classId);
            }
        });

        Object.values(schedulesByWeek).flat().forEach(item => {
            if (item.subject === selectedSubject && item.classId) {
                classSet.add(item.classId);
            }
        });

        return Array.from(classSet).sort((a, b) => 
            a.localeCompare(b, 'ko-KR', { numeric: true, sensitivity: 'base' })
        );
    }, [baseSchedule, schedulesByWeek, selectedSubject]);


    useEffect(() => {
        if (visibleSubjects.length > 0 && !visibleSubjects.includes(selectedSubject)) {
            setSelectedSubject(visibleSubjects[0]);
        } else if (visibleSubjects.length === 0) {
            setSelectedSubject('');
        }
    }, [visibleSubjects, selectedSubject]);


    const handleSaveHiddenSubjects = (newHidden: string[]) => {
        setHiddenSubjects(newHidden);
        setIsSubjectModalOpen(false);
    };

    const handleUpdateProgress = useCallback((key: string, value: string) => {
        setProgress(prev => {
            const newProgress = { ...prev };
            const currentEntry = newProgress[key] || { content: '', memo: '' };
            const newEntry = { ...currentEntry, content: value };
            
            if (newEntry.content.trim() === '' && (newEntry.memo || '').trim() === '') {
                delete newProgress[key];
            } else {
                newProgress[key] = newEntry;
            }
            return newProgress;
        });
    }, []);
    
    const handleSaveProgress = (key: string, value: ProgressEntry) => {
        setProgress(prev => {
            const newProgress = { ...prev };
            if (value.content.trim() === '' && value.memo.trim() === '') {
                delete newProgress[key];
            } else {
                newProgress[key] = value;
            }
            return newProgress;
        });
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

        const shouldAddAtStart = currentIndex < weeks.length / 2;
        
        const formatDate = (date: Date) => {
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${m}-${d}`;
        };
    
        if (shouldAddAtStart) {
            const firstWeek = weeks[0];
            const [startMonthStr, startDayStr] = firstWeek.dates.split(' ~ ')[0].split('-');
            const firstDate = new Date(new Date().getFullYear(), parseInt(startMonthStr) - 1, parseInt(startDayStr));
    
            const prevEndDate = new Date(firstDate);
            prevEndDate.setDate(firstDate.getDate() - 3);
    
            const prevStartDate = new Date(prevEndDate);
            prevStartDate.setDate(prevEndDate.getDate() - 4);
    
            const newDates = `${formatDate(prevStartDate)} ~ ${formatDate(prevEndDate)}`;
            const newWeekData = { dates: newDates };
    
            const weekIdMap: { [oldId: number]: number } = {};
            const newWeeksWithData = [newWeekData, ...weeks];
            const finalNewWeeks = newWeeksWithData.map((week, index) => {
                const newId = index + 1;
                if (index > 0) {
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
                const match = key.match(/^w(\d+)-c(.+?)-sub(.+)-s(\d+)$/);
                if (match) {
                    const oldWeekId = parseInt(match[1], 10);
                    const newWeekId = weekIdMap[oldWeekId];
                    if (newWeekId !== undefined) {
                        const classId = match[2];
                        const subject = match[3];
                        const session = match[4];
                        newProgress[`w${newWeekId}-c${classId}-sub${subject}-s${session}`] = progress[key];
                    }
                }
            }
            
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
            const lastWeek = weeks[weeks.length - 1];
            const newId = lastWeek.id + 1;
            
            const lastDateStr = lastWeek.dates.split(' ~ ')[1];
            const [monthStr, dayStr] = lastDateStr.split('-');
            const lastDate = new Date(new Date().getFullYear(), parseInt(monthStr) - 1, parseInt(dayStr));
    
            const nextStartDate = new Date(lastDate);
            nextStartDate.setDate(lastDate.getDate() + 3);
    
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
    
        const weeksToKeep = weeks.filter(w => w.id !== currentWeek);
        const weekIdMap: { [oldId: number]: number } = {};
        const newWeeksFinal = weeksToKeep.map((week, index) => {
            const newId = index + 1;
            weekIdMap[week.id] = newId;
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
            const match = key.match(/^w(\d+)-c(.+?)-sub(.+)-s(\d+)$/);
            if (match) {
                const oldWeekId = parseInt(match[1], 10);
                const newWeekId = weekIdMap[oldWeekId];
                if (newWeekId !== undefined) {
                    const classId = match[2];
                    const subject = match[3];
                    const session = match[4];
                    newProgress[`w${newWeekId}-c${classId}-sub${subject}-s${session}`] = progress[key];
                }
            }
        }
    
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

    const currentSchedule = useMemo(() => schedulesByWeek[currentWeek] || [], [schedulesByWeek, currentWeek]);

    const sessionMap = useMemo(() => {
        const map = new Map<string, number>();
        const classSessionCounter = new Map<string, number>();
    
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

    const sessionsCountPerWeek = useMemo(() => {
        const counts: { [weekId: number]: { [subject: string]: { [classId: string]: number } } } = {};
        
        for (const weekId in schedulesByWeek) {
            const weekIdNum = parseInt(weekId, 10);
            const schedule = schedulesByWeek[weekIdNum];
            const weeklyCounts: { [subject: string]: { [classId: string]: number } } = {};
    
            schedule.forEach(item => {
                if (item.subject && item.classId) {
                    if (!weeklyCounts[item.subject]) {
                        weeklyCounts[item.subject] = {};
                    }
                    if (!weeklyCounts[item.subject][item.classId]) {
                        weeklyCounts[item.subject][item.classId] = 0;
                    }
                    weeklyCounts[item.subject][item.classId]++;
                }
            });
            counts[weekIdNum] = weeklyCounts;
        }
        return counts;
    }, [schedulesByWeek]);

    const sortedProgressForSummary = useMemo(() => {
        const allProgressEntries: { weekId: number, classId: string, day: number, period: number, content: string, subject: string }[] = [];

        const sortedWeekIds = Object.keys(schedulesByWeek).map(Number).sort((a, b) => a - b);

        sortedWeekIds.forEach(weekId => {
            const schedule = schedulesByWeek[weekId];
            if (!schedule) return [];

            const weeklySessionCounter = new Map<string, number>();
            const sortedSchedule = [...schedule].sort((a, b) => {
                if (a.day !== b.day) return a.day - b.day;
                return a.period - b.period;
            });

            sortedSchedule.forEach(item => {
                const counterKey = `${item.subject}-${item.classId}`;
                const currentCount = weeklySessionCounter.get(counterKey) || 0;
                const sessionNumber = currentCount + 1;
                
                const progressKey = `w${weekId}-c${item.classId}-sub${item.subject}-s${sessionNumber}`;
                const progressEntry = progress[progressKey];
                
                if (progressEntry && progressEntry.content) {
                    allProgressEntries.push({
                        weekId: weekId,
                        day: item.day,
                        period: item.period,
                        content: progressEntry.content,
                        subject: item.subject,
                        classId: item.classId
                    });
                }
                
                weeklySessionCounter.set(counterKey, sessionNumber);
            });
        });
        
        const subjectProgressEntries = allProgressEntries.filter(p => p.subject === selectedSubject);
        if (subjectProgressEntries.length === 0) {
            return [];
        }

        const progressCountsByClass = new Map<string, number>();
        subjectProgressEntries.forEach(entry => {
            progressCountsByClass.set(entry.classId, (progressCountsByClass.get(entry.classId) || 0) + 1);
        });

        let referenceClassId = '';
        let maxCount = 0;
        progressCountsByClass.forEach((count, classId) => {
            if (count > maxCount) {
                maxCount = count;
                referenceClassId = classId;
            }
        });
        
        const compareChronologically = (a: {weekId: number, day: number, period: number}, b: {weekId: number, day: number, period: number}) => {
            if (a.weekId !== b.weekId) return a.weekId - b.weekId;
            if (a.day !== b.day) return a.day - b.day;
            return a.period - b.period;
        };

        if (!referenceClassId) {
            return subjectProgressEntries.sort(compareChronologically);
        }

        const referenceProgress = subjectProgressEntries
            .filter(p => p.classId === referenceClassId)
            .sort(compareChronologically);

        const referenceContentTimestamp = new Map<string, { weekId: number, day: number, period: number }>();
        referenceProgress.forEach(entry => {
            if (!referenceContentTimestamp.has(entry.content)) {
                referenceContentTimestamp.set(entry.content, {
                    weekId: entry.weekId,
                    day: entry.day,
                    period: entry.period
                });
            }
        });

        subjectProgressEntries.sort((a, b) => {
            const timestampA = referenceContentTimestamp.get(a.content) || a;
            const timestampB = referenceContentTimestamp.get(b.content) || b;
            
            const effectiveTimeComparison = compareChronologically(timestampA, timestampB);

            if (effectiveTimeComparison !== 0) {
                return effectiveTimeComparison;
            }

            return compareChronologically(a, b);
        });

        return subjectProgressEntries;
    }, [schedulesByWeek, progress, selectedSubject]);

    const progressSummaryContent = useMemo(() => {
        const uniqueContentFromLogic = Array.from(new Set(sortedProgressForSummary.map(p => p.content)));
        const customOrder = progressOrder[selectedSubject];

        if (!customOrder) {
            return uniqueContentFromLogic;
        }

        const actualContentSet = new Set(uniqueContentFromLogic);
        const validCustomOrder = customOrder.filter(content => actualContentSet.has(content));
        const validCustomOrderSet = new Set(validCustomOrder);
        const newItems = uniqueContentFromLogic.filter(content => !validCustomOrderSet.has(content));
        
        return [...validCustomOrder, ...newItems];

    }, [sortedProgressForSummary, progressOrder, selectedSubject]);

    const handleProgressOrderChange = useCallback((subject: string, newOrder: string[]) => {
        setProgressOrder(prev => ({
            ...prev,
            [subject]: newOrder,
        }));
    }, []);

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
                    title: '설정 완료',
                    message: '기본 시간표가 설정되었습니다.'
                });
            }
        });
    }, [currentSchedule, baseSchedule]);
    
    const handleToggleEditMode = () => {
        if (!isEditMode) {
            setInfoModalContent({
                title: '시간표 편집 모드',
                message: '이제 시간표 항목을 드래그 앤 드롭으로 이동할 수 있습니다. 빈 칸을 클릭하여 새 수업을 추가하거나, 기존 수업을 클릭하여 수정/삭제할 수 있습니다.\n\n편집이 끝나면 \'편집 완료\' 버튼을 눌러주세요.'
            });
        }
        setIsEditMode(prev => !prev);
    };

    const actualCurrentWeekId = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentYear = today.getFullYear();
        const foundWeek = weeks.find(week => {
             try {
                const [startStr, endStr] = week.dates.split(' ~ ');
                const [startMonth, startDay] = startStr.split('-').map(Number);
                const [endMonth, endDay] = endStr.split('-').map(Number);
                const startDate = new Date(currentYear, startMonth - 1, startDay);
                const endDate = new Date(currentYear, endMonth - 1, endDay);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(0, 0, 0, 0);
                return today >= startDate && today <= endDate;
            } catch (e) {
                console.error(`Error parsing dates for week ${week.id}: "${week.dates}"`);
                return false;
            }
        });
        return foundWeek ? foundWeek.id : null;
    }, [weeks]);

    if (!currentUser) {
        return <Auth onAuthSuccess={handleAuthSuccess} />;
    }
    
    return (
        <div className="bg-slate-100 min-h-screen">
            <div className="max-w-7xl mx-auto p-4 lg:p-8">
                <header className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <SmileyIcon />
                        <h1 className="text-3xl font-bold text-slate-800">수업 진도 알리미</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-slate-600">환영합니다, <span className="font-bold">{currentUser}</span>님</span>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-slate-600 text-white rounded-md text-sm font-medium hover:bg-slate-700 transition-colors"
                        >
                            로그아웃
                        </button>
                    </div>
                </header>
        
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-1 space-y-6">
                        <WeekSelector
                            weeks={weeks}
                            currentWeek={currentWeek}
                            onSelectWeek={handleSelectWeek}
                            onAddWeek={handleAddWeek}
                            onRemoveWeek={handleRemoveWeek}
                        />
                        <ProgressSummary
                            progressContent={progressSummaryContent}
                            onOrderChange={handleProgressOrderChange}
                            highlightedProgressContent={highlightedProgressContent}
                            onHighlight={handleHighlightProgress}
                            subjects={visibleSubjects}
                            selectedSubject={selectedSubject}
                            onSelectSubject={setSelectedSubject}
                        />
                    </div>
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="p-4 flex flex-wrap justify-between items-center gap-y-2 border-b border-slate-200">
                                <div className="flex items-baseline gap-3">
                                    <h2 className="text-xl font-bold text-slate-700 whitespace-nowrap">시간표</h2>
                                    <p className="text-sm text-slate-600">수업을 클릭하여 진도를 입력하세요.</p>
                                </div>
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    <button
                                        onClick={handleToggleEditMode}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                            isEditMode
                                            ? 'bg-red-500 text-white hover:bg-red-600'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                    >
                                        {isEditMode ? '편집 완료' : '시간표 편집'}
                                    </button>
                                    <button
                                        onClick={handleSetBaseSchedule}
                                        className="px-4 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                                    >
                                        기본 시간표로 설정
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 pl-3">
                                <Timetable
                                    schedule={currentSchedule}
                                    progress={progress}
                                    currentWeek={currentWeek}
                                    onDrop={handleDrop}
                                    onCellClick={handleCellClick}
                                    highlightedProgressContent={highlightedProgressContent}
                                    isEditMode={isEditMode}
                                    sessionMap={sessionMap}
                                    isCurrentWeek={currentWeek === actualCurrentWeekId}
                                />
                            </div>
                        </div>
                    </div>
                </div>
        
                <div className="mt-6">
                    <ProgressChart
                        progress={progress}
                        weeks={weeks}
                        classNumbers={classNumbers}
                        onUpdateProgress={handleUpdateProgress}
                        subjects={visibleSubjects}
                        selectedSubject={selectedSubject}
                        onSelectSubject={setSelectedSubject}
                        sessionsCountPerWeek={sessionsCountPerWeek}
                        onEditSubjects={() => setIsSubjectModalOpen(true)}
                    />
                </div>
        
                {isModalOpen && editingItem && (
                    <Modal isOpen={isModalOpen} onClose={closeModal} title={('id' in editingItem) ? '수업 편집' : '수업 추가'}>
                        <ScheduleForm
                            item={editingItem}
                            onSave={handleSaveScheduleItem}
                            onDelete={'id' in editingItem ? handleDeleteScheduleItem : undefined}
                        />
                    </Modal>
                )}
        
                {isProgressModalOpen && editingProgressItem && (
                    <ProgressEditorModal
                        isOpen={isProgressModalOpen}
                        onClose={() => setIsProgressModalOpen(false)}
                        itemInfo={editingProgressItem}
                        currentProgress={progress[`w${currentWeek}-c${editingProgressItem.item.classId}-sub${editingProgressItem.item.subject}-s${editingProgressItem.session}`] || { content: '', memo: '' }}
                        onSave={handleSaveProgress}
                        currentWeek={currentWeek}
                    />
                )}
                
                {isSubjectModalOpen && (
                     <SubjectVisibilityModal
                        isOpen={isSubjectModalOpen}
                        onClose={() => setIsSubjectModalOpen(false)}
                        allSubjects={allSubjects}
                        hiddenSubjects={hiddenSubjects}
                        onSave={handleSaveHiddenSubjects}
                     />
                )}
        
                {infoModalContent && (
                    <InfoModal
                        isOpen={!!infoModalContent}
                        onClose={() => setInfoModalContent(null)}
                        title={infoModalContent.title}
                        message={infoModalContent.message}
                    />
                )}
        
                {confirmModalContent && (
                    <ConfirmModal
                        isOpen={!!confirmModalContent}
                        onClose={() => setConfirmModalContent(null)}
                        onConfirm={confirmModalContent.onConfirm}
                        title={confirmModalContent.title}
                        message={confirmModalContent.message}
                    />
                )}
            </div>
        </div>
    );
};

export default App;
