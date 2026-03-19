import { Store } from './storage.js';
import { generateId, getFaviconUrl, sanitizeUrl, getDomain } from './utils.js';
import { toast } from './toast.js';
import { DOM } from './dom.js';
import { bus } from './event-bus.js';

let links = [];
let topSiteLinks = [];
const TOP_SITE_LIMIT = 6;
const QUICK_LIBRARY = [
  { key: 'gmail', label: 'Gmail', url: 'https://mail.google.com' },
  { key: 'youtube', label: 'YouTube', url: 'https://youtube.com' },
  { key: 'chatgpt', label: 'ChatGPT', url: 'https://chat.openai.com' },
  { key: 'github', label: 'GitHub', url: 'https://github.com' },
  { key: 'twitter', label: 'X', url: 'https://x.com' },
  { key: 'notion', label: 'Notion', url: 'https://notion.so' },
  { key: 'whatsapp', label: 'WhatsApp', url: 'https://web.whatsapp.com' },
  { key: 'instagram', label: 'Instagram', url: 'https://instagram.com' },
  { key: 'facebook', label: 'Facebook', url: 'https://facebook.com' },
  { key: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com' },
  { key: 'discord', label: 'Discord', url: 'https://discord.com' },
  { key: 'slack', label: 'Slack', url: 'https://slack.com' },
  { key: 'spotify', label: 'Spotify', url: 'https://open.spotify.com' },
  { key: 'reddit', label: 'Reddit', url: 'https://reddit.com' },
  { key: 'tiktok', label: 'TikTok', url: 'https://tiktok.com' },
  { key: 'pinterest', label: 'Pinterest', url: 'https://pinterest.com' },
  { key: 'telegram', label: 'Telegram', url: 'https://web.telegram.org' },
  { key: 'drive', label: 'Drive', url: 'https://drive.google.com' },
  { key: 'calendar', label: 'Calendar', url: 'https://calendar.google.com' },
  { key: 'figma', label: 'Figma', url: 'https://figma.com' },
  { key: 'vscode', label: 'VS Code', url: 'https://vscode.dev' },
  { key: 'linear', label: 'Linear', url: 'https://linear.app' },
  { key: 'vercel', label: 'Vercel', url: 'https://vercel.com' },
  { key: 'openai', label: 'OpenAI', url: 'https://openai.com' },
  { key: 'claude', label: 'Claude', url: 'https://claude.ai' },
  { key: 'gemini', label: 'Gemini', url: 'https://gemini.google.com' },
  { key: 'notebooklm', label: 'NotebookLM', url: 'https://notebooklm.google.com' },
  { key: 'perplexity', label: 'Perplexity', url: 'https://perplexity.ai' },
  { key: 'amazon', label: 'Amazon', url: 'https://amazon.com' },
  { key: 'netflix', label: 'Netflix', url: 'https://netflix.com' },
  { key: 'stackoverflow', label: 'Stack Overflow', url: 'https://stackoverflow.com' },
  { key: 'leetcode', label: 'LeetCode', url: 'https://leetcode.com' },
  { key: 'codepen', label: 'CodePen', url: 'https://codepen.io' },
  { key: 'replit', label: 'Replit', url: 'https://replit.com' },
  { key: 'huggingface', label: 'HuggingFace', url: 'https://huggingface.co' },
  { key: 'medium', label: 'Medium', url: 'https://medium.com' },
  { key: 'hashnode', label: 'Hashnode', url: 'https://hashnode.com' },
  { key: 'devto', label: 'Dev.to', url: 'https://dev.to' },
  { key: 'producthunt', label: 'Product Hunt', url: 'https://producthunt.com' },
  { key: 'anthropic', label: 'Anthropic', url: 'https://anthropic.com' },
  { key: 'excalidraw', label: 'Excalidraw', url: 'https://excalidraw.com' },
  { key: 'netlify', label: 'Netlify', url: 'https://netlify.com' },
  { key: 'supabase', label: 'Supabase', url: 'https://supabase.com' },
  { key: 'railway', label: 'Railway', url: 'https://railway.app' },
  { key: 'npm', label: 'npm', url: 'https://npmjs.com' },
  { key: 'mdn', label: 'MDN', url: 'https://developer.mozilla.org' },
  { key: 'cloudflare', label: 'Cloudflare', url: 'https://cloudflare.com' },
  { key: 'twitch', label: 'Twitch', url: 'https://twitch.tv' },
  { key: 'maps', label: 'Maps', url: 'https://maps.google.com' },
  { key: 'translate', label: 'Translate', url: 'https://translate.google.com' },
];

const MONO_ICONS = {
  gmail: `<svg viewBox="0 0 24 24" fill="white"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" fill="white"><path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C16.8 5 12 5 12 5s-4.8 0-7 .1c-.4.1-1.2.1-2 .9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.2.8C6.8 19 12 19 12 19s4.8 0 7-.2c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8zM10 15V9l5.2 3-5.2 3z"/></svg>`,
  chatgpt: `<svg viewBox="0 0 24 24" fill="white"><path d="M22.28 9.29a5.76 5.76 0 00-.49-4.72 5.8 5.8 0 00-6.24-2.78A5.76 5.76 0 0011.34 0a5.8 5.8 0 00-5.53 4.02 5.76 5.76 0 00-3.84 2.79 5.8 5.8 0 00.71 6.8 5.76 5.76 0 00.49 4.71 5.8 5.8 0 006.24 2.78 5.76 5.76 0 004.21 1.8 5.8 5.8 0 005.53-4.03 5.76 5.76 0 003.84-2.78 5.8 5.8 0 00-.71-6.8zm-8.94 12.5a4.3 4.3 0 01-2.76-1c.04-.02.1-.05.14-.08l4.58-2.64a.74.74 0 00.38-.65v-6.44l1.94 1.12a.07.07 0 01.04.05v5.34a4.32 4.32 0 01-4.32 4.3zm-9.29-3.96a4.3 4.3 0 01-.51-2.88l.13.08 4.58 2.64a.76.76 0 00.76 0l5.59-3.23v2.24a.07.07 0 01-.03.06L10 18.95a4.32 4.32 0 01-5.95-1.12zm-1.21-10.1a4.3 4.3 0 012.24-1.89v5.41a.74.74 0 00.38.65l5.59 3.22-1.94 1.12a.07.07 0 01-.07 0L4.86 13.6a4.32 4.32 0 01-.02-5.87zm15.96 3.7l-5.59-3.23 1.94-1.11a.07.07 0 01.07 0l4.28 2.47a4.3 4.3 0 01-.66 7.76V11.1a.74.74 0 00-.04-.67zm1.93-2.9l-.13-.08-4.57-2.66a.76.76 0 00-.76 0L10.18 8.8V6.57a.07.07 0 01.03-.06L14.49 4a4.32 4.32 0 016.24 4.53zm-12.1 3.98l-1.94-1.12a.07.07 0 01-.04-.05V5.99a4.32 4.32 0 017.08-3.32l-.13.08-4.58 2.64a.74.74 0 00-.38.65zm1.05-2.27l2.49-1.44 2.49 1.43v2.87l-2.49 1.43-2.49-1.43z"/></svg>`,
  github: `<svg viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.1-1.46-1.1-1.46-.9-.62.07-.6.07-.6 1 .07 1.52 1.02 1.52 1.02.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.02-2.68-.1-.25-.44-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0112 6.8c.85 0 1.7.11 2.5.33 1.9-1.29 2.74-1.02 2.74-1.02.54 1.37.2 2.39.1 2.64.63.7 1.02 1.59 1.02 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10.01 10.01 0 0022 12c0-5.52-4.48-10-10-10z"/></svg>`,
  twitter: `<svg viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  notion: `<svg viewBox="0 0 24 24" fill="white"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933z"/></svg>`,
  whatsapp: `<svg viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
  discord: `<svg viewBox="0 0 24 24" fill="white"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`,
  slack: `<svg viewBox="0 0 24 24" fill="white"><path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.165 0a2.528 2.528 0 012.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.165a2.528 2.528 0 01-2.522 2.523h-6.313z"/></svg>`,
  spotify: `<svg viewBox="0 0 24 24" fill="white"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>`,
  reddit: `<svg viewBox="0 0 24 24" fill="white"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" fill="white"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`,
  pinterest: `<svg viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>`,
  telegram: `<svg viewBox="0 0 24 24" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`,
  drive: `<svg viewBox="0 0 24 24" fill="white"><path d="M6.28 3L0 14l4.38 7 1.11-1.97L2.54 14 8.09 4.5zm1.55.02L3.09 11h11.22l-2.27-3.97zm8.31 1.87L22 14l-6.27 3.53L14.63 16l4.84-2.72-4.06-7.03zM0 15.45L2.54 19.5h18.92L24 14l-1.74-1-2.46 4.28H4.2L1.74 14.45z"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="white"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>`,
  figma: `<svg viewBox="0 0 24 24" fill="white"><path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V8.981H8.148zm5.872 15.019c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49 4.49 2.014 4.49 4.49-2.014 4.49-4.49 4.49zm0-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.019 3.019 3.019 3.019-1.355 3.019-3.019-1.354-3.019-3.019-3.019z"/></svg>`,
  vscode: `<svg viewBox="0 0 24 24" fill="white"><path d="M23.15 2.587L18.21.21a1.494 1.494 0 00-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 00-1.276.057L.327 7.261A1 1 0 00.326 8.74L3.899 12 .326 15.26a1 1 0 00.001 1.479L1.65 17.94a.999.999 0 001.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 001.704.29l4.942-2.377A1.5 1.5 0 0024 20.06V3.939a1.5 1.5 0 00-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/></svg>`,
  linear: `<svg viewBox="0 0 24 24" fill="white"><path d="M3.53 16.27a.14.14 0 01.2 0l3.83 3.83c.28.28.07.77-.33.74A9.18 9.18 0 013.53 16.27zm-1.13-2.18c-.06.18-.01.39.13.53l6.86 6.86c.14.14.35.19.53.13A9.18 9.18 0 0113.4 20L4 10.6a9.18 9.18 0 01-1.6 3.49zM2.06 11C2 11.17 2 11.35 2 11.53v.04L12.43 22h.04c.18 0 .36 0 .53-.06L2.06 11zM22 11.53C22 6.27 17.73 2 12.47 2A9.53 9.53 0 002 11.53L12.47 22A9.53 9.53 0 0022 11.53z"/></svg>`,
  vercel: `<svg viewBox="0 0 24 24" fill="white"><path d="M24 22.525H0l12-21.05 12 21.05z"/></svg>`,
  openai: `<svg viewBox="0 0 24 24" fill="white"><path d="M22.28 9.29a5.76 5.76 0 00-.49-4.72 5.8 5.8 0 00-6.24-2.78A5.76 5.76 0 0011.34 0a5.8 5.8 0 00-5.53 4.02 5.76 5.76 0 00-3.84 2.79 5.8 5.8 0 00.71 6.8 5.76 5.76 0 00.49 4.71 5.8 5.8 0 006.24 2.78 5.76 5.76 0 004.21 1.8 5.8 5.8 0 005.53-4.03 5.76 5.76 0 003.84-2.78 5.8 5.8 0 00-.71-6.8z"/></svg>`,
  amazon: `<svg viewBox="0 0 24 24" fill="white"><path d="M13.958 10.09c0 1.232.029 2.256-.591 3.351-.502.891-1.301 1.438-2.186 1.438-1.214 0-1.922-.924-1.922-2.292 0-2.692 2.415-3.182 4.699-3.182v.685zm3.186 7.705c-.209.189-.512.201-.745.074-1.052-.872-1.238-1.276-1.814-2.106-1.734 1.767-2.962 2.297-5.209 2.297-2.66 0-4.731-1.641-4.731-4.925 0-2.565 1.391-4.309 3.37-5.164 1.715-.754 4.11-.891 5.942-1.099v-.41c0-.753.06-1.642-.383-2.294-.385-.579-1.124-.82-1.775-.82-1.205 0-2.277.618-2.54 1.897-.054.285-.261.567-.547.582l-3.065-.333c-.259-.058-.548-.266-.472-.66.704-3.716 4.06-4.835 7.066-4.835 1.537 0 3.547.41 4.758 1.574 1.538 1.436 1.392 3.352 1.392 5.438v4.923c0 1.481.616 2.13 1.192 2.929.204.287.249.63-.01.839-.647.541-1.794 1.537-2.421 2.098l-.008-.006zm3.559 1.526C18.489 21.17 15.057 22 12.001 22 7.434 22 3.329 20.287.5 17.438c-.23-.217-.025-.513.252-.345 2.994 1.743 6.696 2.789 10.517 2.789 2.578 0 5.413-.535 8.024-1.643.394-.167.724.258.41.571zm.93-2.605c-.315-.404-2.083-.191-2.879-.096-.241.028-.278-.181-.061-.333 1.41-.99 3.723-.705 3.99-.373.268.334-.073 2.649-1.394 3.752-.203.17-.396.08-.306-.144.298-.744.964-2.402.65-2.806z"/></svg>`,
  claude: `<svg viewBox="0 0 24 24" fill="white"><path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.144-2.339-.192-1.833-.23v-.304l1.055-.095 2.514-.224 2.562-.192 1.928-.16.784-.064.16-.144-.16-.128-.784-.048-1.504-.176-2.786-.271-2.338-.32-1.521-.384v-.318l.48-.064 2.291-.16 2.818-.144 2.978-.064h.656l.144-.128-.144-.128H9.2l-2.482-.144-2.45-.224L2.53 9.2l-1.696-.432V8.48l2.386-.384 2.978-.336 2.434-.224 1.888-.128.144-.128-.144-.128-1.888-.16-2.291-.256-2.625-.336L1.28 6.4V6.08l2.082-.576 2.77-.432 2.834-.288 2.13-.128.16-.128-.16-.16L8.96 4.24l-2.434-.32-1.888-.352-1.008-.272V3.04l1.104-.208 2.258-.288 2.45-.224 2.13-.128 1.696-.064.8-.016.144-.16L19.04 0l.576.016.464.048.272.064.16.128-.16.16-.272.064-.896.16-2.258.272-2.178.304-1.664.288-1.008.224-.144.128.144.16 1.008.208 1.664.336 2.178.384 2.258.448.896.224.272.096.16.16-.16.128-.272.032-.464.016-.576-.016-1.392-.064-2.338-.192-2.754-.272-2.594-.368-1.152-.24v-.224l.912.064 1.696.16 2.386.224 2.402.192.8.048.144.128-.144.16-.8.016-1.696.048-2.13.096-2.45.176-2.258.24-1.104.176v.256l.912.192 1.888.272 2.434.272 2.402.224.8.048.144.128-.144.16-.8.016-1.888.064-2.13.096-2.434.192-2.082.224v.288l1.696.272 2.625.32 2.291.288 1.888.224.144.128-.144.128h-.656l-2.978.048-2.818.112-2.291.144-.48.048v.288l1.521.352 2.338.304 2.786.256 1.504.16.784.048.16.128-.16.128-.784.064-1.928.144-2.562.176-2.514.208-1.055.096v.304l1.833.224 2.339.192 2.698.144.79.048h.229l.08.128-.08.224-4.72 2.647-.16.304.16.144 1.168-.672 3.04-1.76 2.978-1.728 2.338-1.36 1.344-.784.48-.272.16.064-.064.208-.384.48-.96 1.232-1.76 2.258-2.082 2.674-1.344 1.728-.16.272.128.208.256-.064.688-.784 1.712-1.952 2.434-2.658 2.338-2.562.912-1.008.16-.144.16.08-.08.304-.56.88-1.504 2.37-2.082 3.28-1.36 2.146-.16.256.08.208.272-.048.56-.8 1.36-2.146 2.082-3.28 1.504-2.37.56-.88.08-.304.16-.08.16.144.912 1.008 2.338 2.562 2.434 2.658 1.712 1.952.688.784.256.064.128-.208-.16-.272-1.344-1.728-2.082-2.674-1.76-2.258-.96-1.232-.384-.48-.064-.208.16-.064.48.272 1.344.784 2.338 1.36 2.978 1.728 3.04 1.76 1.168.672.16-.144-.16-.304z"/></svg>`,
  gemini: `<svg viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c.34 0 .672.02 1 .057V12L7.586 7.586A9.96 9.96 0 0112 2zm-8.943 8.057L8.414 12l-5.357 1.943A9.96 9.96 0 013 12c0-2.04.61-3.935 1.057-1.943zM12 22a9.96 9.96 0 01-6.414-2.586L12 13.414l6.414 6A9.96 9.96 0 0112 22zm8.943-8.057L15.586 12l5.357-1.943A9.96 9.96 0 0121 12c0 2.04-.61 3.935-1.057 1.943z"/></svg>`,
  notebooklm: `<svg viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>`,
  perplexity: `<svg viewBox="0 0 24 24" fill="white"><path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10zm-10-6l-6 6h4v4h4v-4h4l-6-6z"/></svg>`,
  netflix: `<svg viewBox="0 0 24 24" fill="white"><path d="M6 2h4l4 12V2h4v20h-4L10 10v12H6z"/></svg>`,
  stackoverflow: `<svg viewBox="0 0 24 24" fill="white"><path d="M18.986 21.865v-6.404h2.134V24H1.844v-8.539h2.13v6.404h15.012zM6.111 19.731H16.85v-2.137H6.111v2.137zm.259-4.852l10.48 2.189.451-2.07-10.478-2.187-.453 2.068zm1.359-5.056l9.705 4.53.903-1.95-9.706-4.53-.902 1.95zm2.715-4.785l8.217 6.855 1.359-1.62-8.216-6.853-1.36 1.618zM15.751 0l-1.746 1.294 6.405 8.604 1.746-1.294L15.751 0z"/></svg>`,
  leetcode: `<svg viewBox="0 0 24 24" fill="white"><path d="M13.483 0a1.374 1.374 0 00-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 00-1.209 2.104 5.35 5.35 0 00-.125 2.236 5.456 5.456 0 00.56 1.938 5.422 5.422 0 001.03 1.538l.17.176 5.096 5.234a1.376 1.376 0 001.962 0l.17-.174 5.093-5.234a5.424 5.424 0 001.028-1.538 5.454 5.454 0 00.56-1.938 5.347 5.347 0 00-.124-2.236 5.267 5.267 0 00-1.208-2.104L13.481.438A1.374 1.374 0 0013.483 0zm-.237 5.48l4.4 4.716a3.033 3.033 0 01.7 1.215c.127.476.148.973.063 1.458a3.139 3.139 0 01-.322 1.116 3.124 3.124 0 01-.594.887l-4.4 4.529-4.4-4.53a3.123 3.123 0 01-.594-.886 3.14 3.14 0 01-.321-1.116 3.06 3.06 0 01.063-1.458 3.033 3.033 0 01.699-1.215l4.4-4.716h.306z"/></svg>`,
  codepen: `<svg viewBox="0 0 24 24" fill="white"><path d="M24 8.182l-.018-.087-.017-.05c-.01-.024-.018-.05-.03-.075l-.023-.044-.03-.038-.035-.038-.04-.03-.05-.03-.063-.017-.065-.012H.524l-.066.014-.066.02-.06.026-.048.026-.043.032-.04.04-.03.045-.026.05-.02.06-.016.07L0 8.165v7.768l.006.06.016.06.026.053.034.05.04.04.04.03.052.026.056.02.06.01.067.012h22.84l.065-.01.06-.015.056-.022.05-.026.044-.03.04-.04.033-.05.024-.06.016-.064.006-.057v-7.8l-.018-.08zm-13.748 4.765l-3.322-2.23 3.322-2.228v4.458zm.834-4.938l3.273 2.198-3.273 2.196V8.01zm-4.88 3.395l-2.7 1.812V9.588l2.7 1.817zm9.947 1.812l-2.698-1.813 2.698-1.816v3.629z"/></svg>`,
  replit: `<svg viewBox="0 0 24 24" fill="white"><path d="M2.189 0A2.189 2.189 0 000 2.189v7.773a2.189 2.189 0 002.189 2.189h7.773V2.189A2.189 2.189 0 007.773 0H2.189zm9.962 0v12.151h9.66A2.189 2.189 0 0024 9.962V2.189A2.189 2.189 0 0021.811 0h-9.66zM0 14.038v7.773A2.189 2.189 0 002.189 24h7.773v-9.962H0zm14.038 0V24h7.773A2.189 2.189 0 0024 21.811v-7.773h-9.962z"/></svg>`,
  huggingface: `<svg viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm-3 6a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2zm-7.5 4.5c.5 2.5 2.5 4 4.5 4s4-1.5 4.5-4H7.5z"/></svg>`,
  medium: `<svg viewBox="0 0 24 24" fill="white"><path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/></svg>`,
  hashnode: `<svg viewBox="0 0 24 24" fill="white"><path d="M22.351 8.019l-6.37-6.37a5.63 5.63 0 00-7.962 0l-6.37 6.37a5.63 5.63 0 000 7.962l6.37 6.37a5.63 5.63 0 007.962 0l6.37-6.37a5.63 5.63 0 000-7.962zM12 15.953a3.953 3.953 0 110-7.906 3.953 3.953 0 010 7.906z"/></svg>`,
  devto: `<svg viewBox="0 0 24 24" fill="white"><path d="M7.826 10.083a.784.784 0 00-.468-.175h-.701v4.198h.701a.786.786 0 00.468-.175c.155-.117.233-.292.233-.525v-2.798c.001-.233-.078-.408-.233-.525zM24 0v24H0V0h24zM8.427 13.7c-.292.35-.7.525-1.225.525H5.599V9.775h1.603c.525 0 .933.175 1.225.525.291.35.437.817.437 1.399v.6c0 .584-.145 1.052-.437 1.401zm5.53-.757c0 .408-.092.725-.274.952-.183.226-.441.34-.777.34-.334 0-.591-.114-.773-.34-.183-.227-.274-.544-.274-.952V9.775h-1.106v3.162c0 .642.162 1.14.487 1.494.325.354.785.53 1.379.53s1.053-.176 1.377-.53c.324-.353.486-.851.486-1.494V9.775h-1.106v3.168zM19 9.775h-1.106v2.65l-1.49-2.65h-1.107v4.449h1.106v-2.65l1.49 2.65H19z"/></svg>`,
  producthunt: `<svg viewBox="0 0 24 24" fill="white"><path d="M13.604 8.4h-3.405V12h3.405c.995 0 1.801-.806 1.801-1.8S14.6 8.4 13.604 8.4zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 14.4h-3.405V18H7.8V6h5.804c2.319 0 4.2 1.881 4.2 4.2s-1.881 4.2-4.2 4.2z"/></svg>`,
  anthropic: `<svg viewBox="0 0 24 24" fill="white"><path d="M14.565 2.738L24 21.262h-4.928l-1.698-3.205H6.626l-1.698 3.205H0L9.435 2.738h5.13zm-2.565 4.81l-3.253 6.14h6.506l-3.253-6.14z"/></svg>`,
  excalidraw: `<svg viewBox="0 0 24 24" fill="white"><path d="M20.723 3.194a1.01 1.01 0 00-1.428 0L3.194 19.295a1.01 1.01 0 000 1.428l.083.083a1.01 1.01 0 001.428 0L20.806 4.705a1.01 1.01 0 000-1.428l-.083-.083zM6 2L2 6v2l4-4 2 2-4 4v2l6-6-2-2 2-2H6zm10 14l-2 2 2 2h2l4-4v-2l-4 4-2-2 4-4v-2l-4 6z"/></svg>`,
  netlify: `<svg viewBox="0 0 24 24" fill="white"><path d="M16.934 8.519a1.044 1.044 0 01.303.23l2.349-1.045-2.192-2.171-.491 2.954zM12.06 6.546a1.305 1.305 0 01.209.574l3.497 1.482a1.044 1.044 0 01.355-.177l.574-3.55-2.13-2.234-2.505 3.905zM7.481 11.44l-.766-2.688-3.388 2.135-.002.006 4.156.547zm5.29-4.675L9.284 10.16l1.15 4.046 4.746.624 1.823-3.816-3.918-1.663a1.3 1.3 0 01-.314.214zM0 13.397v2.323l1.501-1.501L0 13.397zm8.375 1.193a1.305 1.305 0 01-.46-.693l-4.548-.599L0 17.216v1.77l6.744-3.56 1.631-2.836zm.182 1.086l-1.4 2.432 2.897-1.53-1.497-1.5zm7.632-3.443l-1.728 3.617 3.231 1.297 2.557-2.432-4.06-2.482zm3.084 5.58l-3.55-1.426-.726 1.522 4.276.562v-.658zm2.727-6.432l-2.38 1.06a1.044 1.044 0 01-.06.72l4.032 2.465.308-.308v-3.141l-1.9-2.354v1.558zm0 7.5v1.7l1.968-1.967-1.967.267zM24 10.56v-.52l-.974-.982-1.93 1.93 1.3 1.308L24 10.56zm-11.354 9.39l-1.312 1.312.652.738h.66v-2.05zm2.114-.978l-.948-.946-2.624 2.623v1.35l.46.001 3.112-3zM12 21.612l-1.04 1.038.318.35H12v-1.388zm3.793-2.165l-4.008 3.876.386.677h.577l4.233-4.233-.966-.656-.222.336z"/></svg>`,
  supabase: `<svg viewBox="0 0 24 24" fill="white"><path d="M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C-.33 13.427.65 15.455 2.409 15.455h9.579l.113 7.51c.014.985 1.259 1.408 1.873.636l9.262-11.653c1.093-1.375.113-3.403-1.645-3.403h-9.58L11.9 1.036z"/></svg>`,
  railway: `<svg viewBox="0 0 24 24" fill="white"><path d="M0 11.5C0 5.148 5.148 0 11.5 0S23 5.148 23 11.5 17.852 23 11.5 23 0 17.852 0 11.5zm18.95 3.087L7.863 6.837a7.717 7.717 0 00-2.66 4.663h13.584c0-.318-.278-.913-.278-.913zm-13.79 1.826c.602 1.694 1.74 3.135 3.246 4.133l1.586-4.133H5.16zm5.55 4.734a7.74 7.74 0 003.05.003l-1.526-3.975-1.524 3.972zm4.425-.6a7.717 7.717 0 003.248-4.137h-4.834l1.586 4.136z"/></svg>`,
  npm: `<svg viewBox="0 0 24 24" fill="white"><path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"/></svg>`,
  mdn: `<svg viewBox="0 0 24 24" fill="white"><path d="M12 0L1.5 6v12L12 24l10.5-6V6L12 0zm0 2.25L20.625 7.5v9L12 21.75 3.375 16.5v-9L12 2.25zM8.625 8.25v7.5h1.5v-3h3.75v3h1.5v-7.5h-1.5v3H10.125v-3z"/></svg>`,
  cloudflare: `<svg viewBox="0 0 24 24" fill="white"><path d="M16.478 15.126l.914-3.131c.101-.345.057-.661-.12-.892-.17-.222-.445-.344-.775-.344H5.765a.23.23 0 00-.222.166.232.232 0 00.104.257l.988.56c.427.245.68.692.68 1.176v.009a1.37 1.37 0 01-1.37 1.37H3.22a.232.232 0 00-.228.275l.7 3.568a.46.46 0 00.452.372h10.18c.42 0 .8-.285.913-.69zM20.89 9.68c-.07 0-.14.003-.21.008a3.39 3.39 0 00-3.168-2.188 3.343 3.343 0 00-1.406.31A4.744 4.744 0 0011.44 5.5a4.745 4.745 0 00-4.745 4.745c0 .04.002.08.003.12A3.39 3.39 0 003.11 13.75h17.78a3.39 3.39 0 000-6.78v.71z"/></svg>`,
  twitch: `<svg viewBox="0 0 24 24" fill="white"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>`,
  maps: `<svg viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
  translate: `<svg viewBox="0 0 24 24" fill="white"><path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>`,
};

let managePanelEl = null;
let managePanelOpen = false;
let manageAddedGridEl = null;
let manageLibraryGridEl = null;
let manageUrlInputEl = null;
let manageNameInputEl = null;
let manageAddedEmptyEl = null;
let manageLibrarySearchEl = null;
let manageLibraryEmptyEl = null;
const manageAddedTiles = new Map();
const manageLibraryTiles = new Map();

const ICON_KEY_ALIASES = {
  twitter: ['x.com', 'twitter.com'],
  chatgpt: ['chat.openai.com', 'chatgpt.com'],
  openai: ['openai.com'],
  devto: ['dev.to'],
  mdn: ['developer.mozilla.org', 'developer.mozilla'],
  maps: ['maps.google'],
  translate: ['translate.google'],
  gmail: ['mail.google.com', 'gmail.com'],
  drive: ['drive.google.com'],
  calendar: ['calendar.google.com'],
  notion: ['notion.so', 'notion.site'],
  npm: ['npmjs.com'],
  vscode: ['vscode.dev', 'code.visualstudio.com'],
  netlify: ['netlify.com', 'netlify.app'],
  railway: ['railway.app'],
  huggingface: ['huggingface.co'],
  stackoverflow: ['stackoverflow.com'],
  notebooklm: ['notebooklm.google.com', 'notebooklm.google'],
  perplexity: ['perplexity.ai'],
};

function getDefaultLinks() {
  return [
    {
      id: generateId(),
      key: 'youtube',
      title: 'YouTube',
      url: 'https://youtube.com',
      favicon: getFaviconUrl('https://youtube.com'),
      isApp: true
    },
    {
      id: generateId(),
      key: 'gmail',
      title: 'Gmail',
      url: 'https://mail.google.com',
      favicon: getFaviconUrl('https://mail.google.com'),
      isApp: true
    },
    {
      id: generateId(),
      key: 'chatgpt',
      title: 'ChatGPT',
      url: 'https://chat.openai.com',
      favicon: getFaviconUrl('https://chat.openai.com'),
      isApp: true
    }
  ];
}

function ensureQuicklinksStructure() {
  return Boolean(DOM.sidebarGrid && DOM.bottomGrid);
}

function ensureQuicklinksStyles() {
  if (document.querySelector('link[data-quicklinks-css="true"]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime?.getURL ? chrome.runtime.getURL('modules/quicklinks.css') : 'modules/quicklinks.css';
  link.dataset.quicklinksCss = 'true';
  document.head.appendChild(link);
}

function normalizeIconKey(key) {
  if (!key) return '';
  const lowered = String(key).toLowerCase();
  if (lowered === 'x') return 'twitter';
  return lowered;
}

function getNormalizedDomain(url) {
  try {
    return new URL(sanitizeUrl(url)).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function resolveIconKey(link) {
  const explicitKey = normalizeIconKey(link?.key);
  if (explicitKey && MONO_ICONS[explicitKey]) return explicitKey;

  const url = String(link?.url || '').toLowerCase();
  const domain = getNormalizedDomain(url);
  if (!domain) return null;

  for (const [iconKey, patterns] of Object.entries(ICON_KEY_ALIASES)) {
    if (patterns.some((pattern) => domain.includes(pattern) || url.includes(pattern))) {
      return iconKey;
    }
  }

  for (const iconKey of Object.keys(MONO_ICONS)) {
    if (domain.includes(iconKey) || url.includes(iconKey)) {
      return iconKey;
    }
  }

  return null;
}

function getLinkById(id) {
  return links.find((link) => link.id === id)
    || topSiteLinks.find((link) => link.id === id)
    || null;
}

function isRenderableTopSite(site) {
  if (!site?.url) return false;
  try {
    const parsed = new URL(site.url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function mapTopSite(site) {
  const url = site.url;
  return {
    id: `topsite:${encodeURIComponent(url)}`,
    title: site.title?.trim() || getDomain(url) || 'Top Site',
    url,
    favicon: getFaviconUrl(url),
    isApp: false,
    isTopSite: true,
  };
}

async function loadTopSiteLinks() {
  const items = await new Promise((resolve) => {
    chrome.topSites.get((sites) => resolve(Array.isArray(sites) ? sites : []));
  });

  const seen = new Set();
  return items
    .filter(isRenderableTopSite)
    .filter((site) => {
      if (seen.has(site.url)) return false;
      seen.add(site.url);
      return true;
    })
    .map(mapTopSite);
}

function migrateStoredLinks(stored) {
  if (!Array.isArray(stored) || stored.length === 0) return getDefaultLinks();
  return stored.filter((link) => link?.isApp === true);
}

function setTileIcon(iconEl, link) {
  if (!iconEl) return;
  iconEl.innerHTML = '';
  const iconKey = resolveIconKey(link);

  if (iconKey && MONO_ICONS[iconKey]) {
    iconEl.innerHTML = MONO_ICONS[iconKey];
    const svgEl = iconEl.querySelector('svg');
    if (svgEl) svgEl.style.cssText = 'width:22px;height:22px;opacity:0.9;';
    return;
  }

  const domain = getNormalizedDomain(link?.url || '');
  if (!domain) return;
  const img = document.createElement('img');
  img.className = 'quicklink-favicon';
  img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  img.alt = '';
  img.loading = 'lazy';
  img.onerror = () => {
    img.style.display = 'none';
  };
  iconEl.appendChild(img);
}

function inferLinkKey(url) {
  return resolveIconKey({ url }) || undefined;
}

function getAppLinks() {
  return links.filter((link) => link.isApp);
}

function updateManageButtonState() {
  const manageBtn = DOM.manageQuicklinksBtn;
  if (!manageBtn) return;
  manageBtn.classList.toggle('is-manage-open', managePanelOpen);
  manageBtn.setAttribute('aria-expanded', String(managePanelOpen));
}

function createManageAddedTile(link) {
  const item = document.createElement('div');
  item.className = 'manage-link-item';
  item.dataset.linkId = link.id;

  const iconWrap = document.createElement('div');
  iconWrap.className = 'manage-link-icon-wrap';

  const removeBtn = document.createElement('button');
  removeBtn.className = 'manage-link-remove';
  removeBtn.type = 'button';
  removeBtn.textContent = '−';
  removeBtn.setAttribute('aria-label', 'Remove quick link');
  removeBtn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    removeLink(item.dataset.linkId);
  });

  const name = document.createElement('span');
  name.className = 'manage-link-name';

  item.append(iconWrap, removeBtn, name);
  return item;
}

function updateManageAddedTile(item, link) {
  item.dataset.linkId = link.id;
  const iconWrap = item.querySelector('.manage-link-icon-wrap');
  const name = item.querySelector('.manage-link-name');
  if (iconWrap instanceof HTMLElement) {
    setTileIcon(iconWrap, link);
  }
  if (name instanceof HTMLElement) {
    name.textContent = link.title;
  }
}

function syncManageAddedGrid() {
  if (!manageAddedGridEl) return;
  const targetLinks = getAppLinks();
  manageAddedEmptyEl && (manageAddedEmptyEl.style.display = targetLinks.length === 0 ? 'block' : 'none');

  targetLinks.forEach((link, index) => {
    let node = manageAddedTiles.get(link.id);
    if (!node) {
      node = createManageAddedTile(link);
      manageAddedTiles.set(link.id, node);
    }
    updateManageAddedTile(node, link);
    const atIndex = manageAddedGridEl.children[index];
    if (atIndex !== node) {
      manageAddedGridEl.insertBefore(node, atIndex || null);
    }
  });

  const activeIds = new Set(targetLinks.map((link) => link.id));
  [...manageAddedTiles.entries()].forEach(([id, node]) => {
    if (activeIds.has(id)) return;
    node.remove();
    manageAddedTiles.delete(id);
  });
}

function setManageLibraryEmptyState(visible) {
  if (!manageLibraryEmptyEl) return;
  manageLibraryEmptyEl.style.display = visible ? 'block' : 'none';
}

function applyManageLibraryFilter() {
  const query = (manageLibrarySearchEl?.value || '').trim().toLowerCase();
  let visibleCount = 0;
  QUICK_LIBRARY.forEach((entry) => {
    const node = manageLibraryTiles.get(entry.key);
    if (!node) return;
    const label = (entry.label || '').toLowerCase();
    const matches = !query || label.includes(query) || entry.key.includes(query);
    node.style.display = matches ? 'flex' : 'none';
    if (matches) visibleCount += 1;
  });
  setManageLibraryEmptyState(visibleCount === 0);
  return visibleCount;
}

function animateManageLibraryItems() {
  if (!manageLibraryGridEl || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const libraryItems = Array.from(manageLibraryGridEl.querySelectorAll('.manage-library-item'))
    .filter((item) => item instanceof HTMLElement && item.style.display !== 'none');

  libraryItems.forEach((item, i) => {
    const delay = i * 18;
    item.style.opacity = '0';
    item.style.transform = 'scale(0.85)';
    item.style.transition = `opacity 180ms ease ${delay}ms, transform 180ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        item.style.opacity = '1';
        item.style.transform = 'scale(1)';
      });
    });
    setTimeout(() => {
      item.style.transition = '';
    }, delay + 240);
  });
}

function showManageLibraryAddFeedback(item) {
  const iconWrap = item.querySelector('.manage-library-icon-wrap');
  if (!(iconWrap instanceof HTMLElement)) return;
  const original = iconWrap.innerHTML;
  iconWrap.innerHTML = `<svg viewBox="0 0 24 24" fill="white" width="22" height="22"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
  item.classList.add('manage-library-item-added');
  setTimeout(() => {
    iconWrap.innerHTML = original;
    item.classList.remove('manage-library-item-added');
  }, 800);
}

function createManageLibraryTile(entry) {
  const label = entry.label || entry.title || entry.key;
  const item = document.createElement('button');
  item.type = 'button';
  item.className = 'manage-library-item';
  item.dataset.libraryKey = entry.key;
  item.dataset.label = label;
  item.title = label;
  item.setAttribute('aria-label', `Add ${label}`);

  const iconWrap = document.createElement('div');
  iconWrap.className = 'manage-library-icon-wrap';
  item.append(iconWrap);
  item.addEventListener('mouseenter', () => {
    if (item.classList.contains('manage-library-item-added')) return;
    item.style.transform = 'scale(1.08)';
    item.style.background = 'rgba(255,255,255,0.13)';
  });
  item.addEventListener('mouseleave', () => {
    if (item.classList.contains('manage-library-item-added')) return;
    item.style.transform = 'scale(1)';
    item.style.background = 'rgba(255,255,255,0.07)';
  });
  item.addEventListener('click', () => {
    const added = addLibraryLink(entry);
    if (added) showManageLibraryAddFeedback(item);
  });
  return item;
}

function updateManageLibraryTile(item, entry) {
  const iconWrap = item.querySelector('.manage-library-icon-wrap');
  if (iconWrap instanceof HTMLElement) {
    setTileIcon(iconWrap, {
      key: entry.key,
      title: entry.label || entry.title || entry.key,
      url: entry.url,
    });
  }
}

function syncManageLibraryGrid() {
  if (!manageLibraryGridEl) return;
  QUICK_LIBRARY.forEach((entry, index) => {
    let node = manageLibraryTiles.get(entry.key);
    if (!node) {
      node = createManageLibraryTile(entry);
      manageLibraryTiles.set(entry.key, node);
    }
    updateManageLibraryTile(node, entry);
    const atIndex = manageLibraryGridEl.children[index];
    if (atIndex !== node) {
      manageLibraryGridEl.insertBefore(node, atIndex || null);
    }
  });
  const activeKeys = new Set(QUICK_LIBRARY.map((entry) => entry.key));
  [...manageLibraryTiles.entries()].forEach(([key, node]) => {
    if (activeKeys.has(key)) return;
    node.remove();
    manageLibraryTiles.delete(key);
  });
  applyManageLibraryFilter();
}

function renderManagePanel() {
  if (!managePanelEl) return;
  syncManageAddedGrid();
  syncManageLibraryGrid();
}

function addLibraryLink(entry) {
  const label = entry.label || entry.title || entry.key;
  const normalizedUrl = sanitizeUrl(entry.url);
  const exists = links.some((link) => link.isApp && sanitizeUrl(link.url) === normalizedUrl);
  if (exists) {
    toast.info(`${label} is already added`);
    return false;
  }
  links.unshift({
    id: generateId(),
    key: normalizeIconKey(entry.key),
    title: label,
    url: normalizedUrl,
    favicon: getFaviconUrl(normalizedUrl),
    isApp: true,
  });
  persistLinks();
  renderLinks();
  toast.success(`${label} added`);
  return true;
}

function addCustomLinkFromPanel() {
  if (!manageUrlInputEl || !manageNameInputEl) return;
  const rawUrl = manageUrlInputEl.value.trim();
  if (!rawUrl) {
    toast.error('URL cannot be empty');
    return;
  }

  const normalizedUrl = sanitizeUrl(rawUrl);
  const title = manageNameInputEl.value.trim() || getDomain(normalizedUrl) || 'Link';
  const exists = links.some((link) => link.isApp && sanitizeUrl(link.url) === normalizedUrl);
  if (exists) {
    toast.info('This link is already in Quick Links');
    return;
  }

  links.unshift({
    id: generateId(),
    key: inferLinkKey(normalizedUrl),
    title,
    url: normalizedUrl,
    favicon: getFaviconUrl(normalizedUrl),
    isApp: true,
  });
  persistLinks();
  renderLinks();
  manageUrlInputEl.value = '';
  manageNameInputEl.value = '';
  manageUrlInputEl.focus();
  toast.success('Link added!');
}

function closeManagePanel() {
  managePanelOpen = false;
  if (managePanelEl) {
    managePanelEl.classList.remove('open');
    managePanelEl.setAttribute('aria-hidden', 'true');
    managePanelEl.style.opacity = '';
    managePanelEl.style.transform = '';
    managePanelEl.style.transition = '';
  }
  updateManageButtonState();
}

function openManagePanel() {
  const panel = ensureManagePanel();
  managePanelOpen = true;
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  renderManagePanel();
  panel.style.opacity = '0';
  panel.style.transform = 'translateX(-12px) scale(0.97)';
  panel.style.transition = 'opacity 220ms cubic-bezier(0.16,1,0.3,1), transform 220ms cubic-bezier(0.16,1,0.3,1)';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      panel.style.opacity = '1';
      panel.style.transform = 'translateX(0) scale(1)';
    });
  });
  animateManageLibraryItems();
  updateManageButtonState();
  setTimeout(() => manageUrlInputEl?.focus(), 50);
}

function toggleManagePanel() {
  if (managePanelOpen) {
    closeManagePanel();
  } else {
    openManagePanel();
  }
}

function handleManageOutsideClick(event) {
  if (!managePanelOpen || !managePanelEl) return;
  const target = event.target;
  const manageBtn = DOM.manageQuicklinksBtn;
  if (managePanelEl.contains(target) || (manageBtn && manageBtn.contains(target))) return;
  closeManagePanel();
}

function handleManageEscape(event) {
  if (event.key === 'Escape') {
    closeManagePanel();
  }
}

function buildManagePanel() {
  const panel = document.createElement('aside');
  panel.id = 'manage-links-panel';
  panel.className = 'manage-links-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Manage quick links');
  panel.setAttribute('aria-hidden', 'true');

  const header = document.createElement('div');
  header.className = 'manage-links-header';

  const title = document.createElement('h3');
  title.className = 'manage-links-title';
  title.textContent = 'Quick Links';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'manage-links-close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close quick links panel');
  closeBtn.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <line x1="6" y1="6" x2="18" y2="18"></line>
      <line x1="6" y1="18" x2="18" y2="6"></line>
    </svg>
  `;
  closeBtn.addEventListener('click', closeManagePanel);
  header.append(title, closeBtn);

  const addedSection = document.createElement('section');
  addedSection.className = 'manage-links-section';
  const addedTitle = document.createElement('p');
  addedTitle.className = 'manage-links-section-title';
  addedTitle.textContent = 'Active Links';
  manageAddedGridEl = document.createElement('div');
  manageAddedGridEl.className = 'manage-links-grid manage-links-added-grid';
  manageAddedEmptyEl = document.createElement('p');
  manageAddedEmptyEl.className = 'manage-links-empty';
  manageAddedEmptyEl.textContent = 'No links added yet.';
  addedSection.append(addedTitle, manageAddedGridEl, manageAddedEmptyEl);

  const divider = document.createElement('div');
  divider.className = 'manage-links-divider';

  const customSection = document.createElement('section');
  customSection.className = 'manage-links-section';
  const customTitle = document.createElement('p');
  customTitle.className = 'manage-links-section-title';
  customTitle.textContent = 'Add New Link';

  const form = document.createElement('form');
  form.className = 'manage-links-form';
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    addCustomLinkFromPanel();
  });

  manageUrlInputEl = document.createElement('input');
  manageUrlInputEl.type = 'url';
  manageUrlInputEl.className = 'manage-links-input';
  manageUrlInputEl.placeholder = 'https://example.com';
  manageUrlInputEl.autocomplete = 'off';
  const urlWrap = document.createElement('div');
  urlWrap.className = 'manage-input-wrap';
  const urlIcon = document.createElement('span');
  urlIcon.className = 'manage-input-icon';
  urlIcon.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 1 0-7.07-7.07L11.6 4.34"></path>
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L12.4 19.66"></path>
    </svg>
  `;
  urlWrap.append(urlIcon, manageUrlInputEl);

  manageNameInputEl = document.createElement('input');
  manageNameInputEl.type = 'text';
  manageNameInputEl.className = 'manage-links-input';
  manageNameInputEl.placeholder = 'Name';
  manageNameInputEl.autocomplete = 'off';
  const nameWrap = document.createElement('div');
  nameWrap.className = 'manage-input-wrap';
  const nameIcon = document.createElement('span');
  nameIcon.className = 'manage-input-icon';
  nameIcon.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>
    </svg>
  `;
  nameWrap.append(nameIcon, manageNameInputEl);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'manage-links-submit';
  submitBtn.textContent = 'Add Link';
  form.append(urlWrap, nameWrap, submitBtn);
  customSection.append(customTitle, form);

  const librarySection = document.createElement('section');
  librarySection.className = 'manage-links-section';
  const libraryTitle = document.createElement('p');
  libraryTitle.className = 'manage-links-section-title';
  libraryTitle.textContent = 'Quick Add';
  manageLibrarySearchEl = document.createElement('input');
  manageLibrarySearchEl.type = 'search';
  manageLibrarySearchEl.className = 'manage-links-search';
  manageLibrarySearchEl.placeholder = 'Search apps...';
  manageLibrarySearchEl.autocomplete = 'off';
  manageLibrarySearchEl.addEventListener('input', () => {
    applyManageLibraryFilter();
  });
  manageLibraryGridEl = document.createElement('div');
  manageLibraryGridEl.className = 'manage-links-grid manage-links-library-grid';
  manageLibraryEmptyEl = document.createElement('p');
  manageLibraryEmptyEl.className = 'manage-links-library-empty';
  manageLibraryEmptyEl.textContent = 'No matching apps';
  manageLibraryEmptyEl.style.display = 'none';
  librarySection.append(libraryTitle, manageLibrarySearchEl, manageLibraryGridEl, manageLibraryEmptyEl);

  panel.append(header, addedSection, divider, customSection, librarySection);
  return panel;
}

function ensureManagePanel() {
  if (managePanelEl) return managePanelEl;
  managePanelEl = buildManagePanel();
  document.body.appendChild(managePanelEl);
  document.addEventListener('mousedown', handleManageOutsideClick);
  document.addEventListener('keydown', handleManageEscape);
  renderManagePanel();
  return managePanelEl;
}

function renderLinks() {
  if (!ensureQuicklinksStructure()) return;
  const sidebarGrid = DOM.sidebarGrid;
  const bottomGrid = DOM.bottomGrid;
  if (!sidebarGrid || !bottomGrid) return;
  document.getElementById('ql-more-btn')?.remove();

  const appLinks = links.filter((linkData) => linkData.isApp);
  const bottomLinks = topSiteLinks.slice(0, TOP_SITE_LIMIT);

  syncGrid(sidebarGrid, appLinks, true);
  syncGrid(bottomGrid, bottomLinks, false);
  renderManagePanel();
}

function syncGrid(grid, targetLinks, hideLabel = false) {
  const existingById = new Map();
  const allChildren = Array.from(grid.children);

  allChildren.forEach((child) => {
    if (!(child instanceof HTMLElement)) return;
    const id = child.dataset.linkId;
    if (id) existingById.set(id, child);
  });

  targetLinks.forEach((linkData, index) => {
    let node = existingById.get(linkData.id);
    if (node) {
      existingById.delete(linkData.id);
      node = updateTile(node, linkData, hideLabel);
    } else {
      node = createTile(linkData, hideLabel);
    }

    const currentAtIndex = grid.children[index] || null;
    if (node !== currentAtIndex) {
      grid.insertBefore(node, currentAtIndex);
    }
  });

  existingById.forEach((node) => node.remove());
}

function updateTile(wrapper, link, hideLabel = false) {
  if (!(wrapper instanceof HTMLElement)) return createTile(link, hideLabel);
  wrapper.dataset.linkId = link.id;
  wrapper.dataset.id = link.id;

  const tile = wrapper.querySelector('.quicklink-tile');
  const iconEl = wrapper.querySelector('.ql-icon-wrap');
  const labelEl = wrapper.querySelector('.quicklink-label');

  if (!(tile instanceof HTMLAnchorElement) || !(iconEl instanceof HTMLElement) || !(labelEl instanceof HTMLElement)) {
    const replacement = createTile(link, hideLabel);
    wrapper.replaceWith(replacement);
    return replacement;
  }

  tile.href = link.url;
  tile.title = link.title;
  tile.dataset.id = link.id;
  setTileIcon(iconEl, link);
  labelEl.textContent = link.title;
  labelEl.classList.toggle('quicklink-label-hidden', hideLabel);

  return wrapper;
}

function createTile(link, hideLabel = false) {
  const wrapper = document.createElement('div');
  wrapper.className = 'quicklink-item';
  wrapper.dataset.linkId = link.id;
  wrapper.dataset.id = link.id;

  const a = document.createElement('a');
  a.className = 'quicklink-tile';
  a.href = link.url;
  a.title = link.title;
  a.dataset.id = link.id;
  a.setAttribute('role', 'listitem');

  a.addEventListener('click', (e) => {
    const currentLink = getLinkById(a.dataset.id) || link;
    if (e.button === 1 || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    window.location.href = currentLink.url;
  });
  if (!link.isTopSite) {
    a.addEventListener('contextmenu', (e) => {
      const currentLink = getLinkById(a.dataset.id) || link;
      e.preventDefault();
      openContextMenu(e, currentLink);
    });
  }

  const iconEl = document.createElement('div');
  iconEl.className = 'ql-icon-wrap';

  setTileIcon(iconEl, link);

  const labelEl = document.createElement('span');
  labelEl.className = 'quicklink-label';
  labelEl.textContent = link.title;
  labelEl.classList.toggle('quicklink-label-hidden', hideLabel);

  a.appendChild(iconEl);
  wrapper.append(a, labelEl);
  return wrapper;
}

function openContextMenu(e, link) {
  removeContextMenu();
  const menu = document.createElement('div');
  menu.id = 'ql-context-menu';
  menu.className = 'glass';
  Object.assign(menu.style, {
    position: 'fixed', zIndex: '999', padding: '8px',
    minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '4px',
    left: e.clientX + 'px', top: e.clientY + 'px',
  });

  const editBtn = document.createElement('button');
  editBtn.className = 'engine-option';
  editBtn.textContent = 'Edit';
  editBtn.ariaLabel = 'Edit quick link';
  editBtn.onclick = () => { removeContextMenu(); openLinkModal(link); };

  const delBtn = document.createElement('button');
  delBtn.className = 'engine-option';
  delBtn.textContent = 'Delete';
  delBtn.ariaLabel = 'Delete quick link';
  delBtn.onclick = () => { removeContextMenu(); removeLink(link.id); };

  menu.append(editBtn, delBtn);
  document.body.appendChild(menu);
  setTimeout(() => {
    document.addEventListener('mousedown', (ev) => {
      if (!menu.contains(ev.target)) removeContextMenu();
    }, { once: true });
  }, 10);
}

function removeContextMenu() {
  document.querySelector('#ql-context-menu')?.remove();
}

function openLinkModal(existingLink = null) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const box = document.createElement('div');
  box.className = 'modal-box glass';

  const heading = document.createElement('h3');
  heading.textContent = existingLink ? 'Edit Quick Link' : 'Add Quick Link';

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.placeholder = 'Title e.g. GitHub';
  if (existingLink) titleInput.value = existingLink.title;

  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.placeholder = 'https://...';
  if (existingLink) urlInput.value = existingLink.url;

  const sidebarToggleLabel = document.createElement('label');
  sidebarToggleLabel.className = 'ql-sidebar-toggle';
  const sidebarToggle = document.createElement('input');
  sidebarToggle.type = 'checkbox';
  sidebarToggle.id = 'ql-pin-sidebar';
  sidebarToggle.checked = existingLink?.isApp === true;
  sidebarToggleLabel.append(sidebarToggle, document.createTextNode(' Pin to Sidebar (App Icon)'));

  const close = () => overlay.remove();

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.ariaLabel = 'Cancel quick link edit';
  cancelBtn.onclick = close;

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.ariaLabel = 'Save quick link';
  saveBtn.onclick = () => {
    const rawUrl = urlInput.value.trim();
    if (!rawUrl) { toast.error('URL cannot be empty'); return; }
    const url = sanitizeUrl(rawUrl);
    const title = titleInput.value.trim() || getDomain(url) || 'Link';
    const isApp = sidebarToggle.checked;
    if (existingLink) updateLink(existingLink.id, title, url, isApp);
    else addLink(title, url, isApp);
    close();
  };

  box.append(heading, titleInput, urlInput, sidebarToggleLabel, cancelBtn, saveBtn);
  overlay.appendChild(box);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  document.body.appendChild(overlay);
  setTimeout(() => titleInput.focus(), 50);
}

function emitLinksUpdated() {
  bus.dispatchEvent(new CustomEvent('linksUpdated', { detail: { links: [...links], source: 'quicklinks' } }));
}

function persistLinks() {
  Store.setLinks(links);
  emitLinksUpdated();
}

function addLink(title, url, isApp = false) {
  const normalizedUrl = sanitizeUrl(url);
  links.push({
    id: generateId(),
    key: inferLinkKey(normalizedUrl),
    title,
    url: normalizedUrl,
    favicon: getFaviconUrl(normalizedUrl),
    isApp,
  });
  persistLinks();
  renderLinks();
  toast.success('Link added!');
}

function updateLink(id, title, url, isApp = false) {
  const link = links.find(l => l.id === id);
  if (!link) return;
  const normalizedUrl = sanitizeUrl(url);
  link.title = title;
  link.url = normalizedUrl;
  link.favicon = getFaviconUrl(normalizedUrl);
  link.key = inferLinkKey(normalizedUrl);
  link.isApp = isApp;
  persistLinks();
  renderLinks();
  toast.success('Link updated!');
}

function removeLink(id) {
  links = links.filter(l => l.id !== id);
  persistLinks();
  renderLinks();
  toast.info('Link removed');
}

export async function initQuickLinks() {
  ensureQuicklinksStyles();
  const stored = await Store.getLinks();
  links = migrateStoredLinks(stored);
  if (!Array.isArray(stored) || stored.length !== links.length) {
    await Store.setLinks(links);
  }
  topSiteLinks = await loadTopSiteLinks();
  renderLinks();

  const manageBtn = DOM.manageQuicklinksBtn;
  if (manageBtn) {
    manageBtn.setAttribute('aria-label', 'Manage quick links');
    manageBtn.setAttribute('aria-expanded', 'false');
    manageBtn.setAttribute('aria-controls', 'manage-links-panel');
    manageBtn.addEventListener('click', (event) => {
      event.preventDefault();
      toggleManagePanel();
    });
  }

  const refreshTopSites = async () => {
    topSiteLinks = await loadTopSiteLinks();
    renderLinks();
  };

  window.addEventListener('focus', () => {
    refreshTopSites();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshTopSites();
  });

  bus.addEventListener('linksUpdated', (event) => {
    const incoming = event.detail?.links;
    if (!Array.isArray(incoming) || event.detail?.source === 'quicklinks') return;
    links = incoming.filter((link) => link?.isApp === true);
    renderLinks();
  });
}
