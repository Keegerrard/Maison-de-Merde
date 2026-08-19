import EditorialSplit from "@/components/ui/EditorialSplit";
import SectionHeading from "@/components/ui/SectionHeading";
import Stagger from "@/components/ui/Stagger";
import ServiceRow, { type ServiceRowProps } from "./ServiceRow";

const SERVICES: Omit<ServiceRowProps, "isLast">[] = [
  {
    index: "01",
    displayName: "The Entry",
    englishSubtitle: "Structured logging",
    description:
      "One tap records a session. Add depth when you want it: seven Bristol types, six clinical colour categories, odour, straining, symptoms, and a note if the moment calls for one.",
    tags: ["BRISTOL I-VII", "UNDER 10s", "DEPTH OPTIONAL"],
  },
  {
    index: "02",
    displayName: "The Rhythm",
    englishSubtitle: "The streak engine",
    description:
      "A day with at least one entry extends the streak. Miss one and a grace token quietly absorbs it. Travelling? Freeze the whole thing in advance, before you need to.",
    tags: ["GRACE TOKENS", "FREEZE", "NO PENALTY"],
  },
  {
    index: "03",
    displayName: "The Circle",
    englishSubtitle: "Private circles",
    description:
      "Invite people by name. Ranked on streak and consistency, never on volume: rewarding volume in this particular domain would be irresponsible.",
    tags: ["OPT-IN", "STREAK & CONSISTENCY", "NO PHOTOS SHARED"],
  },
  {
    index: "04",
    displayName: "The File",
    englishSubtitle: "Doctor export",
    description:
      "A plain, de-identified summary: totals, Bristol distribution, and every session flagged for blood or severe straining. Written to be handed over, not to be admired.",
    tags: ["DE-IDENTIFIED", "PLAIN TEXT", "YOURS"],
  },
  {
    index: "05",
    displayName: "The Eye",
    englishSubtitle: "Assisted visual analysis",
    description:
      "Photograph a session and a vision model proposes a Bristol type and a colour. Below its confidence threshold it says nothing at all. You confirm; it never submits on your behalf.",
    tags: ["OPTIONAL", "CONFIDENCE-GATED", "DELETED AFTER INFERENCE"],
  },
];

export default function ServicesList() {
  return (
    <EditorialSplit
      id="systeme"
      stickyRail
      rail={
        <SectionHeading
          eyebrow="THE SERVICES"
          title="Five instruments."
          lede="Four of them are boring on purpose. One of them looks at a photograph."
        />
      }
    >
      <Stagger>
        {SERVICES.map((service, i) => (
          <ServiceRow
            key={service.index}
            {...service}
            isLast={i === SERVICES.length - 1}
          />
        ))}
      </Stagger>
    </EditorialSplit>
  );
}
