
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Loader, Wand2, Copy } from 'lucide-react';
import { generateBookSummaryFlow } from '@/ai/flows/book-summary-flow';

const summarySchema = z.object({
  bookName: z.string().min(1, 'Book name is required'),
  authorName: z.string().min(1, 'Author name is required'),
});

type SummaryFormValues = z.infer<typeof summarySchema>;

export default function AiBookSummaryPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const form = useForm<SummaryFormValues>({
    resolver: zodResolver(summarySchema),
    defaultValues: {
      bookName: '',
      authorName: '',
    },
  });

  const onSubmit = async (values: SummaryFormValues) => {
    setIsLoading(true);
    setSummary(null);
    try {
      const result = await generateBookSummaryFlow(values);
      setSummary(result.summary);
      toast({ title: "Summary Generated!", description: "The AI has created a summary for the book." });
    } catch (e) {
      console.error("AI Summary Error:", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not generate the summary.' });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary).then(() => {
        toast({ title: 'Copied to Clipboard!' });
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Book Summary Generator</CardTitle>
        <CardDescription>Generate a short, engaging summary for a book to use in its description.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bookName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Book Name</FormLabel>
                  <FormControl><Input placeholder="e.g., The Psychology of Money" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="authorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Author's Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Morgan Housel" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Wand2 className="mr-2 h-4 w-4" /> Generate Summary</>}
            </Button>
          </form>
        </Form>
        {(isLoading || summary) && (
            <div className="pt-6 space-y-4">
                {isLoading && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader className="animate-spin" />
                        <p>The AI is reading... please wait.</p>
                    </div>
                )}
                {summary && (
                    <Card className="bg-muted">
                        <CardHeader className="flex-row justify-between items-center">
                            <CardTitle className="text-lg">Generated Summary</CardTitle>
                            <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                                <Copy className="h-4 w-4"/>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm whitespace-pre-wrap">{summary}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
