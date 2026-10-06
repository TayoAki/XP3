import { ArrowRight, Map, BedDouble, Compass, X } from "lucide-react";
export default function WorkspaceGuide({
  onOpen,
  onCompare,
  onDismiss,
}: {
  onOpen: () => void;
  onCompare: () => void;
  onDismiss: () => void;
}) {
  return (
    <section
      className="workspace-guide"
      aria-label="Getting started with your trip"
    >
      <div className="section-line">
        <div>
          <span className="eyebrow">MAKE IT YOURS</span>
          <h3>One trip. Three ways to explore.</h3>
        </div>
        <button
          className="icon-button"
          aria-label="Dismiss trip guide"
          onClick={onDismiss}
        >
          <X size={17} />
        </button>
      </div>
      <div className="guide-steps">
        <div>
          <Map size={18} />
          <strong>See the big picture</strong>
          <p>The map connects your stops. Click a pin to research a place.</p>
        </div>
        <button onClick={onCompare}>
          <BedDouble size={18} />
          <strong>Find your base</strong>
          <p>Compare stays for the whole trip, then choose your favorite.</p>
          <ArrowRight size={15} />
        </button>
        <button onClick={onOpen}>
          <Compass size={18} />
          <strong>Go a little deeper</strong>
          <p>Photos, reviews and sources open beside your conversation.</p>
          <ArrowRight size={15} />
        </button>
      </div>
      <p className="fine-print">
        Edit any day below. You can undo trip changes or reopen this guide from
        the header.
      </p>
    </section>
  );
}
