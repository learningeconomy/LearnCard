/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Updateconfig4Inputs */

const en_developerportal_guides_embedapp_yourapp_updateconfig4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Updateconfig4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Update Config`)
};

const es_developerportal_guides_embedapp_yourapp_updateconfig4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Updateconfig4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualizar Configuración`)
};

const fr_developerportal_guides_embedapp_yourapp_updateconfig4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Updateconfig4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mettre à jour la config`)
};

const ar_developerportal_guides_embedapp_yourapp_updateconfig4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Updateconfig4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحديث التكوين`)
};

/**
* | output |
* | --- |
* | "Update Config" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Updateconfig4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_updateconfig4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Updateconfig4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Updateconfig4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_updateconfig4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_updateconfig4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_updateconfig4(inputs)
	return ar_developerportal_guides_embedapp_yourapp_updateconfig4(inputs)
});
export { developerportal_guides_embedapp_yourapp_updateconfig4 as "developerPortal.guides.embedApp.yourApp.updateConfig" }