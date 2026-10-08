import React from 'react';
import { CheckCircle2, FileText } from 'lucide-react';

export const TEMPLATES = [
  { id: 'modern', name: 'ATS Professional', description: 'Jake Ryan style — two-line headers, compact, ATS-optimized' },
  { id: 'clean', name: 'ATS Clean', description: 'Simple single-line headers, spacious, minimal — ATS-friendly' },
];

export default function TemplateSelector({ selected, onSelect }) {
  return (
    <div role="group" aria-label="Resume template" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {TEMPLATES.map((template) => (
        <button
          type="button"
          aria-pressed={selected === template.id}
          key={template.id}
          onClick={() => onSelect(template.id)}
          className={`text-left rounded-lg p-4 cursor-pointer transition-colors bg-[#0f0f10] border ${
            selected === template.id
              ? 'border-blue-400 bg-blue-500/5'
              : 'border-gray-700 hover:border-gray-500'
          }`}
        >
          <span className="flex items-center justify-between gap-2 mb-2">
            <FileText className="w-5 h-5 text-gray-400" />
            {selected === template.id && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
          </span>
            <span className="block text-sm font-semibold text-white mb-1">{template.name}</span>
            <span className="block text-xs text-gray-400 leading-relaxed">
              {template.description}
            </span>
        </button>
      ))}
    </div>
  );
}
