import { useEffect, useState, type ReactNode } from 'react';
import { Save, CheckCircle2, Upload, X, ShoppingBag } from 'lucide-react';
import { fetchSettings, setSetting, uploadImage, refreshCommerceConfig, DEFAULT_COMMERCE, type CommerceConfig } from './store';

interface BrandSettings {
  logoUrl?: string;
  faviconUrl?: string;
  brandColor?: string;
  socialWechat?: string;
  socialInstagram?: string;
  socialTiktok?: string;
  customerServicePhone?: string;
  fxRate_usd_cny?: number;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
}

export default function SettingsManager() {
  const [v, setV] = useState<BrandSettings>({});
  const [commerce, setCommerce] = useState<CommerceConfig>({ ...DEFAULT_COMMERCE });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings().then((all) => {
      setV((all.brand as BrandSettings) || {});
      const c = (all.commerce as Partial<CommerceConfig>) || {};
      setCommerce({
        shoppingEnabled: c.shoppingEnabled !== undefined ? !!c.shoppingEnabled : DEFAULT_COMMERCE.shoppingEnabled,
        showPrices:      c.showPrices      !== undefined ? !!c.showPrices      : DEFAULT_COMMERCE.showPrices
      });
    });
  }, []);

  const save = async () => {
    await setSetting('brand', v);
    await setSetting('commerce', commerce);
    await refreshCommerceConfig();
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  };

  const uploadLogo = async (file?: File, key: 'logoUrl' | 'faviconUrl' = 'logoUrl') => {
    if (!file) return;
    try { const r = await uploadImage(file); setV({ ...v, [key]: r.url }); }
    catch (err) { alert(err instanceof Error ? err.message : '上传失败'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">网站设置</h1>
        <p className="text-sm text-slate-500 mt-1">品牌资源、社交链接、汇率、维护模式</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 max-w-2xl">
        <h2 className="font-extrabold text-base">品牌</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Logo">
            {v.logoUrl ? (
              <div className="flex items-center gap-3">
                <img src={v.logoUrl} alt="" className="h-12 rounded border border-slate-200" />
                <button onClick={() => setV({ ...v, logoUrl: '' })} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer">移除</button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 border-2 border-dashed border-slate-300 rounded-lg hover:border-rose-400 cursor-pointer w-fit">
                <Upload className="w-3.5 h-3.5" /> 上传 Logo
                <input type="file" accept="image/*" hidden onChange={(e) => uploadLogo(e.target.files?.[0], 'logoUrl')} />
              </label>
            )}
          </Field>
          <Field label="Favicon">
            {v.faviconUrl ? (
              <div className="flex items-center gap-3">
                <img src={v.faviconUrl} alt="" className="h-8 w-8 rounded border border-slate-200" />
                <button onClick={() => setV({ ...v, faviconUrl: '' })} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer">移除</button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 border-2 border-dashed border-slate-300 rounded-lg hover:border-rose-400 cursor-pointer w-fit">
                <Upload className="w-3.5 h-3.5" /> 上传 Favicon
                <input type="file" accept="image/*" hidden onChange={(e) => uploadLogo(e.target.files?.[0], 'faviconUrl')} />
              </label>
            )}
          </Field>
          <Field label="主品牌色">
            <input type="color" value={v.brandColor || '#E11D48'} onChange={(e) => setV({ ...v, brandColor: e.target.value })}
              className="h-9 w-full rounded cursor-pointer" />
          </Field>
          <Field label="USD ↔ CNY 汇率（1 USD = ? CNY）">
            <input type="number" step="0.01" value={v.fxRate_usd_cny ?? 7.2} onChange={(e) => setV({ ...v, fxRate_usd_cny: Number(e.target.value) })} className="ip" />
          </Field>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 max-w-2xl">
        <h2 className="font-extrabold text-base">联系 / 社交</h2>
        <Field label="客服电话"><input value={v.customerServicePhone || ''} onChange={(e) => setV({ ...v, customerServicePhone: e.target.value })} className="ip" /></Field>
        <Field label="微信号"><input value={v.socialWechat || ''} onChange={(e) => setV({ ...v, socialWechat: e.target.value })} className="ip" /></Field>
        <Field label="Instagram URL"><input value={v.socialInstagram || ''} onChange={(e) => setV({ ...v, socialInstagram: e.target.value })} className="ip" /></Field>
        <Field label="TikTok URL"><input value={v.socialTiktok || ''} onChange={(e) => setV({ ...v, socialTiktok: e.target.value })} className="ip" /></Field>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 max-w-2xl">
        <h2 className="font-extrabold text-base flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-rose-600" /> 购物 / 商城功能
        </h2>
        <p className="text-xs text-slate-500 -mt-1">控制前台是否开放购物、是否展示价格。仅管理员可修改。</p>

        <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-150 hover:bg-slate-50 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={commerce.shoppingEnabled}
            onChange={(e) => setCommerce({ ...commerce, shoppingEnabled: e.target.checked })}
          />
          <span>
            <span className="block text-sm font-bold text-slate-800">开启购物功能</span>
            <span className="block text-xs text-slate-500 mt-0.5">
              关闭后，前台将隐藏购物车、「加入购物车」按钮与结算流程，网站变为纯产品展示。
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-150 hover:bg-slate-50 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={commerce.showPrices}
            onChange={(e) => setCommerce({ ...commerce, showPrices: e.target.checked })}
          />
          <span>
            <span className="block text-sm font-bold text-slate-800">在前台展示价格</span>
            <span className="block text-xs text-slate-500 mt-0.5">
              关闭后，前台所有产品价格与货币切换将被隐藏（产品介绍照常显示）。
            </span>
          </span>
        </label>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 max-w-2xl">
        <h2 className="font-extrabold text-base">维护模式</h2>
        <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
          <input type="checkbox" checked={v.maintenanceMode || false} onChange={(e) => setV({ ...v, maintenanceMode: e.target.checked })} />
          开启后，前台显示维护提示，购物车结算被禁用
        </label>
        <Field label="维护提示文案">
          <textarea rows={3} value={v.maintenanceMessage || ''} onChange={(e) => setV({ ...v, maintenanceMessage: e.target.value })} className="ip" placeholder="网站升级中，预计 14:00 恢复" />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl cursor-pointer">
          <Save className="w-4 h-4" /> 保存全部
        </button>
        {saved && <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> 已保存</span>}
      </div>

      <style>{`
        .ip { width:100%; padding:0.5rem 0.75rem; font-size:0.875rem; font-weight:600; color:rgb(15,23,42); background-color:rgb(248,250,252); border:1px solid rgb(226,232,240); border-radius:0.5rem; outline:none; }
      `}</style>
      <X className="hidden" />
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{label}</label>{children}</div>;
}
