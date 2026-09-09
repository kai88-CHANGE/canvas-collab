import { useCallback } from 'react';
import { uploadImage } from '../api';

const COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
];

const HIGHLIGHT_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff'];

const FONT_SIZES = [
  { label: '極小 10', value: '10px' },
  { label: '小 12', value: '12px' },
  { label: '普通 14', value: '14px' },
  { label: '中 16', value: '16px' },
  { label: '大 18', value: '18px' },
  { label: '特大 20', value: '20px' },
  { label: '24', value: '24px' },
  { label: '28', value: '28px' },
  { label: '32', value: '32px' },
  { label: '40', value: '40px' },
  { label: '48', value: '48px' },
  { label: '64', value: '64px' },
];

const FONTS = [
  { label: 'デフォルト', value: 'inherit' },
  { label: 'ゴシック体', value: '"Hiragino Sans", "Yu Gothic", sans-serif' },
  { label: '明朝体', value: '"Hiragino Mincho Pro", "Yu Mincho", serif' },
  { label: '丸ゴシック', value: '"Hiragino Maru Gothic Pro", "BIZ UDPGothic", sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier', value: '"Courier New", monospace' },
  { label: 'Impact', value: 'Impact, fantasy' },
];

export default function Toolbar({ editor }) {
  const handleImageUpload = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const url = await uploadImage(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch {
        alert('画像のアップロードに失敗しました');
      }
    };
    input.click();
  }, [editor]);

  if (!editor) return null;

  const btn = (active, onClick, title, children) => (
    <button
      key={title}
      onClick={onClick}
      title={title}
      className={`toolbar-btn${active ? ' active' : ''}`}
    >
      {children}
    </button>
  );

  return (
    <div className="toolbar">
      {/* フォント */}
      <select
        className="toolbar-select font-select"
        title="フォント"
        onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
      >
        {FONTS.map(f => <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>)}
      </select>

      {/* フォントサイズ */}
      <select
        className="toolbar-select size-select"
        title="フォントサイズ"
        onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
        defaultValue="16px"
      >
        {FONT_SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      <div className="toolbar-divider" />

      {/* テキストスタイル */}
      {btn(editor.isActive('bold'),      () => editor.chain().focus().toggleBold().run(),      '太字 (Ctrl+B)', <b>B</b>)}
      {btn(editor.isActive('italic'),    () => editor.chain().focus().toggleItalic().run(),    '斜体 (Ctrl+I)', <i>I</i>)}
      {btn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), '下線',          <u>U</u>)}
      {btn(editor.isActive('strike'),    () => editor.chain().focus().toggleStrike().run(),    '取り消し線',    <s>S</s>)}

      <div className="toolbar-divider" />

      {/* 見出し */}
      {[1, 2, 3].map(level =>
        btn(
          editor.isActive('heading', { level }),
          () => editor.chain().focus().toggleHeading({ level }).run(),
          `見出し${level}`,
          `H${level}`
        )
      )}

      <div className="toolbar-divider" />

      {/* 文字揃え */}
      {[
        { align: 'left',    icon: '⬅', label: '左揃え' },
        { align: 'center',  icon: '↔', label: '中央揃え' },
        { align: 'right',   icon: '➡', label: '右揃え' },
        { align: 'justify', icon: '≡',  label: '両端揃え' },
      ].map(({ align, icon, label }) =>
        btn(editor.isActive({ textAlign: align }), () => editor.chain().focus().setTextAlign(align).run(), label, icon)
      )}

      <div className="toolbar-divider" />

      {/* リスト */}
      {btn(editor.isActive('bulletList'),  () => editor.chain().focus().toggleBulletList().run(),  '箇条書き',   '• ≡')}
      {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), '番号リスト', '1.≡')}

      <div className="toolbar-divider" />

      {/* その他 */}
      {btn(editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), '引用',         '❝')}
      {btn(editor.isActive('codeBlock'),  () => editor.chain().focus().toggleCodeBlock().run(),  'コードブロック', '</>')}
      {btn(false, () => editor.chain().focus().setHorizontalRule().run(), '区切り線', '—')}

      <div className="toolbar-divider" />

      {/* 文字色 */}
      <div className="color-group" title="文字色">
        <span className="color-label">A</span>
        <div className="swatches">
          {COLORS.map(c => (
            <button
              key={c}
              className="swatch"
              style={{ background: c, border: editor.isActive('textStyle', { color: c }) ? '2px solid #5865f2' : '1px solid #555' }}
              onClick={() => editor.chain().focus().setColor(c).run()}
              title={`文字色: ${c}`}
            />
          ))}
          <input
            type="color"
            className="color-input"
            title="カスタム文字色"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
        </div>
      </div>

      {/* ハイライト */}
      <div className="color-group" title="ハイライト">
        <span className="color-label">🖊</span>
        <div className="swatches">
          {HIGHLIGHT_COLORS.map(c => (
            <button
              key={c}
              className="swatch"
              style={{ background: c, border: editor.isActive('highlight', { color: c }) ? '2px solid #5865f2' : '1px solid #555' }}
              onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()}
              title={`ハイライト: ${c}`}
            />
          ))}
        </div>
      </div>

      <div className="toolbar-divider" />

      {/* 画像・リンク */}
      <button className="toolbar-btn" onClick={handleImageUpload} title="画像を挿入">🖼</button>
      <button
        className={`toolbar-btn${editor.isActive('link') ? ' active' : ''}`}
        onClick={() => {
          if (editor.isActive('link')) { editor.chain().focus().unsetLink().run(); return; }
          const url = prompt('URLを入力:', 'https://');
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}
        title="リンク"
      >🔗</button>

      <div className="toolbar-divider" />

      {/* Undo/Redo */}
      <button className="toolbar-btn" onClick={() => editor.chain().focus().undo().run()} title="元に戻す (Ctrl+Z)">↩</button>
      <button className="toolbar-btn" onClick={() => editor.chain().focus().redo().run()} title="やり直し (Ctrl+Y)">↪</button>
    </div>
  );
}
