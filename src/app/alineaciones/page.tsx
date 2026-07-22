import AlignmentBuilder from "./alignment-builder";

export const metadata = {
  title: "Creador de alineaciones | Aldapan Gora",
  description: "Diseña la alineación del próximo partido.",
};

export default function AlignmentsPage() {
  return <AlignmentBuilder />;
}
