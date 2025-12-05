import React, { useState } from 'react';
import { useSmartReorder } from '@/hooks/useSmartReorder';
import { AlertTriangle, TrendingUp, Clock, Sparkles, RefreshCw, X, ChevronDown, ChevronUp } from 'lucide-react';

interface SmartReorderWidgetProps {
    storeId?: string;
    maxItems?: number;
}

const SmartReorderWidget: React.FC<SmartReorderWidgetProps> = ({ storeId, maxItems = 5 }) => {
    const { suggestions, loading, error, triggerAnalysis, markAsOrdered, dismissSuggestion } = useSmartReorder(storeId);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'normal': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'urgent': return <AlertTriangle className="h-5 w-5" />;
            case 'high': return <TrendingUp className="h-5 w-5" />;
            default: return <Clock className="h-5 w-5" />;
        }
    };

    // If widget is dismissed, don't render
    if (isDismissed) return null;

    const urgentSuggestions = suggestions.filter(s => s.priority === 'urgent').slice(0, maxItems);
    const highSuggestions = suggestions.filter(s => s.priority === 'high').slice(0, maxItems);
    const otherSuggestions = suggestions.filter(s => s.priority !== 'urgent' && s.priority !== 'high').slice(0, maxItems);

    // Error state - show dismissible error message
    if (error && !loading) {
        return (
            <div className="glass rounded-2xl p-6 border border-red-500/20 bg-red-500/5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-red-400" />
                        <h2 className="text-xl font-bold text-foreground">Reabastecimiento Inteligente</h2>
                    </div>
                    <button
                        onClick={() => setIsDismissed(true)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-red-400 font-semibold mb-2">Error al cargar sugerencias</p>
                    <p className="text-sm text-muted-foreground mb-4">
                        {error.includes('relation') || error.includes('does not exist')
                            ? 'La tabla de sugerencias no existe. Por favor ejecuta las migraciones de base de datos.'
                            : error}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                        >
                            Recargar Página
                        </button>
                        <button
                            onClick={() => setIsDismissed(true)}
                            className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                        >
                            Ocultar Widget
                        </button>
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground">
                        <p className="font-semibold mb-1">Solución:</p>
                        <code className="bg-black/20 px-2 py-1 rounded">supabase db push</code>
                        <p className="mt-2">O ejecuta manualmente las migraciones en Supabase Dashboard.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (loading && suggestions.length === 0) {
        return (
            <div className="glass rounded-2xl p-6 border border-white/10 animate-pulse">
                <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-20 bg-white/10 rounded"></div>
                    <div className="h-20 bg-white/10 rounded"></div>
                </div>
            </div>
        );
    }

    if (suggestions.length === 0 && !loading) {
        return (
            <div className="glass rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-blue-400" />
                        <h2 className="text-xl font-bold text-foreground">Reabastecimiento Inteligente</h2>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => triggerAnalysis(storeId)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Analizar
                        </button>
                        <button
                            onClick={() => setIsDismissed(true)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                    <p>No hay sugerencias de reorden en este momento.</p>
                    <p className="text-sm mt-2">Ejecuta un análisis para obtener recomendaciones.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="glass rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-blue-400" />
                    <h2 className="text-xl font-bold text-foreground">Reabastecimiento Inteligente</h2>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full font-medium">
                        {suggestions.length} sugerencias
                    </span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => triggerAnalysis(storeId)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </button>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                    </button>
                    <button
                        onClick={() => setIsDismissed(true)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {!isCollapsed && (
                <>
                    {/* Urgent Section */}
                    {urgentSuggestions.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                URGENTE - Agotar en menos de 3 días
                            </h3>
                            <div className="space-y-3">
                                {urgentSuggestions.map((suggestion) => (
                                    <div
                                        key={suggestion.id}
                                        className={`p-4 rounded-xl border ${getPriorityColor(suggestion.priority)} backdrop-blur-sm`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {getPriorityIcon(suggestion.priority)}
                                                    <h4 className="font-semibold text-foreground">
                                                        {suggestion.product?.name || 'Producto'}
                                                    </h4>
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
                                                    <div>Stock actual: <span className="text-foreground font-medium">{suggestion.current_stock}</span></div>
                                                    <div>Venta diaria: <span className="text-foreground font-medium">{suggestion.daily_sales_rate.toFixed(1)}</span></div>
                                                    <div>Se agota en: <span className="text-red-400 font-semibold">{suggestion.days_until_depletion} días</span></div>
                                                    <div>Sugerencia: <span className="text-foreground font-medium">{suggestion.suggested_quantity} unidades</span></div>
                                                </div>
                                                {suggestion.ai_reasoning && (
                                                    <p className="text-xs text-muted-foreground italic">{suggestion.ai_reasoning}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <button
                                                    onClick={() => markAsOrdered(suggestion.id)}
                                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
                                                >
                                                    Ordenar
                                                </button>
                                                <button
                                                    onClick={() => dismissSuggestion(suggestion.id)}
                                                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors"
                                                >
                                                    Descartar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* High Priority Section */}
                    {highSuggestions.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                PRIORIDAD ALTA - Próximos a agotar
                            </h3>
                            <div className="space-y-3">
                                {highSuggestions.map((suggestion) => (
                                    <div
                                        key={suggestion.id}
                                        className={`p-4 rounded-xl border ${getPriorityColor(suggestion.priority)} backdrop-blur-sm`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-foreground mb-2">
                                                    {suggestion.product?.name || 'Producto'}
                                                </h4>
                                                <div className="flex gap-4 text-sm text-muted-foreground">
                                                    <span>Stock: {suggestion.current_stock}</span>
                                                    <span>Días: {suggestion.days_until_depletion}</span>
                                                    <span>Sugerencia: {suggestion.suggested_quantity} unidades</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <button
                                                    onClick={() => markAsOrdered(suggestion.id)}
                                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
                                                >
                                                    Ordenar
                                                </button>
                                                <button
                                                    onClick={() => dismissSuggestion(suggestion.id)}
                                                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors"
                                                >
                                                    Descartar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Normal/Low Priority Section */}
                    {otherSuggestions.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                SUGERENCIAS GENERALES
                            </h3>
                            <div className="space-y-3">
                                {otherSuggestions.map((suggestion) => (
                                    <div
                                        key={suggestion.id}
                                        className={`p-4 rounded-xl border ${getPriorityColor(suggestion.priority)} backdrop-blur-sm`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-foreground mb-2">
                                                    {suggestion.product?.name || 'Producto'}
                                                </h4>
                                                <div className="flex gap-4 text-sm text-muted-foreground">
                                                    <span>Stock: {suggestion.current_stock}</span>
                                                    <span>Días: {suggestion.days_until_depletion}</span>
                                                    <span>Sugerencia: {suggestion.suggested_quantity} unidades</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <button
                                                    onClick={() => markAsOrdered(suggestion.id)}
                                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
                                                >
                                                    Ordenar
                                                </button>
                                                <button
                                                    onClick={() => dismissSuggestion(suggestion.id)}
                                                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors"
                                                >
                                                    Descartar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* View All Link */}
                    {suggestions.length > maxItems && (
                        <div className="mt-4 text-center">
                            <a
                                href="/inventory/reorden"
                                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Ver todas las {suggestions.length} sugerencias →
                            </a>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SmartReorderWidget;
