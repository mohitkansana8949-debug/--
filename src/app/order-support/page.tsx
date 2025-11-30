
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LifeBuoy, Info } from 'lucide-react';
import Link from 'next/link';

export default function OrderSupportPage() {
  return (
    <div className="container mx-auto p-4 max-w-2xl">
        <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <LifeBuoy className="h-8 w-8 text-primary" />
                Order Support
            </h1>
            <p className="text-muted-foreground">
                Get help with your book orders.
            </p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Need Help With Your Order?</CardTitle>
                <CardDescription>
                    If you have any questions about a book order you have placed, please contact us.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="flex">
                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-300 mr-3 mt-1 shrink-0" />
                        <div>
                            <h4 className="font-semibold text-blue-800 dark:text-blue-200">Instructions</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                After placing an order, please wait for one day for a confirmation message from our team. If you do not receive a confirmation or have any other questions, please contact our support team.
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                                To help us find your order quickly, please provide the mobile number you used during payment.
                            </p>
                        </div>
                    </div>
                </div>
                
                <Button asChild className="w-full">
                    <Link href="/support">
                        <LifeBuoy className="mr-2 h-4 w-4" />
                        Contact Support Team
                    </Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
