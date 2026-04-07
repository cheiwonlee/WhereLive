import Layout from "@/components/common/Layout";
import KakaoMapProvider from "@/components/map/KakaoMapProvider";
import OnboardingGuide from "@/components/common/OnboardingGuide";
import ToastContainer from "@/components/common/ToastContainer";

export default function App() {
  return (
    <KakaoMapProvider>
      <Layout />
      <OnboardingGuide />
      <ToastContainer />
    </KakaoMapProvider>
  );
}
