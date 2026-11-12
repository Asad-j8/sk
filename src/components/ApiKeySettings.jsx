import React, { useState } from 'react';
import { KeyIcon, CloseIcon, CheckIcon, ExternalLinkIcon, SparklesIcon, AlertCircleIcon } from './Icons';
import { getStoredApiKey, setStoredApiKey } from '../api/youtube';

export default function ApiKeySettings({ isOpen, onClose, onKeySaved, onUseDemo }) {
  const [apiKey, setApiKey] = useState(() => getStoredApiKey());
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: boolean, message: string }

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = apiKey.trim();
    setStoredApiKey(trimmed);
    if (onKeySaved) onKeySaved(trimmed);
    onClose();
  };

  const handleClear = () => {
    setApiKey('');
    setStoredApiKey('');
    setTestResult(null);
    if (onKeySaved) onKeySaved('');
  };

  const handleTestKey = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setTestResult({ success: false, message: 'Please enter an API key first.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Test key using a lightweight 1-unit channels.list call (Google Developers channel)
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=UC_x5XG1OV2P6uZZ5FSM9Ttw&key=${trimmed}`
      );
      const data = await res.json();

      if (!res.ok) {
        const errorReason = data?.error?.errors?.[0]?.reason || '';
        if (errorReason === 'keyInvalid' || res.status === 400) {
          throw new Error('Key appears invalid or revoked.');
        } else if (errorReason === 'quotaExceeded') {
          throw new Error('Key is valid, but daily quota is currently exceeded.');
        } else {
          throw new Error(data?.error?.message || 'API error verifying key.');
        }
      }

      setTestResult({ success: true, message: 'API key is valid and ready to use!' });
    } catch (err) {
      setTestResult({ success: false, message: err.message || 'Verification failed.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative flex flex-col max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-100 dark:bg-red-950/60 text-red-600 rounded-lg">
              <KeyIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                YouTube API Key Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                100% Client-side. Stored only in your browser's localStorage.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close dialog"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              YouTube Data API v3 Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestResult(null);
                }}
                placeholder="AIzaSy..."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Test verification feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {testResult.success ? (
                <CheckIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircleIcon className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Guide Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>How to get a 100% free API key:</span>
            </h4>
            <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside leading-relaxed">
              <li>
                Open the{' '}
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 dark:text-red-400 font-medium hover:underline inline-flex items-center gap-0.5"
                >
                  Google Cloud Console <ExternalLinkIcon className="w-3 h-3" />
                </a>
              </li>
              <li>Create a new project (e.g. "PodcastFinder").</li>
              <li>Go to <strong>APIs &amp; Services &gt; Library</strong> and enable <strong>YouTube Data API v3</strong>.</li>
              <li>Go to <strong>APIs &amp; Services &gt; Credentials</strong> and click <strong>Create Credentials &gt; API key</strong>.</li>
              <li>Paste the key above! You get <strong>10,000 free units/day</strong>.</li>
            </ol>
          </div>

          {/* Quick Demo Mode */}
          {onUseDemo && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onUseDemo();
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <SparklesIcon className="w-4 h-4 text-amber-500" />
                <span>Don't have a key yet? Try Instant Demo Mode</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          {apiKey ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
            >
              Clear Key
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={testing || !apiKey}
              onClick={handleTestKey}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 transition"
            >
              {testing ? 'Testing...' : 'Test Key'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 transition"
            >
              Save Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
