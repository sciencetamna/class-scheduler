import React, { useRef, useEffect, useState } from 'react';

interface ProgressSummaryProps {
  progressContent: string[];
  onOrderChange: (subject: string, newOrder: string[]) => void;
  highlightedProgressContent: string | null;
  onHighlight: (content: string | null) => void;
  subjects: string[];
  selectedSubject: string;
  onSelectSubject: (subject: string) => void;
}

const ProgressSummary: React.FC<ProgressSummaryProps> = ({ 
  progressContent, onOrderChange, highlightedProgressContent, onHighlight, 
  subjects, selectedSubject, onSelectSubject 
}) => {
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const isTabDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedTabRef = useRef(false);
  
  const dragItemIndex = useRef<number | null>(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ index: number; position: 'above' | 'below' } | null>(null);


  useEffect(() => {
    if (isTabDraggingRef.current) return;
    const container = tabContainerRef.current;
    if (container && selectedSubject) {
      const activeTab = container.querySelector<HTMLButtonElement>(`button[data-subject="${selectedSubject}"]`);
      if (activeTab) {
        activeTab.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [selectedSubject]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = tabContainerRef.current;
    if (!container) return;
    isTabDraggingRef.current = true;
    hasDraggedTabRef.current = false;
    startXRef.current = e.pageX - container.offsetLeft;
    scrollLeftRef.current = container.scrollLeft;
    container.style.cursor = 'grabbing';
    container.style.userSelect = 'none';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isTabDraggingRef.current) return;
    const container = tabContainerRef.current;
    if (!container) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 5) {
      hasDraggedTabRef.current = true;
    }
    container.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    const container = tabContainerRef.current;
    if (!isTabDraggingRef.current) return;
    isTabDraggingRef.current = false;
    if (container) {
      container.style.cursor = 'grab';
      container.style.removeProperty('user-select');
    }
  };
  
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const container = tabContainerRef.current;
    if (!container) return;
    isTabDraggingRef.current = true;
    hasDraggedTabRef.current = false;
    startXRef.current = e.touches[0].pageX - container.offsetLeft;
    scrollLeftRef.current = container.scrollLeft;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isTabDraggingRef.current) return;
    const container = tabContainerRef.current;
    if (!container) return;
    const x = e.touches[0].pageX - container.offsetLeft;
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 5) {
      hasDraggedTabRef.current = true;
    }
    container.scrollLeft = scrollLeftRef.current - walk;
  };
  
  const handleTouchEnd = () => {
    isTabDraggingRef.current = false;
  };

  const handleTabClick = (subject: string) => {
    if (hasDraggedTabRef.current) {
      return;
    }
    onSelectSubject(subject);
  };

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    dragItemIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    
    // Defer state update to allow browser to snapshot the original element
    setTimeout(() => {
        setDraggedItemIndex(index);
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>, index: number) => {
      e.preventDefault();
      if (dragItemIndex.current === null || dragItemIndex.current === index) {
        setDropIndicator(null);
        return;
      }
      
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const position = e.clientY < midY ? 'above' : 'below';

      if (dropIndicator?.index !== index || dropIndicator?.position !== position) {
        setDropIndicator({ index, position });
      }
  };

  const handleListDragLeave = (e: React.DragEvent<HTMLUListElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setDropIndicator(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLIElement>) => {
      e.preventDefault();
      if (dragItemIndex.current === null || !dropIndicator) {
        setDropIndicator(null);
        return;
      }

      const dragIndex = dragItemIndex.current;
      
      const reorderedContent = [...progressContent];
      const [movedItem] = reorderedContent.splice(dragIndex, 1);
      
      let targetIndex = dropIndicator.index;
      
      if (dragIndex < dropIndicator.index) {
          targetIndex--;
      }
      
      if (dropIndicator.position === 'below') {
          targetIndex++;
      }
      
      reorderedContent.splice(targetIndex, 0, movedItem);
      onOrderChange(selectedSubject, reorderedContent);
  };

  const handleDragEnd = () => {
      dragItemIndex.current = null;
      setDraggedItemIndex(null);
      setDropIndicator(null);
  };

  if (subjects.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md mt-8">
      <div className="px-3 pt-3 border-b border-slate-300">
        <div
          ref={tabContainerRef}
          className="-mb-px flex gap-1 overflow-x-auto"
          style={{ scrollbarWidth: 'none', cursor: 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
            {subjects.map(subject => (
                <button
                    key={subject}
                    data-subject={subject}
                    onClick={() => handleTabClick(subject)}
                    className={`relative flex-shrink-0 whitespace-nowrap px-3 py-1 text-sm font-medium rounded-t-lg border border-slate-300 transition-colors focus:outline-none ${
                        selectedSubject === subject
                        ? 'bg-white text-blue-600 border-b-white -mb-px'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-200 border-b-slate-300'
                    }`}
                >
                    {subject}
                </button>
            ))}
        </div>
      </div>

      <div className="p-4">
        <div className="max-h-72 overflow-y-auto overflow-x-hidden">
            {progressContent.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-4">선택된 과목에 대한 진도 내용이 없습니다.</p>
            ) : (
                <ul className="space-y-1 py-1" onDragLeave={handleListDragLeave}>
                {progressContent.map((content, index) => {
                    const isHighlighted = highlightedProgressContent === content;
                    const isDragging = draggedItemIndex === index;
                    const showIndicatorAbove = dropIndicator?.index === index && dropIndicator.position === 'above';
                    const showIndicatorBelow = dropIndicator?.index === index && dropIndicator.position === 'below';

                    return (
                    <li
                        key={content}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={handleDrop}
                        onDragEnd={handleDragEnd}
                        className={`p-2 rounded-md transition-all duration-200 text-xs flex items-center group relative ${
                            isHighlighted 
                            ? 'bg-purple-500 text-white font-bold' 
                            : 'bg-slate-100 hover:bg-purple-100'
                        } ${isDragging ? 'opacity-40 shadow-lg' : ''}`}
                        title={content}
                    >
                        {showIndicatorAbove && <div className="absolute -top-1 left-2 right-2 h-1 bg-blue-500 rounded-full z-20 pointer-events-none" />}
                        <span className="w-6 text-slate-500 font-medium">{index + 1}.</span>
                        <span 
                            className="flex-grow cursor-pointer pl-2 truncate" 
                            onClick={() => onHighlight(content)}
                        >
                            {content}
                        </span>
                        <div className="ml-2 cursor-grab flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 group-hover:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </div>
                        {showIndicatorBelow && <div className="absolute -bottom-1 left-2 right-2 h-1 bg-blue-500 rounded-full z-20 pointer-events-none" />}
                    </li>
                    );
                })}
                </ul>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProgressSummary;
