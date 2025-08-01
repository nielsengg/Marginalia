import '../assets/styles/searchModal.css';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  onClose: () => void;
};

export function SearchModal({ onClose }: Props) {
  return (
    <div id="modalSearchContainer">
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1  }}
                transition={{ duration: 0.2 }}
                id="modalSearchContent" 
                className='borderRadius'
            >
                <div id="headerModalSearch">
                    <h2 id='messageModalSearch'>Add to your books...</h2>
                    <button id='exitModalSearch' onClick={onClose}>X</button>
                </div>
                
                <div id="bodyModalSearch">
                    <input id='searchInput' className='borderRadius' type="text" placeholder="Search for book..."/>
                </div>
            </motion.div>
        </AnimatePresence>
    </div>
        
        
      
  );
}