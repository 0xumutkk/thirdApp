import React from 'react';
import { ChevronLeft, Share2, Bookmark, Star, Quote, Sparkles, Coffee } from 'lucide-react';
import { EditorPick } from '../types';

interface EditorArticleScreenProps {
    article: EditorPick;
    onBack: () => void;
}

const EditorArticleScreen: React.FC<EditorArticleScreenProps> = ({ article, onBack }) => {
    // Mock content that would normally be written by editors
    const mockContent = {
        sections: [
            {
                heading: "Şehrin Kalbinde Bir Durak",
                content: "İstanbul'un karmaşasından uzaklaşmak istediğinizde, sığındığınız o özel köşeler vardır ya... İşte burası tam da öyle bir yer. Kapıdan içeri girdiğiniz an yayılan taze çekilmiş kahve kokusu, sizi bir anda günün stresinden çekip alıyor. Her köşesi özenle düşünülmüş dekorasyonu ve yumuşak aydınlatmasıyla, hem çalışmak hem de derin sohbetlere dalmak için ideal bir atmosfer sunuyor."
            },
            {
                heading: "Lezzet ve Doku",
                content: "Kahvelerindeki özen, sadece çekirdek seçiminden değil, hazırlama sürecindeki hassasiyetten de belli oluyor. Özel harmanları olan 'Single Origin' seçkileri, meyvemsi notaları ve dengeli asiditesiyle damağınızda unutulmaz bir iz bırakıyor. Yanında sunulan ev yapımı ekşi mayalı kurabiyeler ise bu deneyimi tam bir şölene dönüştürüyor."
            },
            {
                heading: "Neden Ziyaret Etmelisiniz?",
                content: "Eğer gerçek bir kahve tutkunuysanız ve her yudumda o emeği hissetmek istiyorsanız, burası listenizin en başında olmalı. Sadece bir kahve dükkanı değil, aynı zamanda yerel sanatçıların eserlerine ev sahipliği yapan bir sanat galerisi gibi hissettiriyor. Hafta sonu sakinliğinde kitabınızı alıp gelmelisiniz."
            }
        ],
        quotes: [
            "Kahve sadece bir içecek değil, anın tadını çıkarma sanatıdır."
        ],
        rating: 4.8
    };

    return (
        <div className="h-full w-full bg-[#FAF9F6] overflow-y-auto no-scrollbar pb-20">
            {/* Hero Header */}
            <div className="relative h-[60vh] w-full">
                <img
                    src={article.image}
                    className="absolute inset-0 w-full h-full object-cover"
                    alt={article.title}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#FAF9F6]" />

                {/* Navigation */}
                <div className="absolute top-12 left-6 right-6 flex justify-between items-center z-10">
                    <button
                        onClick={onBack}
                        className="w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white active:scale-90 transition-all"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex gap-3">
                        <button className="w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white active:scale-90 transition-all">
                            <Bookmark className="w-5 h-5" />
                        </button>
                        <button className="w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white active:scale-90 transition-all">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Floating Editor Badge */}
                <div className="absolute bottom-12 left-8 right-8">
                    <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-xl border border-white/50 px-4 py-2 rounded-full shadow-2xl mb-6">
                        <img src={article.editorImage} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" alt={article.editorName} />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-[#1B4332] uppercase tracking-widest">{article.editorName}</span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Third Coffee Critic</span>
                        </div>
                    </div>
                    <h1 className="font-outfit text-4xl font-black text-[#1B4332] leading-[1.1] tracking-tight mb-4">
                        {article.title}
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 bg-[#BC4749] px-3 py-1.5 rounded-xl shadow-lg rotate-[-2deg]">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{article.location}</span>
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{article.readTime} OKUMA</span>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="px-8 pt-8 pb-12 space-y-12">
                <div className="space-y-8">
                    {mockContent.sections.map((section, idx) => (
                        <div key={idx} className="space-y-4">
                            <h3 className="font-outfit text-xl font-bold text-[#1B4332] flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-[#BC4749] rounded-full" />
                                {section.heading}
                            </h3>
                            <p className="text-gray-600 leading-[1.8] font-medium text-[15px]">
                                {section.content}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Premium Quote Block */}
                <div className="relative py-12 px-10 bg-[#1B4332] rounded-[3.5rem] overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#BC4749]/20 rounded-full -ml-16 -mb-16 blur-2xl" />
                    <Quote className="w-10 h-10 text-[#BC4749] mb-6 opacity-50" />
                    <p className="font-outfit text-2xl font-bold text-white leading-tight italic">
                        "{mockContent.quotes[0]}"
                    </p>
                </div>

                {/* Flavor Profile / Rating */}
                <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-xl space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Coffee className="w-5 h-5 text-[#BC4749]" />
                            <h4 className="text-[10px] font-black text-[#1B4332] uppercase tracking-[0.2em]">Karakter Analizi</h4>
                        </div>
                        <div className="flex items-center gap-1 bg-[#FAF9F6] px-3 py-1.5 rounded-full">
                            <span className="text-[10px] font-black text-[#BC4749]">{mockContent.rating}/5</span>
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-2.5 h-2.5 ${i < Math.floor(mockContent.rating) ? 'text-[#BC4749] fill-[#BC4749]' : 'text-gray-200'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {['Asidite', 'Gövde', 'Aroma', 'Denge'].map((note) => (
                            <div key={note} className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">{note}</span>
                                </div>
                                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#1B4332]"
                                        style={{ width: `${60 + Math.random() * 40}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="pt-8 border-t border-gray-100 flex flex-col items-center space-y-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                        Bu içerik Third Kolektifi editörleri tarafından<br />yerinde deneyimlenerek hazırlanmıştır.
                    </p>
                    <div className="flex items-center gap-2 text-[#BC4749]">
                        <Sparkles className="w-3 h-3 fill-[#BC4749]" />
                        <span className="text-[9px] font-black uppercase tracking-widest">THIRD SEÇKİSİ 2026</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditorArticleScreen;
