import { motion } from "framer-motion";
import Link from "next/link";

interface DropDownMenuProps {
  onClose: () => void;
}

const DropDownMenu: React.FC<DropDownMenuProps> = ({ onClose }) => {
  return (
    <motion.div
      className="
    w-screen
    h-screen
    dark:bg-black-100 
     bg-opacity-50
     text-white
     p-6
     space-y-4
     absolute
     top-28
     left-0
     right-0
     z-50
     rounded-t-3xl
    "
      initial={{ opacity: 0, y: "-80%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "-100%" }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex-col flex space-y-10">
        {/* <Link href="/pricing" className="text-black text-2xl">
          Pricing
        </Link> */}
        <Link
          href="#uxdesign"
          className="text-white text-2xl hover:text-[#CBACF9] duration-300"
          onClick={onClose}
        >
          Ux Design
        </Link>

        <Link
          href="#siteweb"
          className="text-white text-2xl hover:text-[#CBACF9]  duration-300"
          onClick={onClose}
        >
          Site Web
        </Link>

        {/* Add onClick handler to Services link */}
        <Link
          href="#temoignages"
          className="cursor-pointer text-white text-2xl hover:text-[#CBACF9] duration-300"
          onClick={onClose}
        >
          Temoignages
        </Link>

        <Link
          href="#seo"
          className="cursor-pointer text-white text-2xl hover:text-[#CBACF9] duration-300"
          onClick={onClose}
        >
          SEO
        </Link>

        <div className="flex space-x-6">
          <Link
            href="/emails"
            className="cursor-pointer bg-gradient-to-r from-purple to-purple-500 py-2 px-3 rounded-md font-bold"
            onClick={onClose}
          >
            Contact
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default DropDownMenu;
