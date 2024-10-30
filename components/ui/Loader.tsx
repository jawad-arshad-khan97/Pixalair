import Image from "next/image";

const Loader = () => (
  <div className="transforming-loader">
    <Image
      src="/assets/icons/spinner.svg"
      width={50}
      height={50}
      alt="spinner"
    />
    <p className="text-white/80">Please wait...</p>
  </div>
);

export default Loader;
