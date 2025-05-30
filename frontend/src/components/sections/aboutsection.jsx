import Image from "next/image";

const AboutSection = ({ id }) => {
  const images = [
    "/images/church13.jpg",
    "/images/church14.jpg",
    "/images/church5.jpg",
    "/images/church16.jpg",
  ];

  return (
    <div className="min-h-screen" id={id}>
      <section className="pt-24 bg-gray-50">
        <div className="max-w-screen-xl mx-auto text-center">
          <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight md:text-5xl lg:text-6xl text-black">
            About FaithSeeker
          </h1>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="max-w-screen-xl mx-auto text-center">
          <p className="mb-6 text-lg font-normal text-black lg:text-xl sm:px-16 xl:px-48 text-justify">
            FaithSeeker is an innovative digital platform designed to simplify
            and modernize the management of sacramental services for Roman
            Catholic churches in Davao City. Developed by a team of Bachelor of
            Science in Information Technology students from STI College Davao,
            this system addresses the challenges of manual booking processes,
            such as inefficiencies, scheduling conflicts, and lost records, by
            providing a centralized online solution.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {images.map((src, index) => (
          <div key={index}>
            <Image
              className="h-auto max-w-full rounded-lg"
              src={src}
              alt={`Church image ${index + 13}`}
              width={500}
              height={300}
              layout="responsive"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AboutSection;
