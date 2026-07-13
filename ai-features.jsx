// ai-features.jsx — AI Teaching Features (Intermediate focus)
// Exports all components to window

const { useState, useEffect, useRef, useCallback } = React;
const ORANGE = '#ff8000';

// ── AI hook ───────────────────────────────────────────────────────────────
function useAI() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const run = useCallback(async (prompt) => {
    setLoading(true); setResult(null);
    try {
      const text = await (window.claude?.complete(prompt) ?? Promise.resolve('AI not available in this context.'));
      setResult(text);
    } catch(e) { setResult('Unable to connect. Please try again.'); }
    setLoading(false);
  }, []);
  return { result, loading, run };
}

// ── Shared UI ─────────────────────────────────────────────────────────────
const AIPill = ({ label='AI' }) => (
  <span style={{
    display:'inline-flex', alignItems:'center', gap:3,
    padding:'2px 7px', borderRadius:10,
    background:'#fff3e0', border:'1px solid #ffcc80',
    fontSize:9, fontWeight:800, color:ORANGE, letterSpacing:'0.06em',
  }}>✦ {label}</span>
);

const AIBlock = ({ children, loading, compact }) => (
  <div style={{
    background:'#fff8f0', border:'1px solid #ffe0b2',
    borderRadius:10, padding: compact?'10px 12px':'14px 16px',
    position:'relative', marginTop:8,
  }}>
    <span style={{position:'absolute',top:8,right:10}}><AIPill/></span>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    {loading
      ? <div style={{display:'flex',alignItems:'center',gap:8,paddingRight:36}}>
          <span style={{fontSize:18,display:'inline-block',animation:'spin 1s linear infinite'}}>✦</span>
          <span style={{fontSize:12,color:'#aaa'}}>Thinking…</span>
        </div>
      : <div style={{fontSize:12,color:'#444',lineHeight:1.65,paddingRight:36,whiteSpace:'pre-wrap'}}>{children}</div>
    }
  </div>
);

// ── FEATURE 2: Daily Challenge ────────────────────────────────────────────
function DailyChallenge() {
  const [dismissed, setDismissed] = useState(false);
  const { result, loading, run } = useAI();

  useEffect(() => {
    const today = new Date().toDateString();
    const saved = JSON.parse(localStorage.getItem('cof-daily')||'{}');
    if (saved.date===today && saved.challenge) return;
    run(`Create a focused daily piano practice challenge for an intermediate student learning music theory. One specific thing to practice today in 10 minutes. Focus on key relationships, inversions, or modes. 2 sentences max. No markdown.`);
  }, []);

  useEffect(() => {
    if (result) {
      localStorage.setItem('cof-daily', JSON.stringify({date:new Date().toDateString(),challenge:result}));
    }
  }, [result]);

  const cached = JSON.parse(localStorage.getItem('cof-daily')||'{}').challenge;
  const text = result || cached;

  if (dismissed || (!text && !loading)) return null;
  return (
    <div style={{
      background:'#fff', border:`2px solid ${ORANGE}`, borderRadius:12,
      padding:'12px 14px', margin:'0 16px 16px',
      boxShadow:'0 2px 12px rgba(255,128,0,0.12)',
    }}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
        <AIPill label="DAILY CHALLENGE"/>
        <button onClick={()=>setDismissed(true)} style={{marginLeft:'auto',background:'none',border:'none',color:'#ccc',cursor:'pointer',fontSize:18,lineHeight:1}}>×</button>
      </div>
      {loading
        ? <p style={{fontSize:12,color:'#aaa'}}>Generating today's challenge… ✦</p>
        : <p style={{fontSize:12,color:'#444',lineHeight:1.55}}>{text}</p>
      }
    </div>
  );
}

// ── FEATURE 3: Quiz Modal (intermediate level) ────────────────────────────
function QuizModal({ onClose }) {
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const { result, loading, run } = useAI();

  const TOPICS = [
    'modal theory — the differences between Dorian, Phrygian, Lydian, Mixolydian and Aeolian, including their characteristic intervals',
    'circle of fifths relationships — which keys share key signatures and why dominant/tonic relationships matter',
    'relative major and minor keys — how to identify the relative key and what musical connection they share',
    'key signatures — how many sharps or flats a given major or minor key has and the pattern behind it',
    'diatonic chords — what chord quality appears on each scale degree in major and minor keys',
    'enharmonic equivalents — when two keys with different names contain the same pitches and why this matters',
    'the characteristic notes that define each mode — e.g. the raised 4th in Lydian, the flatted 7th in Mixolydian',
    'secondary dominants and how they create tension between related keys',
    'parallel vs relative modes — the difference between C Dorian and D Dorian',
  ];

  const generate = () => {
    setSelected(null); setQuestion(null);
    const topic = TOPICS[Math.floor(Math.random()*TOPICS.length)];
    run(`Create a challenging intermediate music theory question about: ${topic}.
The question should require genuine understanding of relationships, not just memorisation.
Return ONLY this format with NO extra text:
Q: [the question]
A: [correct answer]
B: [plausible wrong answer]
C: [plausible wrong answer]
D: [plausible wrong answer]
E: [explanation of why A is correct, why the others are wrong, and the underlying concept]`);
  };

  useEffect(() => { generate(); }, []);

  useEffect(() => {
    if (!result) return;
    const lines = result.split('\n').map(l=>l.trim()).filter(Boolean);
    const get = p => { const l=lines.find(x=>x.startsWith(p)); return l?l.slice(p.length).trim():''; };
    const q=get('Q:'),a=get('A:'),b=get('B:'),c=get('C:'),d=get('D:'),explanation=get('E:');
    if (q&&a) setQuestion({q,a,b,c,d,explanation});
  }, [result]);

  const opts = question ? [
    {key:'A',text:question.a,correct:true},
    {key:'B',text:question.b},
    {key:'C',text:question.c},
    {key:'D',text:question.d},
  ] : [];

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:16,padding:'22px',width:'100%',maxWidth:440,boxShadow:'0 20px 60px rgba(0,0,0,0.3)',maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
          <AIPill label="KEY RELATIONSHIPS QUIZ"/>
          <button onClick={onClose} style={{marginLeft:'auto',background:'none',border:'none',color:'#aaa',cursor:'pointer',fontSize:22}}>×</button>
        </div>
        {loading && <p style={{textAlign:'center',color:'#aaa',padding:'24px 0',fontSize:13}}>Generating question… ✦</p>}
        {question && !loading && (
          <>
            <div style={{background:'#f0ebe4',borderRadius:10,padding:'14px',marginBottom:14}}>
              <p style={{fontSize:14,fontWeight:600,color:'#1a1a1a',lineHeight:1.55}}>{question.q}</p>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:12}}>
              {opts.map(o => {
                const isSel=selected===o.key,show=selected!==null;
                let bg='#fff',border='#ddd',color='#333';
                if(show&&o.correct){bg='#e8f5e9';border='#4caf50';color='#2e7d32';}
                if(show&&isSel&&!o.correct){bg='#ffebee';border='#ef5350';color='#c62828';}
                return (
                  <button key={o.key} onClick={()=>!selected&&setSelected(o.key)} style={{
                    padding:'10px 14px',borderRadius:8,border:`1.5px solid ${border}`,
                    background:bg,color,fontSize:13,fontWeight:600,cursor:selected?'default':'pointer',
                    textAlign:'left',display:'flex',alignItems:'center',gap:10,
                  }}>
                    <span style={{width:24,height:24,borderRadius:'50%',background:show&&o.correct?'#4caf50':show&&isSel?'#ef5350':ORANGE,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>{o.key}</span>
                    {o.text}
                    {show&&o.correct&&<span style={{marginLeft:'auto'}}>✓</span>}
                    {show&&isSel&&!o.correct&&<span style={{marginLeft:'auto'}}>✗</span>}
                  </button>
                );
              })}
            </div>
            {selected && <AIBlock compact>{(selected==='A'?'✓ Correct! ':'✗ Not quite. ')+question.explanation}</AIBlock>}
            <button onClick={generate} style={{width:'100%',marginTop:12,padding:'10px',borderRadius:8,background:'#f5f5f5',border:'1.5px solid #ddd',color:'#555',fontSize:12,fontWeight:700,cursor:'pointer'}}>
              Next Question →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── FEATURE 9: Song Decoder Modal ─────────────────────────────────────────
function SongDecoderModal({ onClose }) {
  const [song, setSong] = useState('');
  const [parsed, setParsed] = useState(null);
  const { result, loading, run } = useAI();

  const search = () => {
    if (!song.trim()) return; setParsed(null);
    run(`What key is "${song}" in? Return ONLY:
KEY: [key name e.g. C Major or A Minor]
CHORDS: [comma-separated main chord names]
PROGRESSION: [Roman numeral progression e.g. I-V-vi-IV]
FEEL: [one sentence on the emotional character of the progression]`);
  };

  useEffect(() => {
    if (!result) return;
    const lines=result.split('\n');
    const get=p=>{const l=lines.find(x=>x.startsWith(p));return l?l.slice(p.length).trim():''};
    setParsed({key:get('KEY:'),chords:get('CHORDS:').split(',').map(s=>s.trim()).filter(Boolean),progression:get('PROGRESSION:'),feel:get('FEEL:')});
  }, [result]);

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:16,padding:'22px',width:'100%',maxWidth:420,boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
          <AIPill label="SONG DECODER"/>
          <button onClick={onClose} style={{marginLeft:'auto',background:'none',border:'none',color:'#aaa',cursor:'pointer',fontSize:22}}>×</button>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:14}}>
          <input value={song} onChange={e=>setSong(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()}
            placeholder="Song title + artist…"
            style={{flex:1,padding:'9px 12px',borderRadius:8,border:'1.5px solid #ddd',fontSize:13,fontFamily:'inherit'}}/>
          <button onClick={search} style={{padding:'9px 16px',borderRadius:8,background:ORANGE,border:'none',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>Go</button>
        </div>
        {loading && <p style={{textAlign:'center',color:'#aaa',padding:'16px 0'}}>Analysing… ✦</p>}
        {parsed && !loading && (
          <div>
            <AIBlock compact>
              <strong>Key: {parsed.key}</strong>
              {parsed.progression && <><br/><strong>Progression:</strong> {parsed.progression}</>}
              {parsed.feel && <><br/><br/>{parsed.feel}</>}
            </AIBlock>
            {parsed.chords.length>0 && (
              <div style={{marginTop:12}}>
                <p style={{fontSize:10,color:'#aaa',marginBottom:8,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase'}}>Chords used</p>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {parsed.chords.map((c,i)=>(
                    <span key={i} style={{padding:'5px 12px',borderRadius:6,background:'#fff3e0',border:`1px solid ${ORANGE}`,fontSize:13,fontWeight:700,color:ORANGE}}>{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── FEATURE 6: Chord Progressions ────────────────────────────────────────
function ProgressionPanel({ keyDisplay, isMinor }) {
  const { result, loading, run } = useAI();
  const [loaded, setLoaded] = useState(false);

  const load = () => {
    if (loaded) return; setLoaded(true);
    run(`List 4 chord progressions for ${keyDisplay} ${isMinor?'minor':'major'} with increasing sophistication. For each use ONLY this exact format (one per line, pipe-separated):
[Roman numerals] | [Chord names] | [Style/Feel] | [Famous song example]`);
  };

  const progressions = result ? result.split('\n').filter(l=>l.includes('|')).map(l=>{
    const [roman,chords,feel,song]=l.split('|').map(s=>s.trim());
    return {roman,chords,feel,song};
  }) : [];

  return (
    <div style={{marginBottom:20}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
        <span style={{fontSize:13,fontWeight:700,color:'#1a1a1a'}}>Chord Progressions</span>
        <AIPill/>
        {!loaded && <button onClick={load} style={{marginLeft:'auto',padding:'4px 10px',borderRadius:6,border:`1px solid ${ORANGE}`,background:'#fff8f0',color:ORANGE,fontSize:11,fontWeight:700,cursor:'pointer'}}>Generate ✦</button>}
      </div>
      {loading && <p style={{fontSize:12,color:'#aaa',padding:'8px 0'}}>Generating… ✦</p>}
      {progressions.map((p,i)=>(
        <div key={i} style={{background:'#fff',border:'1px solid #ffe0b2',borderRadius:8,padding:'10px 12px',marginBottom:8}}>
          <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:4}}>
            <span style={{fontSize:10,fontWeight:700,color:'#fff',background:ORANGE,padding:'1px 7px',borderRadius:4}}>{p.roman}</span>
            <span style={{fontSize:11,color:'#888',fontStyle:'italic'}}>{p.feel}</span>
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:4}}>
            {(p.chords||'').split(/[,\s–-]+/).filter(Boolean).map((c,j)=>(
              <span key={j} style={{padding:'2px 9px',borderRadius:4,background:'#f5f5f5',border:'1px solid #ddd',fontSize:12,fontWeight:700,color:'#333'}}>{c}</span>
            ))}
          </div>
          {p.song && <p style={{fontSize:11,color:'#aaa',fontStyle:'italic'}}>🎵 {p.song}</p>}
        </div>
      ))}
    </div>
  );
}

// ── FEATURE 7: Harmony Analyser ───────────────────────────────────────────
function HarmonyAnalyser({ keyDisplay, isMinor }) {
  const [chord1,setChord1]=useState('');
  const [chord2,setChord2]=useState('');
  const { result, loading, run } = useAI();

  const analyse = () => {
    if (!chord1||!chord2) return;
    run(`Explain the harmonic relationship between ${chord1} and ${chord2} in the context of ${keyDisplay} ${isMinor?'minor':'major'}. Address: shared notes, voice leading, harmonic function, and why composers use this pairing. 3-4 sentences for an intermediate musician. No markdown.`);
  };

  return (
    <div style={{marginBottom:20}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
        <span style={{fontSize:13,fontWeight:700,color:'#1a1a1a'}}>Harmonic Relationships</span>
        <AIPill/>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:8}}>
        <input value={chord1} onChange={e=>setChord1(e.target.value)} placeholder="e.g. C Major"
          style={{flex:1,padding:'8px 10px',borderRadius:7,border:'1.5px solid #ddd',fontSize:12,fontFamily:'inherit'}}/>
        <span style={{display:'flex',alignItems:'center',color:'#aaa',fontWeight:700,fontSize:16}}>↔</span>
        <input value={chord2} onChange={e=>setChord2(e.target.value)} placeholder="e.g. Am"
          style={{flex:1,padding:'8px 10px',borderRadius:7,border:'1.5px solid #ddd',fontSize:12,fontFamily:'inherit'}}/>
        <button onClick={analyse} style={{padding:'8px 12px',borderRadius:7,background:ORANGE,border:'none',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>✦</button>
      </div>
      {(loading||result) && <AIBlock loading={loading} compact>{result}</AIBlock>}
    </div>
  );
}

// ── FEATURE 8: Practice Path ──────────────────────────────────────────────
function PracticePathPanel({ currentKey, isMinor }) {
  const { result, loading, run } = useAI();
  const [loaded, setLoaded] = useState(false);
  const [steps, setSteps] = useState([]);

  const load = () => {
    if (loaded) return; setLoaded(true);
    const visited = JSON.parse(localStorage.getItem('cof-visited')||'[]');
    const keyStr = visited.length>0 ? visited.slice(-6).join(', ') : `${currentKey} ${isMinor?'minor':'major'}`;
    run(`Create a 5-step practice path focused on key relationships and modal theory for someone who has studied: ${keyStr}. Current focus: ${currentKey} ${isMinor?'minor':'major'}. Each step should build musical understanding, not just technical exercises. Number 1-5, one line each, no extra text.`);
  };

  useEffect(() => {
    if (!result) return;
    setSteps(result.split('\n').filter(l=>/^\d/.test(l.trim())).map((l,i)=>({id:i+1,text:l.replace(/^\d+[\.\)]\s*/,'').trim(),done:false})));
  }, [result]);

  useEffect(() => {
    const key=`${currentKey} ${isMinor?'minor':'major'}`;
    const visited=JSON.parse(localStorage.getItem('cof-visited')||'[]');
    if (!visited.includes(key)) localStorage.setItem('cof-visited',JSON.stringify([...visited,key].slice(-20)));
  }, [currentKey,isMinor]);

  const toggle=id=>setSteps(s=>s.map(x=>x.id===id?{...x,done:!x.done}:x));

  return (
    <div style={{marginBottom:20}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
        <span style={{fontSize:13,fontWeight:700,color:'#1a1a1a'}}>Practice Path</span>
        <AIPill/>
        {!loaded&&<button onClick={load} style={{marginLeft:'auto',padding:'4px 10px',borderRadius:6,border:`1px solid ${ORANGE}`,background:'#fff8f0',color:ORANGE,fontSize:11,fontWeight:700,cursor:'pointer'}}>Generate ✦</button>}
      </div>
      {loading&&<p style={{fontSize:12,color:'#aaa'}}>Building your path… ✦</p>}
      {steps.map((s,i)=>(
        <div key={s.id} onClick={()=>toggle(s.id)} style={{display:'flex',gap:10,alignItems:'flex-start',marginBottom:8,cursor:'pointer',opacity:s.done?0.45:1}}>
          <div style={{width:24,height:24,borderRadius:'50%',flexShrink:0,marginTop:1,background:s.done?'#4caf50':i===steps.findIndex(x=>!x.done)?ORANGE:'#e0e0e0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',transition:'all 0.2s'}}>{s.done?'✓':s.id}</div>
          <p style={{fontSize:12,color:s.done?'#aaa':'#333',lineHeight:1.5,marginTop:3}}>{s.text}</p>
        </div>
      ))}
    </div>
  );
}

// ── FEATURE 11: Key Relationships (bullet point format) ──────────────────
function KeyJourneyPanel({ keyDisplay, isMinor, relativeKey }) {
  const { result, loading, run } = useAI();
  const [loaded, setLoaded] = useState(false);
  const [points, setPoints] = useState([]);
  const [checked, setChecked] = useState({});

  const load = () => {
    if (loaded) return; setLoaded(true);
    const rel = relativeKey ? `${relativeKey.display} ${isMinor?'major':'minor'}` : '';
    run(`Give exactly 6 key relationship insights for ${keyDisplay} ${isMinor?'minor':'major'}${rel?' (relative: '+rel+')':''}.
Each insight should be a short actionable fact a musician can internalise — covering: relative key, neighbouring keys on the CoF, shared chords, common modulations, characteristic chord borrowed from parallel key, and one practical tip.
Return ONLY a numbered list 1-6, one insight per line, no extra text, no markdown.`);
  };

  useEffect(() => {
    if (!result) return;
    const parsed = result.split('\n')
      .filter(l => /^\d/.test(l.trim()))
      .map((l, i) => ({ id: i, text: l.replace(/^\d+[\.\)]\s*/, '').trim() }));
    setPoints(parsed);
  }, [result]);

  const toggle = id => setChecked(c => ({ ...c, [id]: !c[id] }));
  const done = points.length > 0 ? points.filter(p => checked[p.id]).length : 0;

  return (
    <div style={{marginBottom:20}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
        <span style={{fontSize:13,fontWeight:700,color:'#1a1a1a'}}>Key Relationships</span>
        <AIPill/>
        {points.length > 0 && (
          <span style={{fontSize:11,color:'#aaa',marginLeft:4}}>{done}/{points.length}</span>
        )}
        {!loaded && (
          <button onClick={load} style={{marginLeft:'auto',padding:'4px 10px',borderRadius:6,
            border:`1px solid ${ORANGE}`,background:'#fff8f0',
            color:ORANGE,fontSize:11,fontWeight:700,cursor:'pointer'}}>
            Explore ✦
          </button>
        )}
      </div>
      {loading && (
        <p style={{fontSize:12,color:'#aaa',padding:'6px 0'}}>Analysing key relationships… ✦</p>
      )}
      {points.map((p, i) => (
        <div key={p.id} onClick={() => toggle(p.id)} style={{
          display:'flex', gap:10, alignItems:'flex-start',
          marginBottom:8, cursor:'pointer',
          opacity: checked[p.id] ? 0.45 : 1, transition:'opacity 0.2s',
        }}>
          <div style={{
            width:24, height:24, borderRadius:'50%', flexShrink:0, marginTop:1,
            background: checked[p.id] ? '#4caf50'
              : i === points.findIndex(x => !checked[x.id]) ? ORANGE
              : '#e0e0e0',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:11, fontWeight:700, color:'#fff', transition:'background 0.2s',
          }}>
            {checked[p.id] ? '✓' : i + 1}
          </div>
          <p style={{
            fontSize:12, color: checked[p.id] ? '#aaa' : '#333',
            lineHeight:1.55, marginTop:3,
          }}>{p.text}</p>
        </div>
      ))}
      {points.length > 0 && done === points.length && (
        <div style={{
          background:'#e8f5e9', border:'1px solid #4caf50',
          borderRadius:8, padding:'8px 12px', marginTop:4,
          fontSize:12, color:'#2e7d32', fontWeight:600,
        }}>
          ✓ All {points.length} relationships internalised!
        </div>
      )}
    </div>
  );
}

// ── Combined AI Tab ───────────────────────────────────────────────────────
function AITabContent({ keyObj, isMinor, relativeKey }) {
  const divider = <div style={{height:1,background:'#f0ebe4',margin:'4px 0 20px'}}/>;
  return (
    <div style={{padding:'20px 16px 60px',maxWidth:760,margin:'0 auto'}}>
      <ProgressionPanel keyDisplay={keyObj.display} isMinor={isMinor}/>
      {divider}
      <HarmonyAnalyser keyDisplay={keyObj.display} isMinor={isMinor}/>
      {divider}
      <PracticePathPanel currentKey={keyObj.display} isMinor={isMinor}/>
      {divider}
      <KeyJourneyPanel keyDisplay={keyObj.display} isMinor={isMinor} relativeKey={relativeKey}/>
    </div>
  );
}

// ── Global floating toolbar ───────────────────────────────────────────────
function AIFloatingBar({ onQuiz, onSong }) {
  return (
    <div style={{position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',display:'flex',gap:10,zIndex:500,background:'#fff',border:'1.5px solid #ffe0b2',borderRadius:30,padding:'8px 16px',boxShadow:'0 4px 20px rgba(255,128,0,0.18)',whiteSpace:'nowrap'}}>
      <button onClick={onQuiz} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:20,background:'#fff8f0',border:`1px solid ${ORANGE}`,color:ORANGE,fontSize:12,fontWeight:700,cursor:'pointer'}}>🎵 Key Quiz</button>
      <button onClick={onSong} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:20,background:'#fff8f0',border:`1px solid ${ORANGE}`,color:ORANGE,fontSize:12,fontWeight:700,cursor:'pointer'}}>🔍 Song Decoder</button>
    </div>
  );
}

Object.assign(window, {
  useAI, AIPill, AIBlock,
  DailyChallenge, QuizModal, SongDecoderModal,
  ProgressionPanel, HarmonyAnalyser, PracticePathPanel, KeyJourneyPanel,
  AITabContent, AIFloatingBar,
});
