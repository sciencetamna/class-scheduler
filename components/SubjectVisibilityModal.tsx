import React, { useState, useEffect } from 'react';
import Modal from './Modal';

interface SubjectVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  allSubjects: string[];
  hiddenSubjects: string[];
  onSave: (newHiddenSubjects: string[]) => void;
}

const SubjectVisibilityModal: React.FC<SubjectVisibilityModalProps> = ({
  isOpen,
  onClose,
  allSubjects,
  hiddenSubjects,
  onSave,
}) => {
  const [localHiddenSubjects, setLocalHiddenSubjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setLocalHiddenSubjects(new Set(hiddenSubjects));
    }
  }, [isOpen, hiddenSubjects]);

  const handleToggleSubject = (subject: string) => {
    setLocalHiddenSubjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subject)) {
        newSet.delete(subject);
      } else {
        newSet.add(subject);
      }
      return newSet;
    });
  };

  const handleSave = () => {
    onSave(Array.from(localHiddenSubjects).sort());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="표시할 과목 편집">
      <div className="space-y-3 max-h-[60vh] overflow-y-auto p-1">
        <p className="text-sm text-gray-600 mb-4">
          교과진도표와 수업 진도 순서에 표시할 과목을 선택하세요.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allSubjects.map(subject => (
                <label key={subject} className="flex items-center space-x-2 p-2 rounded-md hover:bg-slate-100 cursor-pointer transition-colors">
                    <input
                        type="checkbox"
                        checked={!localHiddenSubjects.has(subject)}
                        onChange={() => handleToggleSubject(subject)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="select-none">{subject}</span>
                </label>
            ))}
        </div>
      </div>
      <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
        <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium">
          취소
        </button>
        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
          저장
        </button>
      </div>
    </Modal>
  );
};

export default SubjectVisibilityModal;
