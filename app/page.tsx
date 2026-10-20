import { ToolRail } from "@/components/toolbar/ToolRail";
import { Viewport2D } from "@/components/viewport/Viewport2D";

export default function Home() {
  return (
    <main className="flex h-[100dvh] w-full">
      <ToolRail />
      <div className="relative min-w-0 flex-1">
        <Viewport2D />
      </div>
    </main>
  );
}
