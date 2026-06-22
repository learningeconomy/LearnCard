/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Apitokens_Notokenshint5Inputs */

const en_developerportal_integrationguide_apitokens_notokenshint5 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Notokenshint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create one to authenticate your backend`)
};

const es_developerportal_integrationguide_apitokens_notokenshint5 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Notokenshint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea uno para autenticar tu backend`)
};

const fr_developerportal_integrationguide_apitokens_notokenshint5 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Notokenshint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez-en un pour authentifier votre backend`)
};

const ar_developerportal_integrationguide_apitokens_notokenshint5 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Notokenshint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ واحداً لتوثيق خادمك الخلفي`)
};

/**
* | output |
* | --- |
* | "Create one to authenticate your backend" |
*
* @param {Developerportal_Integrationguide_Apitokens_Notokenshint5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_apitokens_notokenshint5 = /** @type {((inputs?: Developerportal_Integrationguide_Apitokens_Notokenshint5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Apitokens_Notokenshint5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_apitokens_notokenshint5(inputs)
	if (locale === "es") return es_developerportal_integrationguide_apitokens_notokenshint5(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_apitokens_notokenshint5(inputs)
	return ar_developerportal_integrationguide_apitokens_notokenshint5(inputs)
});
export { developerportal_integrationguide_apitokens_notokenshint5 as "developerPortal.integrationGuide.apiTokens.noTokensHint" }