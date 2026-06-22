/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Setupwebsitestep_Configureheadersonserver7Inputs */

const en_developerportal_guides_embedapp_setupwebsitestep_configureheadersonserver7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Configureheadersonserver7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configure headers on your server`)
};

const es_developerportal_guides_embedapp_setupwebsitestep_configureheadersonserver7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Configureheadersonserver7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurar cabeceras en tu servidor`)
};

const fr_developerportal_guides_embedapp_setupwebsitestep_configureheadersonserver7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Configureheadersonserver7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurer les en-têtes sur votre serveur`)
};

const ar_developerportal_guides_embedapp_setupwebsitestep_configureheadersonserver7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Configureheadersonserver7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تكوين الرؤوس على الخادم الخاص بك`)
};

/**
* | output |
* | --- |
* | "Configure headers on your server" |
*
* @param {Developerportal_Guides_Embedapp_Setupwebsitestep_Configureheadersonserver7Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_setupwebsitestep_configureheadersonserver7 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Setupwebsitestep_Configureheadersonserver7Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Setupwebsitestep_Configureheadersonserver7Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_setupwebsitestep_configureheadersonserver7(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_setupwebsitestep_configureheadersonserver7(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_setupwebsitestep_configureheadersonserver7(inputs)
	return ar_developerportal_guides_embedapp_setupwebsitestep_configureheadersonserver7(inputs)
});
export { developerportal_guides_embedapp_setupwebsitestep_configureheadersonserver7 as "developerPortal.guides.embedApp.setupWebsiteStep.configureHeadersOnServer" }