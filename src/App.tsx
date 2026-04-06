import Layout from "@/components/common/Layout";
import KakaoMapProvider from "@/components/map/KakaoMapProvider";

export default function App() {
  return (
    <KakaoMapProvider>
      <Layout />
    </KakaoMapProvider>
  );
}
