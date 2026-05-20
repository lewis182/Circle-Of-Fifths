// ai-features.jsx — AI Teaching Features
// Exports all components to window

const { useState, useEffect, useRef, useCallback } = React;
const ORANGE = '#ff8000';

// ── API Key helpers ───────────────────────────────────────────────────────
const getApiKey      = () => localStorage.getItem('cof-api-key') || '';
const saveApiKey     = (k) => localStorage.setItem('cof-api-key', k.trim());
const getProvider    = () => localStorage.getItem('cof-provider') || 'anthropic';
const saveProvider   = (p) => localStorage.setItem('cof-provider', p);
const getModel       = () => localStorage.getItem('cof-model') || '';
const saveModel      = (m) => localStorage.setItem('cof-model', m);

const PROVIDERS = {
  anthropic: {
    label: 'Anthropic',
    url: 'https://api.anthropic.com/v1/messages',
    models: [
      { id: 'claude-haiku-4-5',             label: 'Claude Haiku 4.5 (fast)' },
      { id: 'claude-sonnet-4-5',            label: 'Claude Sonnet 4.5' },
      { id: 'claude-3-5-haiku-20241022',    label: 'Claude 3.5 Haiku' },
      { id: 'claude-3-5-sonnet-20241022',   label: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-7-sonnet-20250219',   label: 'Claude 3.7 Sonnet' },
      { id: 'claude-3-opus-20240229',       label: 'Claude 3 Opus' },
    ],
    default: 'claude-haiku-4-5',
    placeholder: 'sk-ant-…',
  },
  openrouter: {
    label: 'OpenRouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    models: [
      { id: 'anthropic/claude-haiku-4-5',              label: 'Claude Haiku 4.5' },
      { id: 'anthropic/claude-sonnet-4-5',             label: 'Claude Sonnet 4.5' },
      { id: 'anthropic/claude-3.5-sonnet',             label: 'Claude 3.5 Sonnet' },
      { id: 'anthropic/claude-3.7-sonnet',             label: 'Claude 3.7 Sonnet' },
      { id: 'openai/gpt-4o-mini',                      label: 'GPT-4o Mini (fast)' },
      { id: 'openai/gpt-4o',                           label: 'GPT-4o' },
      { id: 'openai/o4-mini',                          label: 'o4-mini' },
      { id: 'openai/gpt-4.5-preview',                  label: 'GPT-4.5 Preview' },
      { id: 'google/gemini-flash-1.5',                 label: 'Gemini Flash 1.5' },
      { id: 'google/gemini-pro-1.5',                   label: 'Gemini Pro 1.5' },
      { id: 'google/gemini-2.0-flash-001',             label: 'Gemini 2.0 Flash' },
      { id: 'google/gemini-2.5-pro-preview-03-25',     label: 'Gemini 2.5 Pro' },
      { id: 'meta-llama/llama-3.1-8b-instruct',        label: 'Llama 3.1 8B (free)' },
      { id: 'meta-llama/llama-3.3-70b-instruct',       label: 'Llama 3.3 70B' },
      { id: 'mistralai/mistral-7b-instruct',           label: 'Mistral 7B (free)' },
      { id: 'mistralai/mistral-small-3.1-24b-instruct',label: 'Mistral Small 3.1' },
    ],
    default: 'anthropic/claude-haiku-4-5',
    placeholder: 'sk-or-…',
  },
};

async function callClaude(prompt) {
  // Try built-in window.claude first (works in hosted editor)
  if (window.claude?.complete) {
    return await window.claude.complete(prompt);
  }

  const key = getApiKey();
  if (!key) throw new Error('NO_KEY');

  const provider = getProvider();
  const cfg = PROVIDERS[provider];
  const model = getModel() || cfg.default;

  if (provider === 'anthropic') {
    const res = await fetch(cfg.url, {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e.error?.message||`API error ${res.status}`); }
    const data = await res.json();
    return data.content?.[0]?.text || '';
  }

  // OpenRouter — OpenAI-compatible format
  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'content-type': 'application/json',
      'HTTP-Referer': window.location.href,
      'X-Title': 'Circle of Fifths App',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e.error?.message||`API error ${res.status}`); }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── API Settings Modal ────────────────────────────────────────────────────
function APIKeyModal({ onClose }) {
  const [provider, setProvider] = useState(getProvider());
  const [key, setKey]           = useState(getApiKey());
  const [model, setModel]       = useState(getModel() || PROVIDERS[getProvider()].default);
  const [saved, setSaved]       = useState(false);
  const [testing, setTesting]   = useState(false);
  const [testMsg, setTestMsg]   = useState('');

  const cfg = PROVIDERS[provider];

  // When provider changes, reset model to that provider's default
  const handleProvider = (p) => {
    setProvider(p);
    setModel(PROVIDERS[p].default);
    setTestMsg('');
  };

  const save = () => {
    saveApiKey(key); saveProvider(provider); saveModel(model);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  };

  const test = async () => {
    if (!key) { setTestMsg('⚠ Enter a key first'); return; }
    setTesting(true); setTestMsg('');
    saveApiKey(key); saveProvider(provider); saveModel(model);
    try {
      const text = await callClaude('Reply with exactly: OK');
      setTestMsg(text.trim().includes('OK') ? '✓ Connection successful!' : '✓ Connected: ' + text.slice(0,40));
    } catch(e) {
      setTestMsg('✗ ' + e.message);
    }
    setTesting(false);
  };

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:16,padding:'24px',width:'100%',maxWidth:420,boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
          <span style={{fontSize:20}}>🔑</span>
          <strong style={{fontSize:16,color:'#1a1a1a'}}>AI Settings</strong>
          <button onClick={onClose} style={{marginLeft:'auto',background:'none',border:'none',color:'#aaa',cursor:'pointer',fontSize:22}}>×</button>
        </div>

        {/* Provider toggle */}
        <p style={{fontSize:11,color:'#aaa',marginBottom:6,fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase'}}>Provider</p>
        <div style={{display:'flex',gap:8,marginBottom:14}}>
          {Object.entries(PROVIDERS).map(([id,p])=>(
            <button key={id} onClick={()=>handleProvider(id)} style={{
              flex:1,padding:'8px',borderRadius:8,
              border:`2px solid ${provider===id?ORANGE:'#ddd'}`,
              background:provider===id?'#fff8f0':'#fafafa',
              color:provider===id?ORANGE:'#888',
              fontSize:12,fontWeight:700,cursor:'pointer',
            }}>{p.label}</button>
          ))}
        </div>

        {/* Model selector */}
        <p style={{fontSize:11,color:'#aaa',marginBottom:6,fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase'}}>Model</p>
        <select value={model} onChange={e=>setModel(e.target.value)} style={{
          width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid #ddd',
          fontSize:13,fontFamily:'inherit',marginBottom:14,background:'#fff',color:'#333',
        }}>
          {cfg.models.map(m=>(
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>

        {/* API Key */}
        <p style={{fontSize:11,color:'#aaa',marginBottom:6,fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase'}}>API Key</p>
        <input type="password" value={key} onChange={e=>setKey(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&save()}
          placeholder={cfg.placeholder}
          style={{width:'100%',padding:'10px 12px',borderRadius:8,border:'1.5px solid #ddd',fontSize:13,fontFamily:'monospace',marginBottom:8}}
        />
        <p style={{fontSize:10,color:'#ccc',marginBottom:14}}>
          {provider==='anthropic'
            ? <>Get a key at <strong>console.anthropic.com</strong></>
            : <>Get a key at <strong>openrouter.ai/keys</strong> — many free models available</>
          }
        </p>

        {/* Test result */}
        {testMsg && (
          <p style={{fontSize:12,marginBottom:10,padding:'6px 10px',borderRadius:6,
            background:testMsg.startsWith('✓')?'#e8f5e9':'#ffebee',
            color:testMsg.startsWith('✓')?'#2e7d32':'#c62828',fontWeight:600}}>
            {testMsg}
          </p>
        )}

        <div style={{display:'flex',gap:8}}>
          <button onClick={test} disabled={testing} style={{
            padding:'10px 14px',borderRadius:8,background:'#f5f5f5',
            border:'1.5px solid #ddd',color:'#555',fontSize:12,fontWeight:700,cursor:'pointer',
          }}>{testing?'Testing…':'Test'}</button>
          <button onClick={save} style={{
            flex:1,padding:'10px',borderRadius:8,
            background:saved?'#4caf50':ORANGE,
            border:'none',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',transition:'background 0.2s',
          }}>{saved?'✓ Saved!':'Save'}</button>
          {key && <button onClick={()=>{saveApiKey('');setKey('');}} style={{
            padding:'10px 14px',borderRadius:8,background:'#fff',
            border:'1.5px solid #ddd',color:'#bbb',fontSize:12,cursor:'pointer',
          }}>Clear</button>}
        </div>
      </div>
    </div>
  );
}

// ── AI hook ───────────────────────────────────────────────────────────────
function useAI() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);

  const run = useCallback(async (prompt) => {
    setLoading(true); setResult(null); setNeedsKey(false);
    try {
      const text = await callClaude(prompt);
      setResult(text);
    } catch(e) {
      if (e.message === 'NO_KEY') {
        setNeedsKey(true);
        setResult(null);
      } else {
        setResult('Error: ' + e.message);
      }
    }
    setLoading(false);
  }, []);

  return { result, loading, needsKey, run };
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

const AIBlock = ({ children, loading, compact, needsKey, onSetKey }) => (
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
      : needsKey
        ? <div style={{paddingRight:36}}>
            <p style={{fontSize:12,color:'#888',marginBottom:8}}>An API key is required for AI features when running outside the editor.</p>
            <button onClick={onSetKey} style={{padding:'6px 14px',borderRadius:7,background:ORANGE,border:'none',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>🔑 Set API Key</button>
          </div>
        : <div style={{fontSize:12,color:'#444',lineHeight:1.65,paddingRight:36,whiteSpace:'pre-wrap'}}>{children}</div>
    }
  </div>
);

// ── FEATURE 2: Daily Challenge ────────────────────────────────────────────
function DailyChallenge() {
  const [dismissed, setDismissed] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const { result, loading, needsKey, run } = useAI();

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

  if (dismissed || (!text && !loading && !needsKey)) return null;
  return (
    <div style={{background:'#fff',border:`2px solid ${ORANGE}`,borderRadius:12,padding:'12px 14px',margin:'0 16px 16px',boxShadow:'0 2px 12px rgba(255,128,0,0.12)'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
        <AIPill label="DAILY CHALLENGE"/>
        <button onClick={()=>setDismissed(true)} style={{marginLeft:'auto',background:'none',border:'none',color:'#ccc',cursor:'pointer',fontSize:18,lineHeight:1}}>×</button>
      </div>
      {loading ? <p style={{fontSize:12,color:'#aaa'}}>Generating today's challenge… ✦</p>
        : needsKey ? <div style={{display:'flex',alignItems:'center',gap:10}}>
            <p style={{fontSize:12,color:'#aaa',flex:1}}>Set an API key to enable AI features.</p>
            <button onClick={()=>setShowKey(true)} style={{padding:'5px 10px',borderRadius:6,background:ORANGE,border:'none',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>🔑 Key</button>
          </div>
        : <p style={{fontSize:12,color:'#444',lineHeight:1.55}}>{text}</p>
      }
      {showKey && <APIKeyModal onClose={()=>setShowKey(false)}/>}
    </div>
  );
}

// ── FEATURE 3: Quiz Modal (intermediate level) ────────────────────────────
function QuizModal({ onClose }) {
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showKey, setShowKey] = useState(false);
  const { result, loading, needsKey, run } = useAI();

  const TOPICS = [
    'naming the notes of a major scale in keys with up to three sharps or flats (e.g. what are the notes of D major? G major? F major?)',
    'major key signatures with up to three sharps or flats — which sharps or flats belong to which key (e.g. how many sharps in A major? what flats are in E♭ major?)',
    'identifying the tonic, dominant, and subdominant note in a given major key',
    'the relative minor of a major key (and vice versa) — how to find it from the key signature',
    'building a simple major triad on a given root (e.g. what are the three notes of G major triad?)',
    'the pattern of whole and half steps in a major scale (W-W-H-W-W-W-H) and using it to spell a scale',
    'identifying simple intervals within a major scale — 2nd, 3rd, 4th, 5th, 6th, 7th, octave (number only, not yet quality)',
    'reading basic note names on the treble or bass clef within a given key',
    'sharps and flats — how they raise or lower a note by a semitone, and naming sharpened or flattened notes',
    'the order of sharps (F C G D A E B) and the order of flats (B E A D G C F) as they appear in key signatures',
  ];

  const generate = () => {
    setSelected(null); setQuestion(null);
    const topic = TOPICS[Math.floor(Math.random()*TOPICS.length)];
    run(`Create a Grade 1–2 standard music theory question (ABRSM / Trinity level — for beginners learning their first major scales, key signatures, and intervals) about: ${topic}.
Keep the question concrete and factual — a single right answer, not a relationship/comparison question. Use everyday musical language, avoid jargon like "tonicization", "modal interchange", "secondary dominant", "enharmonic", "diatonic" etc.
Return ONLY this format with NO extra text:
Q: [the question — one sentence]
A: [correct answer — short, often just a note name or number]
B: [plausible wrong answer at the same level]
C: [plausible wrong answer at the same level]
D: [plausible wrong answer at the same level]
E: [a one-sentence explanation a beginner can understand — no jargon]`);
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
          <AIPill label="MUSIC THEORY QUIZ"/>
          <button onClick={onClose} style={{marginLeft:'auto',background:'none',border:'none',color:'#aaa',cursor:'pointer',fontSize:22}}>×</button>
        </div>
        {showKey && <APIKeyModal onClose={()=>setShowKey(false)}/>}
        {needsKey && <div style={{textAlign:'center',padding:'20px 0'}}><p style={{fontSize:13,color:'#aaa',marginBottom:12}}>An API key is needed to generate quiz questions.</p><button onClick={()=>setShowKey(true)} style={{padding:'8px 18px',borderRadius:8,background:ORANGE,border:'none',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>🔑 Set API Key</button></div>}
        {loading && !needsKey && <p style={{textAlign:'center',color:'#aaa',padding:'24px 0',fontSize:13}}>Generating question… ✦</p>}
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
            {selected && <AIBlock compact needsKey={false}>{(selected==='A'?'✓ Correct! ':'✗ Not quite. ')+question.explanation}</AIBlock>}
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
  const [showKey, setShowKey] = useState(false);
  const { result, loading, needsKey, run } = useAI();

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
        {showKey && <APIKeyModal onClose={()=>setShowKey(false)}/>}
        {needsKey && <div style={{textAlign:'center',padding:'12px 0'}}><button onClick={()=>setShowKey(true)} style={{padding:'7px 16px',borderRadius:7,background:ORANGE,border:'none',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>🔑 Set API Key to continue</button></div>}
        {loading && !needsKey && <p style={{textAlign:'center',color:'#aaa',padding:'16px 0'}}>Analysing… ✦</p>}
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
  const { result, loading, needsKey, run } = useAI();
  const [loaded, setLoaded] = useState(false);
  const [showKey, setShowKey] = useState(false);

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
      {showKey && <APIKeyModal onClose={()=>setShowKey(false)}/>}
      {needsKey && <div style={{padding:'8px 0',display:'flex',alignItems:'center',gap:8}}><p style={{fontSize:12,color:'#aaa',flex:1}}>API key needed.</p><button onClick={()=>setShowKey(true)} style={{padding:'4px 10px',borderRadius:6,background:ORANGE,border:'none',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>🔑 Set Key</button></div>}
      {loading && !needsKey && <p style={{fontSize:12,color:'#aaa',padding:'8px 0'}}>Generating… ✦</p>}
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
  const [showKey, setShowKey] = useState(false);
  const { result, loading, needsKey, run } = useAI();

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
      {showKey && <APIKeyModal onClose={()=>setShowKey(false)}/>}
      {needsKey && <div style={{padding:'8px 0',display:'flex',gap:8,alignItems:'center'}}><p style={{fontSize:12,color:'#aaa',flex:1}}>API key needed.</p><button onClick={()=>setShowKey(true)} style={{padding:'4px 10px',borderRadius:6,background:ORANGE,border:'none',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>🔑 Set Key</button></div>}
      {(loading||result) && !needsKey && <AIBlock loading={loading} compact needsKey={false}>{result}</AIBlock>}
    </div>
  );
}

// ── FEATURE 8: Practice Path ──────────────────────────────────────────────
function PracticePathPanel({ currentKey, isMinor }) {
  const { result, loading, needsKey, run } = useAI();
  const [loaded, setLoaded] = useState(false);
  const [steps, setSteps] = useState([]);
  const [showKey, setShowKey] = useState(false);

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
      {showKey && <APIKeyModal onClose={()=>setShowKey(false)}/>}
      {needsKey && <div style={{padding:'8px 0',display:'flex',gap:8,alignItems:'center'}}><p style={{fontSize:12,color:'#aaa',flex:1}}>API key needed.</p><button onClick={()=>setShowKey(true)} style={{padding:'4px 10px',borderRadius:6,background:ORANGE,border:'none',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>🔑 Set Key</button></div>}
      {loading && !needsKey &&<p style={{fontSize:12,color:'#aaa'}}>Building your path… ✦</p>}
      {steps.map((s,i)=>(
        <div key={s.id} onClick={()=>toggle(s.id)} style={{display:'flex',gap:10,alignItems:'flex-start',marginBottom:8,cursor:'pointer',opacity:s.done?0.45:1}}>
          <div style={{width:24,height:24,borderRadius:'50%',flexShrink:0,marginTop:1,background:s.done?'#4caf50':i===steps.findIndex(x=>!x.done)?ORANGE:'#e0e0e0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',transition:'all 0.2s'}}>{s.done?'✓':s.id}</div>
          <p style={{fontSize:12,color:s.done?'#aaa':'#333',lineHeight:1.5,marginTop:3}}>{s.text}</p>
        </div>
      ))}
    </div>
  );
}

// ── FEATURE 11: Key Relationships ────────────────────────────────────────
function KeyJourneyPanel({ keyDisplay, isMinor, relativeKey }) {
  const { result, loading, needsKey, run } = useAI();
  const [loaded, setLoaded] = useState(false);
  const [points, setPoints] = useState([]);
  const [checked, setChecked] = useState({});
  const [showKey, setShowKey] = useState(false);

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
      {showKey && <APIKeyModal onClose={()=>setShowKey(false)}/>}
      {needsKey && <div style={{padding:'8px 0',display:'flex',gap:8,alignItems:'center'}}><p style={{fontSize:12,color:'#aaa',flex:1}}>API key needed.</p><button onClick={()=>setShowKey(true)} style={{padding:'4px 10px',borderRadius:6,background:ORANGE,border:'none',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>🔑 Set Key</button></div>}
      {loading && !needsKey && (
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
      <HarmonyAnalyser keyDisplay={keyObj.display} isMinor={isMinor}/>
      {divider}
      <PracticePathPanel currentKey={keyObj.display} isMinor={isMinor}/>
      {divider}
      <KeyJourneyPanel keyDisplay={keyObj.display} isMinor={isMinor} relativeKey={relativeKey}/>
    </div>
  );
}

// ── Global floating toolbar ───────────────────────────────────────────────
function AIFloatingBar({ onQuiz, onSong, onKey }) {
  const hasKey = !!getApiKey() || !!window.claude;
  return (
    <div style={{position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',display:'flex',gap:8,zIndex:500,background:'#fff',border:'1.5px solid #ffe0b2',borderRadius:30,padding:'8px 14px',boxShadow:'0 4px 20px rgba(255,128,0,0.18)',whiteSpace:'nowrap'}}>
      <button onClick={onQuiz} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:20,background:'#fff8f0',border:`1px solid ${ORANGE}`,color:ORANGE,fontSize:12,fontWeight:700,cursor:'pointer'}}>🎵 Key Quiz</button>
      <button onClick={onSong} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:20,background:'#fff8f0',border:`1px solid ${ORANGE}`,color:ORANGE,fontSize:12,fontWeight:700,cursor:'pointer'}}>🔍 Song Decoder</button>
      <a href="score-analyser.html" style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:20,background:ORANGE,border:`1px solid ${ORANGE}`,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',textDecoration:'none'}} title="Upload a score, get full chord analysis">📄 Score Analyser</a>
      <button onClick={onKey} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 10px',borderRadius:20,background: hasKey?'#e8f5e9':'#fff8f0',border:`1px solid ${hasKey?'#4caf50':ORANGE}`,color:hasKey?'#2e7d32':ORANGE,fontSize:12,fontWeight:700,cursor:'pointer'}} title={hasKey?'API key saved':'Set API key for AI features'}>
        🔑{hasKey ? ' ✓' : ''}
      </button>
    </div>
  );
}

Object.assign(window, {
  useAI, AIPill, AIBlock, APIKeyModal,
  DailyChallenge, QuizModal, SongDecoderModal,
  ProgressionPanel, HarmonyAnalyser, PracticePathPanel, KeyJourneyPanel,
  AITabContent, AIFloatingBar,
});
