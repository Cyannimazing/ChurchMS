import Navigation from "@/components/layout/Navigation";
import HomeSection from "@/components/sections/homesection";

const Home = () => {
  return (
    <div>
      <main>
        <div className="pt-16">
          <Navigation />
          <section id="home">
            <HomeSection />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Home;
