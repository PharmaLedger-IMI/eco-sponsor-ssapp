import SitesService from '../../services/SitesService.js';
// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class EditSiteContactModalController extends WebcController {
  name = {
    label: 'Health Care Professional Last Name',
    name: 'name',
    required: true,
    placeholder: 'Please insert a name...',
    value: '',
  };

  did = {
    label: 'Site DID',
    name: 'did',
    required: true,
    placeholder: 'Please insert the site DID...',
    disabled: true,
    value: '',
  };

  constructor(...props) {
    super(...props);

    this.site = props[0].site;
    let { id, keySSI, uid } = this.history.location.state;
    this.trialUid = uid;
    this.trialKeySSI = keySSI;
    this.trialId = id;

    this.sitesService = new SitesService(this.DSUStorage);

    this.model = {
      site: {
        name: this.name,
        did: { ...this.did, value: this.site.did },
      },
    };

    this.attachAll();
  }

  attachAll() {
    this.onTagClick('update-contact', async () => {
      try {
        window.WebCardinal.loader.hidden = false;
        const site = {
          name: this.model.site.name.value,
        };
        Object.assign(this.site, site);
        const result = await this.sitesService.updateSiteContact(this.site, this.site.did, this.trialKeySSI);
        window.WebCardinal.loader.hidden = true;
        this.send('confirmed', result);
      } catch (error) {
        window.WebCardinal.loader.hidden = true;
        this.send('closed', new Error('There was an updating the site'));
        console.error(error);
      }
    });
  }
}
