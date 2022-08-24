// eslint-disable-next-line no-undef
const commonServices = require('common-services');
const BreadCrumbManager = commonServices.getBreadCrumbManager();
const PDFService = commonServices.PDFService;

export default class ParticipantConsentPreviewController extends BreadCrumbManager {
  constructor(...props) {
    super(...props);

    let {
      participantUid,
      participantId,
      trialId,
      trialKeySSI,
      trialUid,
      siteKeySSI,
      siteId,
      siteUid,
      consent
    } = this.getState();
    this.model = {consent, participantUid, participantId, trialId, trialKeySSI, trialUid, siteKeySSI, siteId, siteUid};

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

    this.PDFService = new PDFService(this.DSUStorage);
    this.PDFService.displayPDF(econsentFilePath, this.model.consent.attachment);
  }

  getEconsentManualFilePath(siteUid, consentUid, version) {
    return '/sites/' + siteUid + '/consent/' + consentUid + '/versions/' + version;
  }
}
