import React from 'react';
import { BUSINESS_DETAILS } from '../constants';

const About: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-slate-900 py-16 text-center px-4">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Our Story</h1>
        <p className="text-brand-gold text-lg italic">"Where Style Meets Confidence"</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Founders & Origin */}
        <div className="mb-16">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-1/2">
               <img 
                 src="https://images.unsplash.com/photo-1507537297725-24a1c029d3a8?q=80&w=800&auto=format&fit=crop" 
                 alt="Chelky Threads Fashion Lifestyle" 
                 className="rounded-lg shadow-xl w-full object-cover h-64 md:h-80 grayscale hover:grayscale-0 transition-all duration-700"
               />
            </div>
            <div className="w-full md:w-1/2">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">The Beginning</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Founded by <strong>Chels Chelule</strong> and <strong>Luis Kithinji</strong>, Chelky Threads was born from a shared love for creative self-expression. 
                Noticing a gap in Kenya’s market for affordable yet high-quality fashion, they set out to create a brand that bridges the gap between luxury and accessibility.
              </p>
              <p className="text-slate-600 leading-relaxed">
                From a humble online boutique to a rising name in Nairobi's fashion scene, our journey is fueled by the ambition of the vibrant Kenyan youth culture.
              </p>
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-slate-50 p-8 rounded-lg border-l-4 border-brand-gold">
            <h3 className="text-xl font-bold text-slate-900 mb-3">Our Mission</h3>
            <p className="text-slate-600">
              To empower individuals to express themselves confidently through stylish, high-quality, and affordable fashion that blends global trends with a Kenyan touch.
            </p>
          </div>
          <div className="bg-slate-50 p-8 rounded-lg border-l-4 border-brand-dark">
            <h3 className="text-xl font-bold text-slate-900 mb-3">Our Vision</h3>
            <p className="text-slate-600">
              To become Kenya’s most recognized online fashion destination, known for redefining modern elegance, quality service, and customer trust.
            </p>
          </div>
        </div>

        {/* Future Goals */}
        <div className="text-center bg-slate-900 text-white rounded-xl p-10">
          <h2 className="text-2xl font-serif font-bold mb-6">Looking Ahead</h2>
          <p className="text-slate-300 max-w-2xl mx-auto mb-8">
            We are more than just a store. We are building a movement. From expanding into physical locations in Nairobi to launching sustainable product lines, Chelky Threads is here to stay.
          </p>
          <a href={`mailto:${BUSINESS_DETAILS.email}`} className="inline-block px-6 py-2 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-white transition-all rounded-md">
            Contact Founders
          </a>
        </div>

      </div>
    </div>
  );
};

export default About;