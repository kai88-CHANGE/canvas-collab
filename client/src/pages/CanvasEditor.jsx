import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { io } from 'socket.io-client';
import Toolbar from '../components/Toolbar';
import ActiveUsers from '../components/ActiveUsers';
import { fetchCanvas } from '../api';

const SOCKET_URL = import.meta.env.PROD ? window.location.origin : 'http://localhost:3001';

export default function CanvasEditor({ canvasId, user, onBack }) {
  const [title, setTitle] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [saved, setSaved] = useState(true);
  const socketRef = useRef(null);
  const isRemoteUpdate = useRef(false);
  const saveTimer = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontSize,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      Image.configure({ resizable: true, inline: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'キャンバスに何か書いてみましょう...' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      if (isRemoteUpdate.current) return;
      setSaved(false);
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const content = JSON.stringify(editor.getJSON());
        socketRef.current?.emit('content-update', { canvasId, content });
        setSaved(true);
      }, 500);
    },
  });

  useEffect(() => {
    if (!canvasId || !editor) return;

    fetchCanvas(canvasId).then(canvas => {
      if (canvas.content) {
        try {
          isRemoteUpdate.current = true;
          editor.commands.setContent(JSON.parse(canvas.content));
          isRemoteUpdate.current = false;
        } catch {
          editor.commands.setContent('');
        }
      }
      setTitle(canvas.title || 'Untitled Canvas');
    });

    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => socket.emit('join-canvas', canvasId));

    socket.on('users-update', (users) => setActiveUsers(users));

    socket.on('content-update', ({ content, title: newTitle }) => {
      if (content !== undefined) {
        try {
          isRemoteUpdate.current = true;
          editor.commands.setContent(JSON.parse(content));
          isRemoteUpdate.current = false;
        } catch {}
      }
      if (newTitle !== undefined) setTitle(newTitle);
    });

    return () => {
      socket.disconnect();
      clearTimeout(saveTimer.current);
    };
  }, [canvasId, editor]);

  const handleTitleChange = useCallback((e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setSaved(false);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      socketRef.current?.emit('content-update', { canvasId, title: newTitle });
      setSaved(true);
    }, 500);
  }, [canvasId]);

  return (
    <div className="canvas-editor">
      <div className="editor-header">
        <button className="back-btn" onClick={onBack}>← キャンバス一覧</button>
        <input
          className="canvas-title-input"
          value={title}
          onChange={handleTitleChange}
          placeholder="タイトルを入力..."
        />
        <div className="header-right">
          <span className={`save-indicator ${saved ? 'saved' : 'saving'}`}>
            {saved ? '✓ 保存済み' : '保存中...'}
          </span>
          <ActiveUsers users={activeUsers} currentUserId={user?.id} />
        </div>
      </div>

      <Toolbar editor={editor} />

      <div className="editor-body">
        <EditorContent editor={editor} className="editor-content" />
      </div>
    </div>
  );
}
