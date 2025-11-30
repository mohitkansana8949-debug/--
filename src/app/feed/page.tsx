
'use client';
import { useState } from 'react';
import { useCollection, useMemoFirebase, useFirebase, useUser } from '@/firebase';
import { collection, doc, updateDoc, increment, deleteDoc, addDoc, serverTimestamp, query, orderBy, getDoc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader, MessageSquare, ThumbsUp, Share2 } from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { hi } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function FeedPage() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const { toast } = useToast();

    const postsQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'posts'), orderBy('createdAt', 'desc')) : null), [firestore]);
    const { data: posts, isLoading: postsLoading } = useCollection(postsQuery);

    const getInitials = (name: string | null | undefined) => {
        if (!name) return 'A';
        return name.substring(0, 1).toUpperCase();
    }

    const handleLike = async (postId: string) => {
        if (!firestore || !user) return;
        const postRef = doc(firestore, 'posts', postId);
        const likeRef = doc(collection(firestore, 'posts', postId, 'likes'), user.uid);

        try {
            const likeDoc = await getDoc(likeRef);
            if (likeDoc.exists()) {
                 toast({ variant: "default", title: "You have already liked this post."});
                 return; // Already liked
            }
            await updateDoc(postRef, { likeCount: increment(1) });
            await setDoc(likeRef, { userId: user.uid });
        } catch (error) {
            console.error("Error liking post:", error);
        }
    };
    
     const handleShare = async (postText: string) => {
        const message = `Check out this post from Quickly Study:\n\n"${postText}"`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Post from Quickly Study',
                    text: message,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
             const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
             window.open(whatsappUrl, '_blank');
        }
    };


    return (
        <div className="container mx-auto max-w-lg p-2 sm:p-4 space-y-4">
             <div className="mb-6">
                <h1 className="text-3xl font-bold">Feed</h1>
                <p className="text-muted-foreground">
                    Latest updates and posts.
                </p>
            </div>
            {postsLoading ? <div className="flex justify-center p-8"><Loader className="animate-spin"/></div> :
            posts && posts.length > 0 ? (
                posts.map(post => (
                    <Card key={post.id} className="overflow-hidden">
                        <CardHeader className="flex flex-row items-center gap-3 p-3">
                             <Avatar className="h-10 w-10">
                               <AvatarImage src={post.userImage} alt={post.userName} />
                               <AvatarFallback>{getInitials(post.userName)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{post.userName}</p>
                                <p className="text-xs text-muted-foreground">
                                    {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true, locale: hi }) : '...'}
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <p className="whitespace-pre-wrap text-sm">{post.text}</p>
                            {post.imageUrl && (
                                <div className="mt-3 w-full aspect-video relative">
                                    <Image src={post.imageUrl} alt="Post image" fill className="rounded-md object-cover" />
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between border-t p-1">
                             <Button variant="ghost" className="w-full text-xs" onClick={() => handleLike(post.id)}>
                                <ThumbsUp className="mr-2 h-4 w-4"/> {post.likeCount || 0}
                             </Button>
                             <Button variant="ghost" className="w-full text-xs">
                                <MessageSquare className="mr-2 h-4 w-4"/> {post.commentCount || 0}
                             </Button>
                             <Button variant="ghost" className="w-full text-xs" onClick={() => handleShare(post.text)}>
                                <Share2 className="mr-2 h-4 w-4"/> Share
                             </Button>
                        </CardFooter>
                    </Card>
                ))
            ) : (
                <div className="text-center text-muted-foreground p-8">
                    <MessageSquare className="mx-auto h-12 w-12" />
                    <p className="mt-4">The feed is empty. Check back later for new posts!</p>
                </div>
            )}
        </div>
    );
}
