import React, { useState, useRef, useCallback } from 'react';
import { SizePreset, TextLayer, CanvasState, GenerationStatus } from './types';
import { PRESETS, DEFAULT_TEXT_LAYER, FONTS } from './constants';
import { CanvasEditor } from './components/CanvasEditor';
import { Button } from './components/Button';
import { generateBackgroundImage, suggestTaglines } from './services/geminiService';
import { Download, Wand2, RefreshCw, Type, Layout, Image as ImageIcon, Palette, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  // State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<'layout' | 'text' | 'bg'>('layout');
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  const [canvasState, setCanvasState] = useState<CanvasState>({
    width: 1280,
    height: 720,
    backgroundColor: '#1e293b',
    backgroundImage: null,
    overlayOpacity: 0.2
  });

  const [textLayers, setTextLayers] = useState<TextLayer[]>([
    { ...DEFAULT_TEXT_LAYER, id: '1' }
  ]);

  const [prompt, setPrompt] = useState('');

  // Handlers
  const handlePresetChange = (preset: SizePreset) => {
    setCanvasState(prev => ({
      ...prev,
      width: preset.width,
      height: preset.height
    }));
  };

  const handleGenerateBackground = async () => {
    if (!prompt.trim()) return;
    setStatus(GenerationStatus.LOADING);
    setErrorMsg('');
    try {
      const base64Image = await generateBackgroundImage(prompt);
      setCanvasState(prev => ({
        ...prev,
        backgroundImage: base64Image
      }));
      setStatus(GenerationStatus.SUCCESS);
    } catch (e) {
      setStatus(GenerationStatus.ERROR);
      setErrorMsg("Failed to generate image. Please try again.");
    }
  };

  const handleSuggestTaglines = async () => {
    if (!prompt.trim()) return;
    setStatus(GenerationStatus.LOADING);
    try {
      const suggestions = await suggestTaglines(prompt);
      if (suggestions.length > 0) {
        // Update the first text layer or add new one
        setTextLayers(prev => {
          const newLayers = [...prev];
          if (newLayers.length > 0) {
            newLayers[0].text = suggestions[0];
          } else {
             newLayers.push({ ...DEFAULT_TEXT_LAYER, id: Date.now().toString(), text: suggestions[0] });
          }
          return newLayers;
        });
      }
      setStatus(GenerationStatus.SUCCESS);
    } catch (e) {
      console.error(e);
      setStatus(GenerationStatus.ERROR);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `pixelcraft-design-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const updateTextLayer = (id: string, updates: Partial<TextLayer>) => {
    setTextLayers(prev => prev.map(layer => layer.id === id ? { ...layer, ...updates } : layer));
  };

  const addTextLayer = () => {
    setTextLayers(prev => [...prev, { ...DEFAULT_TEXT_LAYER, id: Date.now().toString(), y: prev.length * 10 + 50 }]);
  };

  const removeTextLayer = (id: string) => {
    setTextLayers(prev => prev.filter(l => l.id !== id));
  };

  // Render Helpers
  const renderSidebar = () => {
    switch (activeTab) {
      case 'layout':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Presets</h3>
              <div className="grid grid-cols-2 gap-3">
                {PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetChange(preset)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      canvasState.width === preset.width && canvasState.height === preset.height
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                      : 'border-slate-700 hover:border-slate-500 text-slate-300'
                    }`}
                  >
                    <div className="text-xl mb-1">{preset.icon}</div>
                    <div className="text-xs font-bold">{preset.name}</div>
                    <div className="text-[10px] text-slate-500">{preset.width} x {preset.height}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Custom Size</h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-xs text-slate-500">W</span>
                  <input 
                    type="number" 
                    value={canvasState.width}
                    onChange={(e) => setCanvasState({...canvasState, width: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 pl-8 text-sm focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-xs text-slate-500">H</span>
                  <input 
                    type="number" 
                    value={canvasState.height}
                    onChange={(e) => setCanvasState({...canvasState, height: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 pl-8 text-sm focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'bg':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">AI Generator</h3>
              <div className="space-y-3">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your background (e.g., 'Neon city skyline at night, cyberpunk style')..."
                  className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none resize-none"
                />
                <Button 
                  onClick={handleGenerateBackground} 
                  isLoading={status === GenerationStatus.LOADING}
                  className="w-full"
                  icon={<Wand2 size={16} />}
                >
                  Generate Background
                </Button>
                {status === GenerationStatus.ERROR && (
                  <div className="text-red-400 text-xs flex items-center gap-1">
                    <AlertCircle size={12} /> {errorMsg}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700">
               <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Appearance</h3>
               <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Base Color</label>
                    <input 
                      type="color" 
                      value={canvasState.backgroundColor}
                      onChange={(e) => setCanvasState({...canvasState, backgroundColor: e.target.value})}
                      className="w-full h-10 rounded cursor-pointer bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Overlay Opacity (Darken)</label>
                    <input 
                      type="range" 
                      min="0" max="0.9" step="0.1"
                      value={canvasState.overlayOpacity}
                      onChange={(e) => setCanvasState({...canvasState, overlayOpacity: parseFloat(e.target.value)})}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  {canvasState.backgroundImage && (
                    <Button 
                      variant="secondary" 
                      onClick={() => setCanvasState({...canvasState, backgroundImage: null})}
                      className="w-full text-xs"
                    >
                      Clear Image
                    </Button>
                  )}
               </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
               <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Layers</h3>
               <button onClick={addTextLayer} className="text-indigo-400 text-xs hover:underline">+ Add Text</button>
            </div>
            
            {prompt && (
              <Button 
                variant="ghost" 
                className="w-full mb-4 border border-slate-700 border-dashed text-xs"
                onClick={handleSuggestTaglines}
                icon={<Wand2 size={12} />}
              >
                AI Auto-Write Text from Prompt
              </Button>
            )}

            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1">
              {textLayers.map((layer, index) => (
                <div key={layer.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 group">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs text-slate-500 font-mono">Layer {index + 1}</span>
                    <button onClick={() => removeTextLayer(layer.id)} className="text-slate-500 hover:text-red-400">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                    </button>
                  </div>
                  
                  <input 
                    type="text" 
                    value={layer.text}
                    onChange={(e) => updateTextLayer(layer.id, { text: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 mb-3 text-sm focus:border-indigo-500 outline-none"
                  />
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Font</label>
                      <select 
                        value={layer.fontFamily} 
                        onChange={(e) => updateTextLayer(layer.id, { fontFamily: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-xs"
                      >
                        {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Color</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={layer.color}
                          onChange={(e) => updateTextLayer(layer.id, { color: e.target.value })}
                          className="h-6 w-6 rounded bg-transparent cursor-pointer"
                        />
                        <span className="text-xs text-slate-400">{layer.color}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                     <div>
                       <div className="flex justify-between text-[10px] text-slate-500">
                         <span>Size</span>
                         <span>{layer.fontSize}px</span>
                       </div>
                       <input 
                        type="range" min="10" max="200"
                        value={layer.fontSize}
                        onChange={(e) => updateTextLayer(layer.id, { fontSize: parseInt(e.target.value) })}
                        className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      />
                     </div>
                     <div>
                       <div className="flex justify-between text-[10px] text-slate-500">
                         <span>Pos X</span>
                         <span>{Math.round(layer.x)}%</span>
                       </div>
                       <input 
                        type="range" min="0" max="100"
                        value={layer.x}
                        onChange={(e) => updateTextLayer(layer.id, { x: parseInt(e.target.value) })}
                        className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      />
                     </div>
                     <div>
                       <div className="flex justify-between text-[10px] text-slate-500">
                         <span>Pos Y</span>
                         <span>{Math.round(layer.y)}%</span>
                       </div>
                       <input 
                        type="range" min="0" max="100"
                        value={layer.y}
                        onChange={(e) => updateTextLayer(layer.id, { y: parseInt(e.target.value) })}
                        className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      />
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white">P</span>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">PixelCraft <span className="text-indigo-400 font-light">Studio</span></h1>
            </div>
          </div>
          <div className="flex gap-4">
             <Button 
                variant="primary" 
                onClick={handleDownload}
                icon={<Download size={18} />}
             >
               Export Image
             </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
        
        {/* Left Sidebar - Controls */}
        <aside className="w-full lg:w-96 bg-slate-900 border-r border-slate-800 flex flex-col z-20 shadow-xl">
          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            <button 
              onClick={() => setActiveTab('layout')}
              className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'layout' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Layout size={16} /> Layout
            </button>
            <button 
              onClick={() => setActiveTab('bg')}
              className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'bg' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <ImageIcon size={16} /> Background
            </button>
            <button 
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'text' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Type size={16} /> Text
            </button>
          </div>
          
          {/* Scrollable Control Area */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700">
             {renderSidebar()}
          </div>
        </aside>

        {/* Center - Canvas */}
        <section className="flex-1 bg-slate-950 p-4 lg:p-8 flex flex-col relative overflow-hidden">
          
          <div className="flex-1 flex items-center justify-center relative z-10">
             <CanvasEditor 
                canvasRef={canvasRef}
                canvasState={canvasState}
                textLayers={textLayers}
             />
          </div>

          {/* Quick Info/Intro inside the canvas area */}
          <div className="mt-6 text-center text-slate-500 text-sm max-w-2xl mx-auto">
             <p className="mb-2">
               Design professional thumbnails and banners instantly. 
               Use the <span className="text-indigo-400 font-medium">AI Generator</span> to create unique backgrounds or auto-write catchy titles.
             </p>
          </div>
        </section>

      </main>

      {/* Simplified Footer for metadata requirement */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 px-8 text-center text-slate-600 text-xs">
         <div className="flex justify-center gap-6 mb-4">
            <a href="#" className="hover:text-slate-400">Terms</a>
            <a href="#" className="hover:text-slate-400">Privacy</a>
            <a href="#" className="hover:text-slate-400">Contact Support</a>
         </div>
         <p>&copy; 2024 PixelCraft Studio. All rights reserved. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
};

export default App;