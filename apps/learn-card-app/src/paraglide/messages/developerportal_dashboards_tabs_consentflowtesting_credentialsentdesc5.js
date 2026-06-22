/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialsentdesc5Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_credentialsentdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialsentdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The recipient should see it in their LearnCard wallet.`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_credentialsentdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialsentdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El destinatario debería verla en su billetera de LearnCard.`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_credentialsentdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialsentdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le destinataire devrait le voir dans son portefeuille LearnCard.`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_credentialsentdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialsentdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يجب أن يراها المستلم في محفظة LearnCard الخاصة به.`)
};

/**
* | output |
* | --- |
* | "The recipient should see it in their LearnCard wallet." |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialsentdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_credentialsentdesc5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialsentdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialsentdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_credentialsentdesc5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_credentialsentdesc5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_credentialsentdesc5(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_credentialsentdesc5(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_credentialsentdesc5 as "developerPortal.dashboards.tabs.consentFlowTesting.credentialSentDesc" }