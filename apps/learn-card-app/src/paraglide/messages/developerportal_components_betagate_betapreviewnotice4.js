/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Betagate_Betapreviewnotice4Inputs */

const en_developerportal_components_betagate_betapreviewnotice4 = /** @type {(inputs: Developerportal_Components_Betagate_Betapreviewnotice4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Beta Preview Notice`)
};

const es_developerportal_components_betagate_betapreviewnotice4 = /** @type {(inputs: Developerportal_Components_Betagate_Betapreviewnotice4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aviso de Vista Previa Beta`)
};

const fr_developerportal_components_betagate_betapreviewnotice4 = /** @type {(inputs: Developerportal_Components_Betagate_Betapreviewnotice4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Avis d'Aperçu Beta`)
};

const ar_developerportal_components_betagate_betapreviewnotice4 = /** @type {(inputs: Developerportal_Components_Betagate_Betapreviewnotice4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إشعار المعاينة التجريبية`)
};

/**
* | output |
* | --- |
* | "Beta Preview Notice" |
*
* @param {Developerportal_Components_Betagate_Betapreviewnotice4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_betagate_betapreviewnotice4 = /** @type {((inputs?: Developerportal_Components_Betagate_Betapreviewnotice4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Betagate_Betapreviewnotice4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_betagate_betapreviewnotice4(inputs)
	if (locale === "es") return es_developerportal_components_betagate_betapreviewnotice4(inputs)
	if (locale === "fr") return fr_developerportal_components_betagate_betapreviewnotice4(inputs)
	return ar_developerportal_components_betagate_betapreviewnotice4(inputs)
});
export { developerportal_components_betagate_betapreviewnotice4 as "developerPortal.components.betaGate.betaPreviewNotice" }