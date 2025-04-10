import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Heart, Trash2, Mail, Wand2 } from 'lucide-react';

interface Message {
  id: number;
  name: string;
  company: string;
  email: string;
  body: string;
  likes: number;
  color: string;
  timestamp: string;
}

const initialMessages: Message[] = [
  { id: 1, name: "Alice", company: "TechCo", email: "alice@techco.com", body: "Love this project!\n\tIt's amazing how it all came together.\n\tGreat work team!", likes: 25, color: "bg-pink-400", timestamp: new Date().toISOString() },
  { id: 2, name: "Bob", company: "DesignHub", email: "bob@designhub.io", body: "Amazing work everyone!\n\tThe design is spot on\n\tLooking forward to more!", likes: 15, color: "bg-purple-400", timestamp: new Date().toISOString() },
  { id: 3, name: "Charlie", company: "DevInc", email: "charlie@devinc.dev", body: "Keep it up!\n\tThis is exactly what we needed\n\tPerfect implementation", likes: 45, color: "bg-blue-400", timestamp: new Date().toISOString() },
  { id: 4, name: "Diana", company: "CreativeLab", email: "diana@creativelab.com", body: "This is fantastic!\n\tLove the attention to detail\n\tCan't wait to see what's next", likes: 30, color: "bg-green-400", timestamp: new Date().toISOString() },
];

const colors = [
  'bg-pink-400', 'bg-purple-400', 'bg-blue-400', 'bg-green-400',
  'bg-yellow-400', 'bg-red-400', 'bg-indigo-400', 'bg-teal-400'
];

function App() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    body: '',
    signature: ''
  });
  const [sortBy, setSortBy] = useState<'latest' | 'likes'>('latest');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRephrasing, setIsRephrasing] = useState(false);
  const [notification, setNotification] = useState('');

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleLike = (id: number) => {
    setMessages(messages.map(msg =>
      msg.id === id ? { ...msg, likes: msg.likes + 1 } : msg
    ));
    showNotification('Thanks for your like! 💖');
  };

  const handleDelete = (id: number) => {
    setMessages(messages.filter(msg => msg.id !== id));
    showNotification('Message deleted successfully! 🗑️');
  };

  const handleRephrase = async () => {
    if (!formData.body.trim()) {
      showNotification('Please enter some text to rephrase! ⚠️');
      return;
    }

    setIsRephrasing(true);
    try {
      const response = await fetch('/api/webhook-test/a7be01bc-3899-462c-8e10-55198519f88b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: formData.body,
          name: formData.name,
          company: formData.company,
          signature: formData.signature
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      setFormData(prev => ({ ...prev, body: text }));
      showNotification('Text rephrased successfully! ✨');
    } catch (error) {
      console.error('Error:', error);
      showNotification(`Failed to rephrase: ${error instanceof Error ? error.message : 'Unknown error'} ⚠️`);
    } finally {
      setIsRephrasing(false);
    }
  };

  const formatMessage = (text: string) => {
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line.replace(/\t/g, '\u00A0\u00A0\u00A0\u00A0')}
        {i < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.company || !formData.body || !formData.email) {
      showNotification('Please fill in all required fields! ⚠️');
      return;
    }

    if (!formData.email.includes('@')) {
      showNotification('Please enter a valid email address! ⚠️');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const newMessage: Message = {
      id: messages.length + 1,
      name: formData.name,
      company: formData.company,
      email: formData.email,
      body: formData.body,
      likes: 0,
      color: colors[Math.floor(Math.random() * colors.length)],
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, newMessage]);
    setFormData({ name: '', company: '', email: '', body: '', signature: '' });
    setIsSubmitting(false);
    showNotification('Message posted successfully! 🎉');
  };

  const sortedMessages = [...messages].sort((a, b) => {
    if (sortBy === 'likes') {
      return b.likes - a.likes;
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row relative">
      {notification && (
        <div className="fixed top-4 right-4 bg-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {notification}
        </div>
      )}

      {/* Sidebar Form */}
      <div className="w-full md:w-1/3 bg-white p-6 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Share Your Thoughts</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Company *</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({...formData, company: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Company Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Message *</label>
            <div className="relative">
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({...formData, body: e.target.value})}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                rows={4}
                placeholder="Share your thoughts..."
              />
              <button
                type="button"
                onClick={handleRephrase}
                disabled={isRephrasing}
                className={`absolute right-2 top-2 p-2 rounded-md text-white
                  ${isRephrasing ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}
                  transition-colors duration-200`}
                title="Rephrase text"
              >
                <Wand2 className={`w-4 h-4 ${isRephrasing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">Use Tab for indentation and Enter for new lines</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Signature</label>
            <input
              type="text"
              value={formData.signature}
              onChange={(e) => setFormData({...formData, signature: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Your signature"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              ${isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} 
              transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            <Send className={`w-4 h-4 mr-2 ${isSubmitting ? 'animate-spin' : ''}`} />
            {isSubmitting ? 'Posting...' : 'Share Message'}
          </button>
        </form>
      </div>

      {/* Chat Bubble Collage */}
      <div className="w-full md:w-2/3 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Messages ({messages.length})</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('latest')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200
                ${sortBy === 'latest' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Latest
            </button>
            <button
              onClick={() => setSortBy('likes')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200
                ${sortBy === 'likes' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Most Liked
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedMessages.map((message, index) => (
            <div
              key={message.id}
              className={`
                ${message.color} chat-bubble rounded-2xl p-6 
                transform hover:scale-105 transition-all duration-300 
                shadow-lg group
                animate-float animate-pulse-slow
              `}
              style={{ 
                minHeight: `${100 + message.likes}px`,
                animationDelay: `${index * 0.2}s`
              }}
            >
              <div className="flex items-start space-x-2 relative z-10">
                <MessageCircle className="w-6 h-6 text-white" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-lg">{message.name}</h3>
                      <p className="text-sm text-white/90 font-medium">{message.company}</p>
                      <div className="flex items-center mt-1 space-x-1">
                        <Mail className="w-4 h-4 text-white/80" />
                        <p className="text-sm text-white/90 font-medium break-all">{message.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(message.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white/80 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-white font-medium whitespace-pre-wrap font-mono">
                    {formatMessage(message.body)}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      onClick={() => handleLike(message.id)}
                      className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full text-white font-medium hover:bg-white/30 transition-colors duration-200"
                    >
                      <Heart className="w-4 h-4" />
                      <span>{message.likes}</span>
                    </button>
                    <span className="text-sm text-white/80">
                      {new Date(message.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;