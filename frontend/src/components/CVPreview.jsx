import React, { useMemo } from 'react';
import { buildResumeDocument } from '../lib/resumeDocument';

export default function CVPreview({ cvData, template, document }) {
  const generated = useMemo(() => document || buildResumeDocument(cvData, template), [document, cvData, template]);
  return (
    <div className="space-y-4" aria-label="Resume pages">
      {generated.pages.map((commands, page) => (
        <svg key={page} xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${generated.width} ${generated.height}`}
          role="img" aria-label={`Resume page ${page + 1}`}
          className="block w-full bg-white shadow-lg"
          style={{ aspectRatio: `${generated.width} / ${generated.height}` }}>
          <title>{`Resume page ${page + 1}`}</title>
          {commands.map((command, index) => command.type === 'line' ? (
            <line key={index} x1={command.x1} y1={command.y1} x2={command.x2} y2={command.y2}
              stroke={command.color} strokeWidth={command.width} />
          ) : (
            <text key={index} x={command.x} y={command.y} fill={command.color}
              fontFamily={command.family} fontSize={command.size}
              fontWeight={command.bold ? 'bold' : 'normal'} fontStyle={command.italic ? 'italic' : 'normal'}
              textLength={command.width || undefined} lengthAdjust="spacingAndGlyphs" xmlSpace="preserve">{command.text}</text>
          ))}
        </svg>
      ))}
    </div>
  );
}
