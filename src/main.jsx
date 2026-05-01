import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ClipboardPaste, Copy, Download, Edit3, Eye, FileJson, Printer, RotateCcw, Upload } from 'lucide-react';
import './styles.css';

const today = new Date().toISOString().slice(0, 10);

const emptyReport = {
  meta: {
    reportTitle: '海悅廣告 土地評估分析表',
    owner: '',
    researchDate: today,
    fileNameRule: '建設公司名＋地段地號＋調研日期',
    status: '草稿'
  },
  basic: {
    location: '',
    landIdsText: '',
    zoning: '',
    baseArea: '',
    coverage: '',
    far: '',
    roadCondition: '',
    landPrice: '待複核',
    school: '',
    village: ''
  },
  areaDetails: [{ landId: '', sqm: '', ping: '', note: '待謄本／地籍資料複核' }],
  siteStatus: {
    summary: '本基地周遭現況為：',
    north: '',
    west: '',
    south: '',
    east: ''
  },
  environment: {
    traffic: '',
    living: '',
    publicFacilities: ''
  },
  market: {
    regionalSales: '',
    productSuggestion: '',
    pricePrediction: {
      residential2F: '',
      residential1F: '',
      shop: '',
      parking: '',
      note: '車位價格以周邊競案實際車位行情為核心，公式推算僅作合理性檢查。'
    }
  },
  cases: [
    { builder: '', project: '', status: '', roomType: '', size: '', price: '', source: '', note: '' },
    { builder: '', project: '', status: '', roomType: '', size: '', price: '', source: '', note: '' },
    { builder: '', project: '', status: '', roomType: '', size: '', price: '', source: '', note: '' },
    { builder: '', project: '', status: '', roomType: '', size: '', price: '', source: '', note: '' }
  ],
  evaluation: {
    advantages: ['', '', ''],
    disadvantages: ['', '', ''],
    conclusion: '',
    pendingItems: [
      '土地面積需以謄本／地籍資料複核',
      '建蔽率、容積率需以都市計畫書／分區證明複核',
      '學區、里別需以教育局與戶政資料複核'
    ]
  },
  sources: []
};

function safeClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function setByPath(obj, path, value) {
  const next = safeClone(obj);
  let cur = next;
  path.forEach((key, index) => {
    if (index === path.length - 1) cur[key] = value;
    else cur = cur[key];
  });
  return next;
}

function textValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join('；');
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, val]) => {
        const txt = textValue(val);
        return txt ? `${key}：${txt}` : '';
      })
      .filter(Boolean)
      .join('；');
  }
  return String(value);
}

function pick(source, keys, fallback = '') {
  for (const key of keys) {
    const value = key.split('.').reduce((cur, part) => (cur ? cur[part] : undefined), source);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}

function formatLandIds(value) {
  if (Array.isArray(value)) return value.map(textValue).join('、');
  return textValue(value);
}

function formatLandArea(landArea) {
  if (!landArea) return '';
  if (typeof landArea === 'string') return landArea;
  const parcels = Array.isArray(landArea.parcels) ? landArea.parcels : [];
  const parcelText = parcels
    .map((p) => {
      const id = pick(p, ['id', 'landId', '地號']);
      const area = pick(p, ['area', 'ping', '坪數']);
      const sqm = pick(p, ['areaM2', 'sqm', '平方公尺']);
      const note = pick(p, ['note', '備註']);
      return [id, area, sqm, note].filter(Boolean).join('／');
    })
    .filter(Boolean)
    .join('；');
  const total = pick(landArea, ['total', 'totalPing', '總坪數']);
  return [parcelText, total ? `合計：${total}` : ''].filter(Boolean).join('；');
}

function normalizeCase(c = {}) {
  const avgParts = [
    pick(c, ['avg6']) ? `近半年：${pick(c, ['avg6'])}` : '',
    pick(c, ['count6']) ? `近半年筆數：${pick(c, ['count6'])}` : '',
    pick(c, ['avg12']) ? `近一年：${pick(c, ['avg12'])}` : '',
    pick(c, ['count12']) ? `近一年筆數：${pick(c, ['count12'])}` : '',
    pick(c, ['adoptedAvg']) ? `採用均價：${pick(c, ['adoptedAvg'])}` : '',
    pick(c, ['adoptedPeriod']) ? `採用期間：${pick(c, ['adoptedPeriod'])}` : ''
  ].filter(Boolean).join('；');

  return {
    builder: textValue(pick(c, ['builder', 'constructionCompany', 'developer', '建設公司'])),
    project: textValue(pick(c, ['project', 'caseName', 'name', '案名'])),
    status: textValue(pick(c, ['status', 'type', '類型'])),
    roomType: textValue(pick(c, ['roomType', 'product', '產品規劃', '房型'])),
    size: textValue(pick(c, ['size', '坪數', 'area'])),
    price: textValue(pick(c, ['price', 'priceInfo', 'avgPrice', '近半年均價'])) || avgParts,
    source: textValue(pick(c, ['source', 'reference', '資料來源'])),
    note: textValue(pick(c, ['note', 'distance', 'distanceNote', 'location', '備註']))
  };
}

function normalizeImportedReport(input) {
  const base = safeClone(emptyReport);

  if (input?.meta || input?.basic || input?.environment || input?.evaluation) {
    const merged = {
      ...base,
      ...input,
      meta: { ...base.meta, ...(input.meta || {}) },
      basic: { ...base.basic, ...(input.basic || {}) },
      siteStatus: { ...base.siteStatus, ...(input.siteStatus || {}) },
      environment: { ...base.environment, ...(input.environment || {}) },
      market: {
        ...base.market,
        ...(input.market || {}),
        pricePrediction: {
          ...base.market.pricePrediction,
          ...((input.market && input.market.pricePrediction) || {})
        }
      },
      evaluation: { ...base.evaluation, ...(input.evaluation || {}) }
    };
    merged.basic.school = textValue(merged.basic.school);
    merged.market.productSuggestion = textValue(merged.market.productSuggestion);
    merged.cases = (input.cases || base.cases).map(normalizeCase);
    while (merged.cases.length < 4) merged.cases.push({ builder: '', project: '', status: '', roomType: '', size: '', price: '', source: '', note: '' });
    return merged;
  }

  base.meta.owner = textValue(pick(input, ['client']));
  base.meta.researchDate = textValue(pick(input, ['date'])) || today;
  base.basic.location = textValue(pick(input, ['location']));
  base.basic.landIdsText = formatLandIds(pick(input, ['landIds']));
  base.basic.zoning = textValue(pick(input, ['zoning']));
  base.basic.baseArea = formatLandArea(pick(input, ['landArea']));
  base.basic.coverage = textValue(pick(input, ['coverage']));
  base.basic.far = textValue(pick(input, ['far']));
  base.basic.roadCondition = textValue(pick(input, ['road']));
  base.basic.landPrice = textValue(pick(input, ['landPrice'])) || '待複核';
  base.basic.school = textValue(pick(input, ['school']));
  base.basic.village = textValue(pick(input, ['village']));

  base.siteStatus.summary = textValue(pick(input, ['siteSummary']));
  base.siteStatus.north = textValue(pick(input, ['north']));
  base.siteStatus.west = textValue(pick(input, ['west']));
  base.siteStatus.south = textValue(pick(input, ['south']));
  base.siteStatus.east = textValue(pick(input, ['east']));

  base.environment.traffic = textValue(pick(input, ['traffic']));
  base.environment.living = textValue(pick(input, ['amenity', 'living']));
  base.environment.publicFacilities = textValue(pick(input, ['publicWorks']));

  base.market.regionalSales = textValue(pick(input, ['market']));
  base.market.productSuggestion = textValue(pick(input, ['product']));
  base.market.pricePrediction.residential2F = [
    pick(input, ['listPrice']) ? `住家表價：${textValue(input.listPrice)}` : '',
    pick(input, ['dealAvg']) ? `成交均價：${textValue(input.dealAvg)}` : '',
    pick(input, ['firstWave']) ? `首波成交帶：${textValue(input.firstWave)}` : '',
    pick(input, ['highFloor']) ? `高樓拉價：${textValue(input.highFloor)}` : ''
  ].filter(Boolean).join('；');
  base.market.pricePrediction.residential1F = textValue(pick(input, ['firstFloor', 'residential1F']));
  base.market.pricePrediction.shop = [
    pick(input, ['shopPrice']) ? `店面價格：${textValue(input.shopPrice)}` : '',
    pick(input, ['shopDefault']) ? `預設：${textValue(input.shopDefault)}` : '',
    pick(input, ['shopAdjust']) ? `調整：${textValue(input.shopAdjust)}` : ''
  ].filter(Boolean).join('；');
  base.market.pricePrediction.parking = [
    pick(input, ['parkingPrice']) ? `建議：${textValue(input.parkingPrice)}` : '',
    pick(input, ['parkingFormula']) ? `公式：${textValue(input.parkingFormula)}` : '',
    pick(input, ['parkingMarket']) ? `市場：${textValue(input.parkingMarket)}` : ''
  ].filter(Boolean).join('；');
  base.market.pricePrediction.note = textValue(pick(input, ['parkingNote', 'mapNote'])) || base.market.pricePrediction.note;

  base.cases = (Array.isArray(input.cases) ? input.cases : []).map(normalizeCase);
  while (base.cases.length < 4) base.cases.push({ builder: '', project: '', status: '', roomType: '', size: '', price: '', source: '', note: '' });

  base.evaluation.advantages = [textValue(pick(input, ['adv1'])), textValue(pick(input, ['adv2'])), textValue(pick(input, ['adv3']))];
  base.evaluation.disadvantages = [textValue(pick(input, ['weak1'])), textValue(pick(input, ['weak2'])), textValue(pick(input, ['weak3']))];
  base.evaluation.conclusion = textValue(pick(input, ['conclusion']));
  base.evaluation.pendingItems = [
    textValue(pick(input, ['mapNote'])),
    '土地面積需以謄本／地籍資料複核',
    '建蔽率、容積率需以都市計畫書／分區證明複核',
    '學區、里別需以教育局與戶政資料複核'
  ].filter(Boolean);

  return base;
}

function Input({ label, value, onChange, placeholder, textarea = false }) {
  return (
    <label className="field">
      <span>{label}</span>
      {textarea ? (
        <textarea value={value || ''} placeholder={placeholder || ''} onChange={e => onChange(e.target.value)} rows={4} />
      ) : (
        <input value={value || ''} placeholder={placeholder || ''} onChange={e => onChange(e.target.value)} />
      )}
    </label>
  );
}

function Section({ title, children }) {
  return <section className="section"><h2>{title}</h2>{children}</section>;
}

function ReportPreview({ report }) {
  const cases = report.cases || [];
  return (
    <div className="paper" id="printArea">
      <h1>{report.meta.reportTitle}</h1>
      <div className="grid2 tableLike">
        <div><b>配合業主</b><span>{report.meta.owner}</span></div>
        <div><b>調研時間</b><span>{report.meta.researchDate}</span></div>
        <div><b>標的位置</b><span>{report.basic.location}</span></div>
        <div><b>標的地號</b><span>{report.basic.landIdsText}</span></div>
        <div><b>土地分區</b><span>{report.basic.zoning}</span></div>
        <div><b>基地面積</b><span>{report.basic.baseArea}</span></div>
        <div><b>法定建蔽率</b><span>{report.basic.coverage}</span></div>
        <div><b>法定容積率</b><span>{report.basic.far}</span></div>
        <div><b>臨路條件</b><span>{report.basic.roadCondition}</span></div>
        <div><b>土地售價</b><span>{report.basic.landPrice}</span></div>
        <div><b>學區</b><span>{report.basic.school}</span></div>
        <div><b>里別</b><span>{report.basic.village}</span></div>
      </div>
      <div className="block"><b>基地現況</b><p>{report.siteStatus.summary}</p><ul><li>北向：{report.siteStatus.north}</li><li>西向：{report.siteStatus.west}</li><li>南向：{report.siteStatus.south}</li><li>東向：{report.siteStatus.east}</li></ul></div>
      <div className="block"><b>交通動線</b><p>{report.environment.traffic}</p></div>
      <div className="block"><b>生活機能</b><p>{report.environment.living}</p></div>
      <div className="block"><b>公共建設</b><p>{report.environment.publicFacilities}</p></div>
      <div className="block"><b>區域銷況</b><p>{report.market.regionalSales}</p></div>
      <div className="block"><b>建議產品</b><p>{report.market.productSuggestion}</p></div>
      <table><thead><tr><th>建設公司</th><th>案名</th><th>狀態</th><th>房型</th><th>坪數</th><th>價格</th><th>資訊來源</th><th>備註</th></tr></thead><tbody>{cases.map((c, i) => <tr key={i}><td>{c.builder}</td><td>{c.project}</td><td>{c.status}</td><td>{c.roomType}</td><td>{c.size}</td><td>{c.price}</td><td>{c.source}</td><td>{c.note}</td></tr>)}</tbody></table>
      <div className="grid2 tableLike compact"><div><b>2F以上住家</b><span>{report.market.pricePrediction.residential2F}</span></div><div><b>店面</b><span>{report.market.pricePrediction.shop}</span></div><div><b>1F住家</b><span>{report.market.pricePrediction.residential1F}</span></div><div><b>車位</b><span>{report.market.pricePrediction.parking}</span></div></div>
      <div className="block"><b>價格預判備註</b><p>{report.market.pricePrediction.note}</p></div>
      <div className="grid2 lists"><div><b>優勢</b><ol>{report.evaluation.advantages.map((x, i) => <li key={i}>{x}</li>)}</ol></div><div><b>劣勢</b><ol>{report.evaluation.disadvantages.map((x, i) => <li key={i}>{x}</li>)}</ol></div></div>
      <div className="block"><b>初步結論</b><p>{report.evaluation.conclusion}</p></div>
      <div className="block small"><b>資料來源／待複核事項</b><ul>{report.evaluation.pendingItems.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
    </div>
  );
}

function EditForm({ report, update, setReport, setJsonText }) {
  return (
    <div className="formPanel">
      <Section title="基本資料">
        <div className="grid2">
          <Input label="配合業主" value={report.meta.owner} onChange={update(['meta','owner'])} />
          <Input label="調研時間" value={report.meta.researchDate} onChange={update(['meta','researchDate'])} />
          <Input label="標的位置" value={report.basic.location} onChange={update(['basic','location'])} textarea />
          <Input label="標的地號" value={report.basic.landIdsText} onChange={update(['basic','landIdsText'])} textarea />
          <Input label="土地分區" value={report.basic.zoning} onChange={update(['basic','zoning'])} />
          <Input label="基地面積" value={report.basic.baseArea} onChange={update(['basic','baseArea'])} />
          <Input label="法定建蔽率" value={report.basic.coverage} onChange={update(['basic','coverage'])} />
          <Input label="法定容積率" value={report.basic.far} onChange={update(['basic','far'])} />
          <Input label="臨路條件" value={report.basic.roadCondition} onChange={update(['basic','roadCondition'])} />
          <Input label="土地售價" value={report.basic.landPrice} onChange={update(['basic','landPrice'])} />
          <Input label="學區" value={report.basic.school} onChange={update(['basic','school'])} />
          <Input label="里別" value={report.basic.village} onChange={update(['basic','village'])} />
        </div>
      </Section>
      <Section title="基地四向現況">
        <Input label="現況摘要" value={report.siteStatus.summary} onChange={update(['siteStatus','summary'])} textarea />
        <div className="grid2">
          <Input label="北向" value={report.siteStatus.north} onChange={update(['siteStatus','north'])} textarea />
          <Input label="西向" value={report.siteStatus.west} onChange={update(['siteStatus','west'])} textarea />
          <Input label="南向" value={report.siteStatus.south} onChange={update(['siteStatus','south'])} textarea />
          <Input label="東向" value={report.siteStatus.east} onChange={update(['siteStatus','east'])} textarea />
        </div>
      </Section>
      <Section title="環境與銷況">
        <Input label="交通動線" value={report.environment.traffic} onChange={update(['environment','traffic'])} textarea />
        <Input label="生活機能" value={report.environment.living} onChange={update(['environment','living'])} textarea />
        <Input label="公共建設" value={report.environment.publicFacilities} onChange={update(['environment','publicFacilities'])} textarea />
        <Input label="區域銷況" value={report.market.regionalSales} onChange={update(['market','regionalSales'])} textarea />
        <Input label="建議產品" value={report.market.productSuggestion} onChange={update(['market','productSuggestion'])} textarea />
      </Section>
      <Section title="個案參考">
        {(report.cases || []).map((c, i) => <div className="caseBox" key={i}><h3>競案 {i + 1}</h3><div className="grid2">{['builder','project','status','roomType','size','price','source','note'].map(k => <Input key={k} label={k} value={c[k]} onChange={v => { const next = safeClone(report); next.cases[i][k] = v; setReport(next); setJsonText(JSON.stringify(next, null, 2)); }} />)}</div></div>)}
      </Section>
      <Section title="價格預判與綜合評估">
        <div className="grid2">
          <Input label="2F以上住家" value={report.market.pricePrediction.residential2F} onChange={update(['market','pricePrediction','residential2F'])} />
          <Input label="1F住家" value={report.market.pricePrediction.residential1F} onChange={update(['market','pricePrediction','residential1F'])} />
          <Input label="店面" value={report.market.pricePrediction.shop} onChange={update(['market','pricePrediction','shop'])} />
          <Input label="車位" value={report.market.pricePrediction.parking} onChange={update(['market','pricePrediction','parking'])} />
        </div>
        <Input label="價格預判備註" value={report.market.pricePrediction.note} onChange={update(['market','pricePrediction','note'])} textarea />
        <div className="grid2">
          {report.evaluation.advantages.map((x, i) => <Input key={`a${i}`} label={`優勢 ${i + 1}`} value={x} onChange={v => { const next = safeClone(report); next.evaluation.advantages[i] = v; setReport(next); setJsonText(JSON.stringify(next, null, 2)); }} />)}
          {report.evaluation.disadvantages.map((x, i) => <Input key={`d${i}`} label={`劣勢 ${i + 1}`} value={x} onChange={v => { const next = safeClone(report); next.evaluation.disadvantages[i] = v; setReport(next); setJsonText(JSON.stringify(next, null, 2)); }} />)}
        </div>
        <Input label="初步結論" value={report.evaluation.conclusion} onChange={update(['evaluation','conclusion'])} textarea />
      </Section>
    </div>
  );
}

function App() {
  const [report, setReport] = useState(emptyReport);
  const [jsonText, setJsonText] = useState(JSON.stringify(emptyReport, null, 2));
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState('edit');
  const jsonOutput = useMemo(() => JSON.stringify(report, null, 2), [report]);

  const update = (path) => (value) => {
    const next = setByPath(report, path, value);
    setReport(next);
    setJsonText(JSON.stringify(next, null, 2));
  };

  const importJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const normalized = normalizeImportedReport(parsed);
      setReport(normalized);
      setJsonText(JSON.stringify(normalized, null, 2));
      setTab('edit');
      setMessage('JSON 已匯入，物件欄位已自動轉成表格可顯示文字。');
    } catch {
      setMessage('JSON 格式錯誤，請確認逗號、引號與大括號。');
    }
  };

  const copyJson = async () => {
    await navigator.clipboard.writeText(jsonOutput);
    setMessage('已複製目前報告 JSON。');
  };

  const downloadJson = () => {
    const name = `${report.meta.owner || 'XX建設'}-${(report.basic.landIdsText || 'XX段XXX地號').replace(/[\\/:*?"<>|\s]+/g, '')}-${report.meta.researchDate || today}.json`;
    const blob = new Blob([jsonOutput], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    const next = safeClone(emptyReport);
    setReport(next);
    setJsonText(JSON.stringify(next, null, 2));
    setTab('edit');
    setMessage('已重置為空白表。');
  };

  return (
    <main>
      <header className="topbar mobileTopbar">
        <div>
          <p>海悅廣告</p>
          <h1>土地評估報告產生器</h1>
          <small>{report.meta.owner || '尚未填寫業主'}｜{report.meta.researchDate}</small>
        </div>
        <button className="iconOnly" onClick={copyJson} aria-label="複製 JSON"><Copy size={18}/></button>
      </header>

      {message && <div className="toast">{message}</div>}

      <div className="quickActions">
        <button onClick={() => setTab('json')}><ClipboardPaste size={16}/>貼 JSON</button>
        <button onClick={downloadJson}><Download size={16}/>下載</button>
        <button onClick={() => window.print()}><Printer size={16}/>PDF</button>
        <button onClick={reset}><RotateCcw size={16}/>重置</button>
      </div>

      <div className="mobileContent">
        {tab === 'edit' && <EditForm report={report} update={update} setReport={setReport} setJsonText={setJsonText} />}
        {tab === 'json' && <aside className="jsonPanel mobilePanel"><h2><FileJson size={18}/>ChatGPT JSON 貼上區</h2><textarea value={jsonText} onChange={e => setJsonText(e.target.value)} spellCheck="false" /><button className="primaryWide" onClick={importJson}><Upload size={18}/>匯入 JSON 並開始修改</button></aside>}
        {tab === 'preview' && <div className="previewPanel mobilePanel"><ReportPreview report={report} /></div>}
      </div>

      <nav className="bottomNav">
        <button className={tab === 'edit' ? 'active' : ''} onClick={() => setTab('edit')}><Edit3 size={18}/><span>編輯</span></button>
        <button className={tab === 'json' ? 'active' : ''} onClick={() => setTab('json')}><FileJson size={18}/><span>JSON</span></button>
        <button className={tab === 'preview' ? 'active' : ''} onClick={() => setTab('preview')}><Eye size={18}/><span>預覽</span></button>
      </nav>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
