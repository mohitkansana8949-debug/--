
'use client';
import { useState } from 'react';
import { useCollection, useMemoFirebase, useFirebase, useUser } from '@/firebase';
import { collection, doc, updateDoc, increment, deleteDoc, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader, MessageSquare, ThumbsUp, Share2 } from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { hi } from 'date-fns/locale';

export default function FeedPage() {
    const { firestore } = useFirebase();
    const { user } = useUser();

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
            await updateDoc(postRef, { likeCount: increment(1) });
            await addDoc(collection(firestore, 'posts', postId, 'likes'), { userId: user.uid, postId });
        } catch (error) {
            console.error("Error liking post:", error);
        }
    };


    return (
        <div className="container mx-auto max-w-2xl p-4 space-y-6">
             <div className="mb-8">
                <h1 className="text-3xl font-bold">Feed</h1>
                <p className="text-muted-foreground">
                    Latest updates and posts.
                </p>
            </div>
            {postsLoading ? <div className="flex justify-center p-8"><Loader className="animate-spin"/></div> :
            posts && posts.length > 0 ? (
                posts.map(post => (
                    <Card key={post.id}>
                        <CardHeader className="flex flex-row items-center gap-3">
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
                        <CardContent>
                            <p className="whitespace-pre-wrap">{post.text}</p>
                            {post.imageUrl && (
                                <div className="mt-4 w-full aspect-video relative">
                                    <Image src={post.imageUrl} alt="Post image" fill className="rounded-md object-cover" />
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-2">
                             <Button variant="ghost" onClick={() => handleLike(post.id)}>
                                <ThumbsUp className="mr-2"/> {post.likeCount || 0} Likes
                             </Button>
                             <Button variant="ghost">
                                <MessageSquare className="mr-2"/> {post.commentCount || 0} Comments
                             </Button>
                             <Button variant="ghost">
                                <Share2 className="mr-2"/> Share
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

