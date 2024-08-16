import { useRef } from "react";
import { useViewState } from "src/models/ViewState";
import * as VT from "src/models/VTWorkspace";

interface TabPreviewProps {
	leaf: VT.WorkspaceLeaf;
}

export const TabPreview = ({ leaf }: TabPreviewProps) => {
	const { getScreenShot } = useViewState();
	const img = useRef<HTMLImageElement>(null);
	const handleRefresh = async () => {
		const dataUrl = await getScreenShot(leaf);
		if (dataUrl && img.current) {
			img.current.src = dataUrl;
		}
	};
	return (
		<>
			<div className="tab-preview" onClick={handleRefresh}>
				<img className="tab-preview-img" ref={img} />
			</div>
			<div className="tab-preview-title">{leaf.getDisplayText()}</div>
		</>
	);
};
