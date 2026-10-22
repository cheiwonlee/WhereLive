import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import KakaoMapProvider from "@/components/map/KakaoMapProvider";
import Layout from "@/components/common/Layout";
import OnboardingGuide from "@/components/common/OnboardingGuide";
import ToastContainer from "@/components/common/ToastContainer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30,
      gcTime: 1000 * 60 * 60,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <KakaoMapProvider>
        <Layout />
        <OnboardingGuide />
        <ToastContainer />
      </KakaoMapProvider>
    </QueryClientProvider>
  );
}
