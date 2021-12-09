import { DefineComponent } from 'vue';

export default VuePdfViewer;

export interface VuePdfViewerProps {
  source: object | string;
  controls?: string[];
  loadingText?: string;
  renderingText?: string;
}
export interface VuePdfViewerData {
  isLoading: boolean,
  page: number,
  total: number,
  catalogVisible: boolean,
  zoom: number,
  rotate: number,
}

export const VuePdfViewer: DefineComponent<
  VuePdfViewerProps,
  unknown,
  VuePdfViewerData
>;
