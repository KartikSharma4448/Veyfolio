import React from 'react';

/**
 * CVPreview — Live preview matching the PDF output.
 * Supports two ATS templates:
 *   - "modern" = Jake Ryan style (two-line subheadings, compact)
 *   - "clean"  = Simple ATS style (single-line bold + hfill dates, spacious)
 */
const CVPreview = ({ cvData, template }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  if (template === 'clean') {
    return <CleanTemplate cvData={cvData} formatDate={formatDate} />;
  }
  // Default: modern (Jake Ryan)
  return <ModernTemplate cvData={cvData} formatDate={formatDate} />;
};

/**
 * MODERN TEMPLATE — Jake Ryan style
 * Two-line subheadings: Company bold left / dates right, Position italic left / location right
 */
function ModernTemplate({ cvData, formatDate }) {
  return (
    <div className="bg-white text-black p-10 shadow-2xl min-h-[1100px] font-['Helvetica',_'Arial',_sans-serif] text-[10px] leading-[1.4]">
      {/* HEADING */}
      <div className="text-center mb-1">
        <h1 className="text-[22px] font-bold tracking-tight">
          {cvData.personalInfo.fullName}
        </h1>
        {cvData.personalInfo.title?.trim() && <p className="text-[11px] text-gray-800 mt-1 break-words">{cvData.personalInfo.title}</p>}
        <div className="text-[9px] text-gray-700 mt-1 flex flex-wrap justify-center gap-x-1">
          {[
            cvData.personalInfo.phone,
            cvData.personalInfo.email,
            cvData.personalInfo.portfolio,
            cvData.personalInfo.linkedinUrl,
          ].filter(Boolean).map((item, i, arr) => (
            <span key={i}>
              {item}{i < arr.length - 1 && <span className="mx-1">|</span>}
            </span>
          ))}
        </div>
        {cvData.personalInfo.location && (
          <div className="text-[9px] text-gray-600 mt-0.5">
            {cvData.personalInfo.location}
          </div>
        )}
      </div>

      {/* SUMMARY */}
      {cvData.personalInfo.summary && cvData.personalInfo.summary.trim() && (
        <div className="mt-3">
          <SectionHeader title="Professional Summary" />
          <p className="text-[9.5px] text-gray-800 leading-[1.5]">
            {cvData.personalInfo.summary}
          </p>
        </div>
      )}

      {/* SKILLS */}
      {cvData.skills && cvData.skills.length > 0 && (
        <div className="mt-3">
          <SectionHeader title="Technical Skills" />
          <div className="text-[9.5px] pl-1">
            {cvData.skills.some(s => s.includes(':')) ? (
              cvData.skills.map((skillLine, i) => {
                const colonIdx = skillLine.indexOf(':');
                if (colonIdx > -1) {
                  return (
                    <div key={i} className="mb-0.5">
                      <span className="font-bold">{skillLine.substring(0, colonIdx + 1)}</span>
                      <span className="text-gray-800">{skillLine.substring(colonIdx + 1)}</span>
                    </div>
                  );
                }
                return <div key={i} className="text-gray-800">{skillLine}</div>;
              })
            ) : (
              <div>
                <span className="font-bold">Skills: </span>
                <span className="text-gray-800">{cvData.skills.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EXPERIENCE */}
      {cvData.experience && cvData.experience.length > 0 && (
        <div className="mt-3">
          <SectionHeader title="Work Experience" />
          <div className="space-y-2.5">
            {cvData.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-[10px]">{exp.company}</span>
                  <span className="text-[9px] text-gray-700">
                    {formatDate(exp.startDate)} – {exp.current ? 'Present' : formatDate(exp.endDate)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="italic text-[9.5px] text-gray-700">{exp.position}</span>
                  {exp.location && (
                    <span className="italic text-[9px] text-gray-600">{exp.location}</span>
                  )}
                </div>
                {exp.description && (
                  <ul className="mt-1 ml-3 space-y-0.5">
                    {exp.description.split('\n').filter(b => b.trim()).map((bullet, i) => {
                      const clean = bullet.replace(/^[\s\-•◦⁃*]+/, '').trim();
                      return clean ? (
                        <li key={i} className="text-[9.5px] text-gray-800 flex gap-1.5">
                          <span className="mt-[2px]">•</span>
                          <span>{clean}</span>
                        </li>
                      ) : null;
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EDUCATION */}
      {cvData.education && cvData.education.length > 0 && (
        <div className="mt-3">
          <SectionHeader title="Education" />
          <div className="space-y-2">
            {cvData.education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-[10px]">
                    {[edu.degree, edu.field].filter(Boolean).join(' in ') || edu.institution}
                  </span>
                  <span className="text-[9px] text-gray-700">
                    {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                  </span>
                </div>
                {edu.degree && (
                  <div className="italic text-[9.5px] text-gray-700">{edu.institution}</div>
                )}
                {edu.gpa && (
                  <div className="text-[9.5px] text-gray-700 ml-3 mt-0.5">• GPA: {edu.gpa}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <ProjectsSection projects={cvData.projects} />
    </div>
  );
}

/**
 * CLEAN TEMPLATE — Simple ATS style from cv_template.tex
 * Single-line bold title + dates right, italic company below, bullet points
 * More spacious, larger section gaps
 */
function CleanTemplate({ cvData, formatDate }) {
  return (
    <div className="bg-white text-black p-10 shadow-2xl min-h-[1100px] font-['Latin_Modern',_'Georgia',_serif] text-[10px] leading-[1.5]">
      {/* HEADING */}
      <div className="text-center mb-2">
        <h1 className="text-[24px] font-bold uppercase tracking-wide">
          {cvData.personalInfo.fullName}
        </h1>
        {cvData.personalInfo.title?.trim() && <p className="text-[11px] text-gray-800 mt-1 break-words">{cvData.personalInfo.title}</p>}
        <div className="text-[9px] text-gray-700 mt-1.5">
          {[
            cvData.personalInfo.location,
            cvData.personalInfo.phone,
            cvData.personalInfo.email,
          ].filter(Boolean).join('  |  ')}
        </div>
        <div className="text-[9px] text-gray-700 mt-0.5">
          {[
            cvData.personalInfo.portfolio,
            cvData.personalInfo.linkedinUrl,
          ].filter(Boolean).join('  |  ')}
        </div>
      </div>

      {/* SUMMARY */}
      {cvData.personalInfo.summary && cvData.personalInfo.summary.trim() && (
        <div className="mt-4">
          <CleanSectionHeader title="Summary" />
          <p className="text-[10px] text-gray-800 leading-[1.6] mt-1">
            {cvData.personalInfo.summary}
          </p>
        </div>
      )}

      {/* SKILLS */}
      {cvData.skills && cvData.skills.length > 0 && (
        <div className="mt-4">
          <CleanSectionHeader title="Technical Skills" />
          <ul className="mt-1 ml-3 space-y-0.5">
            {cvData.skills.some(s => s.includes(':')) ? (
              cvData.skills.map((skillLine, i) => {
                const colonIdx = skillLine.indexOf(':');
                if (colonIdx > -1) {
                  return (
                    <li key={i} className="text-[10px] flex gap-1.5">
                      <span className="mt-[2px]">•</span>
                      <span>
                        <span className="font-bold">{skillLine.substring(0, colonIdx + 1)}</span>
                        {skillLine.substring(colonIdx + 1)}
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={i} className="text-[10px] flex gap-1.5">
                    <span className="mt-[2px]">•</span>
                    <span>{skillLine}</span>
                  </li>
                );
              })
            ) : (
              <li className="text-[10px] flex gap-1.5">
                <span className="mt-[2px]">•</span>
                <span><span className="font-bold">Skills:</span> {cvData.skills.join(', ')}</span>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* EXPERIENCE */}
      {cvData.experience && cvData.experience.length > 0 && (
        <div className="mt-4">
          <CleanSectionHeader title="Experience" />
          <div className="space-y-3 mt-1">
            {cvData.experience.map((exp) => (
              <div key={exp.id}>
                {/* Single line: Bold title + hfill dates */}
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-[10.5px]">{exp.position}</span>
                  <span className="italic text-[9.5px] text-gray-700">
                    {formatDate(exp.startDate)} – {exp.current ? 'Present' : formatDate(exp.endDate)}
                  </span>
                </div>
                {/* Italic company + location */}
                <div className="italic text-[9.5px] text-gray-600">
                  {[exp.company, exp.location].filter(Boolean).join(', ')}
                </div>
                {/* Bullets */}
                {exp.description && (
                  <ul className="mt-1 ml-3 space-y-0.5">
                    {exp.description.split('\n').filter(b => b.trim()).map((bullet, i) => {
                      const clean = bullet.replace(/^[\s\-•◦⁃*]+/, '').trim();
                      return clean ? (
                        <li key={i} className="text-[9.5px] text-gray-800 flex gap-1.5">
                          <span className="mt-[2px]">•</span>
                          <span>{clean}</span>
                        </li>
                      ) : null;
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EDUCATION */}
      {cvData.education && cvData.education.length > 0 && (
        <div className="mt-4">
          <CleanSectionHeader title="Education" />
          <div className="space-y-2 mt-1">
            {cvData.education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-[10.5px]">
                    {[edu.degree, edu.field].filter(Boolean).join(' in ') || edu.institution}
                  </span>
                  <span className="italic text-[9.5px] text-gray-700">
                    {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                  </span>
                </div>
                {edu.degree && (
                  <div className="text-[9.5px] text-gray-700">
                    {edu.institution}
                  </div>
                )}
                {edu.gpa && (
                  <div className="text-[9.5px] text-gray-600">GPA: {edu.gpa}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <ProjectsSection projects={cvData.projects} clean />
    </div>
  );
}

function ProjectsSection({ projects = [], clean = false }) {
  const entries = projects.filter(p => [p.name, p.techStack, p.link, p.description].some(value => value?.trim()));
  if (!entries.length) return null;
  const Header = clean ? CleanSectionHeader : SectionHeader;
  return (
    <div className="mt-4">
      <Header title="Projects" />
      <div className="space-y-3">
        {entries.map(project => (
          <div key={project.id} className="break-words">
            <p className="text-[10px] font-bold">{project.name}</p>
            {project.techStack && <p className="text-[9.5px] text-gray-700 italic">{project.techStack}</p>}
            {project.link && <p className="text-[9px] text-gray-700 break-all">{project.link}</p>}
            {project.description && <ul className="list-disc ml-3 mt-1 space-y-0.5 text-[9.5px]">
              {project.description.split('\n').filter(line => line.trim()).map((line, index) => <li key={index}>{line.replace(/^[\s\-*\u2022]+/, '')}</li>)}
            </ul>}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Section header — Modern template (thin black line) */
function SectionHeader({ title }) {
  return (
    <div className="mb-1.5">
      <h2 className="text-[11px] font-bold uppercase tracking-wide">{title}</h2>
      <div className="border-t border-black mt-0.5 mb-1.5" />
    </div>
  );
}

/** Section header — Clean template (thicker line, more spacing) */
function CleanSectionHeader({ title }) {
  return (
    <div className="mb-1">
      <h2 className="text-[12px] font-bold uppercase tracking-wider">{title}</h2>
      <div className="border-t-[1.5px] border-black mt-1 mb-1" />
    </div>
  );
}

export default CVPreview;
