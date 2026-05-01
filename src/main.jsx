import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ClipboardPaste, Copy, Download, Edit3, Eye, FileJson, Printer, RotateCcw, Sparkles, Upload } from 'lucide-react';
import './styles.css';

const today = new Date().toISOString().slice(0, 10);
const emptyCase = {
  builder: '',
  company: '',
  project: '',
  caseName: '',
  name: '',
  type: '',
  status: '',
  distance: '',
  roomType: '',
  size: '',
  price: '',
  avgPrice: '',
  source: '',
  note: ''
};

const emptyReport = {
  client: '',
  date: today,
  location: '',
  landIds: [],
  landPrice: '待複核',
  landArea: { parcels: [], total: '' },
  zoning: '',
  coverage: '',
  far: '',
  road: '',
  school: '',
  village: '',
  siteSummary: '',
  north: '',
  south: '',
  west: '',
  east: '',
  traffic: '',
  amenity: '',
  publicWorks: '',
  market: '',
  product: '',
  listPrice: '',
  dealAvg: '',
  firstWave: '',
  highFloor: '',
  shopPrice: '',
  shopDefault: '',
  shopAdjust: '',
  parkingFormula: '',
  parkingMarket: '',
  parkingPrice: '',
  parkingNote: '',
  adv1: '',
  adv2: '',
  adv3: '',
  weak1: '',
  weak2: '',
  weak3: '',
  conclusion: '',
  mapNote: '',
  cases: [{ ...emptyCase }, { ...emptyCase }, { ...emptyCase }, { ...emptyCase }]
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const toText = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join('；');
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, val]) => {
        const t = toText(val);
        return t ? `${key}：${t}` : '';
      })
      .filter(Boolean)
      .join('；');
  }
  return String(value);
};

const pick = (source, keys, fallback = '') => {
  for (const key of keys) {
    const value = key.split('.').reduce((obj, part) => (obj ? obj[part] : undefined), source);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
};

const formatLandIds = (value) => Array.isArray(value) ? value.map(toText).join('、') : toText(value);
const formatLandArea = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  const parcels = Array.isArray(value.parcels) ? value.parcels : [];
  const rows = parcels.map((p) => [
    pick(p, ['id', 'landId', '地號']),
    pick(p, ['area', 'ping', '坪數']),
    pick(p, ['areaM2', 'sqm', '平方公尺']),
    pick(p, ['note', '備註'])
  ].filter(Boolean).join('／')).filter(Boolean).join('；');
  const total = pick(value, ['total', 'totalPing', '總坪數']);
  return [rows, total ? `合計：${total}` : ''].filter(Boolean).join('；');
};

function normalizeCase(c = {}) {
  const avg = [
    pick(c, ['avg6']) ? `近半年：${pick(c, ['avg6'])}` : '',
    pick(c, ['count6']) ? `近半年筆數：${pick(c, ['count6'])}` : '',
    pick(c, ['avg12']) ? `近一年：${pick(c, ['avg12'])}` : '',
    pick(c, ['count12']) ? `近一年筆數：${pick(c, ['count12'])}` : '',
    pick(c, ['adoptedAvg']) ? `採用均價：${pick(c, ['adoptedAvg'])}` : '',
    pick(c, ['adoptedPeriod']) ? `採用期間：${pick(c, ['adoptedPeriod'])}` : ''
  ].filter(Boolean).join('；');
  const builder = toText(pick(c, ['builder', 'company', 'constructionCompany', 'developer', '建設公司']));
  const project = toText(pick(c, ['project', 'caseName', 'name', '案名']));
  const type = toText(pick(c, ['type', 'status', '類型', '狀態']));
  const distance = toText(pick(c, ['distance', 'distanceNote', 'location', '距離', '屋齡']));
  const price = toText(pick(c, ['price', 'priceInfo', 'avgPrice', '近半年均價', '近半年均價/筆數'])) || avg;
  return {
    ...emptyCase,
    builder,
    company: builder,
    project,
    caseName: project,
    name: project,
    type,
    status: type,
    distance,
    roomType: toText(pick(c, ['roomType', 'product', '產品規劃', '房型'])),
    size: toText(pick(c, ['size', 'area', '坪數'])),
    price,
    avgPrice: price,
    source: toText(pick(c, ['source', 'reference', '資料來源'])),
    note: toText(pick(c, ['note', '備註']))
  };
}

function normalizeReport(input) {
  const r = clone(emptyReport);
  if (!input || typeof input !== 'object') return r;

  if (input.meta || input.basic || input.environment || input.evaluation) {
    r.client = toText(pick(input, ['client', 'meta.owner']));
    r.date = toText(pick(input, ['date', 'meta.researchDate'])) || today;
    r.location = toText(pick(input, ['location', 'basic.location']));
    r.landIds = formatLandIds(pick(input, ['landIds', 'basic.landIdsText']));
    r.landPrice = toText(pick(input, ['landPrice', 'basic.landPrice'])) || '待複核';
    r.landArea = formatLandArea(pick(input, ['landArea', 'basic.baseArea']));
    r.zoning = toText(pick(input, ['zoning', 'basic.zoning']));
    r.coverage = toText(pick(input, ['coverage', 'basic.coverage']));
    r.far = toText(pick(input, ['far', 'basic.far']));
    r.road = toText(pick(input, ['road', 'basic.roadCondition']));
    r.school = toText(pick(input, ['school', 'basic.school']));
    r.village = toText(pick(input, ['village', 'basic.village']));
    r.siteSummary = toText(pick(input, ['siteSummary', 'siteStatus.summary']));
    r.north = toText(pick(input, ['north', 'siteStatus.north']));
    r.south = toText(pick(input, ['south', 'siteStatus.south']));
    r.west = toText(pick(input, ['west', 'siteStatus.west']));
    r.east = toText(pick(input, ['east', 'siteStatus.east']));
    r.traffic = toText(pick(input, ['traffic', 'environment.traffic']));
    r.amenity = toText(pick(input, ['amenity', 'living', 'environment.living']));
    r.publicWorks = toText(pick(input, ['publicWorks', 'environment.publicFacilities']));
    r.market = toText(pick(input, ['market', 'market.regionalSales']));
    r.product = toText(pick(input, ['product', 'market.productSuggestion']));
    r.listPrice = toText(pick(input, ['listPrice', 'market.pricePrediction.residential2F']));
    r.shopPrice = toText(pick(input, ['shopPrice', 'market.pricePrediction.shop']));
    r.parkingPrice = toText(pick(input, ['parkingPrice', 'market.pricePrediction.parking']));
    r.parkingNote = toText(pick(input, ['parkingNote', 'market.pricePrediction.note']));
    r.adv1 = toText(pick(input, ['adv1', 'evaluation.advantages.0']));
    r.adv2 = toText(pick(input, ['adv2', 'evaluation.advantages.1']));
    r.adv3 = toText(pick(input, ['adv3', 'evaluation.advantages.2']));
    r.weak1 = toText(pick(input, ['weak1', 'evaluation.disadvantages.0']));
    r.weak2 = toText(pick(input, ['weak2', 'evaluation.disadvantages.1']));
    r.weak3 = toText(pick(input, ['weak3', 'evaluation.disadvantages.2']));
    r.conclusion = toText(pick(input, ['conclusion', 'evaluation.conclusion']));
    r.mapNote = toText(pick(input, ['mapNote', 'evaluation.pendingItems']));
    r.cases = (input.cases || []).map(normalizeCase);
    while (r.cases.length < 4) r.cases.push({ ...emptyCase });
    return r;
  }

  Object.keys(r).forEach((key) => {
    if (key === 'cases') return;
    if (key === 'landIds') r[key] = formatLandIds(input[key]);
    else if (key === 'landArea') r[key] = input[key] || r[key];
    else r[key] = input[key] !== undefined ? input[key] : r[key];
  });
  r.school = toText(r.school);
  r.product = toText(r.product);
  r.cases = (Array.isArray(input.cases) ? input.cases : []).map(normalizeCase);
  while (r.cases.length < 4) r.cases.push({ ...emptyCase });
  return r;
}

function toPreview(report) {
  return {
    client: toText(report.client),
    date: toText(report.date),
    location: toText(report.location),
    landIds: formatLandIds(report.landIds),
    landArea: formatLandArea(report.landArea),
    school: toText(report.school),
    product: toText(report.product),
    cases: (report.cases || []).map(normalizeCase)
  };
}

function makePrompt(form) {
  return `【海悅廣告｜土地評估調研邏輯｜最終版】\n\n請依照固定「海悅廣告 土地評估分析表」模式，幫我完成土地評估調研，最後只輸出可貼入 App 的 JSON，不要加 Markdown、不要加前言。\n\n一、基本資料\n1. 配合業主：${form.client || '待填'}\n2. 調研時間：${form.date || today}\n3. 標的位置：轉換為實際道路＋生活圈描述\n4. 標的地號：${form.landIds || '待填'}，需逐筆列出\n5. 土地售價：${form.landPrice || '待複核'}\n\n二、固定調研要求\n基地面積需逐筆查詢並換算坪數；土地分區、建蔽率、容積率需查都市計畫／分區資料；臨路條件需判斷單面、雙面、三面或四面臨路；基地四向現況需依實際地圖、衛星圖、街景、地籍圖逐向判讀；學區查教育局最新公告；里別查戶政或區公所里界；競案以距離最近且客戶會比較為優先，預售案盡量找滿4個，不足補5年內、5至10年、10至15年個案；價格以內政部實價登錄為核心。\n\n三、輸出欄位\nclient, date, location, landIds, landPrice, landArea, zoning, coverage, far, road, school, village, siteSummary, north, south, west, east, traffic, amenity, publicWorks, market, product, listPrice, dealAvg, firstWave, highFloor, shopPrice, shopDefault, shopAdjust, parkingFormula, parkingMarket, parkingPrice, parkingNote, adv1, adv2, adv3, weak1, weak2, weak3, conclusion, mapNote, cases。\n\n補充資料：\n${form.note || '無'}`;
}

function Field({ label, value, onChange, textarea = false }) {
  return <label className="field"><span>{label}</span>{textarea ? <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={4} /> : <input value={value || ''} onChange={(e) => onChange(e.target.value)} />}</label>;
}
function Section({ title, children }) { return <section className="section"><h2>{title}</h2>{children}</section>; }
function setKey(obj, key, value) { const n = clone(obj); n[key] = value; return n; }

function Wizard({ form, setForm, setJsonText, setMsg }) {
  const prompt = useMemo(() => makePrompt(form), [form]);
  const copyPrompt = async () => { await navigator.clipboard.writeText(prompt); setMsg('已複製完整調研指令，可直接貼給 ChatGPT。'); };
  const makeBlank = () => {
    const r = clone(emptyReport);
    r.client = form.client;
    r.date = form.date || today;
    r.landIds = form.landIds.split(/[、,，\n]/).map(s => s.trim()).filter(Boolean);
    r.landPrice = form.landPrice || '待複核';
    setJsonText(JSON.stringify(r, null, 2));
    setMsg('已產生空白 JSON，可到 JSON 頁貼入或補資料。');
  };
  return <div className="formPanel">
    <Section title="一鍵調研指令產生器">
      <div className="grid2">
        <Field label="配合業主" value={form.client} onChange={(v) => setForm(setKey(form, 'client', v))} />
        <Field label="調研日期" value={form.date} onChange={(v) => setForm(setKey(form, 'date', v))} />
        <Field label="標的地號" value={form.landIds} onChange={(v) => setForm(setKey(form, 'landIds', v))} textarea />
        <Field label="土地售價" value={form.landPrice} onChange={(v) => setForm(setKey(form, 'landPrice', v))} />
      </div>
      <Field label="業主提供補充資料／現場照片判讀重點" value={form.note} onChange={(v) => setForm(setKey(form, 'note', v))} textarea />
      <div className="buttonRow"><button onClick={copyPrompt}><Copy size={16}/>複製調研指令</button><button onClick={makeBlank}><FileJson size={16}/>產生空白 JSON</button></div>
    </Section>
    <Section title="完整調研指令預覽"><textarea className="promptBox" value={prompt} readOnly /></Section>
  </div>;
}

function JsonPanel({ jsonText, setJsonText, importJson }) {
  return <aside className="jsonPanel mobilePanel"><h2><FileJson size={18}/>ChatGPT JSON 貼上區</h2><textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} spellCheck="false" /><button className="primaryWide" onClick={importJson}><Upload size={18}/>匯入 JSON 並產生報告</button></aside>;
}

function Editor({ report, setReport, setJsonText }) {
  const update = (key) => (value) => { const n = setKey(report, key, value); setReport(n); setJsonText(JSON.stringify(n, null, 2)); };
  const caseUpdate = (i, key, value) => {
    const n = clone(report);
    n.cases[i][key] = value;
    if (key === 'builder') n.cases[i].company = value;
    if (key === 'project') { n.cases[i].caseName = value; n.cases[i].name = value; }
    if (key === 'price') n.cases[i].avgPrice = value;
    setReport(n); setJsonText(JSON.stringify(n, null, 2));
  };
  return <div className="formPanel">
    <Section title="基本資料"><div className="grid2">
      {['client','date','location','landPrice','zoning','coverage','far','road','school','village'].map(k => <Field key={k} label={k} value={toText(report[k])} onChange={update(k)} textarea={['location','road','school'].includes(k)} />)}
      <Field label="landIds" value={formatLandIds(report.landIds)} onChange={(v) => update('landIds')(v.split(/[、,，\n]/).map(s => s.trim()).filter(Boolean))} textarea />
      <Field label="landArea" value={formatLandArea(report.landArea)} onChange={update('landArea')} textarea />
    </div></Section>
    <Section title="基地與環境"><div className="grid2">{['siteSummary','north','south','west','east','traffic','amenity','publicWorks','market','product'].map(k => <Field key={k} label={k} value={toText(report[k])} onChange={update(k)} textarea />)}</div></Section>
    <Section title="價格預判"><div className="grid2">{['listPrice','dealAvg','firstWave','highFloor','shopPrice','shopDefault','shopAdjust','parkingFormula','parkingMarket','parkingPrice','parkingNote'].map(k => <Field key={k} label={k} value={toText(report[k])} onChange={update(k)} textarea />)}</div></Section>
    <Section title="競案資料">{(report.cases || []).map((c, i) => <div className="caseBox" key={i}><h3>競案 {i + 1}</h3><div className="grid2">{['builder','project','type','distance','roomType','size','price','source','note'].map(k => <Field key={k} label={k} value={toText(c[k])} onChange={(v) => caseUpdate(i, k, v)} textarea={['distance','price','note'].includes(k)} />)}</div></div>)}</Section>
    <Section title="綜合評估"><div className="grid2">{['adv1','adv2','adv3','weak1','weak2','weak3','conclusion','mapNote'].map(k => <Field key={k} label={k} value={toText(report[k])} onChange={update(k)} textarea />)}</div></Section>
  </div>;
}

function Preview({ report }) {
  const p = toPreview(report);
  return <div className="paper" id="printArea">
    <h1>海悅廣告 土地評估分析表</h1>
    <div className="grid2 tableLike">
      <div><b>配合業主</b><span>{p.client}</span></div><div><b>調研時間</b><span>{p.date}</span></div>
      <div><b>標的位置</b><span>{report.location}</span></div><div><b>標的地號</b><span>{p.landIds}</span></div>
      <div><b>土地分區</b><span>{report.zoning}</span></div><div><b>基地面積</b><span>{p.landArea}</span></div>
      <div><b>法定建蔽率</b><span>{report.coverage}</span></div><div><b>法定容積率</b><span>{report.far}</span></div>
      <div><b>臨路條件</b><span>{report.road}</span></div><div><b>土地售價</b><span>{report.landPrice}</span></div>
      <div><b>學區</b><span>{p.school}</span></div><div><b>里別</b><span>{report.village}</span></div>
    </div>
    <div className="block"><b>基地現況</b><p>{report.siteSummary}</p><ul><li>北向：{report.north}</li><li>南向：{report.south}</li><li>西向：{report.west}</li><li>東向：{report.east}</li></ul></div>
    <div className="block"><b>交通動線</b><p>{report.traffic}</p></div><div className="block"><b>生活機能</b><p>{report.amenity}</p></div><div className="block"><b>公共建設</b><p>{report.publicWorks}</p></div><div className="block"><b>區域銷況</b><p>{report.market}</p></div><div className="block"><b>建議產品</b><p>{p.product}</p></div>
    <table><thead><tr><th>個案參考</th><th>建設公司</th><th>案名</th><th>類型</th><th>距離/屋齡</th><th>近半年均價/筆數</th></tr></thead><tbody>{p.cases.map((c, i) => <tr key={i}><td>{i + 1}</td><td>{c.builder}</td><td>{c.project}</td><td>{c.type}</td><td>{c.distance || c.note}</td><td>{c.price}</td></tr>)}</tbody></table>
    <div className="grid2 tableLike compact"><div><b>住家表價</b><span>{report.listPrice}</span></div><div><b>成交均價</b><span>{report.dealAvg}</span></div><div><b>首波成交帶</b><span>{report.firstWave}</span></div><div><b>高樓拉價</b><span>{report.highFloor}</span></div><div><b>店面</b><span>{[report.shopPrice, report.shopDefault, report.shopAdjust].filter(Boolean).join('；')}</span></div><div><b>車位</b><span>{[report.parkingPrice, report.parkingMarket, report.parkingFormula].filter(Boolean).join('；')}</span></div></div>
    <div className="block"><b>車位市場／備註</b><p>{report.parkingNote}</p></div>
    <div className="grid2 lists"><div><b>優勢：</b><ol><li>{report.adv1}</li><li>{report.adv2}</li><li>{report.adv3}</li></ol></div><div><b>劣勢：</b><ol><li>{report.weak1}</li><li>{report.weak2}</li><li>{report.weak3}</li></ol></div></div>
    <div className="block"><b>初步結論</b><p>{report.conclusion}</p></div><div className="block small"><b>資料來源／待複核事項</b><p>{report.mapNote}</p></div>
  </div>;
}

function App() {
  const [report, setReport] = useState(clone(emptyReport));
  const [jsonText, setJsonText] = useState(JSON.stringify(emptyReport, null, 2));
  const [tab, setTab] = useState('wizard');
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ client: '弘峻建設', date: today, landIds: '', landPrice: '待複核', note: '' });
  const output = useMemo(() => JSON.stringify(report, null, 2), [report]);

  const importJson = () => {
    try {
      const normalized = normalizeReport(JSON.parse(jsonText));
      setReport(normalized);
      setJsonText(JSON.stringify(normalized, null, 2));
      setTab('preview');
      setMsg('JSON 已匯入，欄位已自動轉換成報告格式。');
    } catch {
      setMsg('JSON 格式錯誤，請確認逗號、引號與大括號。');
    }
  };
  const copyJson = async () => { await navigator.clipboard.writeText(output); setMsg('已複製目前報告 JSON。'); };
  const downloadJson = () => {
    const blob = new Blob([output], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.client || '土地評估'}-${report.date || today}.json`;
    a.click(); URL.revokeObjectURL(url);
  };
  const reset = () => { const r = clone(emptyReport); setReport(r); setJsonText(JSON.stringify(r, null, 2)); setTab('wizard'); setMsg('已重置。'); };

  return <main>
    <header className="topbar mobileTopbar"><div><p>海悅廣告</p><h1>土地評估系統完整版</h1><small>{report.client || form.client || '尚未填寫業主'}｜{report.date || form.date}</small></div><button className="iconOnly" onClick={copyJson} aria-label="複製 JSON"><Copy size={18}/></button></header>
    {msg && <div className="toast">{msg}</div>}
    <div className="quickActions"><button onClick={() => setTab('wizard')}><Sparkles size={16}/>調研</button><button onClick={() => setTab('json')}><ClipboardPaste size={16}/>JSON</button><button onClick={downloadJson}><Download size={16}/>下載</button><button onClick={() => window.print()}><Printer size={16}/>PDF</button><button onClick={reset}><RotateCcw size={16}/>重置</button></div>
    <div className="mobileContent">{tab === 'wizard' && <Wizard form={form} setForm={setForm} setJsonText={setJsonText} setMsg={setMsg} />}{tab === 'json' && <JsonPanel jsonText={jsonText} setJsonText={setJsonText} importJson={importJson} />}{tab === 'edit' && <Editor report={report} setReport={setReport} setJsonText={setJsonText} />}{tab === 'preview' && <div className="previewPanel mobilePanel"><Preview report={report} /></div>}</div>
    <nav className="bottomNav"><button className={tab === 'wizard' ? 'active' : ''} onClick={() => setTab('wizard')}><Sparkles size={18}/><span>調研</span></button><button className={tab === 'json' ? 'active' : ''} onClick={() => setTab('json')}><FileJson size={18}/><span>JSON</span></button><button className={tab === 'edit' ? 'active' : ''} onClick={() => setTab('edit')}><Edit3 size={18}/><span>編輯</span></button><button className={tab === 'preview' ? 'active' : ''} onClick={() => setTab('preview')}><Eye size={18}/><span>預覽</span></button></nav>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
