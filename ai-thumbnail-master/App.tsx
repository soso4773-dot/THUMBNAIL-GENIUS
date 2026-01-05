
import React, { useState } from 'react';
import { analyzeInputs, generateBackground } from './services/geminiService';
import { ThumbnailData, TextSettings, CharConfig, Decoration } from './types';
import Editor from './components/Editor';
import ColorPicker from './components/ColorPicker';
import { 
  Wand2, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  ChevronRight, 
  Type, 
  Eye,
  EyeOff,
  Split,
  MousePointer2,
  RefreshCw,
  CaseSensitive,
  Sticker,
  RotateCw,
  Maximize2,
  Trash2,
  MessageSquarePlus
} from 'lucide-react';

const FONTS = [
  { name: '블랙한산스 (강렬함)', value: 'Black Han Sans' },
  { name: '도현체 (스퀘어)', value: 'Do Hyeon' },
  { name: '주아체 (둥글둥글)', value: 'Jua' },
  { name: '나눔고딕 (깔끔함)', value: 'Nanum Gothic' },
  { name: '나눔손글씨 (붓글씨)', value: 'Nanum Pen Script' },
  { name: '고운바탕 (명조체)', value: 'Gowun Batang' },
  { name: '해바라기 (세련됨)', value: 'Sunflower' },
];

const STICKER_TYPES: Decoration['type'][] = ['!', '?', 'arrow', 'star'];

const App: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [script, setScript] = useState('');
  const [refImage, setRefImage] = useState<string | undefined>();
  const [userRequest, setUserRequest] = useState('');
  const [thumbnailData, setThumbnailData] = useState<ThumbnailData | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedCharIndex, setSelectedCharIndex] = useState(0);
  const [activeColor, setActiveColor] = useState('#ffffff');
  const [activeTab, setActiveTab] = useState<'text' | 'stickers'>('text');
  
  const [decorations, setDecorations] = useState<Decoration[]>([]);
  const [selectedId, setSelectedId] = useState<string | 'text' | null>(null);

  const [textSettings, setTextSettings] = useState<TextSettings>({
    chars: [],
    fontFamily: 'Black Han Sans',
    fontSize: 160,
    strokeColor: '#000000',
    strokeWidth: 20,
    lineHeight: 1.1,
    x: 640,
    y: 360,
    shadow: true
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setRefImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!script) return alert('대본을 입력해주세요!');
    setLoading(true);
    try {
      setLoadingStatus('대본과 스타일을 분석 중입니다...');
      const analysis = await analyzeInputs(script, refImage);
      
      setLoadingStatus(`${analysis.styleType === 'artistic' ? '예술적 일러스트' : '실사형 배경'}을 생성 중입니다...`);
      const bg = await generateBackground(analysis.text, analysis.styleDescription, analysis.styleType, userRequest);
      
      setThumbnailData({
        script,
        referenceImageBase64: refImage,
        suggestedText: analysis.text,
        backgroundUrl: bg,
        styleAnalysis: analysis.styleDescription,
        styleType: analysis.styleType
      });
      
      const initialChars: CharConfig[] = analysis.text.split('').map(char => ({
        char,
        color: '#ffffff'
      }));
      
      setTextSettings(prev => ({ 
        ...prev, 
        chars: initialChars 
      }));
      setActiveColor('#ffffff');
      setStep(2);
      setSelectedCharIndex(0);
      setSelectedId('text');
    } catch (error) {
      console.error(error);
      alert('생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateBackground = async () => {
    if (!thumbnailData) return;
    setLoading(true);
    setLoadingStatus('요청하신 내용에 맞춰 배경을 다시 생성하고 있습니다...');
    try {
      const bg = await generateBackground(
        thumbnailData.suggestedText, 
        thumbnailData.styleAnalysis, 
        thumbnailData.styleType, 
        userRequest
      );
      setThumbnailData({ ...thumbnailData, backgroundUrl: bg });
    } catch (error) {
      console.error(error);
      alert('배경 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const addSticker = (type: Decoration['type']) => {
    const newDec: Decoration = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 1280 / 2,
      y: 720 / 2,
      size: 200,
      color: activeColor,
      rotation: 0,
      strokeColor: '#000000'
    };
    setDecorations([...decorations, newDec]);
    setSelectedId(newDec.id);
    setActiveTab('stickers');
  };

  const updateSelectedDecoration = (updates: Partial<Decoration>) => {
    setDecorations(decorations.map(d => d.id === selectedId ? { ...d, ...updates } : d));
  };

  const deleteDecoration = (id: string) => {
    setDecorations(decorations.filter(d => d.id !== id));
    setSelectedId(null);
  };

  const applyColorToChar = (index: number, color: string) => {
    setTextSettings(prev => {
      const newChars = [...prev.chars];
      if (newChars[index]) {
        newChars[index] = { ...newChars[index], color: color };
      }
      return { ...prev, chars: newChars };
    });
  };

  const updateAllCharsColor = (color: string) => {
    setTextSettings(prev => ({
      ...prev,
      chars: prev.chars.map(c => ({ ...c, color }))
    }));
  };

  const updateCharColor = (newColor: string) => {
    setActiveColor(newColor);
    if (selectedId === 'text') {
      applyColorToChar(selectedCharIndex, newColor);
    } else if (selectedId) {
      updateSelectedDecoration({ color: newColor });
    }
  };

  const handleSelectChar = (index: number) => {
    setSelectedCharIndex(index);
    applyColorToChar(index, activeColor);
  };

  const downloadThumbnail = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'youtube-thumbnail-final.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const currentDecoration = decorations.find(d => d.id === selectedId);

  return (
    <div className="min-h-screen flex flex-col items-center bg-slate-950 text-slate-200 p-4 md:p-8 selection:bg-red-500/30">
      <header className="w-full max-w-6xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-2.5 rounded-xl shadow-lg shadow-red-900/40">
            <Wand2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white leading-tight">THUMBNAIL GENIUS</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">YouTube Automation Suite</p>
          </div>
        </div>
        <div className="flex gap-4">
           {step === 2 && (
             <button 
              onClick={() => { setStep(1); setUserRequest(''); setCompareMode(false); }}
              className="text-sm font-bold text-slate-400 hover:text-white transition-all bg-slate-900 px-5 py-2.5 rounded-xl border border-slate-800 hover:border-slate-600"
             >
               새로 만들기
             </button>
           )}
        </div>
      </header>

      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN */}
        <div className={`space-y-6 transition-all duration-500 ${compareMode ? 'lg:col-span-12' : 'lg:col-span-8'}`}>
          {step === 1 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-md space-y-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-3xl rounded-full" />
              <div className="space-y-4 relative z-10">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-tight font-black">
                  <FileText className="w-4 h-4 text-red-500" /> 1단계: 영상 대본 입력
                </label>
                <textarea
                  className="w-full h-56 bg-slate-950/50 border border-slate-800 rounded-2xl p-6 text-slate-100 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none placeholder:text-slate-700 shadow-inner text-lg font-medium"
                  placeholder="대본을 입력하세요..."
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                />
              </div>
              <div className="space-y-4 relative z-10">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-widest">
                  <MessageSquarePlus className="w-4 h-4 text-red-500" /> 추가 요청 사항 (이미지 분위기, 색상, 형태 등)
                </label>
                <textarea
                  className="w-full h-20 bg-slate-950/30 border border-slate-800 rounded-2xl px-5 py-3 text-slate-300 focus:ring-1 focus:ring-red-500/50 outline-none transition-all resize-none placeholder:text-slate-700 text-sm italic"
                  placeholder="예: '사이버펑크 느낌으로 만들어줘', '강렬한 불꽃 배경을 추가해줘'"
                  value={userRequest}
                  onChange={(e) => setUserRequest(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-widest">
                    <ImageIcon className="w-4 h-4 text-red-500" /> 2단계: 스타일 학습 (이미지)
                  </label>
                  <div className="relative h-44 group/drop cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 z-20 cursor-pointer" />
                    <div className="h-full border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3 bg-slate-950/30 group-hover/drop:bg-slate-900/50 group-hover/drop:border-red-500/50 transition-all overflow-hidden">
                      {refImage ? <img src={refImage} alt="Ref" className="h-full w-full object-cover" /> : (
                        <>
                          <div className="p-4 bg-slate-900 rounded-full group-hover/drop:scale-110 transition-transform shadow-lg"><ImageIcon className="w-6 h-6 text-slate-500" /></div>
                          <p className="text-xs text-slate-600 uppercase font-bold">참고 이미지 업로드</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                   <button onClick={handleGenerate} disabled={loading || !script} className="group relative w-full h-20 bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl font-black text-xl text-white shadow-2xl shadow-red-900/40 transition-all flex items-center justify-center gap-4 overflow-hidden active:scale-[0.97] disabled:opacity-50">
                    {loading ? (
                      <div className="flex items-center gap-4">
                        <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                        <span className="animate-pulse">AI 마스터링 중...</span>
                      </div>
                    ) : (
                      <>
                        <span className="tracking-tight">썸네일 생성하기</span>
                        <ChevronRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center px-4 py-2 bg-slate-900/50 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    <span className="text-sm font-black text-white uppercase tracking-tight">Preview Active</span>
                  </div>
                  <div className="h-4 w-px bg-slate-800" />
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${thumbnailData?.styleType === 'artistic' ? 'bg-purple-600/10 text-purple-400 border-purple-500/20' : 'bg-blue-600/10 text-blue-400 border-blue-500/20'}`}>
                    {thumbnailData?.styleType === 'artistic' ? '✨ Artistic' : '📷 Realistic'}
                  </span>
                </div>
                <div className="flex gap-2">
                  {refImage && (
                     <button onClick={() => setCompareMode(!compareMode)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all border ${compareMode ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-900/20 animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                      {compareMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {compareMode ? '편집 모드로 복귀' : '원본과 비교하기'}
                    </button>
                  )}
                  <button onClick={downloadThumbnail} className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-white font-black transition-all shadow-xl shadow-red-900/40 active:scale-95">
                    <Download className="w-4 h-4" /> 이미지 저장
                  </button>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className={`grid gap-6 ${compareMode ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                  <div className="space-y-2">
                    {compareMode && (
                      <div className="px-4 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Wand2 className="w-3 h-3 text-red-500" /> 현재 편집 중인 결과물
                      </div>
                    )}
                    <Editor 
                      bgUrl={thumbnailData?.backgroundUrl || ''} 
                      settings={textSettings} 
                      setSettings={setTextSettings}
                      decorations={decorations}
                      setDecorations={setDecorations}
                      selectedId={selectedId}
                      setSelectedId={setSelectedId}
                    />
                  </div>

                  {compareMode && refImage && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-right-10 duration-500">
                      <div className="px-4 py-1 text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                        <Split className="w-3 h-3" /> 사용자가 업로드한 원본 참고 이미지
                      </div>
                      <div className="rounded-2xl overflow-hidden border-4 border-slate-800 aspect-video shadow-2xl relative group">
                        <img src={refImage} className="w-full h-full object-cover" alt="Original Reference" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white font-black text-sm uppercase tracking-widest">Original Reference</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {!compareMode && (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-2 text-sm font-black text-slate-200 uppercase tracking-widest mb-4">
                      <RefreshCw className="w-4 h-4 text-red-500" /> 배경 스타일 재요청 (Regenerate)
                    </div>
                    <div className="flex gap-4">
                      <textarea className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-slate-300 font-medium h-14 text-sm" placeholder="이미지가 맘에 안 드시나요? 원하는 분위기를 입력 후 다시 생성하세요." value={userRequest} onChange={(e) => setUserRequest(e.target.value)} />
                      <button onClick={handleRegenerateBackground} disabled={loading} className="px-8 bg-slate-800 hover:bg-slate-700 rounded-2xl border border-slate-700 text-sm font-black text-white transition-all disabled:opacity-50 flex items-center gap-2">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 배경 재생성
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Controls */}
        {!compareMode && step === 2 && !loading && (
          <div className="lg:col-span-4 space-y-6 h-full">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl border-t-slate-700/50 flex flex-col h-[calc(100vh-6rem)] sticky top-8">
              {/* TABS HEADER */}
              <div className="flex bg-slate-950 p-2 gap-2 border-b border-slate-800">
                <button onClick={() => { setActiveTab('text'); setSelectedId('text'); }} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'text' ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}>
                  <Type className="w-4 h-4" /> 텍스트 디자인
                </button>
                <button onClick={() => setActiveTab('stickers')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'stickers' ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}>
                  <Sticker className="w-4 h-4" /> 스티커 & 기호
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-8">
                {activeTab === 'text' ? (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="space-y-3">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5"><CaseSensitive className="w-3.5 h-3.5 text-red-500" /> 폰트 스타일</label>
                      <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold outline-none" value={textSettings.fontFamily} onChange={(e) => setTextSettings({ ...textSettings, fontFamily: e.target.value })} style={{ fontFamily: textSettings.fontFamily }}>
                        {FONTS.map(f => <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">문구 편집 (Enter로 줄바꿈)</label>
                      <textarea className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold outline-none resize-none" value={textSettings.chars.map(c => c.char).join('')} onChange={(e) => {
                        const newText = e.target.value;
                        const newChars = newText.split('').map((char, i) => ({ char, color: textSettings.chars[i]?.color || activeColor }));
                        setTextSettings({ ...textSettings, chars: newChars });
                      }} />
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2"><MousePointer2 className="w-3 h-3 text-red-500" /> 글자별 색상 (클릭 시 현재 색상 적용)</label>
                      <div className="flex flex-wrap gap-2 p-3 bg-slate-950/50 rounded-2xl border border-slate-800/50 min-h-[60px]">
                        {textSettings.chars.map((c, i) => (
                          c.char === '\n' ? <div key={`br-${i}`} className="w-full h-1" /> : (
                            <button key={i} onClick={() => handleSelectChar(i)} className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-lg transition-all border-2 ${selectedCharIndex === i ? 'border-red-500 bg-red-600/10 text-white' : 'border-slate-800 bg-slate-900 text-slate-500'}`} style={{ color: selectedCharIndex === i ? undefined : c.color }}>{c.char}</button>
                          )
                        ))}
                      </div>
                    </div>

                    <div className="space-y-5 bg-slate-950/30 p-5 rounded-3xl border border-slate-800/50">
                      <ColorPicker label="브러쉬 & 텍스트 색상" color={activeColor} onChange={updateCharColor} />
                      <button onClick={() => updateAllCharsColor(activeColor)} className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">전체 글자 적용</button>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-slate-800">
                      <ColorPicker label="테두리 색상" color={textSettings.strokeColor} onChange={(c) => setTextSettings({...textSettings, strokeColor: c})} />
                      <div className="space-y-3">
                        <div className="flex justify-between items-center"><label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">글자 크기</label><span className="text-[10px] text-red-500 font-black">{textSettings.fontSize}px</span></div>
                        <input type="range" min="50" max="400" className="w-full accent-red-600" value={textSettings.fontSize} onChange={(e) => setTextSettings({...textSettings, fontSize: parseInt(e.target.value)})} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="space-y-4">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">기호 추가 (클릭하여 삽입)</label>
                      <div className="grid grid-cols-4 gap-3">
                        {STICKER_TYPES.map(type => (
                          <button key={type} onClick={() => addSticker(type)} className="aspect-square bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-3xl font-black text-white hover:border-red-500 hover:bg-slate-900 transition-all active:scale-90">
                            {type === 'arrow' ? '➡' : type === 'star' ? '★' : type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedId && selectedId !== 'text' && currentDecoration ? (
                      <div className="space-y-8 bg-slate-950/40 p-6 rounded-3xl border border-slate-800 animate-in slide-in-from-right-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-red-500 uppercase tracking-widest">스티커 편집 모드</span>
                          <button onClick={() => deleteDecoration(currentDecoration.id)} className="p-2 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>

                        <div className="space-y-6">
                           <ColorPicker label="스티커 색상" color={currentDecoration.color} onChange={(c) => { setActiveColor(c); updateSelectedDecoration({ color: c }); }} />
                           
                           <div className="space-y-4">
                              <div className="flex justify-between items-center"><label className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5"><Maximize2 className="w-3.5 h-3.5" /> 스티커 크기</label></div>
                              <input type="range" min="50" max="800" className="w-full accent-red-600" value={currentDecoration.size} onChange={(e) => updateSelectedDecoration({ size: parseInt(e.target.value) })} />
                           </div>

                           <div className="space-y-4">
                              <div className="flex justify-between items-center"><label className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5"><RotateCw className="w-3.5 h-3.5" /> 회전</label></div>
                              <input type="range" min="-180" max="180" className="w-full accent-red-600" value={currentDecoration.rotation} onChange={(e) => updateSelectedDecoration({ rotation: parseInt(e.target.value) })} />
                           </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 text-center space-y-3 opacity-50 border-2 border-dashed border-slate-800 rounded-3xl">
                        <MousePointer2 className="w-8 h-8 text-slate-700" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">편집할 스티커를<br/>화면에서 클릭하세요</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
