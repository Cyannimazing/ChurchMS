import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import HomeSection from "@/components/sections/homesection";

const Home = () => {
  return (
    <div>
      <Navigation />
      <main>
        <div className="pt-20">
          <section id="home">
            <HomeSection />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Home;
