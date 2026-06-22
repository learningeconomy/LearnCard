/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Waitingforwebhookevent5Inputs */

const en_developerportal_onboarding_datamapping_waitingforwebhookevent5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Waitingforwebhookevent5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Waiting for webhook event...`)
};

const es_developerportal_onboarding_datamapping_waitingforwebhookevent5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Waitingforwebhookevent5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Waiting for webhook event...`)
};

const fr_developerportal_onboarding_datamapping_waitingforwebhookevent5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Waitingforwebhookevent5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Waiting for webhook event...`)
};

const ar_developerportal_onboarding_datamapping_waitingforwebhookevent5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Waitingforwebhookevent5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Waiting for webhook event...`)
};

/**
* | output |
* | --- |
* | "Waiting for webhook event..." |
*
* @param {Developerportal_Onboarding_Datamapping_Waitingforwebhookevent5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_waitingforwebhookevent5 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Waitingforwebhookevent5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Waitingforwebhookevent5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_waitingforwebhookevent5(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_waitingforwebhookevent5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_waitingforwebhookevent5(inputs)
	return ar_developerportal_onboarding_datamapping_waitingforwebhookevent5(inputs)
});
export { developerportal_onboarding_datamapping_waitingforwebhookevent5 as "developerPortal.onboarding.dataMapping.waitingForWebhookEvent" }