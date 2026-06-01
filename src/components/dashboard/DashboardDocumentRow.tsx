import { useNavigate } from "react-router-dom";
import type { DocumentRow } from "@hooks/pages/useDocumentsPage";
import DocumentRowBody from "@components/documents/DocumentRowBody";
import { dashboardIntroAnimationClasses } from "@utils/dashboardIntroAnimation";

type DashboardDocumentRowProps = {
  document: DocumentRow;
  playIntro?: boolean;
  animationDelayClass?: string;
};

const DashboardDocumentRow = ({
  document,
  playIntro = false,
  animationDelayClass,
}: DashboardDocumentRowProps) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={`dashboard-doc-row dashboard-doc-row--${document.type} ${dashboardIntroAnimationClasses(playIntro, animationDelayClass)}`.trim()}
      onClick={() => navigate(`/documents/${document.id}/edit`)}
    >
      <DocumentRowBody document={document} />
    </button>
  );
};

export default DashboardDocumentRow;
