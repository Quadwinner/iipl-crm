import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useState } from "react";

export const WhatsAppButton = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap"
          >
            <div className="bg-card border border-border rounded-lg px-4 py-2 shadow-lg">
              <p className="text-sm font-medium text-foreground">Chat with us!</p>
              <p className="text-xs text-muted-foreground">We're online</p>
            </div>
            {/* Arrow */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-card border-r border-t border-border rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse Ring */}
      <motion.div
        className="absolute inset-0 rounded-full bg-[#25D366]"
        animate={{
          scale: [1, 1.4, 1.4],
          opacity: [0.4, 0, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />

      {/* Button */}
      <motion.a
        href="https://api.whatsapp.com/send?phone=919142773500&text=Hi%2C%20I%27m%20interested%20in%20your%20services"
        target="_blank"
        rel="noopener noreferrer nofollow"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:shadow-[0_0_30px_rgba(37,211,102,0.5)] transition-shadow"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="text-foreground" size={28} fill="currentColor" />
      </motion.a>
    </motion.div>
  );
};
