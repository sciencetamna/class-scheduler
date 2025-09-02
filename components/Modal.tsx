import React, { useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  const isBackdropMouseDown = useRef(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only set the flag if the mousedown event starts on the backdrop itself
    if (e.target === e.currentTarget) {
      isBackdropMouseDown.current = true;
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if the mouseup event is on the backdrop AND the mousedown started there
    if (isBackdropMouseDown.current && e.target === e.currentTarget) {
      onClose();
    }
    // Always reset the flag on mouseup
    isBackdropMouseDown.current = false;
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center pb-3 border-b">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl leading-none font-medium outline-none focus:outline-none">&times;</button>
        </div>
        <div className="pt-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;