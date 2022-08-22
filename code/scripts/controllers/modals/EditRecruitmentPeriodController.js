const commonServices = require("common-services");
const {Constants, momentService} = commonServices;

const {WebcController} = WebCardinal.controllers;

export default class EditRecruitmentPeriodController extends WebcController {
    constructor(...props) {
        super(...props);
        this.model = {
            ...this.getInitModel(props[0])
        };
        this.initHandlers();
    }

    initHandlers() {
        this.attachHandlerSubmit();

        let recruitmentPeriodHandler = () => {
            let startDate = this.model.startDate.value;
            let endDate = this.model.endDate.value;

            let fromDateObj = new Date(startDate);
            let toDateObj = new Date(endDate);

            if (fromDateObj > toDateObj || !(toDateObj instanceof Date)) {
                this.model.endDate.value = startDate;
            }
            this.model.endDate.min = momentService(startDate).format(Constants.DATE_UTILS.FORMATS.YearMonthDayPattern);
        };


        this.model.onChange('startDate', recruitmentPeriodHandler);
    }

    attachHandlerSubmit() {
        this.onTagEvent('tp:submit', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.send('confirmed', {startDate: this.model.startDate.value, endDate: this.model.endDate.value});
        });
    }

    getInitModel(prevProps) {
        let startDateValue = '', endDateValue = '';
        if (prevProps.recruitmentPeriod) {
            startDateValue = prevProps.recruitmentPeriod.startDate;
            endDateValue = prevProps.recruitmentPeriod.endDate;
        }

        return {
            startDate: {
                label: 'Start date',
                name: 'startDate',
                required: true,
                placeholder: 'Please set the start date ',
                min: momentService(new Date()).format(Constants.DATE_UTILS.FORMATS.YearMonthDayPattern),
                value: startDateValue,
            },
            endDate: {
                label: 'End date',
                name: 'endDate',
                required: true,
                placeholder: 'Please set the end recruitment date ',
                value: endDateValue,
            }

        }
    }
}
