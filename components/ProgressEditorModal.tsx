
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ScheduleItem, ProgressEntry } from '../types';

interface ProgressEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemInfo: { item: ScheduleItem, session: number } | null;
  currentProgress: ProgressEntry;
  onSave: (key: string, value: ProgressEntry) => void;
  currentWeek: number;
}

const ProgressEditorModal: React.FC<ProgressEditorModalProps> = ({
  isOpen,
  onClose,
  itemInfo,
  currentProgress,
  onSave,
  currentWeek,
}) => {
  const [content, setContent] = useState('');
  const [memo, setMemo] = useState('');

  useEffect(() => {
    if (isOpen) {
      setContent(currentProgress.content);
      setMemo(currentProgress.memo);
    }
  }, [isOpen, currentProgress]);

  const handleSave = () => {
    if (!itemInfo) return;
    const { item, session } = itemInfo;
    const progressKey = `w${currentWeek}-c${item.classId}-s${session}`;
    onSave(progressKey, { content, memo });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSave();
  }

  if (!isOpen || !itemInfo) return null;

  const { item, session } = itemInfo;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="진도 내용 편집">
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-slate-100 rounded-md text-sm">
                <p><span className="font-bold">반:</span> {item.classId}</p>
                <p><span className="font-bold">과목:</span> {item.subject}</p>
                <p><span className="font-bold">차시:</span> {session}차시</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">진도 내용</label>
                <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="수업할 내용을 입력하세요."
                    autoFocus
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">메모</label>
                <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="메모를 입력하세요."
                    rows={3}
                />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">취소</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">저장</button>
            </div>
        </form>
    </Modal>
  );
};

export default ProgressEditorModal;
