import React, { useRef, useEffect, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { createPortal } from "react-dom";

const Dropdown = ({
  align = "right",
  width = 48,
  contentClasses = "py-1 bg-white",
  trigger,
  children,
}) => {
  const [isClient, setIsClient] = useState(false);
  const triggerRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0, right: 'auto' });
  let alignmentClasses;
  let widthClass;

  useEffect(() => {
    setIsClient(true);
  }, []);

  switch (width) {
    case "48":
      widthClass = "w-48";
      break;
    default:
      widthClass = `w-${width}`;
  }

  switch (align) {
    case "left":
      alignmentClasses = "origin-top-left";
      break;
    case "top":
      alignmentClasses = "origin-top";
      break;
    case "right":
    default:
      alignmentClasses = "origin-top-right";
      break;
  }

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const newPosition = {
        top: rect.bottom + window.scrollY + 8,
        left: align === 'left' ? rect.left + window.scrollX : 'auto',
        right: align === 'right' ? window.innerWidth - rect.right - window.scrollX : 'auto'
      };
      setPosition(newPosition);
    }
  };

  return (
    <Menu as="div" className="relative">
      {({ open }) => {
        if (open) {
          updatePosition();
        }
        
        return (
          <>
            <Menu.Button as={React.Fragment}>
              <div ref={triggerRef}>{trigger}</div>
            </Menu.Button>

            {isClient && createPortal(
              <Transition
                show={open}
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <div
                  className={`fixed z-[9999] ${widthClass} rounded-md shadow-lg ${alignmentClasses}`}
                  style={{
                    top: `${position.top}px`,
                    left: position.left !== 'auto' ? `${position.left}px` : 'auto',
                    right: position.right !== 'auto' ? `${position.right}px` : 'auto'
                  }}
                >
                  <Menu.Items
                    className={`rounded-md focus:outline-none ring-1 ring-black ring-opacity-5 ${contentClasses}`}
                    static
                  >
                    {children}
                  </Menu.Items>
                </div>
              </Transition>,
              document.body
            )}
          </>
        );
      }}
    </Menu>
  );
};

export default Dropdown;
