

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ProgressData, Week } from '../types';

interface EditableCellProps {
  value: string;
  onSave: (newValue: string) => void;
}

const EditableCell: React.FC<EditableCellProps> = ({ value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(value);
  }, [value]);
  
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave(text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setText(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full h-full p-1 box-border bg-yellow-100 border-blue-500 border-2 rounded"
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="w-full p-1 cursor-pointer whitespace-normal break-words min-h-8 flex items-center justify-center"
      title={value}
    >
      {value || <span className="text-slate-300">...</span>}
    </div>
  );
};

interface ProgressChartProps {
  progress: ProgressData;
  weeks: Week[];
  classNumbers: string[];
  onUpdateProgress: (key: string, value: string) => void;
  subjects: string[];
  selectedSubject: string;
  onSelectSubject: (subject: string) => void;
  sessionsCountPerWeek: { [weekId: number]: { [subject: string]: { [classId: string]: number } } };
  onEditSubjects: () => void;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ 
    progress, weeks, classNumbers, onUpdateProgress,
    subjects, selectedSubject, onSelectSubject, sessionsCountPerWeek,
    onEditSubjects
}) => {
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  useEffect(() => {
    if (isDraggingRef.current) return;
    const container = tabContainerRef.current;
    if (container && selectedSubject) {
      const activeTab = container.querySelector<HTMLButtonElement>(`button[data-subject="${selectedSubject}"]`);
      if (activeTab) {
        activeTab.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [selectedSubject]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = tabContainerRef.current;
    if (!container) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - container.offsetLeft;
    scrollLeftRef.current = container.scrollLeft;
    container.style.cursor = 'grabbing';
    container.style.userSelect = 'none';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const container = tabContainerRef.current;
    if (!container) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    container.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    const container = tabContainerRef.current;
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (container) {
      container.style.cursor = 'grab';
      container.style.removeProperty('user-select');
    }
  };
  
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const container = tabContainerRef.current;
    if (!container) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.touches[0].pageX - container.offsetLeft;
    scrollLeftRef.current = container.scrollLeft;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const container = tabContainerRef.current;
    if (!container) return;
    const x = e.touches[0].pageX - container.offsetLeft;
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    container.scrollLeft = scrollLeftRef.current - walk;
  };
  
  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  const handleTabClick = (subject: string) => {
    if (hasDraggedRef.current) {
      return;
    }
    onSelectSubject(subject);
  };
  
  const weeklyMaxSessions = useMemo(() => {
    const result: { [weekId: number]: number } = {};
    weeks.forEach(week => {
        const weeklyCounts = sessionsCountPerWeek[week.id];
        if (!selectedSubject || !weeklyCounts || !weeklyCounts[selectedSubject]) {
            result[week.id] = 0;
            return;
        }
        const subjectCountsForWeek = weeklyCounts[selectedSubject];
        const counts = Object.values(subjectCountsForWeek);
        result[week.id] = Math.max(0, ...counts);
    });
    return result;
  }, [selectedSubject, sessionsCountPerWeek, weeks]);

  const allWeeksHaveZeroSessions = useMemo(
    () => Object.values(weeklyMaxSessions).every(count => count === 0),
    [weeklyMaxSessions]
  );
  
  return (
    <div className="bg-white rounded-lg shadow-md">
       <div className="p-4 flex justify-between items-center">
        <div className="flex items-baseline gap-3">
            <h2 className="text-xl font-bold text-slate-800">수업진도표</h2>
            <p className="text-sm text-slate-600">진도를 작성하면 시간표에 자동으로 반영됩니다.</p>
        </div>
        <button 
            onClick={onEditSubjects}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
            과목 편집
        </button>
      </div>

      <div className="px-4 border-b border-slate-300">
        <div
            ref={tabContainerRef}
            className="-mb-px flex gap-1 overflow-x-auto"
            style={{ scrollbarWidth: 'none', cursor: 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {subjects.map(subject => (
                <button
                    key={subject}
                    data-subject={subject}
                    onClick={() => handleTabClick(subject)}
                    className={`flex-shrink-0 whitespace-nowrap px-4 py-1.5 text-sm font-medium rounded-t-lg border border-slate-300 transition-colors focus:outline-none relative ${
                        selectedSubject === subject
                        ? 'bg-white text-blue-600 border-b-white'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-200 border-b-slate-300'
                    }`}
                >
                    {subject}
                </button>
            ))}
        </div>
      </div>

      <div className="p-4">
        <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-center text-sm table-fixed">
            <thead>
                <tr className="bg-slate-200 text-[13px]">
                <th rowSpan={2} className="p-2 border border-slate-300 w-16 min-w-[4rem] sticky left-0 z-10 bg-slate-200">반</th>
                {weeks.map(week => {
                    const maxSessionsForWeek = weeklyMaxSessions[week.id] || 0;
                    return (
                        <th key={week.id} colSpan={maxSessionsForWeek > 0 ? maxSessionsForWeek : 1} className="p-1 border border-slate-300">
                            {week.label} ({week.dates.split('~')[0].trim()})
                        </th>
                    )
                })}
                </tr>
                <tr className="bg-slate-200 text-[13px]">
                {weeks.flatMap(week => {
                    const maxSessionsForWeek = weeklyMaxSessions[week.id] || 0;
                    if (maxSessionsForWeek === 0) {
                        return [<th key={`${week.id}-ph`} className="p-1 border border-slate-300 min-w-[144px]">-</th>];
                    }
                    return Array.from({ length: maxSessionsForWeek }, (_, i) => (
                        <th key={`${week.id}-${i+1}`} className="p-1 border border-slate-300 min-w-[144px]">{i + 1}차시</th>
                    ));
                })}
                </tr>
            </thead>
            <tbody>
                {classNumbers.map(classId => (
                <tr key={classId} className="hover:bg-slate-50">
                    <td className="p-2 border border-slate-300 font-bold bg-slate-100 sticky left-0 z-10 hover:bg-slate-50 w-16 min-w-[4rem]">{classId}</td>
                    {weeks.flatMap(week => {
                        const maxSessionsForWeek = weeklyMaxSessions[week.id] || 0;
                        const classSessionsForSubject = sessionsCountPerWeek[week.id]?.[selectedSubject]?.[classId] || 0;
                        
                        if (maxSessionsForWeek === 0) {
                            return [<td key={`${week.id}-${classId}-ph`} className="p-0 border border-slate-300 bg-slate-50"></td>];
                        }
                        return Array.from({ length: maxSessionsForWeek }, (_, i) => {
                            const session = i + 1;
                            if (session > classSessionsForSubject) {
                                return <td key={`w${week.id}-c${classId}-s${session}`} className="p-0 border border-slate-300 bg-slate-100"></td>
                            }
                            const key = `w${week.id}-c${classId}-sub${selectedSubject}-s${session}`;
                            const value = progress[key]?.content || '';
                            return (
                                <td key={key} className="p-0 border border-slate-300 align-middle">
                                    <EditableCell value={value} onSave={(val) => onUpdateProgress(key, val)} />
                                </td>
                            );
                        })
                    })}
                </tr>
                ))}
            </tbody>
            </table>
            {subjects.length > 0 && classNumbers.length > 0 && allWeeksHaveZeroSessions && selectedSubject && (
                <div className="text-center text-slate-500 p-4 border border-t-0 border-slate-300">
                    '{selectedSubject}' 과목은 시간표에 없거나, 해당 과목의 수업이 배정된 반이 없습니다.
                </div>
            )}
            {subjects.length > 0 && classNumbers.length === 0 && selectedSubject && (
                 <div className="text-center text-slate-500 p-4 border border-t-0 border-slate-300">
                    '{selectedSubject}' 과목이 배정된 반이 없습니다.
                </div>
            )}
            {subjects.length === 0 && (
                <div className="text-center text-slate-500 p-4 border border-t-0 border-slate-300">
                    표시할 과목이 없습니다. '과목 편집'에서 표시할 과목을 선택해주세요.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;