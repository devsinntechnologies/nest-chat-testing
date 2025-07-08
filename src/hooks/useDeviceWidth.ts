import { useEffect, useState } from "react";

const useDeviceWidth = () => {
  const [deviceWidth, setDeviceWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 0);

  useEffect(() => {
    const handleResize = () => {
      setDeviceWidth(window.innerWidth);
    };

    // Set initial width
    handleResize();

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return deviceWidth;
};

export default useDeviceWidth;
