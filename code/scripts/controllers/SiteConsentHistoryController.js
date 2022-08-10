// eslint-disable-next-line no-undef
import { siteConsentHistoryTableHeaders } from '../constants/consent.js';

// eslint-disable-next-line no-undef
const commonServices = require('common-services');
const BreadCrumbManager = commonServices.getBreadCrumbManager();

export default class SiteConsentHistoryController extends BreadCrumbManager {
  headers = siteConsentHistoryTableHeaders;

  consents = null;

  constructor(...props) {
    super(...props);
    let { trialId, trialKeySSI, trialUid, siteId, siteKeySSI, siteUid, data } = this.history.location.state;

    data = data.map((x) => ({
      ...x,
      siteConsentNameVer: `${x.name}, ver. ${x.version}`,
      trialConsentNameVer: `${x.trialConsentName}, ver. ${x.trialConsentVersion}`,
    }));

    this.model = {
      trialId,
      trialKeySSI,
      trialUid,
      siteId,
      siteKeySSI,
      siteUid,
      data,
      headers: this.headers
    };

    this.model.breadcrumb = this.setBreadCrumb({
      label: `${data[0].name} / Site Consent History`,
      tag: `site-consent-history`
    });

    this.attachEvents();

    this.init();
  }

  async init() {}

  attachEvents() {
    this.onTagClick('view-attachment', async (model) => {
      this.navigateToPageTag('site-preview-consent', {
        trialId: this.model.trialId,
        trialKeySSI: this.model.trialKeySSI,
        trialUid: this.model.trialUid,
        siteKeySSI: this.model.siteKeySSI,
        siteId: this.model.siteId,
        siteUid: this.model.siteUid,
        data: model,
        history: JSON.parse(JSON.stringify(this.model.data)),
        breadcrumb: this.model.toObject('breadcrumb')
      });
    });
  }
}
