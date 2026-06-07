import { motion } from 'framer-motion';

export function SplashScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7 }}
        className="text-center"
      >
        <img src="/icons/solfatonic.svg" alt="" className="mx-auto mb-5 h-24 w-24 rounded-3xl shadow-2xl" />
        <h1 className="text-4xl font-black">SolfaTonic</h1>
        <p className="mt-2 text-sm text-slate-300">Tonic Sol-fa for SATB choirs</p>
        <motion.div
          className="mx-auto mt-8 h-1 w-40 rounded-full bg-slate-700"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-1 rounded-full bg-teal-300"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.8 }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
