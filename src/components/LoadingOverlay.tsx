import React from "react";
import { ProgressSpinner } from "primereact/progressspinner";

interface Props {
  visible: boolean;
}

const LoadingOverlay: React.FC<Props> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="loading-overlay">
      <ProgressSpinner />
    </div>
  );
};

export default LoadingOverlay;