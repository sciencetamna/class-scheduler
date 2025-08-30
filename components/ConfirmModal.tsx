
import React from 'react';
import Modal from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
        <div className="space-y-4">
            <p className="text-gray-600 whitespace-pre-line">{message}</p>
            <div className="flex justify-end pt-2 space-x-2">
                <button 
                    onClick={onClose} 
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                    취소
                </button>
                 <button 
                    onClick={handleConfirm} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    확인
                </button>
            </div>
        </div>
    </Modal>
  );
};

export default ConfirmModal;
