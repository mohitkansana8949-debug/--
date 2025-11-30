
'use client';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Loader, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function CartPage() {
    const { cart, removeFromCart, updateQuantity } = useCart();
    
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <ShoppingCart className="h-8 w-8 text-primary" />
                    Your Cart
                </h1>
            </div>

            {cart.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                        <ShoppingCart className="h-12 w-12 mb-4" />
                        <h3 className="text-xl font-semibold">Your cart is empty</h3>
                        <p>Looks like you haven't added any books yet.</p>
                        <Button asChild className="mt-4">
                            <Link href="/bookshala">Start Shopping</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-4">
                        {cart.map(item => (
                            <Card key={item.id} className="flex items-center p-4 gap-4">
                                <Image src={item.imageUrl} alt={item.name} width={80} height={100} className="rounded-md object-cover" />
                                <div className="flex-1 space-y-1">
                                    <h3 className="font-semibold line-clamp-2">{item.name}</h3>
                                    <p className="text-muted-foreground font-bold">₹{item.price}</p>
                                    <div className="flex items-center gap-2 pt-2">
                                        <Button size="icon" variant="outline" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-4 w-4" /></Button>
                                        <Input type="number" value={item.quantity} readOnly className="w-16 h-9 text-center" />
                                        <Button size="icon" variant="outline" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                                <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => removeFromCart(item.id)}>
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </Card>
                        ))}
                    </div>

                    <Card className="lg:col-span-1 sticky top-20">
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Shipping</span>
                                <span className="text-green-500">Free</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button asChild className="w-full">
                                <Link href="/checkout">Proceed to Checkout</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    )
}
