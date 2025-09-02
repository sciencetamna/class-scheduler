
import React, { useState, useEffect } from 'react';
import Modal from './Modal';

interface ClassEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClasses: string[];
  onSave: (newClasses: string[]) => void;
}

const ClassEditorModal: React.FC<ClassEditorModalProps> = ({ isOpen, onClose, currentClasses, onSave }) => {
    const [classes, setClasses] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setClasses(currentClasses);
            setError(null);
        }
    }, [isOpen, currentClasses]);

    const handleClassChange = (index: number, value: string) => {
        const newClasses = [...classes];
        newClasses[index] = value;
        setClasses(newClasses);
    };

    const handleAddClass = () => {
        setClasses([...classes, '']);
    };

    const handleRemoveClass = (index: number) => {
        const newClasses = classes.filter((_, i) => i !== index);
        setClasses(newClasses);
    };

    const handleSave = () => {
        setError(null);
        const trimmedClasses = classes.map(c => c.trim());

        if (trimmedClasses.some(c => c === '')) {
            setError('반 이름을 비워둘 수 없습니다.');
            return;
        }

        const uniqueClasses = new Set(trimmedClasses);
        if (uniqueClasses.size !== trimmedClasses.length) {
            setError('반 이름은 중복될 수 없습니다.');
            return;
        }
        
        // Alphanumeric sort that handles Korean and numbers correctly
        const sortedClasses = [...uniqueClasses].sort((a, b) => 
            a.localeCompare(b, 'ko-KR', { numeric: true, sensitivity: 'base' })
        );

        onSave(sortedClasses);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="반 편집">
            <div className="space-y-3 max-h-[60vh] overflow-y-auto p-1">
                {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                {classes.map((cls, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={cls}
                            onChange={(e) => handleClassChange(index, e.target.value)}
                            className="flex-grow mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            placeholder="반 이름 (예: 3-1 or 관광경영과 등)"
                        />
                        <button 
                            onClick={() => handleRemoveClass(index)} 
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
                        >
                            삭제
                        </button>
                    </div>
                ))}
                 <button 
                    onClick={handleAddClass} 
                    className="w-full mt-3 px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-colors"
                >
                    반 추가
                </button>
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
                <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium">취소</button>
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">저장</button>
            </div>
        </Modal>
    );
};

export default ClassEditorModal;
