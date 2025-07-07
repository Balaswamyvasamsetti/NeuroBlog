import React, { useEffect, useRef } from 'react';
import Quill from 'react-quill';
import * as Y from 'yjs';
import { QuillBinding } from 'y-quill';
import { WebsocketProvider } from 'y-websocket';
import 'react-quill/dist/quill.snow.css';

function Editor({ postId }) {
  const quillRef = useRef(null);
  const ydoc = new Y.Doc();

  useEffect(() => {
    const provider = new WebsocketProvider(
      process.env.NODE_ENV === 'production' ? 'wss://yourdomain.com:8081' : 'ws://app:8081',
      postId || 'new-post',
      ydoc
    );
    const ytext = ydoc.getText('quill');
    const binding = new QuillBinding(ytext, quillRef.current.getEditor());
    return () => provider.disconnect();
  }, [postId]);

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-md">
      <Quill ref={quillRef} theme="snow" className="text-black" />
    </div>
  );
}

export default Editor;