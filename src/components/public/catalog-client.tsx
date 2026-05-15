"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { ShoppingBag, Share2, Search, ArrowRight, MessageCircle } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Product {
    id: number;
    name: string;
    categoryId: number | null;
    quantity: number;
    unitSalePrice: string | number | null;
    imageUrl?: string | null;
    barcode?: string | null;
    categoryName?: string | null;
    unitCostPrice?: string | null;
    lowStockThreshold?: number | null;
}

interface Category {
    id: number;
    name: string;
}

export function CatalogClient({ products, categories, boutiqueName = "STOCK BOUTIQUE", phoneNumber = "00000000", shareUrl }: { products: Product[], categories: Category[], boutiqueName?: string, phoneNumber?: string, shareUrl?: string }) {
    const [searchTerm, setSearchTerm] = useState("");

    const handleShare = async () => {
        const urlToShare = shareUrl ? (window.location.origin + shareUrl) : window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Catalogue - ${boutiqueName}`,
                    text: 'Découvrez nos produits en ligne !',
                    url: urlToShare,
                });
            } catch (err) {
                console.error("Erreur de partage:", err);
            }
        } else {
            await navigator.clipboard.writeText(urlToShare);
            toast.success("Lien copié dans le presse-papiers");
        }
    };

    const handleOrderWhatsApp = (product: Product) => {
        const message = `Bonjour ${boutiqueName}, je suis intéressé(e) par l'article : *${product.name}* affiché à ${formatCurrency(Number(product.unitSalePrice))}. Est-il disponible ?`;
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const filteredCategories = categories.filter(cat => {
        const catProducts = products.filter(p => p.categoryId === cat.id);
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return catProducts.some(p => p.name.toLowerCase().includes(term));
        }
        return catProducts.length > 0;
    });

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Hero Header */}
            <div className="bg-white border-b sticky top-0 z-50 shadow-sm transition-all">
                <div className="max-w-7xl mx-auto px-4 h-auto py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20">
                                <ShoppingBag className="text-white h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="font-black text-xl tracking-tight text-slate-800 uppercase">{boutiqueName}</h1>
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Catalogue Public</p>
                            </div>
                        </div>
                        <button
                            onClick={handleShare}
                            className="md:hidden flex items-center justify-center p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-all"
                        >
                            <Share2 size={18} />
                        </button>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <Input
                                placeholder="Rechercher un produit..."
                                className="w-full h-11 pl-9 bg-slate-50 border-slate-200 rounded-full focus-visible:ring-blue-500 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleShare}
                            className="hidden md:flex items-center gap-2 px-6 h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-sm font-bold transition-all shadow-lg"
                        >
                            <Share2 size={16} />
                            Partager
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 space-y-12">
                {/* Navigation Rapide */}
                {filteredCategories.length > 0 && !searchTerm && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none sticky top-20 z-40 bg-slate-50/80 backdrop-blur-md py-3 -mx-4 px-4 border-b border-slate-200/50">
                        {filteredCategories.map((cat) => (
                            <a
                                key={cat.id}
                                href={`#category-${cat.id}`}
                                className="px-5 py-2.5 bg-white border border-slate-200 rounded-full text-xs font-black tracking-widest text-slate-600 whitespace-nowrap hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm active:scale-95"
                            >
                                {cat.name.toUpperCase()}
                            </a>
                        ))}
                    </div>
                )}

                {/* Categories Sections */}
                {filteredCategories.map((cat) => {
                    const categoryProducts = products.filter(p => p.categoryId === cat.id && (!searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase())));

                    if (categoryProducts.length === 0) return null;

                    return (
                        <section key={cat.id} id={`category-${cat.id}`} className="space-y-6 scroll-mt-36">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl md:text-3xl font-black text-slate-800 italic uppercase tracking-tighter">
                                    {cat.name}
                                </h2>
                                <div className="h-[2px] bg-slate-200 flex-1 rounded-full" />
                                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                                    {categoryProducts.length} articles
                                </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                                {categoryProducts.map((p) => (
                                    <Card key={p.id} className="group border-none shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 rounded-2xl overflow-hidden bg-white flex flex-col h-full cursor-pointer hover:-translate-y-1">
                                        <div className="aspect-square bg-slate-100 relative overflow-hidden">
                                            {p.imageUrl ? (
                                                <Image
                                                    src={p.imageUrl}
                                                    alt={p.name}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300 italic font-black text-6xl select-none group-hover:scale-110 transition-transform duration-700 ease-out">
                                                    {p.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}

                                            {/* Badge Stock */}
                                            <div className="absolute top-3 left-3">
                                                {p.quantity === 0 ? (
                                                    <span className="px-3 py-1 bg-red-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">Rupture</span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-green-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1">En Stock</span>
                                                )}
                                            </div>
                                        </div>

                                        <CardContent className="p-4 md:p-5 flex flex-col flex-1">
                                            <h3 className="font-extrabold text-slate-800 text-sm md:text-base leading-tight md:leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                                                {p.name}
                                            </h3>
                                            <div className="mt-auto pt-4 flex flex-col gap-3">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-blue-600 font-black text-lg md:text-xl tracking-tight">
                                                        {formatCurrency(Number(p.unitSalePrice))}
                                                    </p>
                                                </div>
                                                <Button
                                                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-10 md:h-11 rounded-xl shadow-lg shadow-[#25D366]/20 transition-all font-bold text-xs"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOrderWhatsApp(p);
                                                    }}
                                                >
                                                    <MessageCircle size={16} className="mr-2" />
                                                    COMMANDER
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    );
                })}

                {/* Empty State */}
                {filteredCategories.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 md:py-40 text-slate-400 text-center px-4">
                        <div className="bg-slate-100 p-6 rounded-full mb-6">
                            <Search size={48} className="opacity-20" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Aucun produit trouvé</h2>
                        <p className="text-sm font-medium">Réessayez avec un autre terme ou explorez nos autres catégories.</p>
                        {searchTerm && (
                            <Button variant="outline" className="mt-6 rounded-full" onClick={() => setSearchTerm("")}>
                                Voir tous les produits
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-500 py-16 px-4 mt-auto">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-xl">
                            <ShoppingBag className="text-white h-5 w-5" />
                        </div>
                        <span className="font-black text-white text-lg tracking-tight uppercase">{boutiqueName}</span>
                    </div>
                    <p className="text-xs font-bold tracking-widest uppercase text-slate-600">© 2026 Tous droits réservés.</p>
                </div>
            </footer>
        </div>
    );
}
