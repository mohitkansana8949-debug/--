'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function MyLibraryPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Library</h1>
        <p className="text-muted-foreground">
          Courses you are enrolled in.
        </p>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Enrolled Courses</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                <BookOpen className="h-12 w-12 mb-4"/>
                <h3 className="text-xl font-semibold">No Courses Yet</h3>
                <p>You haven't enrolled in any courses.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
