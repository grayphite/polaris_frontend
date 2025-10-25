import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../context/ProjectsContext';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  projectId?: string;
  initialName?: string;
  initialDescription?: string;
  onSuccess?: () => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  mode,
  projectId,
  initialName = '',
  initialDescription = '',
  onSuccess,
}) => {
  const [projectName, setProjectName] = useState(initialName);
  const [projectDescription, setProjectDescription] = useState(initialDescription);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createProject, updateProject, endEditProject } = useProjects();
  const navigate = useNavigate();

  // Update local state when props change
  useEffect(() => {
    if (isOpen) {
      setProjectName(initialName);
      setProjectDescription(initialDescription);
    }
  }, [initialName, initialDescription, isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = projectName.trim();
    const description = projectDescription.trim();
    if (!name) return;
    
    if (mode === 'edit' && projectId) {
      updateProject(projectId, name, description);
      handleClose();
      endEditProject();
      navigate(`/projects/${projectId}`);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createProject(name, description);
      handleClose();
      onSuccess?.();
    } catch (err) {
      // Error handling is done in the context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setProjectName('');
    setProjectDescription('');
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white text-gray-900 rounded-lg shadow-xl w-full max-w-xl mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{mode === 'edit' ? 'Edit Project' : 'Create Project'}</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Project name</label>
          <input
            type="text"
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="e.g. Marketing Website Redesign"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            autoFocus
          />
          <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Description (optional)</label>
          <textarea
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm resize-none max-h-40 overflow-y-auto scrollbar-thin"
            placeholder="Brief description, scope, goals..."
            rows={4}
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            maxLength={500}
          />
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md bg-primary-600 hover:bg-primary-700 text-white"
              disabled={!projectName.trim() || isSubmitting}
            >
              {isSubmitting ? 'Creating…' : (mode === 'edit' ? 'Save' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;

