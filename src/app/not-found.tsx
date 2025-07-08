import Image from "next/image";
import React from "react";

const Page = () => {
  return (
    <div className="w-full min-h-170 h-[30vh] max-h-fit flex items-center justify-center p-6 sm:p-10">
      <Image
        src="/images/404.svg"
        alt="404"
        width={796}
        height={664}
        className="min-w-72 max-w-full p-5 md:p-10"
      />
    </div>
  );
};

export default Page;
