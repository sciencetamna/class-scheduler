
import React, { useState } from 'react';
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
  isCurrentWeek: boolean;
}

const Timetable: React.FC<TimetableProps> = ({ 
  schedule, 
  progress, 
  currentWeek, 
  onDrop, 
  onCellClick, 
  highlightedProgressContent,
  isEditMode,
  sessionMap,
  isCurrentWeek
}) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCellKey, setDragOverCellKey] = useState<string | null>(null);

  const scheduleMap = React.useMemo(() => {
    const map = new Map<string, ScheduleItem>();
    schedule.forEach(item => map.set(`${item.day}-${item.period}`, item));
    return map;
  }, [schedule]);

  const today = new Date().getDay(); // Sunday: 0, Monday: 1, ..., Saturday: 6

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: ScheduleItem) => {
    if (!isEditMode) return;
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    setDraggingId(item.id);
  };

  const handleDragEnd = () => {
    if (!isEditMode) return;
    setDraggingId(null);
    setDragOverCellKey(null);
  };

  const handleCellDragOver = (e: React.DragEvent<HTMLDivElement>, day: number, period: number) => {
    if (!isEditMode) return;
    e.preventDefault();
    if (!scheduleMap.has(`${day}-${period}`)) {
        setDragOverCellKey(`${day}-${period}`);
    }
  };
  
  const handleGridDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEditMode) return;
    // Check if the mouse is leaving the component's bounding box
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setDragOverCellKey(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, day: number, period: number) => {
    if (!isEditMode) return;
    e.preventDefault();
    setDragOverCellKey(null);
    const item = JSON.parse(e.dataTransfer.getData('application/json'));
    if (!scheduleMap.has(`${day}-${period}`)) {
        onDrop(item.id, day, period);
        // Fix: Reset dragging state immediately on successful drop to prevent
        // the item from staying transparent due to a race condition with onDragEnd.
        setDraggingId(null);
    }
  };

  return (
    <div 
      className="grid grid-cols-[auto_repeat(5,3.5fr)] grid-rows-[auto_repeat(7,1fr)] gap-1 text-center text-sm p-1 rounded-lg"
      onDragLeave={handleGridDragLeave}
    >
      <div className="py-1.5 pr-1 font-bold text-slate-600">교시</div>
      {DAYS.map((day, index) => {
          const isToday = isCurrentWeek && today === index + 1;
          return (
               <div 
                  key={day} 
                  className={`px-2 py-1.5 font-bold rounded-t-md transition-colors ${
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
          <div className="py-2 pr-1 flex flex-col justify-center items-center text-xs text-slate-500">
            <span className="font-bold text-base">{period.id}</span>
            <span>{period.time}</span>
          </div>
          {DAYS.map((_, dayIndex) => {
            const day = dayIndex + 1;
            const isTodayColumn = isCurrentWeek && today === day;
            const item = scheduleMap.get(`${day}-${period.id}`);
            
            if (item) {
              const sessionNumber = sessionMap.get(item.id);
              const progressKey = sessionNumber ? `w${currentWeek}-c${item.classId}-sub${item.subject}-s${sessionNumber}` : '';
              const progressEntry = progress[progressKey] || { content: '', memo: '' };
              const { content: progressContent, memo } = progressEntry;
              const hasMemo = memo && memo.trim() !== '';

              const isHighlighted = highlightedProgressContent !== null && progressContent === highlightedProgressContent;
              
              const occupiedCellClasses = [
                'border', 'rounded-md', 'p-2', 'flex', 'flex-col', 'justify-between', 'min-h-[60px]', 'text-left', 'transition-all', 'duration-300', 'shadow-sm', 'hover:shadow-lg', 'relative', 'transform', 'group', 'hover:z-30',
                isHighlighted ? 'ring-4 ring-purple-500 ring-offset-1 z-10' : '',
                draggingId === item.id ? 'opacity-50' : '',
                isEditMode
                  ? 'cursor-grab hover:scale-[1.03] bg-rose-200 border-rose-400'
                  : `cursor-pointer ${isTodayColumn ? 'bg-yellow-100 border-yellow-400' : 'bg-sky-100 border-sky-300'}`,
              ].filter(Boolean).join(' ');


              return (
                <div
                  key={`${day}-${period.id}`}
                  className={occupiedCellClasses}
                  draggable={isEditMode}
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onCellClick(item)}
                >
                  <div>
                    <div className="font-jua text-slate-800 text-base tracking-tight">{item.classId} {item.subject}</div>
                  </div>
                  {progressContent && (
                    <div className="text-xs mt-1 p-1 bg-green-100 text-green-800 rounded break-all">
                      - {progressContent}
                    </div>
                  )}
                  {hasMemo && (
                    <>
                        <div className="absolute top-1 right-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="absolute left-full ml-2 top-1 w-3/4 bg-slate-800 text-white text-xs rounded py-1 px-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-pre-wrap break-words">
                            {memo}
                            <svg className="absolute text-slate-800 h-4 w-2 top-2 -translate-y-1/2 right-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve"><polygon className="fill-current" points="255,0 255,255 0,127.5"/></svg>
                        </div>
                    </>
                  )}
                </div>
              );
            } else {
              const isDragOverTarget = isEditMode && dragOverCellKey === `${day}-${period.id}`;
              const emptyCellClasses = [
                'border', 'border-dashed', 'rounded-md', 'min-h-[60px]', 'transition-colors', 'duration-200', 'group', 'relative',
                isDragOverTarget ? 'bg-rose-300' : (
                    isEditMode
                    ? 'cursor-pointer bg-rose-100 border-rose-300 hover:bg-rose-200'
                    : 'bg-slate-100 border-slate-300'
                ),
              ].filter(Boolean).join(' ');

              return (
                <div 
                  key={`${day}-${period.id}`}
                  className={emptyCellClasses}
                  onDragOver={(e) => handleCellDragOver(e, day, period.id)}
                  onDrop={(e) => handleDrop(e, day, period.id)}
                  onClick={() => onCellClick({day, period: period.id})}
                >
                  {isEditMode && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                       <div className="text-rose-400 text-3xl font-light">+</div>
                    </div>
                  )}
                </div>
              );
            }
          })}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Timetable;