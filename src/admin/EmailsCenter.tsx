import { useEffect, useState, type ReactNode } from 'react';
import { Mail, Send, FileText, Settings, Plus, Edit2, Trash2, X, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  listEmailTemplates, upsertEmailTemplate, deleteEmailTemplate, sendTestEmail,
  listCampaigns, createCampaign, sendCampaignNow,
  listEmailLogs, getSmtpSettings, saveSmtpSettings,
  type EmailTemplate, type EmailCampaign, type EmailLog
} from './store';

type Tab = 'templates' | 'campaigns' | 'logs' | 'settings';

export default function EmailsCenter() {
  const [tab, setTab] = useState<Tab>('templates');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">邮件中心</h1>
        <p className="text-sm text-slate-500 mt-1">系统通知模板、营销群发、发送日志、SMTP 配置</p>
      </div>
      <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1 w-fit">
        {([
          { v: 'templates', label: '模板', icon: FileText },
          { v: 'campaigns', label: '群发', icon: Send },
          { v: 'logs', label: '日志', icon: Mail },
          { v: 'settings', label: 'SMTP', icon: Settings }
        ] as const).map((b) => (
          <button key={b.v} onClick={() => setTab(b.v)}
            className={`flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-md cursor-pointer ${tab === b.v ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>
            <b.icon className="w-3.5 h-3.5" /> {b.label}
          </button>
        ))}
      </div>

      {tab === 'templates' && <TemplatesTab />}
      {tab === 'campaigns' && <CampaignsTab />}
      {tab === 'logs' && <LogsTab />}
      {tab === 'settings' && <SmtpTab />}
    </div>
  );
}

function TemplatesTab() {
  const [items, setItems] = useState<EmailTemplate[]>([]);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [testTo, setTestTo] = useState('');
  const refresh = () => listEmailTemplates().then(setItems).catch(() => setItems([]));
  useEffect(() => { refresh(); }, []);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <button onClick={() => setEditing({ id: 'custom-' + Math.random().toString(36).slice(2, 6), name: '', subject: '', body_html: '', kind: 'marketing' })}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm px-4 py-2 rounded-xl cursor-pointer">
          <Plus className="w-4 h-4" /> 新增模板
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">ID</th>
              <th className="text-left px-5 py-3">名称</th>
              <th className="text-left px-5 py-3">主题</th>
              <th className="text-center px-5 py-3">类型</th>
              <th className="text-right px-5 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-mono text-xs">{t.id}</td>
                <td className="px-5 py-3 font-extrabold">{t.name}</td>
                <td className="px-5 py-3 text-xs text-slate-600">{t.subject}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${t.kind === 'system' ? 'bg-slate-100 text-slate-700' : 'bg-rose-50 text-rose-700'}`}>{t.kind}</span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => setEditing({ ...t })} className="p-1.5 text-sky-600 hover:bg-sky-50 rounded cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                  {t.kind !== 'system' && (
                    <button onClick={() => { if (confirm('删除该模板？')) deleteEmailTemplate(t.id).then(refresh); }}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer ml-1"><Trash2 className="w-4 h-4" /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 flex-wrap">
        <input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="发送测试邮件到…"
          className="flex-1 min-w-[240px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none" />
        <select id="test-tpl" className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold">
          {items.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button onClick={async () => {
          const tpl = (document.getElementById('test-tpl') as HTMLSelectElement).value;
          const r = await sendTestEmail({ to: testTo, templateId: tpl });
          alert(r.ok ? '发送成功（请查看收件箱与日志）' : '发送失败，请检查 SMTP 配置');
        }} className="flex items-center gap-1.5 bg-slate-900 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer">
          <Send className="w-3.5 h-3.5" /> 发送测试
        </button>
      </div>

      {editing && <TemplateEditor t={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}
    </div>
  );
}

function TemplateEditor({ t, onCancel, onSaved }: { t: EmailTemplate; onCancel: () => void; onSaved: () => void }) {
  const [d, setD] = useState<EmailTemplate>(t);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try { await upsertEmailTemplate(d); onSaved(); }
    catch (err) { alert(err instanceof Error ? err.message : '保存失败'); }
    finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="font-extrabold text-lg">{d.name || '新建模板'}</h2>
          <button onClick={onCancel} className="p-2 text-slate-400 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="lab">ID</label><input value={d.id} disabled className="ip" /></div>
            <div><label className="lab">名称</label><input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} className="ip" /></div>
          </div>
          <div><label className="lab">主题（支持变量 {`{{orderId}}`} 等）</label><input value={d.subject} onChange={(e) => setD({ ...d, subject: e.target.value })} className="ip" /></div>
          <div>
            <label className="lab">正文 HTML（支持变量替换；预设变量见说明）</label>
            <textarea rows={16} value={d.body_html} onChange={(e) => setD({ ...d, body_html: e.target.value })} className="ip font-mono text-xs" />
            <p className="text-[10px] text-slate-500 font-bold mt-2">
              可用变量：customerName, orderId, currencySymbol, subtotal, discount, shipping, total, trackingNumber, email, unsubscribeUrl
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50 sticky bottom-0">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-bold cursor-pointer">取消</button>
          <button onClick={save} disabled={busy} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer disabled:opacity-60">
            <Save className="w-4 h-4" /> 保存
          </button>
        </div>
        <style>{`
          .ip { width:100%; padding:0.5rem 0.75rem; font-size:0.875rem; font-weight:600; color:rgb(15,23,42); background-color:rgb(248,250,252); border:1px solid rgb(226,232,240); border-radius:0.5rem; outline:none; }
          .lab { display:block; font-size:11px; font-weight:700; color:rgb(100,116,139); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px; }
        `}</style>
      </div>
    </div>
  );
}

function CampaignsTab() {
  const [items, setItems] = useState<EmailCampaign[]>([]);
  const [editing, setEditing] = useState<boolean>(false);
  const refresh = () => listCampaigns().then(setItems).catch(() => setItems([]));
  useEffect(() => { refresh(); }, []);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <button onClick={() => setEditing(true)}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm px-4 py-2 rounded-xl cursor-pointer">
          <Plus className="w-4 h-4" /> 新建群发
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">名称</th>
              <th className="text-left px-5 py-3">主题</th>
              <th className="text-center px-5 py-3">状态</th>
              <th className="text-right px-5 py-3">发送 / 失败</th>
              <th className="text-right px-5 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-sm text-slate-400 font-bold">暂无群发记录</td></tr>}
            {items.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-extrabold">{c.name}</td>
                <td className="px-5 py-3 text-xs">{c.subject}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                    c.status === 'sent' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    c.status === 'sending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    c.status === 'failed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>{c.status}</span>
                </td>
                <td className="px-5 py-3 text-right font-mono text-xs">{c.sent_count} / {c.failed_count}</td>
                <td className="px-5 py-3 text-right">
                  {c.status === 'draft' && (
                    <button onClick={async () => {
                      const r = await sendCampaignNow(c.id);
                      alert(`完成: 成功 ${r.sent}，失败 ${r.failed}`);
                      refresh();
                    }} className="flex items-center gap-1 ml-auto text-xs font-bold text-rose-600 hover:underline cursor-pointer">
                      <Send className="w-3.5 h-3.5" /> 立即发送
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <CampaignEditor onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); refresh(); }} />}
    </div>
  );
}

function CampaignEditor({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void }) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [audKind, setAudKind] = useState<'subscribers' | 'registered' | 'recent_buyers' | 'all_customers'>('subscribers');
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);
  useEffect(() => { listEmailTemplates().then(setTemplates); }, []);

  const useTemplate = (id: string) => {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (t) { setSubject(t.subject); setBody(t.body_html); }
  };

  const save = async (sendNow: boolean) => {
    if (!name || !subject || !body) { alert('请填名称 / 主题 / 正文'); return; }
    setBusy(true);
    try {
      const r = await createCampaign({
        name, templateId: templateId || undefined, subject, body_html: body,
        audience: { kind: audKind, days },
        sendNow
      });
      alert(`已创建群发 ${r.id}` + (sendNow ? '，并已开始发送' : ''));
      onSaved();
    } catch (err) { alert(err instanceof Error ? err.message : '保存失败'); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="font-extrabold text-lg">新建群发邮件</h2>
          <button onClick={onCancel} className="p-2 text-slate-400 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div><label className="lab">名称（仅内部可见）</label><input value={name} onChange={(e) => setName(e.target.value)} className="ip" /></div>
          <div><label className="lab">从模板载入（可选）</label>
            <select value={templateId} onChange={(e) => useTemplate(e.target.value)} className="ip">
              <option value="">（选择模板）</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div><label className="lab">主题</label><input value={subject} onChange={(e) => setSubject(e.target.value)} className="ip" /></div>
          <div><label className="lab">正文 HTML</label>
            <textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} className="ip font-mono text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="lab">收件人</label>
              <select value={audKind} onChange={(e) => setAudKind(e.target.value as 'subscribers' | 'registered' | 'recent_buyers' | 'all_customers')} className="ip">
                <option value="subscribers">订阅者</option>
                <option value="registered">所有注册客户</option>
                <option value="recent_buyers">最近 N 天下单的客户</option>
                <option value="all_customers">全部（注册+访客买家+订阅者）</option>
              </select>
            </div>
            {audKind === 'recent_buyers' && (
              <div><label className="lab">最近多少天</label><input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} className="ip" /></div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50 sticky bottom-0">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-bold cursor-pointer">取消</button>
          <button onClick={() => save(false)} disabled={busy} className="px-4 py-2 text-sm font-bold bg-slate-200 hover:bg-slate-300 rounded-lg cursor-pointer disabled:opacity-60">保存为草稿</button>
          <button onClick={() => save(true)} disabled={busy} className="flex items-center gap-1 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer disabled:opacity-60">
            <Send className="w-4 h-4" /> 立即发送
          </button>
        </div>
        <style>{`
          .ip { width:100%; padding:0.5rem 0.75rem; font-size:0.875rem; font-weight:600; color:rgb(15,23,42); background-color:rgb(248,250,252); border:1px solid rgb(226,232,240); border-radius:0.5rem; outline:none; }
          .lab { display:block; font-size:11px; font-weight:700; color:rgb(100,116,139); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px; }
        `}</style>
      </div>
    </div>
  );
}

function LogsTab() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  useEffect(() => { listEmailLogs().then(setLogs).catch(() => setLogs([])); }, []);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
          <tr>
            <th className="text-left px-5 py-3">时间</th>
            <th className="text-left px-5 py-3">收件人</th>
            <th className="text-left px-5 py-3">主题</th>
            <th className="text-left px-5 py-3">类型</th>
            <th className="text-center px-5 py-3">状态</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {logs.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-sm text-slate-400 font-bold">暂无日志</td></tr>}
          {logs.map((l) => (
            <tr key={l.id} className="hover:bg-slate-50">
              <td className="px-5 py-3 text-xs text-slate-500 font-mono">{new Date(l.sent_at).toLocaleString()}</td>
              <td className="px-5 py-3 text-xs font-bold">{l.to_addr}</td>
              <td className="px-5 py-3 text-xs">{l.subject}</td>
              <td className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600">{l.kind}</td>
              <td className="px-5 py-3 text-center">
                {l.status === 'sent' ?
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" />成功</span>
                  : <span title={l.error} className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full"><AlertCircle className="w-3 h-3" />失败</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SmtpTab() {
  const [v, setV] = useState<{ host?: string; port?: number; secure?: boolean; user?: string; pass?: string; from?: string }>({});
  const [saved, setSaved] = useState(false);
  useEffect(() => { getSmtpSettings().then((d) => setV(d as typeof v)).catch(() => setV({})); }, []);
  const save = async () => {
    await saveSmtpSettings(v as unknown as Record<string, unknown>);
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-xl space-y-3">
      <p className="text-xs font-bold text-slate-500">所有发件 / 群发功能依赖此处的 SMTP 凭据。可使用 Mailgun / SendGrid / Postmark 或自有邮件服务器。</p>
      <Field label="SMTP Host"><input value={v.host || ''} onChange={(e) => setV({ ...v, host: e.target.value })} className="ip" placeholder="smtp.example.com" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="端口"><input type="number" value={v.port || 587} onChange={(e) => setV({ ...v, port: Number(e.target.value) })} className="ip" /></Field>
        <Field label="安全连接">
          <select value={v.secure ? '1' : '0'} onChange={(e) => setV({ ...v, secure: e.target.value === '1' })} className="ip">
            <option value="0">STARTTLS / 普通</option>
            <option value="1">SSL（端口 465）</option>
          </select>
        </Field>
      </div>
      <Field label="用户名"><input value={v.user || ''} onChange={(e) => setV({ ...v, user: e.target.value })} className="ip" /></Field>
      <Field label="密码"><input type="password" value={v.pass || ''} onChange={(e) => setV({ ...v, pass: e.target.value })} className="ip" placeholder="••••••" /></Field>
      <Field label='发件人（"Name <email>"）'><input value={v.from || ''} onChange={(e) => setV({ ...v, from: e.target.value })} className="ip" placeholder='Therabo <noreply@example.com>' /></Field>
      <div className="flex items-center gap-2 pt-2">
        <button onClick={save} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm px-4 py-2 rounded-lg cursor-pointer">
          <Save className="w-4 h-4" /> 保存
        </button>
        {saved && <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> 已保存</span>}
      </div>
      <style>{`.ip { width:100%; padding:0.5rem 0.75rem; font-size:0.875rem; font-weight:600; color:rgb(15,23,42); background-color:rgb(248,250,252); border:1px solid rgb(226,232,240); border-radius:0.5rem; outline:none; }`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{label}</label>{children}</div>;
}
