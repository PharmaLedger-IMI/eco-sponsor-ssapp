// eslint-disable-next-line no-undef
const commonServices = require('common-services');
const BreadCrumbManager = commonServices.getBreadCrumbManager();
import { consentTableHeaders } from '../constants/consent.js';

export default class ConsentHistoryController extends BreadCrumbManager {
  itemsPerPageArray = [5, 10, 15, 20, 30];

  headers = consentTableHeaders;

  consents = null;

  pagination = {
    previous: false,
    next: false,
    items: null,
    pages: {
      selectOptions: '',
    },
    slicedPages: null,
    currentPage: 0,
    itemsPerPage: 10,
    totalPages: null,
    itemsPerPageOptions: {
      selectOptions: this.itemsPerPageArray.map((x) => ({ value: x, label: x })),
      value: this.itemsPerPageArray[1].value,
    },
  };

  constructor(...props) {
    super(...props);
    let { id, keySSI, uid, data } = this.history.location.state;

    this.model = {
      id,
      keySSI,
      uid,
      data,
      pagination: this.pagination,
      headers: this.headers,
      clearButtonDisabled: true,
      type: 'consents',
      tableLength: 7
    };

    this.model.breadcrumb = this.setBreadCrumb({
      label: `${data[0].name} / Consent History`,
      tag: `consent-history`
    });

    this.attachEvents();

    this.init();
  }

  async init() {}

  attachEvents() {
    this.onTagClick('view-attachment', async (model) => {
      this.navigateToPageTag('preview-consent', {
        id: this.model.id,
        keySSI: this.model.keySSI,
        uid: this.model.uid,
        data: model,
        history: JSON.parse(JSON.stringify(this.model.data)),
        breadcrumb: this.model.toObject('breadcrumb')
      });
    });

    this.onTagClick('view-visits', async (model) => {
      this.navigateToPageTag('visits', {
        trialId: this.model.id,
        trialKeySSI: this.model.keySSI,
        consentData: model,
        breadcrumb: this.model.toObject('breadcrumb')
      });
    });
  }
}
