import React from 'react';

const SmileyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        className={className}
        width="40"
        height="40"
        viewBox="0 0 42 42"
        xmlns="http://www.w3.org/2000/svg"
        style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}
    >
        {/* Yellow Circle Base */}
        <rect x="14" y="2" width="14" height="38" fill="#FFFF00"/>
        <rect x="8" y="4" width="26" height="34" fill="#FFFF00"/>
        <rect x="6" y="6" width="30" height="30" fill="#FFFF00"/>
        <rect x="4" y="8" width="34" height="26" fill="#FFFF00"/>
        <rect x="2" y="14" width="38" height="14" fill="#FFFF00"/>
        
        {/* Black Outline (covers yellow edges) */}
        <rect x="14" y="0" width="14" height="2" fill="black"/>
        <rect x="8" y="2" width="6" height="2" fill="black"/>
        <rect x="28" y="2" width="6" height="2" fill="black"/>
        <rect x="6" y="4" width="2" height="2" fill="black"/>
        <rect x="34" y="4" width="2" height="2" fill="black"/>
        <rect x="4" y="6" width="2" height="2" fill="black"/>
        <rect x="36" y="6" width="2" height="2" fill="black"/>
        <rect x="2" y="8" width="2" height="6" fill="black"/>
        <rect x="38" y="8" width="2" height="6" fill="black"/>
        <rect x="0" y="14" width="2" height="14" fill="black"/>
        <rect x="40" y="14" width="2" height="14" fill="black"/>
        <rect x="2" y="28" width="2" height="6" fill="black"/>
        <rect x="38" y="28" width="2" height="6" fill="black"/>
        <rect x="4" y="34" width="2" height="2" fill="black"/>
        <rect x="36" y="34" width="2" height="2" fill="black"/>
        <rect x="6" y="36" width="2" height="2" fill="black"/>
        <rect x="34" y="36" width="2" height="2" fill="black"/>
        <rect x="8" y="38" width="6" height="2" fill="black"/>
        <rect x="28" y="38" width="6" height="2" fill="black"/>
        <rect x="14" y="40" width="14" height="2" fill="black"/>
        
        {/* Eyes */}
        <rect x="12" y="12" width="6" height="8" fill="black"/>
        <rect x="24" y="12" width="6" height="8" fill="black"/>

        {/* Mouth */}
        <rect x="10" y="24" width="2" height="2" fill="black"/>
        <rect x="30" y="24" width="2" height="2" fill="black"/>
        <rect x="12" y="26" width="2" height="2" fill="black"/>
        <rect x="28" y="26" width="2" height="2" fill="black"/>
        <rect x="14" y="28" width="14" height="2" fill="black"/>
        <rect x="16" y="30" width="10" height="2" fill="black"/>
        <rect x="14" y="28" width="14" height="2" fill="red"/>
        <rect x="16" y="30" width="10" height="2" fill="red"/>
    </svg>
);

export default SmileyIcon;
