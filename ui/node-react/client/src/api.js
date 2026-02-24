const API_BASE = process.env.REACT_APP_API_URL || '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Auth
export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function register(email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function getMe() {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

// Datasets
export async function getDatasets() {
  const res = await fetch(`${API_BASE}/datasets`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch datasets');
  return res.json();
}

// Chats
export async function getChats() {
  const res = await fetch(`${API_BASE}/chats`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch chats');
  return res.json();
}

export async function getChat(id) {
  const res = await fetch(`${API_BASE}/chats/${id}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch chat');
  return res.json();
}

export async function sendMessage(chatId, query, history, docs, datasets, messageOffset) {
  const res = await fetch(`${API_BASE}/chats/${chatId}/message`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ query, history, docs, datasets, messageOffset }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || 'Chat failed');
  }
  return res.json();
}

/**
 * Send a message with streaming via Server-Sent Events.
 * Calls `onStep`, `onToken`, `onDocuments`, and `onDone` callbacks as events arrive.
 * Returns a promise that resolves when streaming is complete.
 */
export async function sendMessageStream(chatId, query, history, docs, datasets, messageOffset, callbacks) {
  const { onStep, onToken, onDocuments, onDone, onError } = callbacks;

  const res = await fetch(`${API_BASE}/chats/${chatId}/message/stream`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ query, history, docs, datasets, messageOffset }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || 'Chat stream failed');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete SSE messages (separated by double newline)
    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const message = buffer.substring(0, boundary);
      buffer = buffer.substring(boundary + 2);

      // Parse the SSE message
      let eventType = 'message';
      let dataStr = '';
      for (const line of message.split('\n')) {
        if (line.startsWith('event: ')) {
          eventType = line.substring(7).trim();
        } else if (line.startsWith('data: ')) {
          dataStr += line.substring(6);
        }
      }

      if (dataStr) {
        try {
          const parsed = JSON.parse(dataStr);
          switch (eventType) {
            case 'step':
              onStep?.(parsed.step);
              break;
            case 'token':
              onToken?.(parsed.token);
              break;
            case 'documents':
              onDocuments?.(parsed.documents);
              break;
            case 'done':
              onDone?.(parsed);
              break;
            case 'error':
              onError?.(parsed.error);
              break;
            default:
              break;
          }
        } catch (e) {
          console.error('Failed to parse SSE data:', e, dataStr);
        }
      }

      boundary = buffer.indexOf('\n\n');
    }
  }
}

export async function deleteChat(id) {
  const res = await fetch(`${API_BASE}/chats/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete chat');
  return res.json();
}

// Documents
export async function getDocuments() {
  const res = await fetch(`${API_BASE}/documents`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

export async function uploadDocuments(files, dataset) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  formData.append('dataset', dataset);

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

export async function downloadDocument(filename) {
  const res = await fetch(`${API_BASE}/documents/download/${encodeURIComponent(filename)}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function deleteDocument(filename) {
  const res = await fetch(`${API_BASE}/documents/delete`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ filename }),
  });
  if (!res.ok) throw new Error('Failed to delete document');
  return res.json();
}

// Feedback
export async function getFeedback() {
  const res = await fetch(`${API_BASE}/feedback`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch feedback');
  return res.json();
}

export async function submitFeedback(chatId, messageOffset, feedback, feedbackText) {
  const res = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      chat_id: chatId,
      message_offset: messageOffset,
      feedback,
      feedback_text: feedbackText,
    }),
  });
  if (!res.ok) throw new Error('Failed to submit feedback');
  return res.json();
}

// Config
export async function getConfig() {
  const res = await fetch(`${API_BASE}/config`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch config');
  return res.json();
}

export async function updateConfig(config, reinitialize = false) {
  const res = await fetch(`${API_BASE}/config`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ config, reinitialize }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update config');
  return data;
}