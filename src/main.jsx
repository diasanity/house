import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Copy, Download, FileText, Printer, RotateCcw, Upload } from 'lucide-react';
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
  areaDetails: [
    { landId: '', sqm: '', ping: '', note: '待謄本／地籍資料複核' }
  ],
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

function Input({ label, value, onChange, placeholder, textarea = false }) {
  return (
    <label className="field">
      <span>{label}</span>
      {textarea ? (
        <textarea value={value || ''} placeholder={placeholder || ''} onChange={e => onChange(e.target.value)} rows={3} />
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

      <div className="block"><b>基地現況</b><p>{report.siteStatus.summary}</p>
        <ul>
          <li>北向：{report.siteStatus.north}</li>
          <li>西向：{report.siteStatus.west}</li>
          <li>南向：{report.siteStatus.south}</li>
          <li>東向：{report.siteStatus.east}</li>
        </ul>
      </div>

      <div className="block"><b>交通動線</b><p>{report.environment.traffic}</p></div>
      <div className="block"><b>生活機能</b><p>{report.environment.living}</p></div>
      <div className="block"><b>公共建設</b><p>{report.environment.publicFacilities}</p></div>
      <div className="block"><b>區域銷況</b><p>{report.market.regionalSales}</p></div>
      <div className="block"><b>建議產品</b><p>{report.market.productSuggestion}</p></div>

      <table>
        <thead><tr><th>建設公司</th><th>案名</th><th>狀態</th><th>房型</th><th>坪數</th><th>價格</th><th>資訊來源</th><th>備註</th></tr></thead>
        <tbody>{cases.map((c, i) => <tr key={i}><td>{c.builder}</td><td>{c.project}</td><td>{c.status}</td><td>{c.roomType}</td><td>{c.size}</td><td>{c.price}</td><td>{c.source}</td><td>{c.note}</td></tr>)}</tbody>
      </table>

      <div className="grid2 tableLike compact">
        <div><b>2F以上住家</b><span>{report.market.pricePrediction.residential2F}</span></div>
        <div><b>店面</b><span>{report.market.pricePrediction.shop}</span></div>
        <div><b>1F住家</b><span>{report.market.pricePrediction.residential1F}</span></div>
        <div><b>車位</b><span>{report.market.pricePrediction.parking}</span></div>
      </div>
      <div className="block"><b>價格預判備註</b><p>{report.market.pricePrediction.note}</p></div>

      <div className="grid2 lists">
        <div><b>優勢</b><ol>{report.evaluation.advantages.map((x, i) => <li key={i}>{x}</li>)}</ol></div>
        <div><b>劣勢</b><ol>{report.evaluation.disadvantages.map((x, i) => <li key={i}>{x}</li>)}</ol></div>
      </div>
      <div className="block"><b>初步結論</b><p>{report.evaluation.conclusion}</p></div>
      <div className="block small"><b>資料來源／待複核事項</b><ul>{report.evaluation.pendingItems.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
    </div>
  );
}

function App() {
  const [report, setReport] = useState(emptyReport);
  const [jsonText, setJsonText] = useState(JSON.stringify(emptyReport, null, 2));
  const [message, setMessage] = useState('');

  const jsonOutput = useMemo(() => JSON.stringify(report, null, 2), [report]);

  const update = (path) => (value) => {
    const next = setByPath(report, path, value);
    setReport(next);
    setJsonText(JSON.stringify(next, null, 2));
  };

  const importJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setReport(parsed);
      setMessage('JSON 已匯入，所有欄位都可以繼續手動修改。');
    } catch {
      setMessage('JSON 格式錯誤，請確認逗號、引號與大括號是否完整。');
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
    setMessage('已重置為空白土地評估表。');
  };

  return (
    <main>
      <header className="topbar">
        <div><p>海悅廣告</p><h1>土地評估報告產生器</h1></div>
        <div className="actions">
          <button onClick={importJson}><Upload size={16}/>匯入 JSON</button>
          <button onClick={copyJson}><Copy size={16}/>複製 JSON</button>
          <button onClick={downloadJson}><Download size={16}/>下載 JSON</button>
          <button onClick={() => window.print()}><Printer size={16}/>列印/PDF</button>
          <button onClick={reset}><RotateCcw size={16}/>重置</button>
        </div>
      </header>
      {message && <div className="toast">{message}</div>}
      <div className="layout">
        <aside className="jsonPanel">
          <h2><FileText size={18}/>ChatGPT JSON 貼上區</h2>
          <textarea value={jsonText} onChange={e => setJsonText(e.target.value)} spellCheck="false" />
        </aside>

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
            {(report.cases || []).map((c, i) => <div className="caseBox" key={i}>
              <h3>競案 {i + 1}</h3>
              <div className="grid2">
                {['builder','project','status','roomType','size','price','source','note'].map(k => <Input key={k} label={k} value={c[k]} onChange={v => {
                  const next = safeClone(report);
                  next.cases[i][k] = v;
                  setReport(next);
                  setJsonText(JSON.stringify(next, null, 2));
                }} />)}
              </div>
            </div>)}
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
              {report.evaluation.advantages.map((x, i) => <Input key={`a${i}`} label={`優勢 ${i + 1}`} value={x} onChange={v => {
                const next = safeClone(report); next.evaluation.advantages[i] = v; setReport(next); setJsonText(JSON.stringify(next, null, 2));
              }} />)}
              {report.evaluation.disadvantages.map((x, i) => <Input key={`d${i}`} label={`劣勢 ${i + 1}`} value={x} onChange={v => {
                const next = safeClone(report); next.evaluation.disadvantages[i] = v; setReport(next); setJsonText(JSON.stringify(next, null, 2));
              }} />)}
            </div>
            <Input label="初步結論" value={report.evaluation.conclusion} onChange={update(['evaluation','conclusion'])} textarea />
          </Section>
        </div>

        <div className="previewPanel"><ReportPreview report={report} /></div>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
