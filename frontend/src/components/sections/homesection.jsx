import Image from 'next/image';

const ImageGrid = () => {
  const images = [
    '/images/church1.jpg',
    '/images/church2.jpg',
    '/images/church3.jpg',
    '/images/church4.jpg',
    '/images/church5.jpg',
    '/images/church6.jpg',
    '/images/church7.jpg',
    '/images/church8.jpg',
    '/images/church9.jpg',
    '/images/church10.jpg',
    '/images/church11.jpg',
    '/images/church12.jpg',
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
      {images.map((src, index) => (
        <div key={index}>
          <Image
            className="h-auto max-w-full rounded-lg"
            src={src}
            alt={`Church image ${index + 1}`}
            width={500}
            height={300}
            layout="responsive"
          />
        </div>
      ))}
    </div>
  );
};

const HomeSection = () => {
  return (
    <div className="min-h-screen">
      <main>
        <section className="py-12 bg-gray-50">
          <div className="max-w-screen-xl mx-auto text-center">
            <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight md:text-5xl lg:text-6xl text-black">
              Discover the Heart of Your Ministry.
            </h1>
            <p className="mb-6 text-lg font-normal text-black lg:text-xl sm:px-16 xl:px-48 text-justify">
              Finding the right church for your spiritual needs is important, and we’re here to help! Browse through our listings to discover churches that offer a variety of sacramental services, including baptism, communion, and more. Each church is dedicated to serving you and providing a welcoming environment for your spiritual journey.
            </p>
          </div>
        </section>
        <ImageGrid />
      </main>
    </div>
  );
};

export default HomeSection;