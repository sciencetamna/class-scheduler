
import React from 'react';
import { ScheduleItem, ProgressData } from '../types';
import { DAYS, PERIODS } from '../constants';

interface TimetableProps {
  schedule: ScheduleItem[];
  progress: ProgressData;
  currentWeek: number;
  onDrop: (itemId: string, day: number, period: number) => void;
  onCellClick: (item: ScheduleItem | { day: number, period: number }) => void;
  highlightedProgressContent: string | null;
  isEditMode: boolean;
  sessionMap: Map<string, number>;
}

const Timetable: React.FC<TimetableProps> = ({ 
  schedule, 
  progress, 
  currentWeek, 
  onDrop, 
  onCellClick, 
  highlightedProgressContent,
  isEditMode,
  sessionMap
}) => {
  const scheduleMap = React.useMemo(() => {
    const map = new Map<string, ScheduleItem>();
    schedule.forEach(item => map.set(`${item.day}-${item.period}`, item));
    return map;
  }, [schedule]);

  const today = new Date().getDay(); // Sunday: 0, Monday: 1, ..., Saturday: 6

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: ScheduleItem) => {
    if (!isEditMode) return;
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEditMode) return;
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.currentTarget.classList.add('bg-blue-100');
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEditMode) return;
    e.currentTarget.classList.remove('bg-blue-100');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, day: number, period: number) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-100');
    const item = JSON.parse(e.dataTransfer.getData('application/json'));
    if (!scheduleMap.has(`${day}-${period}`)) {
        onDrop(item.id, day, period);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-2">
      <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] grid-rows-[auto_repeat(7,1fr)] gap-1 text-center text-sm">
        <div className="p-2 font-bold text-slate-600">교시</div>
        {DAYS.map((day, index) => {
            const isToday = today === index + 1;
            return (
                 <div 
                    key={day} 
                    className={`p-2 font-bold rounded-t-md transition-colors ${
                        isToday 
                        ? 'bg-yellow-300 text-yellow-800' 
                        : 'bg-slate-200 text-slate-700'
                    }`}
                >
                    {day}
                </div>
            );
        })}

        {PERIODS.map(period => (
          <React.Fragment key={period.id}>
            <div className="p-2 flex flex-col justify-center items-center text-xs text-slate-500">
              <span className="font-bold text-base">{period.id}</span>
              <span>{period.time}</span>
            </div>
            {DAYS.map((_, dayIndex) => {
              const day = dayIndex + 1;
              const isTodayColumn = today === day;
              const item = scheduleMap.get(`${day}-${period.id}`);
              
              if (item) {
                const sessionNumber = sessionMap.get(item.id);
                let progressContent = '';
                if (sessionNumber) {
                    const progressKey = `w${currentWeek}-c${item.classId}-s${sessionNumber}`;
                    progressContent = progress[progressKey] || '';
                }
                
                const isHighlighted = highlightedProgressContent !== null && progressContent === highlightedProgressContent;

                return (
                  <div
                    key={`${day}-${period.id}`}
                    className={`border rounded-md p-2 flex flex-col justify-between min-h-[60px] text-left transition-all duration-300 shadow-sm hover:shadow-lg relative ${
                        isTodayColumn ? 'bg-yellow-50 border-yellow-300' : 'bg-sky-50 border-sky-200'
                    } ${
                        isHighlighted ? 'ring-4 ring-purple-500 ring-offset-1 z-10' : ''
                    } ${
                        isEditMode ? 'cursor-grab' : 'cursor-pointer'
                    }`}
                    draggable={isEditMode}
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onCellClick(item)}
                  >
                    <div>
                      <div className="font-bold text-slate-800">{item.classId} {item.subject}</div>
                    </div>
                    {progressContent && (
                      <div className="text-xs mt-1 p-1 bg-green-100 text-green-800 rounded">
                        - {progressContent}
                      </div>
                    )}
                  </div>
                );
              } else {
                return (
                  <div 
                    key={`${day}-${period.id}`}
                    className={`border border-dashed rounded-md min-h-[60px] transition-colors duration-200 ${
                        isTodayColumn ? 'bg-yellow-50 border-yellow-300' : 'bg-slate-50 border-slate-200'
                    } ${
                        isEditMode ? '' : 'cursor-pointer'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, day, period.id)}
                    onClick={() => onCellClick({day, period: period.id})}
                  />
                );
              }
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Timetable;
