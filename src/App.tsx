import { useState, FormEvent, useRef, ChangeEvent, useEffect } from "react";
import { Search, ShoppingCart, ExternalLink, TrendingDown, Info, Package, Star, ArrowRight, Loader2, Camera, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { searchProduct, ComparisonResult, ProductResult } from "./services/geminiService";

export default function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingMessages = [
    "Iniciando scanner...",
    "Identificando produto...",
    "Consultando marketplaces brasileiros...",
    "Comparando ofertas em tempo real...",
    "Calculando melhor custo-benefício...",
    "Finalizando análise..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStage(0);
      interval = setInterval(() => {
        setLoadingStage((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !selectedImage) return;

    setLoading(true);
    setError(null);
    try {
      const base64 = selectedImage ? selectedImage.split(",")[1] : undefined;
      const data = await searchProduct(query, base64);
      setResult(data);
    } catch (err) {
      setError("Falha ao buscar comparação de preços. Por favor, tente novamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-geo-bg p-4 md:p-12 flex justify-center items-start">
      <div className="w-full max-w-[1024px] flex flex-col">
        {/* Header */}
        <header className="geo-header flex-col md:flex-row gap-4 md:gap-0 h-auto md:h-20 pb-6 md:pb-3 mb-6 md:mb-10">
          <div className="flex flex-col">
            <h1 className="m-0 text-xl md:text-2xl">PricePulse.Pro</h1>
            <span className="text-[9px] md:text-[10px] text-geo-muted tracking-widest mt-1">SCANNER DE MERCADO COM IA</span>
          </div>
          
          <div className="w-full md:w-auto flex flex-col gap-2">
            <form onSubmit={handleSearch} className="flex gap-2 w-full">
              <div className="relative flex-1">
                <Input 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={selectedImage ? "Descreva o produto (opcional)..." : "Buscar produto..."} 
                  className="h-10 md:h-9 w-full md:w-64 border-2 border-geo-border rounded-none bg-white focus-visible:ring-0 focus-visible:border-geo-accent pr-10"
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-geo-muted hover:text-geo-accent transition-colors"
                >
                  <Camera className="w-5 h-5 md:w-4 h-4" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageSelect} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <Button type="submit" disabled={loading} className="geo-btn h-10 md:h-9 px-4">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Escanear"}
              </Button>
            </form>
            
            <AnimatePresence>
              {selectedImage && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 bg-white border-2 border-geo-border p-2"
                >
                  <div className="w-10 h-10 border border-geo-border overflow-hidden">
                    <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider flex-1 truncate">Imagem selecionada</span>
                  <button onClick={clearImage} className="text-geo-muted hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main className="flex-1">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6 md:gap-10"
              >
                <div className="space-y-6">
                  <div className="relative">
                    <Skeleton className="aspect-square w-full border-2 border-geo-border" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white/50 backdrop-blur-sm">
                      <Loader2 className="w-10 h-10 animate-spin mb-4 text-geo-accent" />
                      <motion.p 
                        key={loadingStage}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs font-bold uppercase tracking-widest text-geo-border"
                      >
                        {loadingMessages[loadingStage]}
                      </motion.p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                </div>
                <div className="geo-table overflow-x-auto">
                  <div className="geo-table-header min-w-[600px] md:min-w-0">
                    <span>Marketplace</span>
                    <span>Preço</span>
                    <span>Envio</span>
                    <span>Total</span>
                    <span>Ação</span>
                  </div>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="geo-table-row min-w-[600px] md:min-w-0">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-12" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : error ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 md:py-24 border-2 border-dashed border-geo-border"
              >
                <Info className="w-12 h-12 mx-auto mb-4 text-geo-muted" />
                <h3 className="text-xl font-bold uppercase tracking-wider mb-2">Falha no Scan</h3>
                <p className="text-geo-muted mb-6 px-4">{error}</p>
                <Button onClick={() => setError(null)} className="geo-btn px-8">Reiniciar Scanner</Button>
              </motion.div>
            ) : result ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6 md:gap-10"
              >
                {/* Product Card (Left) */}
                <aside className="geo-card">
                  <div className="geo-image-container">
                    <img 
                      src={result.results[0]?.imageUrl} 
                      alt={result.productName} 
                      className="max-h-[80%] max-w-[80%] object-contain mix-blend-multiply"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="product-info">
                    <h2 className="text-lg md:text-xl font-black leading-tight mb-2 uppercase tracking-tight">{result.productName}</h2>
                    <p className="text-xs md:text-sm text-geo-muted leading-relaxed">{result.description}</p>
                  </div>
                  <div className="geo-spec-grid">
                    <div className="geo-spec-item">
                      <span className="geo-spec-label">Melhor Preço</span>
                      <span className="font-bold text-geo-accent">{result.bestPrice}</span>
                    </div>
                    <div className="geo-spec-item">
                      <span className="geo-spec-label">Top Market</span>
                      <span className="font-bold truncate block">{result.bestMarketplace}</span>
                    </div>
                    <div className="geo-spec-item">
                      <span className="geo-spec-label">Ofertas</span>
                      <span className="font-bold">{result.results.length}</span>
                    </div>
                    <div className="geo-spec-item">
                      <span className="geo-spec-label">Status</span>
                      <span className="font-bold text-green-600">Verificado</span>
                    </div>
                  </div>
                </aside>

                {/* Comparison Table (Right) */}
                <div className="geo-table">
                  <div className="geo-table-header hidden md:grid">
                    <span>Marketplace</span>
                    <span>Preço</span>
                    <span>Envio</span>
                    <span>Total</span>
                    <span>Ação</span>
                  </div>
                  <ScrollArea className="h-auto md:h-[600px]">
                    <div className="flex flex-col">
                      {result.results.map((item, index) => (
                        <div 
                          key={index} 
                          className={`flex flex-col md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr] p-4 md:py-5 md:px-4 border-b border-zinc-100 items-start md:items-center transition-colors hover:bg-[#f0f7ff] gap-3 md:gap-0 ${item.price === result.bestPrice ? 'geo-best-deal' : ''}`}
                        >
                          <div className="market-name flex items-center font-bold text-sm">
                            {item.marketplace}
                            {item.price === result.bestPrice && <span className="geo-badge">Melhor Oferta</span>}
                          </div>
                          
                          <div className="flex w-full justify-between items-center md:contents">
                            <div className="geo-price text-base md:text-lg">{item.price}</div>
                            <div className="text-[10px] md:text-xs text-geo-muted uppercase font-semibold">
                              {item.shippingInfo || "Calculado no checkout"}
                            </div>
                            <div className="font-bold text-geo-accent hidden md:block">{item.price}</div>
                            <a 
                              href={item.link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="geo-btn w-full md:w-auto"
                            >
                              Ver Loja
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 md:py-32 text-center border-2 border-geo-border bg-white"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 md:mb-8 border-2 border-geo-border flex items-center justify-center relative">
                  <div className="absolute w-10 h-10 md:w-12 md:h-12 border border-geo-border rotate-45 opacity-20"></div>
                  <Search className="w-6 h-6 md:w-8 md:h-8 text-geo-border" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest mb-4">Scanner Inativo</h2>
                <p className="text-geo-muted max-w-md mx-auto uppercase text-[10px] md:text-xs tracking-[2px] font-bold px-4">
                  Digite o nome de um produto ou use a câmera para iniciar a análise de preços.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="mt-8 md:mt-12 pt-6 border-t-2 border-geo-border flex flex-col md:flex-row justify-between items-center text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-geo-muted gap-4">
          <div>© 2026 PricePulse.Pro • Todos os direitos reservados</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-geo-accent">Privacidade</a>
            <a href="#" className="hover:text-geo-accent">Termos</a>
            <a href="#" className="hover:text-geo-accent">API</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
