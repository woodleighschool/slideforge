import { BuildPanel } from "@/components/BuildPanel";
import { ChromeNudge } from "@/components/ChromeNudge";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HowItWorks } from "@/components/HowItWorks";
import { PreviewModal } from "@/components/PreviewModal";
import { TermsGate } from "@/components/TermsGate";
import { TipJar } from "@/components/TipJar";
import { useBuilder } from "@/lib/useBuilder";

export function App() {
  const builder = useBuilder();

  return (
    <>
      <TermsGate />

      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        <Header />

        <ChromeNudge />
        <TipJar visible={builder.tipJarVisible} onDismiss={builder.dismissTipJar} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
          <BuildPanel builder={builder} />
          <HowItWorks
            presentationName={builder.presentationName}
            hasZip={builder.resources !== null}
            hasHtml={builder.lessonHTML.trim().length > 0}
            outputFormat={builder.outputFormat}
            ready={builder.done}
          />
        </div>

        <Footer />
      </div>

      <PreviewModal
        open={builder.previewOpen}
        onOpenChange={builder.setPreviewOpen}
        blocks={builder.previewBlocks}
      />
    </>
  );
}
