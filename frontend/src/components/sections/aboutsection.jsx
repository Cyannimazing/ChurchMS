import Image from "next/image";

const AboutSection = ({ id }) => {
  const images = [
    { src: "/images/church13.jpg", span: "md:col-span-2 md:row-span-2" },
    { src: "/images/church14.jpg", span: "md:row-span-2" },
    { src: "/images/church5.jpg", span: "" },
    { src: "/images/church16.jpg", span: "" },
  ];

  return (
    <div id={id}>
      {/* Hero Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl text-gray-900">
              About <span className="text-indigo-600">FaithSeeker</span>
            </h1>
            <p className="text-lg text-gray-600 lg:text-xl max-w-3xl mx-auto leading-relaxed">
              FaithSeeker is an innovative digital platform designed to simplify and modernize the management of sacramental services for Roman Catholic churches in Davao City. Developed by a team of Bachelor of Science in Information Technology students from STI College Davao, this system addresses the challenges of manual booking processes, such as inefficiencies, scheduling conflicts, and lost records, by providing a centralized online solution.
            </p>
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 auto-rows-[200px] gap-4 mt-16">
            {images.map((item, index) => (
              <div key={index} className={`group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 ${item.span}`}>
                <Image
                  className="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                  src={item.src}
                  alt={`Church image ${index + 13}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutSection;
