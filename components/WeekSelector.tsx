import React from 'react';
import { Week } from '../types';

interface WeekSelectorProps {
  weeks: Week[];
  currentWeek: number;
  onSelectWeek: (weekId: number) => void;
  onAddWeek: () => void;
  onRemoveWeek: () => void;
}

const WeekSelector: React.FC<WeekSelectorProps> = ({ weeks, currentWeek, onSelectWeek, onAddWeek, onRemoveWeek }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-2">
      <div className="max-h-60 overflow-y-auto">
        <table className="w-full text-center text-sm border-collapse">
          <thead>
            <tr className="bg-slate-200">
              <th className="p-2 border border-slate-300">주</th>
              <th className="p-2 border border-slate-300">기간</th>
            </tr>
          </thead>
          <tbody>
            {[...weeks].reverse().map((week) => (
              <tr
                key={week.id}
                onClick={() => onSelectWeek(week.id)}
                className={`cursor-pointer transition-colors duration-200 ${currentWeek === week.id ? 'bg-blue-500 text-white font-bold' : 'hover:bg-blue-100'}`}
              >
                <td className="p-2 border border-slate-300">{week.label}</td>
                <td className="p-2 border border-slate-300">{week.dates}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex gap-2">
        <button 
            onClick={onAddWeek} 
            className="w-full px-3 py-2 bg-blue-500 text-white rounded-md text-sm font-semibold hover:bg-blue-600 transition-colors"
        >
            주차 추가
        </button>
        <button 
            onClick={onRemoveWeek}
            className="w-full px-3 py-2 bg-red-500 text-white rounded-md text-sm font-semibold hover:bg-red-600 transition-colors"
        >
            주차 제거
        </button>
      </div>
    </div>
  );
};

export default WeekSelector;
