// eslint-disable-next-line no-undef
const commonServices = require('common-services');
const BreadCrumbManager = commonServices.getBreadCrumbManager();
const PDFService = commonServices.PDFService;

export default class SitePreviewConsentController extends BreadCrumbManager {
  constructor(...props) {
    super(...props);

    let {trialId, trialKeySSI, trialUid, siteId, siteKeySSI, siteUid, data, history} = this.getState();
    this.model = {trialId, trialKeySSI, trialUid, siteId, siteKeySSI, siteUid, consent: data, history};

    this.model.breadcrumb = this.setBreadCrumb({
      label: `${data.name} / Preview Consent`,
      tag: `site-preview-consent`
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

    this.PDFService = new PDFService(this.DSUStorage);
    this.PDFService.displayPDF(econsentFilePath, this.model.consent.attachment);
  }

  getEconsentManualFilePath(siteUid, consentUid, version) {
    return '/sites/' + siteUid + '/consent/' + consentUid + '/versions/' + version;
  }
}
