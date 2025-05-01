import { getProducts } from '@/lib/supabase/queries';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Search, Filter, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Product } from '@/types';

// ProductCard component
function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg group border border-border">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/50">
            <span className="text-secondary-foreground text-sm">No Image</span>
          </div>
        )}
        
        {product.category && (
          <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
            {product.category}
          </Badge>
        )}
      </div>
      
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
        {product.description && (
          <CardDescription className="line-clamp-2 h-10 mt-1">
            {product.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-xl text-primary">${product.price.toFixed(2)}</p>
          {product.sku && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Tag className="h-3 w-3 mr-1" />
              {product.sku}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Order
        </Button>
      </CardFooter>
    </Card>
  );
}

// Main ProductsPage component
export default async function ProductsPage() {
  console.log("Rendering Products page...");

  // Call the dedicated async function to fetch products
  const { products, error } = await getProducts();
  
  console.log("Products data:", products);
  console.log("Error if any:", error);

  // --- Error Handling ---
  if (error) {
    console.error("Failed to load products:", error.message);
    return (
      <main className="flex min-h-screen flex-col items-center p-4 md:p-8 lg:p-12">
        <h1 className="text-3xl font-bold mb-6 text-destructive">Error loading products</h1>
        <p className="text-muted-foreground">Could not retrieve product data. Details: {error.message}</p>
        <p className="mt-4">Please try refreshing the page or contact support if the problem persists.</p>
      </main>
    );
  }

  // --- No Products Found ---
  if (!products || products.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 md:p-8 lg:p-12">
        <h1 className="text-3xl font-bold mb-6">Welcome to Elegant POS</h1>
        <p className="text-muted-foreground">No products are currently available.</p>
        <p className="mt-4">This could be because:</p>
        <ul className="list-disc pl-6 mt-2">
          <li>The products table is empty in your Supabase database</li>
          <li>There might be a connection issue with your Supabase instance</li>
          <li>The query might not be returning results due to permissions</li>
        </ul>
      </main>
    );
  }

  // Get unique categories for filtering
  const categories = [...new Set(products.map(product => product.category).filter(Boolean))];

  // --- Render Product List ---
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">
            <span className="text-primary">Elegant</span> Products
          </h1>
          <p className="text-muted-foreground mt-1">Browse our collection of {products.length} products</p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search products..." 
              className="pl-8 w-full border-primary/20 focus-visible:ring-primary/30"
            />
          </div>
          <Button variant="outline" size="icon" className="border-primary/20 text-primary hover:text-primary hover:bg-primary/10">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-8">
        <TabsList className="bg-secondary/50 text-secondary-foreground">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All Products</TabsTrigger>
          {categories.map(category => (
            <TabsTrigger 
              key={category} 
              value={category as string}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </TabsContent>
        
        {categories.map(category => (
          <TabsContent key={category} value={category as string} className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products
                .filter(product => product.category === category)
                .map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              }
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </main>
  );
}