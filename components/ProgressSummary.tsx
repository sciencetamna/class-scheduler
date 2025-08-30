import React, { useMemo } from 'react';
import { ProgressData } from '../types';

interface ProgressSummaryProps {
  progress: ProgressData;
  highlightedProgressContent: string | null;
  onHighlight: (content: string | null) => void;
  subjects: string[];
  selectedSubject: string;
  onSelectSubject: (subject: string) => void;
  progressKeyToSubjectMap: { [key: string]: string };
}

const ProgressSummary: React.FC<ProgressSummaryProps> = ({ progress, highlightedProgressContent, onHighlight, subjects, selectedSubject, onSelectSubject, progressKeyToSubjectMap }) => {
  const uniqueProgressContent = useMemo(() => {
    const contentSet = new Set<string>();
    for (const key in progress) {
        if (progressKeyToSubjectMap[key] === selectedSubject) {
            if (progress[key]) {
                contentSet.add(progress[key]);
            }
        }
    }
    return Array.from(contentSet).sort();
  }, [progress, selectedSubject, progressKeyToSubjectMap]);

  if (subjects.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md mt-8">
      <h3 className="font-bold text-center p-2 text-slate-700">수업 진도 순서</h3>
      
      <div className="px-2 pt-2 border-b border-slate-300">
        <div className="-mb-px flex flex-wrap gap-1">
            {subjects.map(subject => (
                <button
                    key={subject}
                    onClick={() => onSelectSubject(subject)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-t-md border border-slate-300 transition-colors focus:outline-none ${
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

      <div className="p-2">
        <div className="max-h-52 overflow-y-auto">
            {uniqueProgressContent.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-4">선택된 과목에 대한 진도 내용이 없습니다.</p>
            ) : (
                <ol className="list-decimal list-inside space-y-1">
                {uniqueProgressContent.map(content => {
                    const isHighlighted = highlightedProgressContent === content;
                    return (
                    <li
                        key={content}
                        onClick={() => onHighlight(content)}
                        className={`p-2 rounded-md cursor-pointer transition-colors duration-200 text-sm truncate ${
                        isHighlighted 
                        ? 'bg-purple-500 text-white font-bold' 
                        : 'bg-slate-100 hover:bg-purple-100'
                        }`}
                        title={content}
                    >
                        <span className="ml-1">{content}</span>
                    </li>
                    );
                })}
                </ol>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProgressSummary;