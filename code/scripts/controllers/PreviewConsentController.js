// eslint-disable-next-line no-undef
const commonServices = require('common-services');
const BreadCrumbManager = commonServices.getBreadCrumbManager();
const PDFService = commonServices.PDFService;

export default class PreviewConsentController extends BreadCrumbManager {
  constructor(...props) {
    super(...props);

    let {id, keySSI, uid, data, history} = this.getState();
    this.model = {id, keySSI, uid, consent: data, history};

    this.model.breadcrumb = this.setBreadCrumb({
      label: `${data.name} / Preview Consent`,
      tag: `preview-consent`
    });

    this.init();
  }

  async init() {
    window.WebCardinal.loader.hidden = false;
    const econsentFilePath = this.getEconsentManualFilePath(
      this.model.uid,
      this.model.consent.uid,
      this.model.consent.version
    );

    this.PDFService = new PDFService(this.DSUStorage);
    this.PDFService.displayPDF(econsentFilePath, this.model.consent.attachment);
  }

  getEconsentManualFilePath(trialUid, consentUid, version) {
    return '/trials/' + trialUid + '/consent/' + consentUid + '/versions/' + version;
  }
}
