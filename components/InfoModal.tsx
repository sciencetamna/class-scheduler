
import React from 'react';
import Modal from './Modal';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
        <div className="space-y-4">
            <p className="text-gray-600 whitespace-pre-line">{message}</p>
            <div className="flex justify-end pt-2">
                <button 
                    onClick={onClose} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    확인
                </button>
            </div>
        </div>
    </Modal>
  );
};

export default InfoModal;
