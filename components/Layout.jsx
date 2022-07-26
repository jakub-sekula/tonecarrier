import Header from "./Header";
import Footer from "./Footer";

export const Layout = ({ children, ...props }) => {
  return (
    <div id="wrapper" className="flex flex-col min-h-screen min-w-screen w-full h-full bg-[#141414] text-white">
      <Header title={props.title}></Header>
      <main className="flex flex-col p-8 w-full max-w-7xl mx-auto">
        {children}
      </main>
      <Footer />
    </div>
  );
};
