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
      className="w-full h-full p-1 cursor-pointer truncate"
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
  sessionsCount: { [subject: string]: { [classId: string]: number } };
  onEditSubjects: () => void;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ 
    progress, weeks, classNumbers, onUpdateProgress,
    subjects, selectedSubject, onSelectSubject, sessionsCount,
    onEditSubjects
}) => {
  
  const maxSessions = useMemo(() => {
    if (!selectedSubject || !sessionsCount[selectedSubject]) {
        return 0;
    }
    const counts = Object.values(sessionsCount[selectedSubject]);
    return Math.max(0, ...counts);
  }, [selectedSubject, sessionsCount]);

  return (
    <div className="bg-white rounded-lg shadow-md">
       <div className="p-4 flex justify-between items-center">
        <div className="flex items-baseline gap-3">
            <h2 className="text-xl font-bold text-slate-800">교과진도표</h2>
            <p className="text-sm text-slate-600">진도를 작성하면 시간표에 자동으로 반영됩니다.</p>
        </div>
        <button 
            onClick={onEditSubjects}
            className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-md text-sm font-semibold hover:bg-slate-300 transition-colors"
        >
            과목 편집
        </button>
      </div>

      <div className="px-4 border-b border-slate-300">
        <div className="-mb-px flex flex-wrap gap-1">
            {subjects.map(subject => (
                <button
                    key={subject}
                    onClick={() => onSelectSubject(subject)}
                    className={`px-4 py-2 text-sm font-semibold rounded-t-lg border border-slate-300 transition-colors focus:outline-none relative ${
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
            <table className="w-full border-collapse text-center text-sm table-fixed">
            <thead>
                <tr className="bg-slate-200">
                <th rowSpan={2} className="p-2 border border-slate-300 w-16">반</th>
                {weeks.map(week => (
                    <th key={week.id} colSpan={maxSessions > 0 ? maxSessions : 1} className="p-2 border border-slate-300">{week.label} ({week.dates.split('~')[0].trim()})</th>
                ))}
                </tr>
                <tr className="bg-slate-200">
                {weeks.flatMap(week => {
                    if (maxSessions === 0) {
                        return [<th key={`${week.id}-ph`} className="p-2 border border-slate-300 w-24">-</th>];
                    }
                    return Array.from({ length: maxSessions }, (_, i) => (
                    <th key={`${week.id}-${i+1}`} className="p-2 border border-slate-300 w-24">{i + 1}차시</th>
                    ))
                })}
                </tr>
            </thead>
            <tbody>
                {classNumbers.map(classId => (
                <tr key={classId} className="hover:bg-slate-50">
                    <td className="p-2 border border-slate-300 font-bold bg-slate-100">{classId}</td>
                    {weeks.flatMap(week => {
                    const classSessionsForSubject = sessionsCount[selectedSubject]?.[classId] || 0;
                    if (maxSessions === 0) {
                        return [<td key={`${week.id}-${classId}-ph`} className="p-0 border border-slate-300 h-10 bg-slate-50"></td>];
                    }
                    return Array.from({ length: maxSessions }, (_, i) => {
                        const session = i + 1;
                        if (session > classSessionsForSubject) {
                            return <td key={`w${week.id}-c${classId}-s${session}`} className="p-0 border border-slate-300 h-10 bg-slate-100"></td>
                        }
                        const key = `w${week.id}-c${classId}-s${session}`;
                        return (
                            <td key={key} className="p-0 border border-slate-300 h-10">
                                <EditableCell value={progress[key] || ''} onSave={(val) => onUpdateProgress(key, val)} />
                            </td>
                        );
                    })
                    })}
                </tr>
                ))}
            </tbody>
            </table>
            {subjects.length > 0 && maxSessions === 0 && selectedSubject && (
                <div className="text-center text-slate-500 p-4 border border-t-0 border-slate-300">
                    '{selectedSubject}' 과목은 시간표에 없거나, 해당 과목의 수업이 배정된 반이 없습니다.
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