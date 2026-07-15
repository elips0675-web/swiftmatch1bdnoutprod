import { lazy, Suspense, useEffect } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { LanguageProvider } from "@/context/language-context"
import { FeatureFlagsProvider } from "@/context/feature-flags-context"
import { AuthProvider } from "@/context/auth-context"
import { ErrorBoundary } from "@/components/shared/error-boundary"
import { PageLoading } from "@/components/shared/loading-screen"
import { AppContainer } from "@/components/layout/app-container"
import { AdminLayout } from "@/components/layout/admin-layout"
import { AdminGuard } from "@/components/shared/admin-guard"
import { ClientOnly } from "@/components/shared/client-only"
import { CookieConsent } from "@/components/shared/cookie-consent"
import { PwaInstallBanner } from "@/components/shared/pwa-install-banner"

const Home = lazy(() => import("./pages/Home"))
const NotFound = lazy(() => import("./pages/NotFound"))
const About = lazy(() => import("./pages/about"))
const Activity = lazy(() => import("./pages/activity"))
const Admin = lazy(() => import("./pages/admin"))
const AdminAnalytics = lazy(() => import("./pages/admin-analytics"))
const AdminContent = lazy(() => import("./pages/admin-content"))
const AdminFeatures = lazy(() => import("./pages/admin-features"))
const AdminMessaging = lazy(() => import("./pages/admin-messaging"))
const AdminMonetization = lazy(() => import("./pages/admin-monetization"))
const AdminReports = lazy(() => import("./pages/admin-reports"))
const AdminPhotos = lazy(() => import("./pages/admin-photos"))
const AdminUsers = lazy(() => import("./pages/admin-users"))
const Chats = lazy(() => import("./pages/chats"))
const ChatId = lazy(() => import("./pages/_chats-chatId-adapter"))
const Contest = lazy(() => import("./pages/contest"))
const Faq = lazy(() => import("./pages/faq"))
const Groups = lazy(() => import("./pages/groups"))
const GroupCategory = lazy(() => import("./pages/groups-category"))
const LegalDataProcessing = lazy(() => import("./pages/legal-data-processing"))
const LegalPrivacy = lazy(() => import("./pages/legal-privacy"))
const LegalTerms = lazy(() => import("./pages/legal-terms"))
const Login = lazy(() => import("./pages/login"))
const ForgotPassword = lazy(() => import("./pages/forgot-password"))
const ResetPassword = lazy(() => import("./pages/reset-password"))
const VerifyEmail = lazy(() => import("./pages/verify-email"))
const Onboarding = lazy(() => import("./pages/onboarding"))
const Profile = lazy(() => import("./pages/profile"))
const ProfileEdit = lazy(() => import("./pages/profile-edit"))
const ProfileAttachmentTest = lazy(() => import("./pages/profile-attachment-test"))
const Register = lazy(() => import("./pages/register"))
const Search = lazy(() => import("./pages/search"))
const SearchFilters = lazy(() => import("./pages/search-filters"))
const Settings = lazy(() => import("./pages/settings"))
const SupportChat = lazy(() => import("./pages/support-chat"))
const User = lazy(() => import("./pages/user"))
const PremiumSuccess = lazy(() => import("./pages/premium-success"))
const PremiumCancel = lazy(() => import("./pages/premium-cancel"))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

const PAGE_TITLES: Record<string, string> = {
  "/": "SwiftMatch",
  "/search": "Поиск — SwiftMatch",
  "/search/filters": "Фильтры — SwiftMatch",
  "/chats": "Чаты — SwiftMatch",
  "/profile": "Профиль — SwiftMatch",
  "/profile/edit": "Редактировать — SwiftMatch",
  "/profile/attachment-test": "Тест привязанности — SwiftMatch",
  "/activity": "Активность — SwiftMatch",
  "/groups": "Группы — SwiftMatch",
  "/contest": "Конкурс — SwiftMatch",
  "/settings": "Настройки — SwiftMatch",
  "/onboarding": "Добро пожаловать — SwiftMatch",
  "/login": "Вход — SwiftMatch",
  "/register": "Регистрация — SwiftMatch",
  "/about": "О приложении — SwiftMatch",
  "/faq": "Вопросы — SwiftMatch",
  "/support-chat": "Поддержка — SwiftMatch",
  "/legal/privacy": "Конфиденциальность — SwiftMatch",
  "/legal/terms": "Условия — SwiftMatch",
  "/legal/data-processing": "Обработка данных — SwiftMatch",
  "/admin": "Админ — SwiftMatch",
  "/admin/analytics": "Аналитика — SwiftMatch",
  "/admin/users": "Пользователи — SwiftMatch",
  "/admin/content": "Контент — SwiftMatch",
  "/admin/features": "Функции — SwiftMatch",
  "/admin/messaging": "Рассылки — SwiftMatch",
  "/admin/monetization": "Монетизация — SwiftMatch",
  "/admin/reports": "Жалобы — SwiftMatch",
  "/premium/success": "Оплата успешна — SwiftMatch",
  "/premium/cancel": "Оплата отменена — SwiftMatch",
}

function DocumentTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = PAGE_TITLES[pathname] || "SwiftMatch"
  }, [pathname])
  return null
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoading />}>{children}</Suspense>
    </ErrorBoundary>
  )
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <LanguageProvider>
                <FeatureFlagsProvider>
                  <DocumentTitle />
                  <Routes>
                    <Route path="/admin" element={<AdminGuard><AdminLayout><SuspenseWrapper><Admin /></SuspenseWrapper></AdminLayout></AdminGuard>} />
                    <Route path="/admin/analytics" element={<AdminGuard><AdminLayout><SuspenseWrapper><AdminAnalytics /></SuspenseWrapper></AdminLayout></AdminGuard>} />
                    <Route path="/admin/content" element={<AdminGuard><AdminLayout><SuspenseWrapper><AdminContent /></SuspenseWrapper></AdminLayout></AdminGuard>} />
                    <Route path="/admin/features" element={<AdminGuard><AdminLayout><SuspenseWrapper><AdminFeatures /></SuspenseWrapper></AdminLayout></AdminGuard>} />
                    <Route path="/admin/messaging" element={<AdminGuard><AdminLayout><SuspenseWrapper><AdminMessaging /></SuspenseWrapper></AdminLayout></AdminGuard>} />
                    <Route path="/admin/monetization" element={<AdminGuard><AdminLayout><SuspenseWrapper><AdminMonetization /></SuspenseWrapper></AdminLayout></AdminGuard>} />
                    <Route path="/admin/reports" element={<AdminGuard><AdminLayout><SuspenseWrapper><AdminReports /></SuspenseWrapper></AdminLayout></AdminGuard>} />
                    <Route path="/admin/photos" element={<AdminGuard><AdminLayout><SuspenseWrapper><AdminPhotos /></SuspenseWrapper></AdminLayout></AdminGuard>} />
                    <Route path="/admin/users" element={<AdminGuard><AdminLayout><SuspenseWrapper><AdminUsers /></SuspenseWrapper></AdminLayout></AdminGuard>} />
                    <Route path="/premium/success" element={<SuspenseWrapper><PremiumSuccess /></SuspenseWrapper>} />
                    <Route path="/premium/cancel" element={<SuspenseWrapper><PremiumCancel /></SuspenseWrapper>} />
                    <Route path="*" element={
                      <SuspenseWrapper>
                        <AppContainer>
                          <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/activity" element={<Activity />} />
                            <Route path="/chats" element={<Chats />} />
                            <Route path="/chats/:chatId" element={<ChatId />} />
                            <Route path="/contest" element={<Contest />} />
                            <Route path="/faq" element={<Faq />} />
                            <Route path="/groups" element={<Groups />} />
                            <Route path="/groups/:category" element={<GroupCategory />} />
                            <Route path="/legal/data-processing" element={<LegalDataProcessing />} />
                            <Route path="/legal/privacy" element={<LegalPrivacy />} />
                            <Route path="/legal/terms" element={<LegalTerms />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/verify-email" element={<VerifyEmail />} />
                            <Route path="/onboarding" element={<Onboarding />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/profile/edit" element={<ProfileEdit />} />
                            <Route path="/profile/attachment-test" element={<ProfileAttachmentTest />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/search" element={<Search />} />
                            <Route path="/search/filters" element={<SearchFilters />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/support-chat" element={<SupportChat />} />
                            <Route path="/user" element={<User />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                          <ClientOnly>
                            <CookieConsent />
                            <PwaInstallBanner />
                          </ClientOnly>
                        </AppContainer>
                      </SuspenseWrapper>
                    } />
                  </Routes>
                </FeatureFlagsProvider>
            </LanguageProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
)

export default App
