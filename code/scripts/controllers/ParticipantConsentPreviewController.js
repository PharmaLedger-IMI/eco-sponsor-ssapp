// eslint-disable-next-line no-undef
const commonServices = require('common-services');
const BreadCrumbManager = commonServices.getBreadCrumbManager();
const FileDownloaderService = commonServices.FileDownloaderService;

export default class ParticipantConsentPreviewController extends BreadCrumbManager {
  constructor(...props) {
    super(...props);

    let { participantUid, participantId, trialId, trialKeySSI, trialUid, siteKeySSI, siteId, siteUid, consent } =
      this.history.location.state;
    this.fileDownloaderService = new FileDownloaderService(this.DSUStorage);

    this.model = {
      consent,
      participantUid,
      participantId,
      trialId,
      trialKeySSI,
      trialUid,
      siteKeySSI,
      siteId,
      siteUid,
      pdf: {
        currentPage: 1,
        pagesNo: 0,
      },
      showPageUp: false,
      showPageDown: true
    };

    this.model.breadcrumb = this.setBreadCrumb({
      label: `${participantId} / Site Participant's Consent Preview`,
      tag: `site-participant-preview`
    });

    this.init();
  }

  async init() {
    window.WebCardinal.loader.hidden = false;
    const econsentFilePath = this.getEconsentManualFilePath(
      this.model.siteUid,
      this.model.consent.uid,
      this.model.consent.version
    );
    this.downloadFile(econsentFilePath, this.model.consent.attachment);
  }

  downloadFile = async (filePath, fileName) => {
    await this.fileDownloaderService.prepareDownloadFromDsu(filePath, fileName);
    let fileBlob = this.fileDownloaderService.getFileBlob(fileName);
    this.rawBlob = fileBlob.rawBlob;
    this.mimeType = fileBlob.mimeType;
    this.blob = new Blob([this.rawBlob], {
      type: this.mimeType,
    });
    this.displayFile();
  };

  loadPdfOrTextFile = () => {
    const reader = new FileReader();
    reader.readAsDataURL(this.blob);
    reader.onloadend = () => {
      let base64data = reader.result;
      this.initPDF(base64data.substr(base64data.indexOf(',') + 1));
    };
  };

  initPDF(pdfData) {
    pdfData = atob(pdfData);
    let pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'scripts/third-parties/pdf.worker.js';

    this.loadingTask = pdfjsLib.getDocument({ data: pdfData });
    this.renderPage(this.model.pdf.currentPage);
    window.WebCardinal.loader.hidden = true;
  }

  renderPage = (pageNo) => {
    this.loadingTask.promise.then(
      (pdf) => {
        this.model.pdf.pagesNo = pdf.numPages;
        pdf.getPage(pageNo).then((result) => this.handlePages(pdf, result));
      },
      (reason) => console.error(reason)
    );
  };

  handlePages = (thePDF, page) => {
    const viewport = page.getViewport({ scale: 1.5 });
    let canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    let context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    page.render({ canvasContext: context, viewport: viewport });
    document.getElementById('canvas-parent').appendChild(canvas);

    this.model.pdf.currentPage = this.model.pdf.currentPage + 1;
    let currPage = this.model.pdf.currentPage;
    if (thePDF !== null && currPage <= this.model.pdf.pagesNo) {
      thePDF.getPage(currPage).then((result) => this.handlePages(thePDF, result));
    }
  };

  displayFile = () => {
    window.URL = window.URL || window.webkitURL;
    const fileType = this.mimeType.split('/')[0];
    switch (fileType) {
      case 'image': {
        this.loadImageFile();
        break;
      }
      default: {
        this.loadPdfOrTextFile();
        break;
      }
    }
  };

  getEconsentManualFilePath(siteUid, consentUid, version) {
    return '/sites/' + siteUid + '/consent/' + consentUid + '/versions/' + version;
  }
}
