import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const InterviewSetupPage = () => {
    const [resumeText, setResumeText] = useState('');
    const [techStack, setTechStack] = useState('');
    const [experience, setExperience] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleStartInterview = async (e) => {
        e.preventDefault();
        
        if (!resumeText.trim() && !techStack.trim()) {
            toast.error("Please provide at least a tech stack or resume summary.");
            return;
        }

        setLoading(true);
        try {
            // Mocking the backend call to generate questions
            // In a real scenario, this would be a fetch to the backend endpoint we just created.
            // Using a relative path for the API call (assuming React dev server proxy is set up)
            // or absolute if we hardcode it, let's use absolute for now based on typical setup.
            const apiUrl = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:3001';
            
            const response = await fetch(`${apiUrl}/api/interview/generate-questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    resumeText,
                    techStack,
                    experience
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to generate questions");
            }

            const data = await response.json();
            
            if (data.questions && data.questions.length > 0) {
                toast.success("Interview generated!");
                navigate('/interview/session', { state: { questions: data.questions, techStack, experience } });
            } else {
                throw new Error("No questions returned from AI.");
            }

        } catch (error) {
            console.error("Error generating interview:", error);
            toast.error(error.message || "Failed to start interview.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">AI Interview Setup</h1>
            <p className="mb-6 text-sm">
                <button type="button" onClick={() => navigate('/interview/history')} className="text-primary font-semibold hover:underline">
                    View saved interviews
                </button>
            </p>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
                Provide your details below to generate a tailored interview experience.
            </p>
            
            <form onSubmit={handleStartInterview} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Tech Stack / Key Skills</label>
                    <input 
                        type="text" 
                        value={techStack}
                        onChange={(e) => setTechStack(e.target.value)}
                        placeholder="e.g. React, Node.js, MongoDB"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Experience Level</label>
                    <select 
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="">Select Level</option>
                        <option value="Intern/Entry Level">Intern / Entry Level</option>
                        <option value="Junior">Junior (1-3 years)</option>
                        <option value="Mid Level">Mid Level (3-5 years)</option>
                        <option value="Senior">Senior (5+ years)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Resume Summary (Paste Text)</label>
                    <textarea 
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        placeholder="Paste the text of your resume here..."
                        rows="6"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    ></textarea>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3 px-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-semibold shadow-md flex justify-center items-center"
                >
                    {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : null}
                    {loading ? "Generating Interview..." : "Start Interview"}
                </button>
            </form>
        </div>
    );
};

export default InterviewSetupPage;
