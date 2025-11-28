
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, Copy, Check, Loader, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { uploadFile } from '@/ai/flows/b2-upload-flow';
import { AxiosProgressEvent } from 'axios';

interface UploadedFile {
    name: string;
    url: string;
}

export default function UploadPage() {
    const { toast } = useToast();

    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setFileName(selectedFile.name);
        }
    };

    const handleUpload = async () => {
        if (!file) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please select a file to upload.',
            });
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const result = await uploadFile(file, (progressEvent: AxiosProgressEvent) => {
                if (progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });
            
            toast({
                title: 'Upload Successful!',
                description: `File URL is ready.`,
            });
            
            const uploadedFileUrl = `https://f005.backblazeb2.com/file/quickly-study/${encodeURIComponent(result.fileName)}`;

            setUploadedFiles(prev => [{ name: fileName, url: uploadedFileUrl }, ...prev]);

        } catch(e: any) {
            console.error(e);
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: e.message || 'An unknown error occurred during upload.'
            })
        } finally {
            setIsUploading(false);
            setFile(null);
            setFileName('');
            setUploadProgress(null);
        }
    };
    
    const handleCopy = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        toast({ title: 'URL Copied!' });
        setTimeout(() => setCopiedUrl(null), 2000);
    }

    return (
      <div className="flex flex-col h-screen bg-background">
         <header className="p-4 border-b flex items-center gap-4">
            <Button asChild variant="outline">
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">Upload New Content</h1>
         </header>
         <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <UploadCloud />
                           Upload Video or PDF
                        </CardTitle>
                        <CardDescription>
                            Upload files to your storage. Once uploaded, you can copy the URL to use in your courses, e-books, or PYQs.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                File
                            </label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-background rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none">
                                            <span>Upload a file</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">Video or PDF files</p>
                                </div>
                            </div>
                            {file && <p className="mt-2 text-sm text-muted-foreground">Selected: {file.name}</p>}
                        </div>

                        {file && (
                           <div>
                                <label htmlFor="file-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Display Name
                                </label>
                                <Input
                                    id="file-name"
                                    value={fileName}
                                    onChange={(e) => setFileName(e.target.value)}
                                    placeholder="Enter a name for the file"
                                    className="mt-1"
                                />
                            </div>
                        )}

                        {uploadProgress !== null && (
                            <div className="space-y-2">
                                <Progress value={uploadProgress} />
                                <p className="text-sm text-center text-muted-foreground">{Math.round(uploadProgress)}%</p>
                            </div>
                        )}

                        <Button onClick={handleUpload} disabled={isUploading || !file} className="w-full">
                            {isUploading ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : 'Start Upload'}
                        </Button>
                    </CardContent>
                </Card>
                
                {uploadedFiles.length > 0 && (
                     <Card>
                        <CardHeader>
                            <CardTitle>Uploaded Files</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {uploadedFiles.map((uploadedFile, index) => (
                                    <li key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <p className="font-medium truncate pr-4">{uploadedFile.name}</p>
                                        <div className="flex items-center gap-2">
                                            <Input readOnly value={uploadedFile.url} className="text-xs h-8" />
                                            <Button size="icon" variant="ghost" onClick={() => handleCopy(uploadedFile.url)}>
                                                {copiedUrl === uploadedFile.url ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

            </div>
         </main>
      </div>
    );
}
