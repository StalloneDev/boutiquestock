import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { Dashboard } from "@/pages/dashboard";
import { Products } from "@/pages/products";
import { ProductNew } from "@/pages/products-new";
import { ProductDetail } from "@/pages/product-detail";
import { Sales } from "@/pages/sales";
import { Categories } from "@/pages/categories";
import { StockEntries } from "@/pages/stock-entries";
import { History } from "@/pages/history";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/products" component={Products} />
        <Route path="/products/new" component={ProductNew} />
        <Route path="/products/:id" component={ProductDetail} />
        <Route path="/sales" component={Sales} />
        <Route path="/categories" component={Categories} />
        <Route path="/stock-entries" component={StockEntries} />
        <Route path="/history" component={History} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
