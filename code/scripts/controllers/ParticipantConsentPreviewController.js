// eslint-disable-next-line no-undef
const commonServices = require('common-services');
const BreadCrumbManager = commonServices.getBreadCrumbManager();
const PDFService = commonServices.PDFService;

export default class ParticipantConsentPreviewController extends BreadCrumbManager {
  constructor(...props) {
    super(...props);

    let {
      participantDid,
      participantPk,
      participantId,
      trialId,
      trialKeySSI,
      trialUid,
      siteKeySSI,
      siteId,
      siteUid,
      consent,
    } = this.getState();

    this.model = {
      consent,
      participantDid,
      participantPk,
      participantId,
      trialId,
      trialKeySSI,
      trialUid,
      siteKeySSI,
      siteId,
      siteUid,
      title: participantId ? `Participant's TP number: ${participantId}` : `Participant's Did: ${participantDid}`,
    };

    this.model.breadcrumb = this.setBreadCrumb({
      label: `Site Participant's Consent Preview`,
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
