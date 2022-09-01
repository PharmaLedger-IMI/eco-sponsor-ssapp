// eslint-disable-next-line no-undef
const commonServices = require('common-services');
const BreadCrumbManager = commonServices.getBreadCrumbManager();
const PDFService = commonServices.PDFService;

export default class ParticipantConsentPreviewController extends BreadCrumbManager {
  constructor(...props) {
    super(...props);

    let { participantPk, participantId, trialId, trialKeySSI, trialUid, siteKeySSI, siteId, siteUid, consent } =
      this.getState();
    this.model = {
      consent,
      participantPk,
      participantId,
      trialId,
      trialKeySSI,
      trialUid,
      siteKeySSI,
      siteId,
      siteUid,
    };

    this.model.breadcrumb = this.setBreadCrumb({
      label: `${participantId} / Site Participant's Consent Preview`,
      tag: `site-participant-preview`,
    });

    this.init();
  }

  async init() {
    window.WebCardinal.loader.hidden = false;
    const econsentFilePath = this.getEconsentManualFilePath(
      this.model.participantPk,
      this.model.consent.uid,
      this.model.consent.version
    );

    this.PDFService = new PDFService(this.DSUStorage);
    this.PDFService.displayPDF(econsentFilePath, this.model.consent.attachment);
  }

  getEconsentManualFilePath(participantPk, consentUid, version) {
    return '/participants-consents/' + participantPk + '/' + consentUid + '/versions/' + version;
  }
}
