/* eslint-disable @next/next/no-img-element */
import { AlignJustify, Menu, X } from "lucide-react";
import { useState } from "react";
import wideweb2 from "@/public/wideweb2.png";
import { navigation } from "../data";
import DropDownMenu from "@/components/ui/DropDownMenu";
import Link from "next/link";

const Navbar = () => {
  const [isDropDownVisible, setIsDropVisible] = useState(false);

  const toggleDropDown = () => {
    setIsDropVisible(!isDropDownVisible);
  };

  const closeDropDown = () => {
    setIsDropVisible(false);
  };

  return (
    <nav className="sticky top-0 z-50 py-3 backdrop-blur-lg border-b border-neutral-700/80">
      <div className="container px-4  mx-auto relative lg:text-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center flex-shrink-0">
            <Link href="/" onClick={closeDropDown}>
              <img className="h-30 w-20 mr-2" src={wideweb2.src} alt="Logo" />
            </Link>
          </div>
          <ul className="hidden lg:flex ml-14 space-x-12 font-bold ">
            {navigation.map((item, index) => (
              <li key={index}>
                {item.url.startsWith("#") ? (
                  <a
                    href={item.url}
                    className="hover:text-[#CBACF9] transition-colors duration-300"
                    onClick={closeDropDown}
                  >
                    {item.title}
                  </a>
                ) : (
                  <Link
                    href={item.url}
                    className="hover:text-[#CBACF9] transition-colors duration-300"
                    onClick={closeDropDown}
                  >
                    {item.title}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <div className="hidden lg:flex justify-center space-x-12 items-center">
            <Link
              href={"/emails"}
              className="bg-gradient-to-r from-purple to-purple-500 py-2 px-3 rounded-md font-bold"
              onClick={closeDropDown}
            >
              Contact
            </Link>
          </div>
          <div className="flex lg:hidden">
            {isDropDownVisible ? (
              <div
                onClick={toggleDropDown}
                className="w-8 h-8 text-slate-300 cursor-pointer"
              >
                <X />
                <DropDownMenu onClose={closeDropDown} />
              </div>
            ) : (
              <AlignJustify
                onClick={toggleDropDown}
                className="w-8 h-8 text-slate-300 cursor-pointer"
              />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
