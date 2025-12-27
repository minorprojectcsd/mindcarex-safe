import { motion, Variants } from "motion/react";

export default function JumpingDots() {
  const dotVariants: Variants = {
    jump: {
      y: -30,
      transition: {
        duration: 0.8,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.div
      animate="jump"
      transition={{ staggerChildren: -0.2, staggerDirection: -1 }}
      className="flex justify-center items-center gap-3"
    >
      <motion.div 
        className="w-5 h-5 rounded-full bg-primary will-change-transform" 
        variants={dotVariants} 
      />
      <motion.div 
        className="w-5 h-5 rounded-full bg-primary will-change-transform" 
        variants={dotVariants} 
      />
      <motion.div 
        className="w-5 h-5 rounded-full bg-primary will-change-transform" 
        variants={dotVariants} 
      />
    </motion.div>
  );
}
