import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Sparkles, Download, Plus, Trash2, ArrowLeft, Eye, PenLine } from 'lucide-react';
import { loadResumeDraft, saveResumeDraft, resumeToText } from '../lib/resumeDraft';
import { buildResumeDocument } from '../lib/resumeDocument';
import api from '../lib/api';
import { refineText } from '../lib/api';
import CVPreview from '../components/CVPreview';
import { toast } from '../hooks/use-toast';
import ATSScorePanel from '../components/ATSScorePanel';
import AIToggle from '../components/AIToggle';
import TemplateSelector from '../components/TemplateSelector';
import { trackEvent } from '../lib/analytics';
import SEOHead from '../components/SEOHead';
import './CreateCV.css';

const CreateCV = () => {
  const navigate = useNavigate();
  const [initialDraft] = useState(loadResumeDraft);
  const [cvData, setCvData] = useState(initialDraft.cvData);
  const [selectedTemplate, setSelectedTemplate] = useState(initialDraft.template);
  const [saveStatus, setSaveStatus] = useState('Saving...');
  useEffect(() => {
    try {
      saveResumeDraft(cvData, selectedTemplate);
      setSaveStatus('Saved locally');
    } catch {
      setSaveStatus('Not saved');
    }
  }, [cvData, selectedTemplate]);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [atsScoreValue, setAtsScoreValue] = useState(null);

  const [activeTab, setActiveTab] = useState('personal');
  const [editorView, setEditorView] = useState('edit');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [refinedSections, setRefinedSections] = useState(new Set());
  const [pdfLoading, setPdfLoading] = useState(false);

  const handlePersonalInfoChange = (field, value) => {
    setCvData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const addExperience = () => {
    const newExp = {
      id: Date.now().toString(),
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    };
    setCvData(prev => ({
      ...prev,
      experience: [...prev.experience, newExp]
    }));
  };

  const updateExperience = (id, field, value) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (id) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  const addEducation = () => {
    const newEdu = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      field: '',
      location: '',
      startDate: '',
      endDate: '',
      gpa: ''
    };
    setCvData(prev => ({
      ...prev,
      education: [...prev.education, newEdu]
    }));
  };

  const updateEducation = (id, field, value) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (id) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  const addSkill = () => {
    const newSkill = prompt('Enter skill name:');
    if (newSkill && newSkill.trim()) {
      setCvData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
    }
  };

  const addProject = () => {
    setCvData(prev => ({ ...prev, projects: [...(prev.projects || []), {
      id: crypto.randomUUID(), name: '', techStack: '', link: '', description: ''
    }] }));
  };

  const updateProject = (id, field, value) => {
    setCvData(prev => ({ ...prev, projects: prev.projects.map(project =>
      project.id === id ? { ...project, [field]: value } : project) }));
  };

  const removeProject = (id) => {
    setCvData(prev => ({ ...prev, projects: prev.projects.filter(project => project.id !== id) }));
  };

  const removeSkill = (index) => {
    setCvData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handleAIOptimize = async () => {
    if (!aiEnabled) {
      toast({ title: 'AI Disabled', description: 'Enable AI Refinement to use this feature', variant: 'destructive' });
      return;
    }
    try {
      setAiLoading(true);
      // Build a prompt combining summary and experiences
      const summary = cvData.personalInfo.summary || '';
      const expText = (cvData.experience || []).map(e => `Position: ${e.position} at ${e.company}. Description: ${e.description}`).join('\n');
      const prompt = `Improve and polish this resume summary and achievements for ATS and recruiter readability. Return a concise improved professional summary and bullet achievements.\n\nSummary:\n${summary}\n\nExperience:\n${expText}`;

      const genResp = await api.generateText(prompt, 300);
      // Try to extract text from common response shapes
      let generated = '';
      if (genResp.output_text) generated = genResp.output_text;
      else if (genResp.outputs && genResp.outputs[0] && genResp.outputs[0].content) {
        const c = genResp.outputs[0].content;
        if (typeof c === 'string') generated = c;
        else if (c.text) generated = c.text;
      } else if (genResp.choices && genResp.choices[0] && genResp.choices[0].text) generated = genResp.choices[0].text;
      else generated = JSON.stringify(genResp);

      setAiSuggestion(generated);
      setShowAISuggestions(true);

      // Compute ATS score
      const cvPlain = `${summary}\n${expText}\n${(cvData.skills||[]).join(', ')}`;
      const atsResp = await api.atsScore(cvPlain, '');
      if (atsResp && typeof atsResp.ats_score !== 'undefined') {
        setAtsScoreValue(atsResp.ats_score);
        toast({ title: 'AI Analysis Complete', description: `Your CV has an ATS score of ${atsResp.ats_score}/100` });
      } else {
        toast({ title: 'AI Analysis', description: 'Analysis complete' });
      }
    } catch (err) {
      console.error('AI optimize error', err);
      toast({ title: 'AI Failed', description: 'Could not reach AI services', variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  const applyAISuggestion = () => {
    // Naively replace professional summary with AI suggestion's first paragraph
    if (!aiSuggestion) return;
    const first = aiSuggestion.split('\n\n')[0];
    handlePersonalInfoChange('summary', first);
    toast({ title: 'Applied', description: 'AI suggestion applied to Professional Summary' });
    setShowAISuggestions(false);
  };

  /**
   * Offer to refine a text entry using the AI refinement endpoint.
   * Only calls the API when aiEnabled is true and the section hasn't been refined yet.
   */
  const handleRefineSection = async (text, section, sectionKey) => {
    if (!aiEnabled) return;
    if (!text || !text.trim()) return;
    if (refinedSections.has(sectionKey)) return;

    try {
      const result = await refineText(text, section);
      if (!result.is_error && result.refined_text !== text) {
        setRefinedSections(prev => new Set([...prev, sectionKey]));
        return result.refined_text;
      }
    } catch (err) {
      console.error('Refine error:', err);
    }
    return null;
  };

  /**
   * When AI toggle is enabled, offer to refine unprocessed text entries.
   */
  const handleAIToggle = async (enabled) => {
    setAiEnabled(enabled);
    if (enabled) {
      // Offer to refine unprocessed text entries
      const summary = cvData.personalInfo.summary;
      if (summary && summary.trim() && !refinedSections.has('summary')) {
        const refined = await handleRefineSection(summary, 'summary', 'summary');
        if (refined) {
          const apply = window.confirm('AI has a suggestion for your Professional Summary. Apply it?');
          if (apply) {
            handlePersonalInfoChange('summary', refined);
            toast({ title: 'Refined', description: 'Professional Summary refined by AI' });
          }
        }
      }
    }
  };

  const resumeDocument = useMemo(
    () => buildResumeDocument(cvData, selectedTemplate),
    [cvData, selectedTemplate]
  );

  const handleDownloadPDF = async () => {
    try {
      setPdfLoading(true);
      const blob = resumeDocument.pdf.output('blob');

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(cvData.personalInfo.fullName || 'Resume').replace(/\s+/g, '_')}_CV.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Fire GA4 event on successful PDF download
      trackEvent('pdf_generated', { template: selectedTemplate, method: 'shared-layout' });

      toast({
        title: "Success!",
        description: "Your CV has been downloaded as PDF",
      });
    } catch (error) {
      console.error('PDF download error:', error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPdfLoading(false);
    }
  };



  return (
    <div className="cv-editor min-h-screen bg-[#0a0a0b] text-gray-200">
      <SEOHead
        title="Create Your CV - Veyfolio"
        description="Build your resume with live preview, two professional templates, optional AI refinement, and PDF export."
        path="/create"
      />
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0a0a0b]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                aria-label="Back to home"
                title="Back to home"
                className="h-9 w-9 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <img src="/veyfolio-logo.png" alt="" width="24" height="24" className="w-6 h-6 object-contain shrink-0" />
                <span className="text-xl font-bold text-white">Veyfolio</span>
              </div>
            </div>
            <div className="flex w-full sm:w-auto flex-wrap items-center gap-2 justify-between sm:justify-end">
              <AIToggle enabled={aiEnabled} onToggle={handleAIToggle} />
              <Button 
                onClick={handleAIOptimize}
                disabled={aiLoading || !aiEnabled}
                variant="outline"
                className="h-9 bg-transparent border-gray-700 text-blue-300 hover:text-blue-200 hover:bg-gray-800 px-3"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {aiLoading ? 'Analyzing...' : 'AI Optimize'}
              </Button>

              <Button 
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="h-9 bg-[#0066ff] hover:bg-[#0052cc] text-white px-3"
              >
                <Download className="w-4 h-4 mr-2" />
                {pdfLoading ? 'Generating...' : 'Download PDF'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-white">Resume workspace</h1>
            <p className="text-sm text-gray-500 mt-1">{cvData.personalInfo.fullName || 'Untitled resume'} <span className="mx-2">/</span><span role="status">{saveStatus}</span></p>
          </div>
          <div className="lg:hidden flex bg-[#171719] border border-gray-700 rounded-lg p-1" aria-label="Workspace view">
            <Button onClick={() => setEditorView('edit')} aria-pressed={editorView === 'edit'} className={`h-8 px-4 ${editorView === 'edit' ? 'bg-gray-700 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-800'}`}><PenLine className="w-4 h-4 mr-2" />Edit</Button>
            <Button onClick={() => setEditorView('preview')} aria-pressed={editorView === 'preview'} className={`h-8 px-4 ${editorView === 'preview' ? 'bg-gray-700 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-800'}`}><Eye className="w-4 h-4 mr-2" />Preview</Button>
          </div>
        </div>
        <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-6 items-start">
          {/* Left Panel - Form */}
          <div className={`${editorView === 'edit' ? 'block' : 'hidden'} lg:block min-w-0 space-y-6`}>
            {showAISuggestions && (
              <Card className="bg-[#081018] border-blue-800 p-4 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-white font-semibold">AI Suggestion</h4>
                    {atsScoreValue !== null && (
                      <p className="text-sm text-gray-300">ATS Score: {atsScoreValue}/100</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setShowAISuggestions(false)} variant="ghost">Close</Button>
                    <Button onClick={applyAISuggestion} className="bg-[#0066ff] text-white">Apply</Button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-200 mt-3">{aiSuggestion}</pre>
              </Card>
            )}
            <section className="bg-[#141416] border border-gray-800 rounded-lg p-4 sm:p-5" aria-label="Resume details">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="cv-editor-tabs grid w-full grid-cols-3 sm:grid-cols-5 h-auto min-h-10 gap-1 bg-[#0b0b0d]">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="experience">Experience</TabsTrigger>
                  <TabsTrigger value="education">Education</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                </TabsList>

                {/* Personal Info Tab */}
                <TabsContent value="personal" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Full Name</Label>
                    <Input 
                      value={cvData.personalInfo.fullName}
                      onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
                      className="bg-[#0f0f10] border-gray-700 text-white"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Email</Label>
                      <Input 
                        type="email"
                        value={cvData.personalInfo.email}
                        onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                        className="bg-[#0f0f10] border-gray-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Phone</Label>
                      <Input 
                        value={cvData.personalInfo.phone}
                        onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                        className="bg-[#0f0f10] border-gray-700 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Location</Label>
                    <Input 
                      value={cvData.personalInfo.location}
                      onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
                      className="bg-[#0f0f10] border-gray-700 text-white"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">LinkedIn URL</Label>
                      <Input 
                        value={cvData.personalInfo.linkedinUrl}
                        onChange={(e) => handlePersonalInfoChange('linkedinUrl', e.target.value)}
                        className="bg-[#0f0f10] border-gray-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Portfolio/Website</Label>
                      <Input 
                        value={cvData.personalInfo.portfolio}
                        onChange={(e) => handlePersonalInfoChange('portfolio', e.target.value)}
                        className="bg-[#0f0f10] border-gray-700 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Professional Title</Label>
                    <Input 
                      value={cvData.personalInfo.title}
                      onChange={(e) => handlePersonalInfoChange('title', e.target.value)}
                      className="bg-[#0f0f10] border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Professional Summary</Label>
                    <Textarea 
                      value={cvData.personalInfo.summary}
                      onChange={(e) => handlePersonalInfoChange('summary', e.target.value)}
                      rows={6}
                      className="bg-[#0f0f10] border-gray-700 text-white"
                    />
                  </div>
                </TabsContent>

                {/* Experience Tab */}
                <TabsContent value="experience" className="space-y-4 mt-6">
                  {cvData.experience.map((exp, index) => (
                    <Card key={exp.id} className="bg-[#0f0f10] border-gray-700 p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-white font-semibold">Experience {index + 1}</h4>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeExperience(exp.id)}
                          aria-label={`Remove experience ${index + 1}`}
                          title="Remove experience"
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-gray-400 text-sm">Position</Label>
                          <Input 
                            value={exp.position}
                            onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                            className="bg-[#1a1a1c] border-gray-700 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-400 text-sm">Company</Label>
                          <Input 
                            value={exp.company}
                            onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                            className="bg-[#1a1a1c] border-gray-700 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-400 text-sm">Location</Label>
                          <Input 
                            value={exp.location}
                            onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                            className="bg-[#1a1a1c] border-gray-700 text-white"
                          />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-gray-400 text-sm">Start Date</Label>
                            <Input 
                              type="month"
                              value={exp.startDate}
                              onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                              className="bg-[#1a1a1c] border-gray-700 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-400 text-sm">End Date</Label>
                            <Input 
                              type="month"
                              value={exp.endDate}
                              onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                              disabled={exp.current}
                              className="bg-[#1a1a1c] border-gray-700 text-white"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            checked={exp.current}
                            onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                            className="rounded"
                          />
                          <Label className="text-gray-400 text-sm">Currently working here</Label>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-400 text-sm">Description</Label>
                          <Textarea 
                            value={exp.description}
                            onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                            rows={4}
                            className="bg-[#1a1a1c] border-gray-700 text-white"
                            placeholder="• Achievement 1\n• Achievement 2\n• Achievement 3"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                  <Button 
                    onClick={addExperience}
                    variant="outline"
                    className="w-full border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-[#0066ff]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Experience
                  </Button>
                </TabsContent>

                {/* Education Tab */}
                <TabsContent value="education" className="space-y-4 mt-6">
                  {cvData.education.map((edu, index) => (
                    <Card key={edu.id} className="bg-[#0f0f10] border-gray-700 p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-white font-semibold">Education {index + 1}</h4>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeEducation(edu.id)}
                          aria-label={`Remove education ${index + 1}`}
                          title="Remove education"
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-gray-400 text-sm">Institution</Label>
                          <Input 
                            value={edu.institution}
                            onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                            className="bg-[#1a1a1c] border-gray-700 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-400 text-sm">Degree</Label>
                          <Input 
                            value={edu.degree}
                            onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                            className="bg-[#1a1a1c] border-gray-700 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-400 text-sm">Field of Study</Label>
                          <Input 
                            value={edu.field}
                            onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                            className="bg-[#1a1a1c] border-gray-700 text-white"
                          />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-gray-400 text-sm">Start Date</Label>
                            <Input 
                              type="month"
                              value={edu.startDate}
                              onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                              className="bg-[#1a1a1c] border-gray-700 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-400 text-sm">End Date</Label>
                            <Input 
                              type="month"
                              value={edu.endDate}
                              onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                              className="bg-[#1a1a1c] border-gray-700 text-white"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-400 text-sm">GPA (Optional)</Label>
                          <Input 
                            value={edu.gpa}
                            onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                            className="bg-[#1a1a1c] border-gray-700 text-white"
                            placeholder="3.8"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                  <Button 
                    onClick={addEducation}
                    variant="outline"
                    className="w-full border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-[#0066ff]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Education
                  </Button>
                </TabsContent>

                {/* Skills Tab */}
                <TabsContent value="skills" className="space-y-4 mt-6">
                  <div>
                    <Label className="text-gray-300 mb-3 block">Your Skills</Label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {cvData.skills.map((skill, index) => (
                        <div 
                          key={index}
                          className="bg-[#0066ff]/10 border border-[#0066ff]/30 px-3 py-1.5 rounded-full flex items-center gap-2"
                        >
                          <span className="text-sm text-[#0066ff]">{skill}</span>
                          <button 
                            onClick={() => removeSkill(index)}
                            aria-label={`Remove ${skill}`}
                            title={`Remove ${skill}`}
                            className="text-[#0066ff] hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <Button 
                      onClick={addSkill}
                      variant="outline"
                      className="w-full border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-[#0066ff]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Skill
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="projects" className="space-y-4 mt-6">
                  {(cvData.projects || []).map((project, index) => (
                    <Card key={project.id} className="bg-[#0f0f10] border-gray-700 p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-white font-semibold">Project {index + 1}</h4>
                        <Button variant="ghost" size="sm" onClick={() => removeProject(project.id)} aria-label={`Remove project ${index + 1}`} title="Remove project" className="text-red-400 hover:bg-red-400/10"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                      <div className="space-y-3">
                        {[
                          ['name', 'Project Name'], ['techStack', 'Technologies'], ['link', 'Project Link'],
                        ].map(([field, label]) => (
                          <div key={field} className="space-y-2">
                            <Label htmlFor={`project-${project.id}-${field}`} className="text-gray-300">{label}</Label>
                            <Input id={`project-${project.id}-${field}`} value={project[field]} onChange={e => updateProject(project.id, field, e.target.value)} className="bg-[#1a1a1c] border-gray-700 text-white" />
                          </div>
                        ))}
                        <div className="space-y-2">
                          <Label htmlFor={`project-${project.id}-description`} className="text-gray-300">Description</Label>
                          <Textarea id={`project-${project.id}-description`} value={project.description} onChange={e => updateProject(project.id, 'description', e.target.value)} rows={4} className="bg-[#1a1a1c] border-gray-700 text-white" />
                        </div>
                      </div>
                    </Card>
                  ))}
                  <Button onClick={addProject} variant="outline" className="w-full bg-transparent border-dashed border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"><Plus className="w-4 h-4 mr-2" />Add Project</Button>
                </TabsContent>
              </Tabs>
            </section>

            {/* Template Selection */}
            <section className="border-t border-gray-800 pt-5" aria-label="Resume templates">
              <h3 className="text-white font-semibold mb-4">Choose Template</h3>
              <TemplateSelector selected={selectedTemplate} onSelect={setSelectedTemplate} />
            </section>
            <div className="mt-6">
              <ATSScorePanel cvText={resumeToText(cvData)} />
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className={`${editorView === 'preview' ? 'block' : 'hidden'} lg:block min-w-0 lg:sticky lg:top-24 h-fit`}>
            <div className="flex items-center justify-between mb-3 gap-3">
              <h2 className="text-sm font-semibold text-gray-300">Resume preview</h2>
              <span className="inline-flex items-center gap-2 text-xs text-emerald-300"><span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />Live</span>
            </div>
            <div className="overflow-x-auto border border-gray-700 rounded-lg bg-[#1a1a1c] p-2 sm:p-3">
            <div className="cv-preview-content min-w-[560px]">
              <CVPreview document={resumeDocument} />
            </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateCV;
