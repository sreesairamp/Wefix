/**
 * Simple markdown renderer for AI chat messages
 */

export function renderMarkdown(text) {
  if (!text) return '';
  
  let html = text;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="font-bold text-lg mt-2 mb-1">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="font-bold text-xl mt-3 mb-2">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="font-bold text-2xl mt-4 mb-3">$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong class="font-semibold">$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  html = html.replace(/_(.*?)_/g, '<em class="italic">$1</em>');
  
  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded-lg my-2 overflow-x-auto text-sm"><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>');
  
  // Lists
  html = html.replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc">$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>');
  html = html.replace(/^(\d+)\. (.*$)/gim, '<li class="ml-4 list-decimal">$2</li>');
  
  // Wrap consecutive list items
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="list-inside space-y-1 my-2">$&</ul>');
  
  // Line breaks
  html = html.replace(/\n\n/g, '</p><p class="my-2">');
  html = html.replace(/\n/g, '<br />');
  
  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<')) {
    html = '<p>' + html + '</p>';
  }
  
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p class="my-2"><\/p>/g, '');
  
  return html;
}

