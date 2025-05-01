import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 lg:p-12"> {/* Adjusted padding */}
      <h1 className="text-3xl font-bold mb-6">Welcome to Elegant POS</h1> {/* Added margin */}
      <Button>Click Me</Button> {/* Use the button */}
    </main>
  );
}
