import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star, Pause, Play } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Rahul Sharma",
    role: "CEO, TechStart Solutions",
    content: "Itoby Infotech transformed our digital presence completely. Their team delivered a stunning website that increased our conversions by 200%. Truly exceptional work!",
    rating: 5,
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face",
  },
  {
    id: 2,
    name: "Priya Patel",
    role: "Marketing Director, GrowthHub",
    content: "The SEO and digital marketing services from Itoby have been game-changing. We've seen a 300% increase in organic traffic and our lead generation has never been better.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face",
  },
  {
    id: 3,
    name: "Amit Kumar",
    role: "Founder, RetailPro",
    content: "The custom ERP solution they built for us streamlined our entire operation. Their attention to detail and commitment to quality is unmatched in the industry.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
  },
  {
    id: 4,
    name: "Sneha Gupta",
    role: "Product Manager, FinanceApp",
    content: "The mobile app Itoby developed exceeded all our expectations. The UI/UX is flawless, and our user engagement metrics have improved dramatically.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face",
  },
  {
    id: 5,
    name: "Vikram Singh",
    role: "CTO, CloudWorks",
    content: "Working with Itoby for our Microsoft 365 migration was seamless. Their expertise and support made the transition completely hassle-free for our team.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face",
  },
  {
    id: 6,
    name: "Anita Desai",
    role: "Owner, Luxe Fashion",
    content: "Our e-commerce store has seen a 400% increase in sales since Itoby redesigned it. Their understanding of user behavior and conversion optimization is remarkable.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=100&h=100&fit=crop&crop=face",
  },
];

export const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [direction, setDirection] = useState(1);

  const next = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      next();
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, next]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 200 : -200,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 200 : -200,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <section className="section-padding bg-gradient-to-b from-background via-card/30 to-background">
      <div className="container-wide">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-16"
        >
          <span className="text-primary font-semibold uppercase tracking-wider text-sm">
            Client Stories
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            What Our <span className="gradient-text">Clients Say</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            Don't just take our word for it. Here's what industry leaders have to say 
            about their experience working with us.
          </p>
        </motion.div>

        {/* Testimonial Slider */}
        <div className="relative max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="absolute -top-4 left-0 right-0 h-0.5 bg-border rounded-full overflow-hidden">
            <motion.div
              key={currentIndex}
              initial={{ width: "0%" }}
              animate={{ width: isAutoPlaying ? "100%" : "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              className="h-full bg-primary"
            />
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative p-6 sm:p-8 md:p-12 rounded-3xl bg-card border border-border"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-3 left-4 sm:top-4 sm:left-6 w-10 h-10 sm:w-12 sm:h-12 text-primary/20" />

              <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-center">
                {/* Image */}
                <motion.div 
                  className="shrink-0"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="relative">
                    <img
                      src={testimonials[currentIndex].image}
                      alt={testimonials[currentIndex].name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-primary/20"
                    />
                    {/* Glow ring */}
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full border-2 border-primary/30"
                    />
                  </div>
                </motion.div>

                {/* Content */}
                <div className="text-center md:text-left">
                  {/* Rating */}
                  <motion.div 
                    className="flex gap-1 justify-center md:justify-start mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                      >
                        <Star size={18} className="text-primary fill-primary" />
                      </motion.div>
                    ))}
                  </motion.div>

                  <motion.p 
                    className="text-base sm:text-lg md:text-xl text-foreground leading-relaxed mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    "{testimonials[currentIndex].content}"
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="font-display font-bold text-lg">
                      {testimonials[currentIndex].name}
                    </p>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      {testimonials[currentIndex].role}
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <motion.button
              onClick={prev}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={24} />
            </motion.button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentIndex ? 1 : -1);
                    setCurrentIndex(index);
                  }}
                  whileHover={{ scale: 1.2 }}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "bg-primary w-8"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2.5"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <motion.button
              onClick={next}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight size={24} />
            </motion.button>

            {/* Auto-play toggle */}
            <motion.button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-colors ${
                isAutoPlaying 
                  ? "bg-primary/10 text-primary" 
                  : "bg-secondary text-muted-foreground hover:text-primary hover:bg-primary/10"
              }`}
              aria-label={isAutoPlaying ? "Pause auto-play" : "Resume auto-play"}
            >
              {isAutoPlaying ? <Pause size={18} /> : <Play size={18} />}
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
};
