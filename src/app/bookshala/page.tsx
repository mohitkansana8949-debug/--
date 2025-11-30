
'use client';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Loader, Package, ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import type { Book } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function BookshalaPage() {
    const firestore = useFirestore();
    const router = useRouter();
    const { addToCart } = useCart();

    const booksQuery = useMemoFirebase(() => (
        firestore ? query(collection(firestore, 'books'), orderBy('createdAt', 'desc')) : null
    ), [firestore]);

    const { data: books, isLoading } = useCollection<Book>(booksQuery);

    const handleBuyNow = (book: Book) => {
        addToCart(book);
        router.push('/cart');
    };

    return (
        <div className="container mx-auto p-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Package className="h-8 w-8 text-primary" />
                    बुकशाला
                </h1>
                <p className="text-muted-foreground">
                    ज्ञान का खजाना, अब आपके दरवाजे पर।
                </p>
            </div>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader className="animate-spin" />
                </div>
            ) : !books || books.length === 0 ? (
                <div className="text-center text-muted-foreground mt-16">
                     <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4">अभी कोई किताब उपलब्ध नहीं है।</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {books.map(book => (
                        <Card key={book.id} className="overflow-hidden transition-shadow hover:shadow-lg flex flex-col group">
                            <Link href={`/bookshala/${book.id}`} className="block">
                                <div className="w-full aspect-[3/4] relative">
                                    <Image 
                                        src={book.imageUrl} 
                                        alt={book.name}
                                        fill
                                        className="object-cover"
                                    />
                                    {book.offer && <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">{book.offer}</div>}
                                </div>
                            </Link>
                            <CardHeader>
                                <CardTitle className="line-clamp-2 h-12">{book.name}</CardTitle>
                                <CardDescription className="line-clamp-3 h-[60px]">{book.description}</CardDescription>
                            </CardHeader>
                            <CardFooter className="flex-col items-start gap-4 mt-auto">
                                <p className="text-xl font-bold">₹{book.price}</p>
                                <div className="w-full flex flex-col sm:flex-row gap-2">
                                     <Button className="w-full" onClick={() => addToCart(book)}>
                                        <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                                     </Button>
                                     <Button variant="secondary" className="w-full" onClick={() => handleBuyNow(book)}>Buy Now</Button>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
