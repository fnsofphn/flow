import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Upload, Calendar, MapPin, Edit3, Heart } from 'lucide-react';
import TiltCard from '../components/TiltCard';

const mockMemories = [
  {
    id: 1,
    title: 'Chuyến đi Đà Lạt',
    date: '2023-12-25',
    location: 'Đà Lạt, Lâm Đồng',
    image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=2070&auto=format&fit=crop',
    description: 'Lần đầu tiên đón Giáng Sinh cùng nhau trên thành phố sương mù. Lạnh nhưng ấm áp.',
    likes: 12
  },
  {
    id: 2,
    title: 'Kỷ niệm 1 năm',
    date: '2024-02-14',
    location: 'Nhà hàng The Deck',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop',
    description: 'Bữa tối lãng mạn bên sông Sài Gòn. Cy đã khóc khi nhận quà.',
    likes: 24
  },
  {
    id: 3,
    title: 'Lần đầu nấu ăn chung',
    date: '2023-08-10',
    location: 'Căn hộ nhỏ',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070&auto=format&fit=crop',
    description: 'Món mì Ý hơi mặn nhưng vẫn ăn hết sạch.',
    likes: 8
  }
];

export default function Memories() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className="space-y-8 pb-24">
      <header className="flex justify-between items-end">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            Kỷ niệm của chúng ta
            <Heart className="w-8 h-8 text-pink-500 fill-pink-500 animate-pulse" />
          </h1>
          <p className="text-white/60 text-lg">Lưu giữ từng khoảnh khắc đáng giá.</p>
        </motion.div>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 flex items-center gap-2"
        >
          <Upload className="w-5 h-5" />
          Tải ảnh lên
        </motion.button>
      </header>

      {/* On This Day Highlight */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full h-64 md:h-96 rounded-3xl overflow-hidden relative group cursor-pointer"
        onClick={() => setSelectedImage(mockMemories[0].image)}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
        <img 
          src={mockMemories[0].image} 
          alt="Highlight" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        <div className="absolute top-6 left-6 z-20 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-orange-400" />
          <span className="font-semibold text-sm tracking-wide text-white">ON THIS DAY</span>
        </div>
        <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 z-20 max-w-2xl">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">{mockMemories[0].title}</h2>
          <p className="text-white/80 text-lg md:text-xl line-clamp-2">{mockMemories[0].description}</p>
        </div>
      </motion.div>

      {/* Timeline */}
      <div className="mt-12">
        <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-orange-400" />
          Dòng thời gian
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockMemories.slice(1).map((memory, index) => (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <TiltCard className="p-0 overflow-hidden group h-[400px] flex flex-col">
                <div 
                  className="relative h-48 overflow-hidden cursor-pointer"
                  onClick={() => setSelectedImage(memory.image)}
                >
                  <img 
                    src={memory.image} 
                    alt={memory.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium">Xem ảnh</span>
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xl font-bold text-white/90">{memory.title}</h4>
                    <button className="text-white/40 hover:text-white transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-white/50 mb-4">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {memory.date}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {memory.location}</span>
                  </div>
                  
                  <p className="text-sm text-white/70 flex-1">{memory.description}</p>
                  
                  <div className="mt-4 flex justify-between items-center pt-4 border-t border-white/10">
                    <button className="flex items-center gap-1 text-pink-500 hover:text-pink-400 transition-colors text-sm font-medium">
                      <Heart className="w-4 h-4 fill-current" /> {memory.likes}
                    </button>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImage} 
              alt="Enlarged" 
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button 
              className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/10 p-2 rounded-full backdrop-blur-md"
              onClick={() => setSelectedImage(null)}
            >
              Đóng
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
