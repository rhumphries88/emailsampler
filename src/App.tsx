import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Heart, Trash2, Mail, Wand2 } from 'lucide-react';
import { 
  saveEmailMessage, 
  getEmailMessages, 
  updateEmailLikes, 
  deleteEmailMessage,
  EmailMessage as FirebaseEmailMessage
} from './firebase';

interface Message {
  id: number | string;
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
  const [messages, setMessages] = useState<Message[]>([]);
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
  const [isLoading, setIsLoading] = useState(true);

  // Fetch messages from Firestore on component mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const emailMessages = await getEmailMessages();
        
        // Convert Firestore messages to our app format
        const formattedMessages = emailMessages.map(msg => ({
          id: msg.id || '',
          name: msg.name,
          company: msg.company,
          email: msg.email,
          body: msg.body,
          likes: msg.likes,
          color: msg.color,
          timestamp: msg.timestamp instanceof Date 
            ? msg.timestamp.toISOString() 
            : new Date(msg.timestamp.seconds * 1000).toISOString()
        }));
        
        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        showNotification('Failed to load messages! ⚠️');
        // Use initial messages as fallback
        setMessages(initialMessages);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleLike = async (id: number | string) => {
    try {
      const messageToUpdate = messages.find(msg => msg.id === id);
      if (!messageToUpdate) return;

      const newLikes = messageToUpdate.likes + 1;
      
      // Update in Firestore if it's a string ID (Firestore document)
      if (typeof id === 'string') {
        await updateEmailLikes(id, newLikes);
      }
      
      // Update in local state
      setMessages(messages.map(msg =>
        msg.id === id ? { ...msg, likes: newLikes } : msg
      ));
      
      showNotification('Thanks for your like! 💖');
    } catch (error) {
      console.error('Error updating likes:', error);
      showNotification('Failed to update likes! ⚠️');
    }
  };

  const handleDelete = async (id: number | string) => {
    try {
      // Delete from Firestore if it's a string ID (Firestore document)
      if (typeof id === 'string') {
        await deleteEmailMessage(id);
      }
      
      // Remove from local state
      setMessages(messages.filter(msg => msg.id !== id));
      showNotification('Message deleted successfully! 🗑️');
    } catch (error) {
      console.error('Error deleting message:', error);
      showNotification('Failed to delete message! ⚠️');
    }
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
          email: formData.email,
          signature: formData.signature
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the response text
      const htmlResponse = await response.text();
      
      // Extract only the text content from the HTML response
      // Create a temporary DOM element to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlResponse;
      
      // Get the text content without HTML tags
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      
      // Set the form data body to only the extracted text content
      setFormData(prev => ({ ...prev, body: textContent.trim() }));
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
    
    try {
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // Prepare the message for Firestore
      const emailMessage: Omit<FirebaseEmailMessage, 'timestamp'> = {
        name: formData.name,
        company: formData.company,
        email: formData.email,
        body: formData.body,
        likes: 0,
        color: color
      };
      
      // Save to Firestore and get the saved message back
      const savedMessage = await saveEmailMessage(emailMessage);
      
      // Convert to our app format
      const newMessage: Message = {
        id: savedMessage.id || '',
        name: savedMessage.name,
        company: savedMessage.company,
        email: savedMessage.email,
        body: savedMessage.body,
        likes: savedMessage.likes,
        color: savedMessage.color,
        timestamp: savedMessage.timestamp instanceof Date 
          ? savedMessage.timestamp.toISOString() 
          : new Date().toISOString()
      };

      setMessages([...messages, newMessage]);
      setFormData({ name: '', company: '', email: '', body: '', signature: '' });
      showNotification('Message posted successfully! 🎉');
    } catch (error) {
      console.error('Error saving message:', error);
      showNotification('Failed to post message! ⚠️');
    } finally {
      setIsSubmitting(false);
    }
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
                className="absolute bottom-2 right-2 text-indigo-500 hover:text-indigo-700 disabled:text-gray-400"
                title="Rephrase with AI"
              >
                <Wand2 size={20} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Signature (optional)</label>
            <input
              type="text"
              value={formData.signature}
              onChange={(e) => setFormData({...formData, signature: e.target.value})}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Your title or role"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : (
              <span className="flex items-center">
                <Send size={16} className="mr-2" />
                Share Message
              </span>
            )}
          </button>
        </form>
      </div>

      {/* Main Content */}
      <div className="w-full md:w-2/3 p-6">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Messages</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setSortBy('latest')}
              className={`px-3 py-1 rounded-md text-sm ${sortBy === 'latest' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Latest
            </button>
            <button
              onClick={() => setSortBy('likes')}
              className={`px-3 py-1 rounded-md text-sm ${sortBy === 'likes' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Most Liked
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : sortedMessages.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <Mail size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No messages yet</h3>
            <p className="text-gray-500">Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedMessages.map((message) => (
              <div key={message.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className={`${message.color} h-2`}></div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{message.name}</h3>
                      <p className="text-sm text-gray-500">{message.company} • {message.email}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleLike(message.id)}
                        className="text-pink-500 hover:text-pink-700 flex items-center"
                        title="Like this message"
                      >
                        <Heart size={16} className="mr-1" />
                        <span className="text-xs">{message.likes}</span>
                      </button>
                      <button
                        onClick={() => handleDelete(message.id)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Delete this message"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 text-gray-700 whitespace-pre-wrap font-mono text-sm">
                    {formatMessage(message.body)}
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    {new Date(message.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;