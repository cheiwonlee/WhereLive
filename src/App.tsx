import Layout from "@/components/common/Layout";
import KakaoMapProvider from "@/components/map/KakaoMapProvider";
import OnboardingGuide from "@/components/common/OnboardingGuide";

export default function App() {
  return (
    <KakaoMapProvider>
      <Layout />
      <OnboardingGuide />
    </KakaoMapProvider>
  );
}
