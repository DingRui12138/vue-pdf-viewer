import { VueConstructor } from 'vue';

export default VuePdfViewer;

export const VuePdfViewer: VuePdfViewerConstructor;

export interface VuePdfViewerProps {
  source: object | string;
  controls: string[];
}
export interface VuePdfViewerData {
  isLoading: boolean,
  page: number,
  total: number,
  catalogVisible: boolean,
  zoom: number,
  rotate: number,
}
export interface VuePdfViewerMethods {
  handleSwitchPage: (page: number) => void;
  handleUpdateZoom: (zoom: number) => void;
  reload: () => void;
}

export interface VuePdfViewerConstructor extends VueConstructor {
  props: VuePdfViewerProps;
  data: () => VuePdfViewerData;
  methods: VuePdfViewerMethods;
}
