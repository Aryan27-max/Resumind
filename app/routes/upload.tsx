import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';
import FileUploader from '~/components/FileUploader';
import Navbar from '~/components/Navbar';
import { convertPdfToImage } from '~/lib/pdf2img';
import { usePuterStore } from '~/lib/puter';
import { generateUUID } from '~/lib/utils';
import { prepareInstructions } from '~/constants';

const Upload = () => {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (file: File | null) => {
    setFile(file);
  };

  const handleAnalyse = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    try {
      setIsProcessing(true);

      // Check authentication
      if (!auth.isAuthenticated) {
        setStatusText('Error: Please sign in to analyze resumes');
        setIsProcessing(false);
        return;
      }

      setStatusText('Uploading the PDF...');
      const uploadedFile = await fs.upload([file]);

      if (!uploadedFile) {
        setStatusText('Error: Failed to upload PDF');
        setIsProcessing(false);
        return;
      }

      setStatusText('Creating thumbnail...');
      const imageFile = await convertPdfToImage(file);
      if (!imageFile.file) {
        const errorMsg = imageFile.error || 'Failed to create thumbnail';
        console.error('Thumbnail creation error:', errorMsg);
        setStatusText(`Error: ${errorMsg}`);
        setIsProcessing(false);
        return;
      }

      setStatusText('Uploading thumbnail...');
      const uploadedImage = await fs.upload([imageFile.file]);
      if (!uploadedImage) {
        setStatusText('Error: Failed to upload thumbnail');
        setIsProcessing(false);
        return;
      }

      setStatusText('Preparing data...');

      const uuid = generateUUID();
      const data = {
        id: uuid,
        resumePath: uploadedFile.path,
        imagePath: uploadedImage.path,
        companyName,
        jobTitle,
        jobDescription,
        feedback: '',
      };
      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      setStatusText('Analyzing...');

      const feedback = await ai.feedback(
        uploadedFile.path,
        prepareInstructions({ jobTitle, jobDescription }),
      );

      if (!feedback) {
        setStatusText('Error: Failed to analyze resume. AI service unavailable.');
        setIsProcessing(false);
        return;
      }

      const feedbackText =
        typeof feedback.message.content === 'string'
          ? feedback.message.content
          : feedback.message.content[0].text;

      data.feedback = JSON.parse(feedbackText);
      await kv.set(`resume:${uuid}`, JSON.stringify(data));
      setStatusText('Analysis Complete, redirecting...');
      console.log(data);
      navigate(`/resume/${uuid}`);
    } catch (error: any) {
      console.error('Analysis error:', error);
      const errorMsg = error?.error || error?.message || 'An unexpected error occurred';
      setStatusText(`Error: ${errorMsg}`);
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget.closest('form');
    if (!form) return;
    const formData = new FormData(form);
    const companyName = formData.get('company-name') as string;
    const jobTitle = formData.get('job-title') as string;
    const jobDescription = formData.get('job-description') as string;

    if (!file) return;

    handleAnalyse({ companyName, jobTitle, jobDescription, file });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart Feedback for your dream job</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-full" />
            </>
          ) : (
            <>
              <h2>Drop your resume for an ATS review and improvement tips 👇</h2>
              {!auth.isAuthenticated && !isLoading && (
                <p className="text-orange-600 mt-4">⚠️ Please sign in to analyze resumes</p>
              )}
            </>
          )}
          {!isProcessing ? (
            <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt=8">
              <div className="form-div">
                <label htmlFor="Company-name">Company Name</label>
                <input
                  type="text"
                  name="company-name"
                  placeholder="Company Name"
                  id="company-name"
                  required
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input
                  type="text"
                  name="job-title"
                  placeholder="Job Title"
                  id="job-title"
                  required
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  rows={5}
                  name="job-description"
                  placeholder="Job Description"
                  id="job-description"
                  required
                />
              </div>
              <div className="form-div">
                <label htmlFor="uploader">Upload Resume</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>
              <button
                className="primary-button"
                type="submit"
                disabled={!auth.isAuthenticated || isLoading}
              >
                {auth.isAuthenticated ? 'Analyse Resume' : 'Sign in to Analyse'}
              </button>
            </form>
          ) : null}
        </div>
      </section>
    </main>
  );
};
export default Upload;
