import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { BUSINESS_DETAILS } from '../constants';
import { Mail, Instagram, MapPin, Phone, Search, Loader2, Map as MapIcon, ExternalLink } from 'lucide-react';

const Contact: React.FC = () => {
  const [mapQuery, setMapQuery] = useState('');
  const [mapResponse, setMapResponse] = useState<string>('');
  const [mapLinks, setMapLinks] = useState<any[]>([]);
  const [isMapLoading, setIsMapLoading] = useState(false);

  const handleMapsQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapQuery.trim()) return;

    setIsMapLoading(true);
    setMapResponse('');
    setMapLinks([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Contextualize the query
      const contextPrompt = `
        I am a customer on the Chelky Threads website, a fashion store in Nairobi.
        Our physical pickup location is near Moi Avenue, Nairobi CBD.
        User Question: ${mapQuery}
        Provide helpful location info, landmarks, or directions based on this.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contextPrompt,
        config: {
          tools: [{ googleMaps: {} }],
        }
      });

      if (response.text) {
        setMapResponse(response.text);
      }
      
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const links = chunks
        .filter((chunk: any) => chunk.web?.uri || chunk.maps?.uri)
        .map((chunk: any) => ({
           title: chunk.web?.title || chunk.maps?.title || "View on Map",
           uri: chunk.web?.uri || chunk.maps?.uri
        }));
      
      setMapLinks(links);

    } catch (error) {
      console.error("Maps error:", error);
      setMapResponse("Sorry, I couldn't fetch the map information right now. Please try again.");
    } finally {
      setIsMapLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-slate-900 mb-4">Get in Touch</h1>
          <p className="text-slate-600">Have questions about your order or need styling advice? We're here to help.</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          
          {/* Main Contact Section */}
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden flex flex-col md:flex-row">
            {/* Info Side */}
            <div className="bg-slate-900 text-white p-10 md:w-2/5 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-6">Contact Info</h2>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <Mail className="h-6 w-6 text-brand-gold mt-1 mr-4" />
                    <div>
                      <h3 className="font-semibold text-lg">Email</h3>
                      <p className="text-slate-400">{BUSINESS_DETAILS.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Instagram className="h-6 w-6 text-brand-gold mt-1 mr-4" />
                    <div>
                      <h3 className="font-semibold text-lg">Social Media</h3>
                      <p className="text-slate-400">{BUSINESS_DETAILS.instagram}</p>
                      <p className="text-slate-400">TikTok: {BUSINESS_DETAILS.tiktok}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="h-6 w-6 text-brand-gold mt-1 mr-4" />
                    <div>
                      <h3 className="font-semibold text-lg">Location</h3>
                      <p className="text-slate-400">Nairobi, Kenya</p>
                      <p className="text-xs text-slate-500 mt-1">(Online Store with Pickup Options)</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                     <Phone className="h-6 w-6 text-brand-gold mt-1 mr-4" />
                     <div>
                       <h3 className="font-semibold text-lg">WhatsApp</h3>
                       <p className="text-slate-400">Direct Message for quick support</p>
                     </div>
                   </div>
                </div>
              </div>
              
              <div className="mt-12">
                 <p className="text-xs text-slate-500">Business Hours: Mon - Sat, 9am - 6pm</p>
              </div>
            </div>

            {/* Form Side */}
            <div className="p-10 md:w-3/5 bg-white">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Send us a message</h2>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input 
                    id="name"
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-brand-gold focus:border-brand-gold outline-none" 
                    placeholder="Your name" 
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input 
                    id="email"
                    type="email" 
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-brand-gold focus:border-brand-gold outline-none" 
                    placeholder="your@email.com" 
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                  <textarea 
                    id="message"
                    rows={4} 
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-brand-gold focus:border-brand-gold outline-none" 
                    placeholder="How can we help?"
                  ></textarea>
                </div>
                <button className="w-full bg-brand-gold text-white font-bold py-3 rounded-md hover:bg-yellow-600 transition-colors">
                  Send Message
                </button>
              </form>
            </div>
          </div>

          {/* Location Finder Section (Gemini Maps Grounding) */}
          <div className="bg-white shadow-lg rounded-2xl p-8 border border-slate-100">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                 <MapIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Find Us & Explore</h2>
                <p className="text-slate-500 text-sm">Use our AI assistant to find directions or nearby landmarks.</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-6">
              <form onSubmit={handleMapsQuery} className="mb-6 relative">
                <input
                  type="text"
                  value={mapQuery}
                  onChange={(e) => setMapQuery(e.target.value)}
                  placeholder="e.g., Where can I park near your shop? or Show me coffee shops nearby."
                  className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold outline-none"
                />
                <button 
                  type="submit" 
                  disabled={isMapLoading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-brand-dark text-white rounded-md hover:bg-slate-700 transition-colors disabled:opacity-70"
                >
                  {isMapLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                </button>
              </form>

              {(mapResponse || mapLinks.length > 0) && (
                <div className="animate-fade-in-up">
                   <div className="prose prose-slate text-slate-700 text-sm mb-4">
                     <p>{mapResponse}</p>
                   </div>
                   
                   {mapLinks.length > 0 && (
                     <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200">
                       <span className="text-xs font-bold text-slate-500 uppercase w-full">References:</span>
                       {mapLinks.map((link, idx) => (
                         <a 
                           key={idx} 
                           href={link.uri} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="inline-flex items-center px-3 py-1 bg-white border border-slate-200 rounded-full text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                         >
                           <ExternalLink className="h-3 w-3 mr-1" />
                           {link.title}
                         </a>
                       ))}
                     </div>
                   )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;
